/**
 * server/routes/hybridCheckoutRoute.js
 *
 * BUGS FIXED (from auth_flow_audit.md):
 * 1. Bug 1: Email not lowercased in findOne() lookup — duplicate accounts created
 *    for same user with different email casing (e.g. Test@Gmail.com vs test@gmail.com)
 * 2. Bug 2: PATH B (new user) — password could be undefined before bcrypt.hash()
 *    → Added !fullName / !password guard before PATH B
 * 3. Bug 3: No BD phone format validation in place-order → added isValidBDPhone()
 * 4. Bug 5: Suspended users could bypass the auth check and place orders via checkout
 *    → Added user.status === 'suspended' check before PATH C1 and PATH C2
 * 5. Added email format validation
 */

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const User     = require('../models/User').default;
const Order    = require('../models/Order').default || require('../models/Order');
const OtpStore = require('../models/OtpStore').default || require('../models/OtpStore');
const Coupon   = require('../models/Coupon').default || require('../models/Coupon');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

const safeUser = (u) => ({
    _id:       u._id,
    email:     u.email,
    name:      u.name,
    phone:     u.phone,
    wishlist:  u.wishlist,
    cart:      u.cart,
    addresses: u.addresses
});

// FIX Bug 3: BD phone validator (reused from authRoutes)
const isValidBDPhone = (phone) => /^01[3-9]\d{8}$/.test(phone);

// Email format validator
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normaliseCartItem = (g) => {
    const rawPid = g.productId?._id
        || g.productId
        || g.product?._id
        || g.product
        || g._id
        || g.id;
    const pidStr = rawPid ? String(rawPid) : '';

    return {
        productId: mongoose.isValidObjectId(pidStr) ? pidStr : undefined,
        name:      g.name,
        image:     g.image,
        price:     Number(g.price),
        size:      g.size  || 'Standard',
        color:     g.color || 'Default',
        quantity:  Number(g.quantity || 1)
    };
};

const createOrder = async (
    userId,
    { cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo }
) => {
    const items    = cart.map(normaliseCartItem);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Number(couponDiscount) || 0;

    // Shipping: FREE only for Sylhet district + Sylhet Sadar thana
    const isFreeShipping = (
        shippingAddress?.district === 'সিলেট' &&
        shippingAddress?.thana    === 'সিলেট সদর'
    );
    const shippingCost = isFreeShipping ? 0 : 60;

    // Always recalculate server-side
    const finalTotal = Math.max(0, subtotal + shippingCost - discount);

    const order = new Order({
        userId,
        customer: {
            name:  customerInfo?.name  || 'Eloria Member',
            phone: customerInfo?.phone || 'N/A',
            email: customerInfo?.email || ''
        },
        items,
        shippingAddress,
        paymentMethod:  'Cash on Delivery',
        subtotal,
        shippingCost,
        couponCode:     couponCode ? couponCode.toUpperCase().trim() : '',
        couponDiscount: discount,
        total:          finalTotal,
        status:         'Pending'
    });

    const saved = await order.save();

    if (userId) await User.findByIdAndUpdate(userId, { cart: [] });

    if (couponCode) {
        await Coupon.findOneAndUpdate(
            { code: couponCode.toUpperCase().trim() },
            { $inc: { usageCount: 1 }, $push: { usedBy: userId } }
        );
    }

    return saved;
};

