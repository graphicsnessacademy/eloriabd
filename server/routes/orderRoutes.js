// server/routes/orderRoutes.js
// CHANGES:
// 1. productId sanitization in sanitizedItems now uses rawPid multi-source extraction
//    (item.productId?._id || item.productId || item.product?._id || item.product || item._id)
// 2. mongoose.isValidObjectId(pidStr) gates the final productId value → undefined if invalid
// 3. Everything else unchanged: coupon tracking, cart wipe, auth, calculations

const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

// Bridge for TypeScript models
const _OrderModule = require('../models/Order');
const Order = _OrderModule.default || _OrderModule;

const User = require('../models/User');
const _authModule = require('../middleware/authMiddleware');
const auth = _authModule.default || _authModule.authMiddleware || _authModule;

const _CouponModule = require('../models/Coupon');
const Coupon = _CouponModule.default || _CouponModule;

/**
 * @route   POST /api/orders
 * @desc    Create a new order for logged-in users
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
    try {
        const {
            items,
            shippingAddress,
            paymentMethod,
            totalAmount,
            couponCode,
            couponDiscount
        } = req.body;

        // 1. Basic Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ message: "আপনার ব্যাগ খালি। অর্ডার করার জন্য পন্য যুক্ত করুন।" });
        }
        if (!shippingAddress) {
            return res.status(400).json({ message: "শিপিং অ্যাড্রেস প্রয়োজন।" });
        }

        // 2. Fetch latest user data
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "ইউজার খুঁজে পাওয়া যায়নি।" });
        }

        // 3. Calculation Logic
        const calculatedSubtotal = items.reduce(
            (sum, item) => sum + (item.price * (item.quantity || 1)), 0
        );
        const discount = Number(couponDiscount) || 0;

        // Shipping: FREE only for Sylhet district + Sylhet Sadar thana
        const isFreeShipping = (
            shippingAddress?.district === 'সিলেট' &&
            shippingAddress?.thana    === 'সিলেট সদর'
        );
        const shippingCost = isFreeShipping ? 0 : 60;

        // Always recalculate server-side — do not trust client totalAmount
        const finalTotal = Math.max(0, calculatedSubtotal + shippingCost - discount);

        // 4. Sanitize items — extract productId from any shape the client may send
        const sanitizedItems = items.map(item => {
            const rawPid = item.productId?._id
                || item.productId
                || item.product?._id
                || item.product
                || item._id;
            const pidStr = rawPid ? String(rawPid) : '';

            return {
                productId: mongoose.isValidObjectId(pidStr) ? pidStr : undefined,
                name:      item.name,
                image:     item.image,
                size:      item.size  || 'Standard',
                color:     item.color || 'Default',
                price:     Number(item.price),
                quantity:  Number(item.quantity) || 1
            };
        });

        // 5. Create the new Order
        const newOrder = new Order({
            userId: req.user.id,
            customer: {
                name:  user.name  || shippingAddress?.recipientName || 'Elora Member',
                phone: user.phone || shippingAddress?.contact       || 'N/A',
                email: user.email
            },
            items:          sanitizedItems,
            shippingAddress,
            paymentMethod:  paymentMethod || 'Cash on Delivery',
            subtotal:       calculatedSubtotal,
            shippingCost:   shippingCost,
            couponCode:     couponCode ? couponCode.toUpperCase().trim() : '',
            couponDiscount: discount,
            total:          finalTotal,
            status:         'Pending'
        });

        // 6. Save (triggers EL-YYMM-XXXX serial generation in model pre-save)
        const savedOrder = await newOrder.save();

        // 7. Wipe the user's cart in the database
        await User.findByIdAndUpdate(req.user.id, { cart: [] });

        // 8. Handle Coupon Usage Tracking
        if (couponCode) {
            try {
                await Coupon.findOneAndUpdate(
                    { code: couponCode.toUpperCase().trim() },
                    {
                        $inc:  { usageCount: 1 },
                        $push: { usedBy: req.user.id }
                    }
                );
            } catch (couponErr) {
                console.error("Coupon tracking failed:", couponErr.message);
                // Do not block the order if only the coupon counter fails
            }
        }

        // 9. Success Response
        res.status(201).json(savedOrder);

    } catch (err) {
        console.error("Order creation failed:", err.stack);
        res.status(500).json({
            message: "অর্ডার প্রসেস করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।",
            error:   err.message
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
        // Security check: user may only fetch their own orders
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