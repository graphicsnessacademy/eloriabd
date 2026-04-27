/**
 * server/routes/hybridCheckoutRoute.js
 *
 * Hybrid checkout — 3 paths + OTP bridge + resend-otp
 *   PATH B  → New user:          create account + auto-login + place order
 *   PATH C1 → Existing + pw ok:  login + place order
 *   PATH C2 → Existing + pw bad: trigger OTP, place order after verify
 *
 * Endpoints:
 *   POST /api/hybrid-checkout/place-order
 *   POST /api/hybrid-checkout/verify-otp     (max 3 attempts enforced)
 *   POST /api/hybrid-checkout/resend-otp     (60s cooldown managed on frontend)
 */

const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const mongoose = require('mongoose');

const User     = require('../models/User');
const Order    = require('../models/Order').default || require('../models/Order');
const OtpStore = require('../models/OtpStore');
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

/**
 * Normalise a cart item — extracts productId from any shape the client sends.
 */
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

/** Merge guest cart into an existing DB cart, stacking quantities for matching SKUs */
const mergeCart = (dbCart, guestCart) => {
    const merged = [...dbCart];
    guestCart.forEach(g => {
        const rawPid = g.productId?._id || g.productId || g.product?._id || g.product || g._id || g.id;
        const gId    = rawPid ? String(rawPid) : '';

        const existing = merged.find(
            u => u.productId?.toString() === gId &&
                 u.size  === (g.size  || 'Standard') &&
                 u.color === (g.color || 'Default')
        );
        if (existing) {
            existing.quantity += (Number(g.quantity) || 1);
        } else {
            merged.push(normaliseCartItem(g));
        }
    });
    return merged;
};

/**
 * Build and save Order document.
 * customerInfo ensures the correct name/phone appear in Admin instantly.
 */
const createOrder = async (userId, { cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo }) => {
    const items = cart.map(normaliseCartItem);

    const subtotal     = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount     = Number(couponDiscount) || 0;
    const finalTotal   = Number(totalAmount) || (subtotal + 60 - discount);
    const shippingCost = Math.max(0, finalTotal - subtotal + discount);

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
        couponDiscount: discount,
        total:          finalTotal,
        status:         'Pending'
    });

    const saved = await order.save();

    // Wipe DB cart
    if (userId) await User.findByIdAndUpdate(userId, { cart: [] });

    // Track coupon usage
    if (couponCode) {
        await Coupon.findOneAndUpdate(
            { code: couponCode.toUpperCase().trim() },
            { $inc: { usageCount: 1 }, $push: { usedBy: userId } }
        );
    }

    return saved;
};

/** Stub — swap for Twilio / SSL Wireless in production */
const sendOtp = async (phone, email, otpCode) => {
    console.log(`\n📱 ELORIA OTP for ${phone || email}: ${otpCode}\n`);
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

/**
 * POST /api/hybrid-checkout/place-order
 */
router.post('/place-order', async (req, res) => {
    const {
        fullName,
        phone,
        email,
        password,
        addressLabel  = 'Home',
        district,
        area,
        addressDetail,
        cart          = [],
        totalAmount,
        couponCode,
        couponDiscount,
        shippingAddress: providedAddress
    } = req.body;

    if (!email || !phone)
        return res.status(400).json({ message: 'ইমেইল এবং ফোন নম্বর প্রয়োজন।' });
    if (!cart.length)
        return res.status(400).json({ message: 'ব্যাগ খালি।' });

    try {
        const shippingAddress = providedAddress || {
            label:         addressLabel,
            recipientName: fullName,
            contact:       phone,
            country:       'Bangladesh',
            district,
            area,
            address:       addressDetail
        };

        const customerInfo = { name: fullName, phone, email };

        const existing = await User.findOne({ $or: [{ email }, { phone }] });

        // ── PATH B: Brand-new user ────────────────────────────────────────────
        if (!existing) {
            const hashed = await bcrypt.hash(password, 10);
            const user   = await new User({
                email,
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

        // ── PATH C1: Existing + password matches ──────────────────────────────
        const passwordOk = await bcrypt.compare(password, existing.password);
        if (passwordOk) {
            if (!existing.name)  existing.name  = fullName;
            if (!existing.phone) existing.phone = phone;

            const addrExists = existing.addresses.some(a => a.address === shippingAddress.address);
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

        // ── PATH C2: Existing + wrong password → OTP bridge ───────────────────
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6);

        await OtpStore.deleteMany({ userId: existing._id });
        const otpDoc = await new OtpStore({
            userId:       existing._id,
            otp:          otpHash,
            attempts:     0,
            pendingOrder: { cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo }
        }).save();

        await sendOtp(existing.phone, existing.email, otpCode);

        const masked = existing.phone
            ? existing.phone.slice(0, 5) + '****' + existing.phone.slice(-2)
            : existing.email.replace(/(.{2}).*(@.*)/, '$1***$2');

        return res.status(200).json({
            status:      'otp_required',
            sessionId:   otpDoc._id,
            maskedPhone: masked
        });

    } catch (err) {
        console.error('Checkout Error:', err);
        if (err.code === 11000)
            return res.status(400).json({ message: 'এই ইমেইলে ইতিমধ্যে একটি অ্যাকাউন্ট আছে।' });
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' });
    }
});


/**
 * POST /api/hybrid-checkout/verify-otp
 * Enforces max 3 attempts server-side. Returns MAX_ATTEMPTS code on breach.
 */
router.post('/verify-otp', async (req, res) => {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp)
        return res.status(400).json({ message: 'Session and OTP are required.' });

    try {
        const otpDoc = await OtpStore.findById(sessionId);
        if (!otpDoc)
            return res.status(400).json({ message: 'OTP সেশন মেয়াদ শেষ। আবার চেষ্টা করুন।' });

        // Enforce 3-attempt limit BEFORE comparing
        if (otpDoc.attempts >= 3) {
            await OtpStore.findByIdAndDelete(sessionId);
            return res.status(429).json({
                code:    'MAX_ATTEMPTS',
                message: 'সর্বোচ্চ চেষ্টা শেষ। পাসওয়ার্ড রিসেট করুন অথবা ভিন্ন ইমেইল ব্যবহার করুন।'
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

        // OTP valid — place order
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
        console.error('OTP verify error:', err);
        res.status(500).json({ message: 'যাচাইকরণ ব্যর্থ হয়েছে।' });
    }
});


/**
 * POST /api/hybrid-checkout/resend-otp
 * Resets attempt counter and issues a fresh code.
 * Body: { sessionId }
 */
router.post('/resend-otp', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId)
        return res.status(400).json({ message: 'Session ID প্রয়োজন।' });

    try {
        const otpDoc = await OtpStore.findById(sessionId);
        if (!otpDoc)
            return res.status(400).json({ message: 'সেশন মেয়াদ শেষ। আবার শুরু করুন।' });

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
        console.error('Resend OTP error:', err);
        res.status(500).json({ message: 'OTP পুনরায় পাঠাতে ব্যর্থ।' });
    }
});

module.exports = router;