const sendOtp = async (phone, email, otpCode) => {
    try {
        if (!email) {
            console.warn("⚠️ Cannot send OTP: Email missing.");
            return;
        }

        console.log(`\n[OTP] Code: ${otpCode} | Sent To: ${email}\n`);

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ RESEND_API_KEY not set. Skipping OTP email.');
            return;
        }
        const resend = new Resend(apiKey);
        const { data, error } = await resend.emails.send({
            from:    'Eloria BD <onboarding@resend.dev>',
            to:      [email],
            subject: `${otpCode} is your Eloria BD verification code`,
            html: `
                <div style="font-family: serif; max-width: 500px; margin: auto; border: 1px solid #f0f0f0; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <div style="background-color: #534AB7; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; letter-spacing: 6px; font-size: 32px; font-weight: bold;">ELORIA</h1>
                    </div>
                    <div style="padding: 40px 30px; background-color: #ffffff; text-align: center;">
                        <h2 style="color: #1a1a1a; font-size: 20px; margin-top: 0; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px;">Verify Your Order</h2>
                        <p style="color: #666666; font-size: 14px; line-height: 1.6; font-family: sans-serif;">
                            Please enter the following 6-digit verification code to complete your checkout.
                        </p>
                        <div style="background-color: #f8f7ff; border: 1px dashed #534AB7; border-radius: 8px; padding: 25px; margin: 30px 0;">
                            <span style="font-size: 36px; font-weight: bold; letter-spacing: 12px; color: #534AB7; font-family: monospace;">${otpCode}</span>
                        </div>
                        <p style="color: #999999; font-size: 12px; font-family: sans-serif;">
                            This code is valid for 5 minutes. If you did not request this, please ignore this email.
                        </p>
                    </div>
                    <div style="background-color: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #f0f0f0;">
                        <p style="color: #bcbcbc; font-size: 10px; font-family: sans-serif; text-transform: uppercase; letter-spacing: 2px; margin: 0;">
                            Wear Your Glory — Eloria BD
                        </p>
                    </div>
                </div>
            `
        });

        if (error) console.error("❌ Resend API Error:", error);
        else console.log("✅ OTP Email delivered. ID:", data.id);

    } catch (err) {
        console.error("❌ Failed to send OTP email:", err.message);
    }
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

