import express, { Request, Response } from 'express';
const router = express.Router();
import Order, { IOrder } from '../models/Order';
import adminAuth from '../middleware/adminAuth';
import { sendEmail } from '../services/emailService';

// @route   GET /api/admin/orders
// @desc    Get all orders with filtering and status counts
router.get('/', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    try {
        const { status, startDate, endDate, search, page = 1, limit = 20 } = req.query;

        // Define query as 'any' to avoid "Property does not exist" errors in TS
        const query: any = {};

        // Status Filter
        if (status && status !== 'All') {
            query.status = status;
        }

        // Date Range Filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate as string);
            if (endDate) query.createdAt.$lte = new Date(endDate as string);
        }

        // Search Filter (Order Number, Name, or Phone)
        if (search) {
            const searchRegex = { $regex: search as string, $options: 'i' };
            query.$or = [
                { orderNumber: searchRegex },
                { 'customer.name': searchRegex },
                { 'customer.phone': searchRegex }
            ];
        }

        // Execute Query with Pagination
        const skip = (Number(page) - 1) * Number(limit);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)) as IOrder[];

        const total = await Order.countDocuments(query);

        // Get counts for each status
        const statusCounts = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({
            orders,
            total,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            statusCounts: statusCounts.reduce((acc, curr) => {
                acc[curr._id] = curr.count;
                return acc;
            }, { All: total })
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/admin/orders/bulk-status
router.patch('/bulk-status', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    const { orderIds, status } = req.body;
    try {
        await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status: status } }
        );
        res.json({ message: `${orderIds.length} orders updated to ${status}` });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// @route   GET /api/admin/orders/:id
router.get('/:id', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.productId') as IOrder | null;
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.json(order);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/admin/orders/:id/status
// @desc    Update status + Trigger Transactional Emails (including Review Invitations)
router.patch('/:id/status', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    const { status, note } = req.body;
    try {
        const order = await Order.findById(req.params.id) as IOrder | null;
        if (!order) return res.status(404).json({ message: "Order not found" });

        const oldStatus = order.status;
        order.status = status;

        // Ensure timeline exists
        if (!order.timeline || !Array.isArray(order.timeline)) {
            (order as any).timeline = [];
        }

        // Add the new status to the timeline
        order.timeline.push({ 
            status, 
            note: note || `Status updated to ${status}`, 
            timestamp: new Date() 
        });
        
        await order.save();

        // ─── EMAIL TRIGGERS (Sprint 3.3 & 5.1) ───
        if (status !== oldStatus && order.customer?.email) {
            (async () => {
                try {
                    const orderRef = order.orderNumber || order._id.toString().slice(-8);
                    const email = order.customer.email;
                    
                    switch (status) {
                        case 'Confirmed':
                            await sendEmail(email, `আপনার অর্ডার confirmed হয়েছে! ✓ Order #${orderRef}`, 'OrderConfirmed', order);
                            break;
                        case 'Packaged':
                            await sendEmail(email, `আপনার অর্ডার pack হয়েছে — Dispatching soon`, 'OrderPackaged', order);
                            break;
                        case 'On Courier':
                            await sendEmail(email, `আপনার অর্ডার courier-এ আছে`, 'OrderOnCourier', order);
                            break;
                        case 'Delivered':
                            // Sprint 5.1: Review Invitation Trigger
                            await sendEmail(
                                email, 
                                `আপনার অর্ডার পৌঁছেছে! আপনার অভিজ্ঞতা শেয়ার করুন ✨`, 
                                'OrderDelivered', 
                                {
                                    order,
                                    reviewLink: `https://eloriabd-shop.vercel.app/account` // Link to user dashboard
                                }
                            );
                            break;
                        case 'Cancelled':
                            await sendEmail(email, `অর্ডার cancel হয়েছে — Order #${orderRef}`, 'OrderCancelled', order);
                            break;
                        case 'Returned':
                            await sendEmail(email, `Return request পেয়েছি — আমরা review করছি`, 'ReturnInitiated', order);
                            break;
                    }
                } catch (err) {
                    console.error("Email trigger failed:", err);
                }
            })();
        }

        res.json({ message: "Status updated successfully", order });
    } catch (err: any) {
        console.error("PATCH ERROR:", err);
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/admin/orders/:id/notes
router.post('/:id/notes', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { $push: { internalNotes: { content: req.body.text, timestamp: new Date() } } },
            { new: true }
        ) as IOrder | null;
        res.json(order?.internalNotes || []);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// @route   PATCH /api/admin/orders/:id/courier
router.patch('/:id/courier', adminAuth(['editor', 'super_admin']), async (req: Request, res: Response) => {
    try {
        const { courierName, trackingNumber } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { courierName, trackingNumber },
                $push: { timeline: { status: 'On Courier', note: `Courier set to ${courierName}. Tracking: ${trackingNumber}`, timestamp: new Date() } }
            },
            { new: true }
        ) as IOrder | null;
        res.json(order);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;