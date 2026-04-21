/**
 * HYBRID CHECKOUT ROUTES
 * Implements the 3-path checkout strategy:
 *   Path A  – Logged-in user  (handled by existing /api/orders, not here)
 *   Path B  – New guest user  → create account + place order + auto-login
 *   Path C1 – Existing user, password matches → login + place order
 *   Path C2 – Existing user, password wrong   → trigger OTP bridge
 *
 * OTP is printed to console by default.
 * Swap the sendOtp() stub below with your Twilio/SSL Wireless call for production.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order').default || require('../models/Order');
const OtpStore = require('../models/OtpStore');
const Coupon = require('../models/Coupon').default || require('../models/Coupon');

// ─── helpers ─────────────────────────────────────────────────────────────────

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

const safeUser = (u) => ({
    _id: u._id, email: u.email, name: u.name,
    phone: u.phone, wishlist: u.wishlist,
    cart: u.cart, addresses: u.addresses
});

/** Normalise a guest-cart item to the DB cart sub-document shape */
const normaliseCartItem = (g) => ({
    productId: g._id || g.id || g.productId,
    name: g.name,
    image: g.image,
    price: g.price,
    size: g.size || 'Standard',
    color: g.color || 'Default',
    quantity: g.quantity || 1
});

/** Merge guest cart into an existing user cart (add quantities for same SKU) */
const mergeCart = (dbCart, guestCart) => {
    const merged = [...dbCart];
    guestCart.forEach(g => {
        const gId = (g._id || g.id || g.productId)?.toString();
        const existing = merged.find(
            u => u.productId?.toString() === gId &&
                u.size === (g.size || 'Standard') &&
                u.color === (g.color || 'Default')
        );
        if (existing) {
            existing.quantity += (g.quantity || 1);
        } else {
            merged.push(normaliseCartItem(g));
        }
    });
    return merged;
};

/** Build a Mongoose Order document and save it, then wipe user cart */
const createOrder = async (userId, { cart, shippingAddress, totalAmount, couponCode }) => {
    const items = cart.map(c => ({
        productId: c._id || c.id || c.productId,
        name: c.name,
        image: c.image,
        size: c.size || 'Standard',
        color: c.color || 'Default',
        price: c.price,
        quantity: c.quantity || 1
    }));

    const order = await new Order({
        userId,
        items,
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
        totalAmount,
        couponCode: couponCode || undefined,
    }).save();

    // Clear the user's cart buffer
    await User.findByIdAndUpdate(userId, { cart: [] });

    // Track coupon usage
    if (couponCode) {
        await Coupon.findOneAndUpdate(
            { code: couponCode.toUpperCase().trim() },
            { $inc: { usageCount: 1 }, $push: { usedBy: userId } }
        );
    }

    return order;
};

/**
 * STUB – replace with real SMS/email provider.
 * In development the OTP is printed to the server console.
 */
const sendOtp = async (phone, email, otpCode) => {
    console.log(`\n📱  OTP for ${phone || email}: ${otpCode}  (dev-mode, replace with Twilio/SSL)\n`);
    // Example Twilio snippet (un-comment & add credentials):
    // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await client.messages.create({ body: `Your Eloria OTP: ${otpCode}`, from: '+1...', to: phone });
};

// ─── routes ──────────────────────────────────────────────────────────────────

/**
 * POST /api/hybrid-checkout/place-order
 *
 * Body:
 *   { fullName, phone, email, password,
 *     addressLabel, district, area, addressDetail,
 *     cart, totalAmount, shippingAddress? }
 *
 * Returns one of:
 *   { status: 'created'      , token, user, order }   → new account
 *   { status: 'logged_in'   , token, user, order }   → password matched
 *   { status: 'otp_required', sessionId, maskedPhone } → OTP sent
 */