router.post('/place-order', async (req, res) => {
    const {
        fullName, phone, email, password,
        addressLabel = 'Home', district, thana, area, addressDetail,
        cart = [], totalAmount, couponCode, couponDiscount,
        shippingAddress: providedAddress
    } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!email || !phone) {
        return res.status(400).json({ message: 'ইমেইল এবং ফোন নম্বর প্রয়োজন।' });
    }
    // FIX Bug 3: validate email format
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'সঠিক ইমেইল ঠিকানা দিন।' });
    }
    // FIX Bug 3: validate BD phone format
    if (!isValidBDPhone(phone)) {
        return res.status(400).json({ message: 'সঠিক মোবাইল নম্বর দিন। (01XXXXXXXXX)' });
    }
    if (!fullName || !fullName.trim()) {
        return res.status(400).json({ message: 'নাম প্রয়োজন।' });
    }
    if (!cart.length) {
        return res.status(400).json({ message: 'ব্যাগ খালি।' });
    }

    try {
        const shippingAddress = providedAddress || {
            label:         addressLabel,
            recipientName: fullName,
            contact:       phone,
            country:       'Bangladesh',
            district,
            thana,
            area,
            address:       addressDetail
        };
        const customerInfo = { name: fullName, phone, email };

        // FIX Bug 1: lowercase email before DB lookup to prevent duplicate accounts
        const existing = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }]
        });

        // ── PATH B: Brand-new user ──────────────────────────────────────────
        if (!existing) {
            // FIX Bug 2: guard password — was hashing undefined if not provided
            if (!password || password.length < 6) {
                return res.status(400).json({
                    message: 'নতুন অ্যাকাউন্টের জন্য কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড প্রয়োজন।'
                });
            }

            const hashed = await bcrypt.hash(password, 10);
            const user   = await new User({
                email:     email.toLowerCase(),  // FIX Bug 1: always store lowercase
                password:  hashed,
                name:      fullName,
                phone,
                addresses: [{ ...shippingAddress, isDefault: true }],
                cart:      []
            }).save();

            const order = await createOrder(user._id, {
                cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo
            });

            return res.status(201).json({
                status: 'created',
                token:  signToken(user._id),
                user:   safeUser(user),
                order
            });
        }

        // FIX Bug 5: Block suspended users from placing orders via checkout
        if (existing.status === 'suspended') {
            return res.status(403).json({
                message: 'আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে। সহায়তার জন্য যোগাযোগ করুন।'
            });
        }

        // ── PATH C1: Existing user + correct password ───────────────────────
        const passwordOk = password
            ? await bcrypt.compare(password, existing.password)
            : false;

        if (passwordOk) {
            if (!existing.name)  existing.name  = fullName;
            if (!existing.phone) existing.phone = phone;

            const addrExists = existing.addresses.some(
                a => a.address === shippingAddress.address
            );
            if (!addrExists) existing.addresses.push(shippingAddress);
            await existing.save();

            const order = await createOrder(existing._id, {
                cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo
            });

            return res.json({
                status: 'logged_in',
                token:  signToken(existing._id),
                user:   safeUser(existing),
                order
            });
        }

        // ── PATH C2: Existing + wrong/missing password → OTP bridge ────────
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6);

        await OtpStore.deleteMany({ userId: existing._id });

        const otpDoc = await new OtpStore({
            userId:       existing._id,
            otp:          otpHash,
            attempts:     0,
            pendingOrder: {
                cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo
            }
        }).save();

        await sendOtp(existing.phone, existing.email, otpCode);

        const masked = existing.email.replace(/(.{2}).*(@.*)/, '$1***$2');

        return res.status(200).json({
            status:      'otp_required',
            sessionId:   otpDoc._id,
            maskedPhone: masked
        });

    } catch (err) {
        console.error('[place-order]', err);
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' });
    }
});

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp) {
        return res.status(400).json({ message: 'Session and OTP are required.' });
    }

    try {
        const otpDoc = await OtpStore.findById(sessionId);
        if (!otpDoc) {
            return res.status(400).json({ message: 'OTP সেশন মেয়াদ শেষ। আবার শুরু করুন।' });
        }

        if (otpDoc.attempts >= 3) {
            await OtpStore.findByIdAndDelete(sessionId);
            return res.status(429).json({
                code:    'MAX_ATTEMPTS',
                message: 'সর্বোচ্চ চেষ্টা শেষ। ৫ মিনিট পর আবার চেষ্টা করুন।'
            });
        }

        const isValid = await bcrypt.compare(otp, otpDoc.otp);
        if (!isValid) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            const remaining = 3 - otpDoc.attempts;
            return res.status(401).json({
                message:      `ভুল ওটিপি কোড। আরও ${remaining}টি সুযোগ আছে।`,
                attemptsLeft: remaining,
                code:         remaining === 0 ? 'MAX_ATTEMPTS' : undefined
            });
        }

        const user = await User.findById(otpDoc.userId);
        if (!user) return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি।' });

        const order = await createOrder(user._id, otpDoc.pendingOrder);
        await OtpStore.findByIdAndDelete(sessionId);

        return res.json({
            status: 'success',
            token:  signToken(user._id),
            user:   safeUser(user),
            order
        });

    } catch (err) {
        console.error('[verify-otp]', err);
        res.status(500).json({ message: 'যাচাইকরণ ব্যর্থ হয়েছে।' });
    }
});

// ─── RESEND OTP ───────────────────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID প্রয়োজন।' });

    try {
        const otpDoc = await OtpStore.findById(sessionId);
        if (!otpDoc) return res.status(400).json({ message: 'সেশন মেয়াদ শেষ।' });

        const user = await User.findById(otpDoc.userId);
        if (!user) return res.status(404).json({ message: 'ব্যবহারকারী পাওয়া যায়নি।' });

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6);

        otpDoc.otp      = otpHash;
        otpDoc.attempts = 0;
        await otpDoc.save();

        await sendOtp(user.phone, user.email, otpCode);

        res.json({ message: 'নতুন OTP পাঠানো হয়েছে।' });
    } catch (err) {
        console.error('[resend-otp]', err);
        res.status(500).json({ message: 'OTP পুনরায় পাঠাতে ব্যর্থ।' });
    }
});

module.exports = router;