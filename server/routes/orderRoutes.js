const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

// POST /api/orders
// Create a new order and clear the user's cart
router.post('/', auth, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, totalAmount } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: "Shipping address is required" });
        }

        const newOrder = new Order({
            userId: req.user.id,
            items,
            shippingAddress,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            totalAmount
        });

        const savedOrder = await newOrder.save();

        // Destructively wipe the cart buffer now that items are migrating to an active order
        await User.findByIdAndUpdate(req.user.id, { cart: [] });

        res.status(201).json(savedOrder);
    } catch (err) {
        console.error("Order creation failed:", err);
        res.status(500).json({ message: "Failed to process order" });
    }
});

// GET /api/orders/user/:userId
router.get('/user/:userId', auth, async (req, res) => {
    try {
        if (req.user.id !== req.params.userId) {
            return res.status(403).json({ message: "Unauthorized access to these orders" });
        }
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

module.exports = router;
