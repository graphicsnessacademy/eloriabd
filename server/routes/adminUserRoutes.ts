import express, { Request, Response } from 'express';
import adminAuth from '../middleware/adminAuth';
import { User } from '../models/User';
import { VisitorEvent } from '../models/VisitorEvent';
import Order from '../models/Order';
import { Parser } from 'json2csv';

const router = express.Router();

// Apply admin protection to all routes
router.use(adminAuth(['super_admin']));

// GET /api/admin/users
router.get('/', async (req: Request, res: Response) => {
    try {
        const { search, status, page = '1', limit = '10' } = req.query;
        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        // Aggregate to get orderCount and totalSpent
        const users = await User.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: parseInt(limit as string) },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    orderCount: { $size: '$orders' },
                    totalSpent: { $sum: '$orders.total' }
                }
            },
            {
                $project: {
                    password: 0,
                    orders: 0 // Remove the large orders array from response
                }
            }
        ]);

        const total = await User.countDocuments(query);

        res.json({
            users,
            total,
            pages: Math.ceil(total / parseInt(limit as string))
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

// GET /api/admin/users/export
router.get('/export', async (req: Request, res: Response) => {
    try {
        const { search, status } = req.query;
        const query: any = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const users = await User.aggregate([
            { $match: query },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'orders',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'orders'
                }
            },
            {
                $addFields: {
                    orderCount: { $size: '$orders' },
                    totalSpent: { $sum: '$orders.total' }
                }
            }
        ]);

        const fields = ['name', 'email', 'phone', 'status', 'orderCount', 'totalSpent', 'createdAt', 'lastLogin'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(users);

        res.header('Content-Type', 'text/csv');
        res.attachment('eloria_users.csv');
        return res.send(csv);
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({ message: 'Error exporting users', error });
    }
});

// GET /api/admin/users/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('wishlist', 'name image price');
            
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error });
    }
});

// GET /api/admin/users/:id/activity
router.get('/:id/activity', async (req: Request, res: Response) => {
    try {
        const orders = await Order.find({ userId: req.params.id }).sort({ createdAt: -1 });
        const events = await VisitorEvent.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(50);
        
        res.json({ orders, events });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Error fetching user activity', error });
    }
});

// PATCH /api/admin/users/:id/status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({ message: 'Error updating user status', error });
    }
});

export default router;
