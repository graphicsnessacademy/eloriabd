/**
 * server/routes/authRoutes.js
 *
 * BUGS FIXED:
 * 1. LOGIN 500: user.save() was re-validating ALL subdocs (addresses enum/required)
 *    → Replaced with User.findByIdAndUpdate() which skips subdocument validation
 * 2. Null guard added to user.wishlist.map() — prevents crash on corrupted null entries
 * 3. Guest cart lookup now also checks item.productId (not just _id/id)
 * 4. console.error(err) added to every catch block for visibility
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Resend } = require('resend');

const User = require('../models/User').default;
const OtpStore = require('../models/OtpStore').default || require('../models/OtpStore');

const resend = new Resend(process.env.RESEND_API_KEY);

// --- HELPERS ---
const signToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

const isValidBDPhone = (phone) => /^01[3-9]\d{8}$/.test(phone);

const sendSignupOtp = async (email, otpCode) => {
    try {
        await resend.emails.send({
            from: 'Eloria BD <onboarding@resend.dev>',
            to: [email],
            subject: `${otpCode} is your Eloria verification code`,
            html: `
                <div style="font-family: serif; max-width: 450px; margin: auto; border: 1px solid #f0f0f0; padding: 40px; text-align: center;">
                    <h1 style="color: #534AB7; font-size: 32px; letter-spacing: 5px;">ELORIA</h1>
                    <p style="font-size: 14px; color: #666;">উদ্যেশ্য: নতুন অ্যাকাউন্ট তৈরি</p>
                    <div style="background: #f8f7ff; border: 1px dashed #534AB7; padding: 20px; font-size: 30px; font-weight: bold; letter-spacing: 10px; color: #534AB7; margin: 20px 0;">
                        ${otpCode}
                    </div>
                    <p style="font-size: 12px; color: #999;">এই কোডটি ৫ মিনিটের জন্য কার্যকর।</p>
                </div>
            `
        });
    } catch (err) {
        console.error("Resend Error:", err);
    }
};

// ─── SIGNUP STEP 1: REQUEST ───────────────────────────────────────────────────
router.post('/signup-request', async (req, res) => {
    const { email, password, name, phone } = req.body;

    try {
        if (!email || !password || !name || !phone) {
            return res.status(400).json({ message: "সবগুলো ঘর পূরণ করুন।" });
        }
        if (!isValidBDPhone(phone)) {
            return res.status(400).json({ message: "সঠিক মোবাইল নম্বর দিন।" });
        }

        const existing = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }]
        });
        if (existing) {
            return res.status(400).json({ message: "ইমেইল বা ফোন নম্বর ইতিমধ্যে নিবন্ধিত।" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otpCode, 6);
        const passHash = await bcrypt.hash(password, 10);

        const session = await new OtpStore({
            otp: otpHash,
            pendingOrder: { name, email, phone, password: passHash }
        }).save();

        await sendSignupOtp(email, otpCode);

        res.status(200).json({
            message: "ভেরিফিকেশন কোড পাঠানো হয়েছে।",
            sessionId: session._id
        });

    } catch (err) {
        console.error('[signup-request]', err);
        res.status(500).json({ message: "সার্ভারে ত্রুটি হয়েছে।" });
    }
});

// ─── BACKWARD COMPAT: old /signup endpoint → redirect to signup-request ──────
// AuthModal.tsx still posts to /signup — keep this until frontend is updated
router.post('/signup', async (req, res) => {
    const { email, password, name, phone, guestWishlist = [], guestCart = [] } = req.body;

    try {
        if (!email || !password || !name || !phone) {
            return res.status(400).json({ message: "সবগুলো ঘর পূরণ করুন।" });
        }

        const existing = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }]
        });
        if (existing) {
            return res.status(400).json({ message: "ইমেইল বা ফোন নম্বর ইতিমধ্যে নিবন্ধিত।" });
        }

        const hashed = await bcrypt.hash(password, 10);

        const normalizedCart = guestCart.map(g => {
            const rawPid = g.productId?._id || g.productId || g._id || g.id;
            const pidStr = rawPid ? String(rawPid) : '';
            return {
                productId: mongoose.isValidObjectId(pidStr) ? pidStr : undefined,
                name: g.name,
                image: g.image,
                price: Number(g.price),
                size: g.size || 'Standard',
                color: g.color || 'Default',
                quantity: Number(g.quantity || 1)
            };
        }).filter(i => i.productId);

        const user = await new User({
            name,
            email: email.toLowerCase(),
            phone,
            password: hashed,
            wishlist: guestWishlist.filter(id => mongoose.isValidObjectId(id)),
            cart: normalizedCart
        }).save();

        res.status(201).json({
            token: signToken(user._id),
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                wishlist: user.wishlist,
                cart: user.cart,
                addresses: user.addresses
            }
        });

    } catch (err) {
        console.error('[signup]', err);
        if (err.code === 11000) {
            return res.status(400).json({ message: "ইমেইল বা ফোন নম্বর ইতিমধ্যে নিবন্ধিত।" });
        }
        res.status(500).json({ message: "অ্যাকাউন্ট তৈরি করতে ব্যর্থ।" });
    }
});

// ─── SIGNUP STEP 2: VERIFY & CREATE ──────────────────────────────────────────
router.post('/signup-verify', async (req, res) => {
    const { sessionId, otp, guestWishlist = [], guestCart = [] } = req.body;

    try {
        if (!mongoose.isValidObjectId(sessionId)) {
            return res.status(400).json({ message: "সেশন ইনভ্যালিড।" });
        }

        const session = await OtpStore.findById(sessionId);
        if (!session) return res.status(400).json({ message: "কোডের মেয়াদ শেষ হয়েছে।" });

        const isOtpValid = await bcrypt.compare(otp, session.otp);
        if (!isOtpValid) return res.status(401).json({ message: "ভুল ওটিপি কোড।" });

        const { name, email, phone, password } = session.pendingOrder;

        const normalizedCart = guestCart.map(g => {
            const rawPid = g.productId?._id || g.productId || g._id || g.id;
            const pidStr = rawPid ? String(rawPid) : '';
            return {
                productId: mongoose.isValidObjectId(pidStr) ? pidStr : undefined,
                name: g.name,
                image: g.image,
                price: Number(g.price),
                size: g.size || 'Standard',
                color: g.color || 'Default',
                quantity: Number(g.quantity || 1)
            };
        }).filter(i => i.productId);

        const user = await new User({
            name, email, phone, password,
            wishlist: guestWishlist.filter(id => mongoose.isValidObjectId(id)),
            cart: normalizedCart
        }).save();

        await OtpStore.findByIdAndDelete(sessionId);

        res.status(201).json({
            token: signToken(user._id),
            user: {
                _id: user._id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                wishlist: user.wishlist,
                cart: user.cart,
                addresses: user.addresses
            }
        });

    } catch (err) {
        console.error('[signup-verify]', err);
        res.status(500).json({ message: "অ্যাকাউন্ট তৈরি করতে ব্যর্থ।" });
    }
});

// ─── LOGIN & SYNC ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password, guestWishlist = [], guestCart = [] } = req.body;

    // Guard: email must be a string
    if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "ইমেইল প্রয়োজন।" });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: "এই ইমেইলে কোনো অ্যাকাউন্ট নেই।" });

        if (user.status === 'suspended') {
            return res.status(403).json({ message: "আপনার অ্যাকাউন্টটি স্থগিত করা হয়েছে।" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "ভুল পাসওয়ার্ড।" });

        // ── Build merged wishlist ────────────────────────────────────────────
        // Null-guard: filter out any null/undefined entries before .toString()
        const existingWishlist = (user.wishlist || [])
            .filter(id => id != null)
            .map(id => id.toString());

        const validGuestWishlist = (guestWishlist || [])
            .filter(id => mongoose.isValidObjectId(id));

        const mergedWishlist = [...new Set([...existingWishlist, ...validGuestWishlist])];

        // ── Build merged cart ────────────────────────────────────────────────
        // Deep-clone existing cart so we can mutate without Mongoose subdoc issues
        const mergedCart = (user.cart || []).map(item => ({
            productId: item.productId?.toString(),
            name: item.name,
            image: item.image,
            price: item.price,
            size: item.size || 'Standard',
            color: item.color || 'Default',
            quantity: item.quantity || 1
        })).filter(item => item.productId && mongoose.isValidObjectId(item.productId));

        (guestCart || []).forEach(gItem => {
            // Accept productId, _id, or id as the source key
            const rawPid = gItem.productId?._id
                || gItem.productId
                || gItem._id
                || gItem.id;
            const pidStr = rawPid ? String(rawPid) : '';
            if (!mongoose.isValidObjectId(pidStr)) return;

            const existing = mergedCart.find(u =>
                u.productId === pidStr &&
                u.size === (gItem.size || 'Standard') &&
                u.color === (gItem.color || 'Default')
            );

            if (existing) {
                existing.quantity += (Number(gItem.quantity) || 1);
            } else {
                mergedCart.push({
                    productId: pidStr,
                    name: gItem.name,
                    image: gItem.image,
                    price: Number(gItem.price),
                    size: gItem.size || 'Standard',
                    color: gItem.color || 'Default',
                    quantity: Number(gItem.quantity || 1)
                });
            }
        });

        // ── Persist with findByIdAndUpdate (skips subdocument validation) ────
        // This is the KEY FIX: user.save() was re-validating all address subdocs,
        // causing ValidationError if any address had enum/required mismatches.
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: { wishlist: mergedWishlist, cart: mergedCart, lastLogin: new Date() } },
            { returnDocument: 'after', runValidators: false }
        );
        res.json({
            token: signToken(user._id),
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone,
                wishlist: updatedUser.wishlist,
                cart: updatedUser.cart,
                addresses: updatedUser.addresses
            }
        });

    } catch (err) {
        console.error('[login]', err);
        res.status(500).json({ message: "লগইন করতে সমস্যা হয়েছে।" });
    }
});

module.exports = router;