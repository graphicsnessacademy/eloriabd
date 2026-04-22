const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Bridge for TypeScript models
const _OrderModule = require('../models/Order');
const Order = _OrderModule.default || _OrderModule;

const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const _CouponModule = require('../models/Coupon');
const Coupon = _CouponModule.default || _CouponModule;

/**
 * @route   POST /api/orders
 * @desc    Create a new order for logged-in users
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, totalAmount, couponCode, couponDiscount } = req.body;

        // 1. Basic Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "আপনার ব্যাগ খালি। অর্ডার করার জন্য পন্য যুক্ত করুন।" });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: "শিপিং অ্যাড্রেস প্রয়োজন।" });
        }

        // 2. Fetch latest user data
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "ইউজার খুঁজে পাওয়া যায়নি।" });
        }

        // 3. Calculation Logic
        const calculatedSubtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        const discount = Number(couponDiscount) || 0;
        
        // If totalAmount isn't sent correctly from frontend, we calculate it
        // (Subtotal + Shipping Cost 60 - Discount)
        const finalTotal = Number(totalAmount) || (calculatedSubtotal + 60 - discount);
        const shippingCost = finalTotal - calculatedSubtotal + discount;

        // 4. Sanitize items to prevent CastErrors on invalid product IDs
        const sanitizedItems = items.map(item => ({
            productId: mongoose.isValidObjectId(item.productId) ? item.productId : undefined,
            name: item.name,
            image: item.image,
            size: item.size || 'Standard',
            color: item.color || 'Default',
            price: Number(item.price),
            quantity: Number(item.quantity) || 1
        }));

        // 5. Create the new Order
        // NOTE: 'orderNumber' is handled by the Model's default function
        const newOrder = new Order({
            userId: req.user.id,
            customer: {
                name: user.name || shippingAddress?.recipientName || 'Elora Member',
                phone: user.phone || shippingAddress?.contact || 'N/A',
                email: user.email
            },
            items: sanitizedItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            subtotal: calculatedSubtotal,
            shippingCost: shippingCost > 0 ? shippingCost : 0,
            couponDiscount: discount,
            total: finalTotal, // Maps to the required 'total' field in schema
            status: 'Pending'
        });

        // 6. Save the order (This triggers the EL-XXXX serial generation)
        const savedOrder = await newOrder.save();

        // 7. WIPE the user's cart in the database
        await User.findByIdAndUpdate(req.user.id, { cart: [] });

        // 8. Handle Coupon Usage Tracking
        if (couponCode) {
            try {
                await Coupon.findOneAndUpdate(
                    { code: couponCode.toUpperCase().trim() },
                    { 
                        $inc: { usageCount: 1 }, 
                        $push: { usedBy: req.user.id } 
                    }
                );
            } catch (couponErr) {
                console.error("Coupon tracking failed:", couponErr.message);
                // We don't block the order if just the coupon counter fails
            }
        }

        // 9. Success Response
        res.status(201).json(savedOrder);

    } catch (err) {
        console.error("Order creation failed:", err.stack);
        res.status(500).json({ 
            message: "অর্ডার প্রসেস করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", 
            error: err.message 
        });
    }
});

/**
 * @route   GET /api/orders/user/:userId
 * @desc    Get order history for a specific user
 * @access  Private
 */
router.get('/user/:userId', auth, async (req, res) => {
    try {
        // Security check: ensure user is requesting their own orders
        if (req.user.id.toString() !== req.params.userId.toString()) {
            return res.status(403).json({ message: "Unauthorized access" });
        }
        
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('[orderRoutes GET] Error:', err.message);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});

module.exports = router;