router.post('/place-order', async (req, res) => {
    const {
        fullName, phone, email, password,
        addressLabel = 'Home', district, area, addressDetail,
        cart = [], totalAmount, shippingAddress: providedAddress,
        couponCode
    } = req.body;

    if (!email && !phone)
        return res.status(400).json({ message: 'Email or phone is required.' });
    if (!cart.length)
        return res.status(400).json({ message: 'Cart is empty.' });

    try {
        // Build shipping address from form fields (used if no pre-built address provided)
        const shippingAddress = providedAddress || {
            label: addressLabel,
            recipientName: fullName,
            contact: phone,
            country: 'Bangladesh',
            district,
            area,
            address: addressDetail
        };

        // ── Check if user exists ──────────────────────────────────────────────
        const existing = await User.findOne({
            $or: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
            ]
        });

        // ── PATH B: Brand-new user ────────────────────────────────────────────
        if (!existing) {
            const hashed = await bcrypt.hash(password, 10);
            const user = await new User({
                email,
                password: hashed,
                name: fullName,
                phone,
                addresses: [{ ...shippingAddress, isDefault: true }],
                cart: cart.map(normaliseCartItem)
            }).save();

            const order = await createOrder(user._id, { cart, shippingAddress, totalAmount, couponCode });
            return res.status(201).json({
                status: 'created',
                token: signToken(user._id),
                user: safeUser(user),
                order
            });
        }

        // ── PATH C1: Existing user + password matches ─────────────────────────
        const passwordOk = await bcrypt.compare(password, existing.password);
        if (passwordOk) {
            existing.cart = mergeCart(existing.cart, cart);
            // Add shipping address if it doesn't already exist
            const addrExists = existing.addresses.some(a => a.address === shippingAddress.address);
            if (!addrExists) existing.addresses.push(shippingAddress);
            await existing.save();

            const order = await createOrder(existing._id, { cart: existing.cart.length ? existing.cart : cart, shippingAddress, totalAmount, couponCode });
            return res.json({
                status: 'logged_in',
                token: signToken(existing._id),
                user: safeUser(existing),
                order
            });
        }

        // ── PATH C2: Existing user + wrong password → OTP bridge ─────────────
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6); // fast hash (fewer rounds ok for short-lived OTP)

        // Remove any previous OTP for this user before saving new one
        await OtpStore.deleteMany({ userId: existing._id });
        const otpDoc = await new OtpStore({
            userId: existing._id,
            otp: otpHash,
            pendingOrder: { cart, shippingAddress, totalAmount, couponCode }
        }).save();

        await sendOtp(existing.phone, existing.email, otpCode);

        // Mask phone for display  e.g. 01711****78
        const masked = existing.phone
            ? existing.phone.slice(0, 5) + '****' + existing.phone.slice(-2)
            : existing.email.replace(/(.{2}).*(@.*)/, '$1***$2');

        return res.status(200).json({
            status: 'otp_required',
            sessionId: otpDoc._id,   // Frontend needs this to call verify-otp
            maskedPhone: masked
        });

    } catch (err) {
        console.error('Hybrid checkout error:', err);
        if (err.code === 11000)
            return res.status(400).json({ message: 'An account with this email already exists. Please log in.' });
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});


/**
 * POST /api/hybrid-checkout/resend-otp
 * Body: { sessionId }
 */
router.post('/resend-otp', async (req, res) => {
    const { sessionId } = req.body;
    try {
        const old = await OtpStore.findById(sessionId);
        if (!old) return res.status(400).json({ message: 'Session expired. Please start over.' });

        const user = await User.findById(old.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6);

        old.otp = otpHash;
        old.attempts = 0;
        await old.save();

        await sendOtp(user.phone, user.email, otpCode);
        res.json({ message: 'OTP resent.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to resend OTP.' });
    }
});


/**
 * POST /api/hybrid-checkout/verify-otp
 * Body: { sessionId, otp }
 *
 * Returns: { status: 'success', token, user, order }
 */
router.post('/verify-otp', async (req, res) => {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp)
        return res.status(400).json({ message: 'Session and OTP are required.' });

    try {
        const otpDoc = await OtpStore.findById(sessionId);
        if (!otpDoc) return res.status(400).json({ message: 'OTP session expired. Please restart checkout.' });

        // Enforce 3-attempt limit
        if (otpDoc.attempts >= 3) {
            await OtpStore.findByIdAndDelete(sessionId);
            return res.status(429).json({
                message: 'Too many failed attempts. Please reset your password or use a different email.',
                code: 'MAX_ATTEMPTS'
            });
        }

        const isValid = await bcrypt.compare(otp, otpDoc.otp);
        if (!isValid) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            const remaining = 3 - otpDoc.attempts;
            return res.status(401).json({
                message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                attemptsLeft: remaining
            });
        }

        // OTP valid – retrieve user + place order
        const { cart, shippingAddress, totalAmount, couponCode } = otpDoc.pendingOrder;
        const user = await User.findById(otpDoc.userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        user.cart = mergeCart(user.cart, cart);
        const addrExists = user.addresses.some(a => a.address === shippingAddress.address);
        if (!addrExists) user.addresses.push(shippingAddress);
        await user.save();

        const order = await createOrder(user._id, { cart, shippingAddress, totalAmount, couponCode });

        // Clean up OTP doc
        await OtpStore.findByIdAndDelete(sessionId);

        return res.json({
            status: 'success',
            token: signToken(user._id),
            user: safeUser(user),
            order
        });

    } catch (err) {
        console.error('OTP verify error:', err);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
});

module.exports = router;