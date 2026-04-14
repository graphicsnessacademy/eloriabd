const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// GET /api/user/profile - Fetch profile details
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// PUT /api/user/update - Update profile details
router.put('/update', auth, async (req, res) => {
    const { name, phone, addresses, wishlist, cart } = req.body;
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        // Allows clearing phone if passed as empty string
        if (phone !== undefined) user.phone = phone; 
        if (addresses !== undefined) user.addresses = addresses; 
        if (wishlist !== undefined) user.wishlist = wishlist;
        if (cart !== undefined) {
            // Normalize frontend cart (_id) to DB schema (productId), preserve all fields
            user.cart = cart.map(item => ({
                productId: item.productId || item._id || item.id,
                name: item.name,
                image: item.image,
                price: item.price,
                size: item.size || 'Standard',
                color: item.color || 'Default',
                quantity: item.quantity || 1
            }));
        }

        await user.save();
        
        res.json({ 
            message: "Profile updated successfully", 
            user: { name: user.name, phone: user.phone, email: user.email, addresses: user.addresses } 
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update profile" });
    }
});

module.exports = router;
