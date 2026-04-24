import express, { Request, Response } from 'express';
import adminAuth from '../middleware/adminAuth';
import Notification from '../models/Notification';

const router = express.Router();

// Apply admin protection to all routes
router.use(adminAuth());

// GET /api/admin/notifications
router.get('/', async (req: Request, res: Response) => {
    try {
        const { unreadOnly } = req.query;
        const query: any = {};
        
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// GET /api/admin/notifications/count
router.get('/count', async (req: Request, res: Response) => {
    try {
        const unreadCount = await Notification.countDocuments({ isRead: false });
        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching notification count:', error);
        res.status(500).json({ message: 'Error fetching count' });
    }
});

// PATCH /api/admin/notifications/read-all
router.patch('/read-all', async (req: Request, res: Response) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Error updating notifications' });
    }
});

// PATCH /api/admin/notifications/:id/read
router.patch('/:id/read', async (req: Request, res: Response) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error updating notification' });
    }
});

export default router;
