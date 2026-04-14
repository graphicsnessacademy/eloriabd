const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ error: "Email already exists" });
    }
});

// LOGIN & SYNC ROUTE
router.post('/login', async (req, res) => {
    const { email, password, guestWishlist, guestCart } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // --- SYNC LOGIC ---
        // 1. Sync Wishlist: Combine local items with DB items (no duplicates)
        const uniqueWishlist = [...new Set([...user.wishlist.map(id => id.toString()), ...guestWishlist])];
        user.wishlist = uniqueWishlist;

        // 2. Sync Cart: Merge quantities
        guestCart.forEach(gItem => {
            const existing = user.cart.find(uItem => uItem.productId.toString() === gItem._id);
            if (existing) {
                existing.quantity += (gItem.quantity || 1);
            } else {
                user.cart.push({ productId: gItem._id, quantity: gItem.quantity || 1 });
            }
        });

        await user.save();

        // Create Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

        res.json({
            token,
            user: { email: user.email, wishlist: user.wishlist, cart: user.cart }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;