const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
    const { email, password, name, phone, guestWishlist = [], guestCart = [] } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Merge immediately for signup — preserve ALL product fields
        const newCart = guestCart.map(g => ({
            productId: g._id || g.id,
            name: g.name,
            image: g.image,
            price: g.price,
            size: g.size || 'Standard',
            color: g.color || 'Default',
            quantity: g.quantity || 1
        }));

        const user = new User({ 
            email, 
            password: hashedPassword, 
            name, 
            phone,
            wishlist: guestWishlist, // Brand new account, no dupes to worry about
            cart: newCart
        });

        await user.save();
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        
        res.status(201).json({ 
            token,
            user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, wishlist: user.wishlist, cart: user.cart, addresses: user.addresses }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Failed to create account. Please try again.' });
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

        // 2. Sync Cart: Merge quantities, preserve all product fields
        guestCart.forEach(gItem => {
            const gId = gItem._id || gItem.id;
            const existing = user.cart.find(uItem => uItem.productId && uItem.productId.toString() === gId);
            if (existing) {
                existing.quantity += (gItem.quantity || 1);
            } else {
                user.cart.push({
                    productId: gId,
                    name: gItem.name,
                    image: gItem.image,
                    price: gItem.price,
                    size: gItem.size || 'Standard',
                    color: gItem.color || 'Default',
                    quantity: gItem.quantity || 1
                });
            }
        });

        await user.save();

        // Create Token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.json({
            token,
            user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, wishlist: user.wishlist, cart: user.cart, addresses: user.addresses }
        });
    } catch (err) {
        res.status(500).json({ message: 'An unexpected error occurred. Please try again.' });
    }
});

module.exports = router;