/**
 * HYBRID CHECKOUT ROUTES - ELORIA BD
 * Optimized to fix Admin Panel "Guest" and "Tk 0" bugs.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const Order = require('../models/Order').default || require('../models/Order');
const OtpStore = require('../models/OtpStore');
const Coupon = require('../models/Coupon').default || require('../models/Coupon');
const { createNotification } = require('../utils/createNotification');
const { sendPushNotification } = require('../services/pushNotificationService');

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

const safeUser = (u) => ({
    _id: u._id, email: u.email, name: u.name,
    phone: u.phone, wishlist: u.wishlist,
    cart: u.cart, addresses: u.addresses
});

/** Normalise a cart item to ensure Size and Color are never missing */
const normaliseCartItem = (g) => ({
    productId: g._id || g.id || g.productId,
    name:      g.name,
    image:     g.image,
    price:     Number(g.price),
    size:      g.size || 'Standard',
    color:     g.color || 'Default',
    quantity:  Number(g.quantity || 1)
});

/** Merge guest cart into an existing user cart */
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
            existing.quantity += (Number(g.quantity) || 1);
        } else {
            merged.push(normaliseCartItem(g));
        }
    });
    return merged;
};

/** 
 * Build and save Order document.
 * FIXED: Uses customerInfo from the form to ensure name appears in Admin immediately.
 */
const createOrder = async (userId, { cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo }) => {
    const items = cart.map(normaliseCartItem);

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = Number(couponDiscount) || 0;
    const finalTotal = Number(totalAmount) || (subtotal + 60 - discount);
    const shippingCost = finalTotal - subtotal + discount;

    const order = new Order({
        userId,
        customer: {
            name: customerInfo.name,   // Fix for "Guest" name bug
            phone: customerInfo.phone, // Fix for missing phone bug
            email: customerInfo.email
        },
        items,
        shippingAddress,
        paymentMethod: 'Cash on Delivery',
        subtotal,
        shippingCost: shippingCost > 0 ? shippingCost : 0,
        couponDiscount: discount,
        total: finalTotal, // Fix for "Tk 0" bug
        status: 'Pending'
    });

    const savedOrder = await order.save(); // Model default handles orderNumber

    // Wipe cart in DB
    if (userId) await User.findByIdAndUpdate(userId, { cart: [] });

    // Track coupon usage
    if (couponCode) {
        await Coupon.findOneAndUpdate(
            { code: couponCode.toUpperCase().trim() },
            { $inc: { usageCount: 1 }, $push: { usedBy: userId } }
        );
    }

    // Trigger Admin Notification
    try {
        await createNotification(
            'new_order',
            `New order placed by ${customerInfo.name}`,
            `/admin/orders/${savedOrder._id}`,
            { orderNumber: savedOrder.orderNumber, total: savedOrder.total }
        );

        await sendPushNotification({
            title: '🛍️ New Order Received',
            body: `${customerInfo.name} placed an order for ৳${savedOrder.total}`,
            url: `/admin/orders/${savedOrder._id}`
        });
    } catch (err) {
        console.error('Failed to trigger notification:', err);
    }

    return savedOrder;
};

const sendOtp = async (phone, email, otpCode) => {
    console.log(`\n📱 ELORIA OTP for ${phone || email}: ${otpCode}\n`);
};

// ─── ROUTES ──────────────────────────────────────────────────────────────────

router.post('/place-order', async (req, res) => {
    const {
        fullName, phone, email, password,
        addressLabel = 'Home', district, area, addressDetail,
        cart = [], totalAmount, couponCode, couponDiscount,
        shippingAddress: providedAddress
    } = req.body;

    if (!email || !phone) return res.status(400).json({ message: 'ইমেইল এবং ফোন নম্বর প্রয়োজন।' });
    if (!cart.length) return res.status(400).json({ message: 'ব্যাগ খালি।' });

    try {
        const shippingAddress = providedAddress || {
            label: addressLabel,
            recipientName: fullName,
            contact: phone,
            country: 'Bangladesh',
            district,
            area,
            address: addressDetail
        };

        const customerInfo = { name: fullName, phone, email };

        const existing = await User.findOne({ $or: [{ email }, { phone }] });

        // ── PATH B: New user ──
        if (!existing) {
            const hashed = await bcrypt.hash(password, 10);
            const user = await new User({
                email,
                password: hashed,
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

        // ── PATH C1: Existing user + match ──
        const passwordOk = await bcrypt.compare(password, existing.password);
        if (passwordOk) {
            // Update profile data if it was missing
            if (!existing.name) existing.name = fullName;
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

        // ── PATH C2: OTP Bridge ──
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6);

        await OtpStore.deleteMany({ userId: existing._id });
        const otpDoc = await new OtpStore({
            userId:       existing._id,
            otp:          otpHash,
            pendingOrder: { cart, shippingAddress, totalAmount, couponCode, couponDiscount, customerInfo }
        }).save();

        await sendOtp(existing.phone, existing.email, otpCode);

        const masked = existing.phone
            ? existing.phone.slice(0, 5) + '****' + existing.phone.slice(-2)
            : existing.email.replace(/(.{2}).*(@.*)/, '$1***$2');

        return res.status(200).json({
            status:     'otp_required',
            sessionId:  otpDoc._id,
            maskedPhone: masked
        });

    } catch (err) {
        console.error('Checkout Error:', err);
        res.status(500).json({ message: 'সার্ভারে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।' });
    }
});

router.post('/verify-otp', async (req, res) => {
    const { sessionId, otp } = req.body;
    if (!sessionId || !otp) return res.status(400).json({ message: 'Session and OTP are required.' });

    try {
        const otpDoc = await OtpStore.findById(sessionId);
        if (!otpDoc) return res.status(400).json({ message: 'OTP session expired.' });

        const isValid = await bcrypt.compare(otp, otpDoc.otp);
        if (!isValid) return res.status(401).json({ message: 'ভুল ওটিপি কোড।' });

        const user = await User.findById(otpDoc.userId);
        const order = await createOrder(user._id, otpDoc.pendingOrder);

        await OtpStore.findByIdAndDelete(sessionId);

        return res.json({
            status: 'success',
            token: signToken(user._id),
            user: safeUser(user),
            order
        });
    } catch (err) {
        res.status(500).json({ message: 'Verification failed.' });
    }
});

module.exports = router;