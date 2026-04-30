/**
 * server/routes/userRoutes.js
 * 
 * CHANGES:
 * 1. Strict ObjectId validation for req.user.id to prevent CastError 500s.
 * 2. Strict validation for incoming wishlist and cart arrays.
 * 3. Sanitized cart normalization: ensures every item has a valid productId.
 * 4. Uses user.save() to trigger the "Title Case" name formatting in the User model.
 * 5. Returns a consistent user object for frontend context synchronization.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const _authModule = require('../middleware/authMiddleware');
const auth = _authModule.default || _authModule;
const User = require('../models/User');

// GET /api/user/profile - Fetch profile details
router.get('/profile', auth, async (req, res) => {
    try {
        // Safety check for ID format
        if (!mongoose.isValidObjectId(req.user.id)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User not found." });
        
        res.json(user);
    } catch (err) {
        console.error('[User Profile Error]:', err);
        res.status(500).json({ message: "Server error fetching profile." });
    }
});

// PUT /api/user/update - Update profile details
router.put('/update', auth, async (req, res) => {
    // Validate user ID format
    if (!mongoose.isValidObjectId(req.user.id)) {
        return res.status(400).json({ message: "Invalid session ID." });
    }

    const { name, phone, addresses, wishlist, cart } = req.body;

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        // 1. Update Basic Info
        if (name) user.name = name;
        
        // Allows clearing phone if passed as empty string, but unique sparse index in model handles collision
        if (phone !== undefined) user.phone = phone; 

        // 2. Update Addresses
        if (addresses !== undefined) user.addresses = addresses; 

        // 3. Update Wishlist with ID Validation
        if (wishlist !== undefined && Array.isArray(wishlist)) {
            // Filter out any malformed IDs sent from frontend
            user.wishlist = wishlist.filter(id => mongoose.isValidObjectId(id));
        }

        // 4. Update Cart with ID Validation and Normalization
        if (cart !== undefined && Array.isArray(cart)) {
            user.cart = cart
                .map(item => {
                    const rawPid = item.productId || item._id || item.id;
                    return {
                        productId: mongoose.isValidObjectId(rawPid) ? rawPid : null,
                        name: item.name,
                        image: item.image,
                        price: Number(item.price),
                        size: item.size || 'Standard',
                        color: item.color || 'Default',
                        quantity: Number(item.quantity || 1)
                    };
                })
                .filter(item => item.productId !== null); // Remove invalid items
        }

        // Save triggers the 'pre-save' hook in User model (Name Title Casing)
        await user.save();
        
        // Return sanitized user object for AuthContext sync
        res.json({ 
            message: "Profile updated successfully", 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                addresses: user.addresses,
                wishlist: user.wishlist,
                cart: user.cart,
                status: user.status
            } 
        });
    } catch (err) {
        console.error('[User Update Error]:', err);
        
        // Handle MongoDB Unique constraint error for phone number
        if (err.code === 11000) {
            return res.status(400).json({ message: "এই ফোন নম্বরটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহার করা হয়েছে।" });
        }
        
        res.status(500).json({ message: "Failed to update profile." });
    }
});

module.exports = router;