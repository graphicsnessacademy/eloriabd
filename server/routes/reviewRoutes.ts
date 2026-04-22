import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Order from '../models/Order';
import auth from '../middleware/authMiddleware';
import adminAuth from '../middleware/adminAuth';

const router = express.Router();

/**
 * @route   GET /api/reviews/ping
 * @desc    Debug route to verify the review router is mounted correctly.
 */
router.get('/ping', (_req: Request, res: Response) => {
    res.json({ status: "Review routes are active and connected!" });
});

// --- CUSTOMER ROUTES ---

/**
 * @route   GET /api/reviews/check-eligibility/:productId
 * @desc    Checks if the logged-in user can review a specific product
 */
router.get('/check-eligibility/:productId', auth, async (req: any, res: Response) => {
    try {
        const productId = req.params.productId as string;
        const userId = req.user.id;

        // 1. Find a DELIVERED order belonging to this user that contains this product
        const order = await Order.findOne({
            userId: userId,
            status: 'Delivered',
            'items.productId': productId
        }).select('_id');

        if (!order) {
            return res.json({ 
                canReview: false, 
                message: "Verified purchase required to leave a review." 
            });
        }

        // 2. Check if the user has already submitted a review
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.json({ canReview: false, message: "Already reviewed." });
        }

        res.json({ canReview: true, orderId: order._id });
    } catch (err: any) {
        res.status(500).json({ error: "Eligibility check failed", details: err.message });
    }
});

/**
 * @route   POST /api/reviews
 * @desc    Submit a verified review
 */
router.post('/', auth, async (req: any, res: Response) => {
    try {
        const { productId, rating, text, images, orderId } = req.body;

        // Security re-verification
        const order = await Order.findOne({
            _id: orderId,
            userId: req.user.id,
            status: 'Delivered'
        });

        if (!order) {
            return res.status(403).json({ message: "You can only review products from delivered orders." });
        }

        const newReview = new Review({
            productId,
            userId: req.user.id,
            orderId,
            rating,
            text,
            images: images || [],
            isVerifiedBuyer: true,
            status: 'pending'
        });

        await newReview.save();
        res.status(201).json({ message: "Review submitted for moderation!", review: newReview });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   GET /api/reviews/product/:id
 * @desc    Get approved reviews + Star Breakdown (No Auth Required)
 */
router.get('/product/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        
        // Validation for MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Product ID provided." });
        }

        const productId = new mongoose.Types.ObjectId(id);

        const reviews = await Review.find({ productId, status: 'approved' })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });

        const stats = await Review.aggregate([
            { $match: { productId, status: 'approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    totalReviews: { $sum: 1 },
                    fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
                    fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
                    threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
                    twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
                    oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
                }
            }
        ]);

        res.json({
            reviews: reviews || [],
            stats: stats[0] || { averageRating: 0, totalReviews: 0, fiveStar: 0, fourStar: 0, threeStar: 0, twoStar: 0, oneStar: 0 }
        });
    } catch (err: any) {
        res.status(500).json({ error: "Failed to fetch reviews", details: err.message });
    }
});

// --- ADMIN ROUTES ---

/**
 * @route   GET /api/reviews/admin/list
 */
router.get('/admin/list', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        let query: any = {};
        if (status) query.status = status;

        const reviews = await Review.find(query)
            .populate('productId', 'name image images')
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   PATCH /api/reviews/admin/:id/status
 */
router.patch('/admin/:id/status', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const review = await Review.findByIdAndUpdate(
            id,
            { status: req.body.status },
            { new: true }
        );
        res.json(review);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   DELETE /api/reviews/admin/:id
 */
router.delete('/admin/:id', adminAuth(['super_admin']), async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await Review.findByIdAndDelete(id);
        res.json({ message: "Review deleted permanently." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;