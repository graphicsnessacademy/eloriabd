import express, { Request, Response } from 'express';
import adminAuth from '../middleware/adminAuth';
import PushSubscription from '../models/PushSubscription';
import { getVapidPublicKey, sendPushNotification } from '../services/pushNotificationService';

const router = express.Router();

router.get('/vapidPublicKey', (req: Request, res: Response) => {
    res.json({ publicKey: getVapidPublicKey() });
});

router.post('/subscribe', adminAuth(), async (req: any, res: Response) => {
    try {
        const subscription = req.body;
        
        // Find existing or create new
        const existingSub = await PushSubscription.findOne({ endpoint: subscription.endpoint });
        
        if (!existingSub) {
            const newSub = new PushSubscription({
                ...subscription,
                adminId: req.admin?._id
            });
            await newSub.save();
        } else {
            // Update adminId if needed
            existingSub.adminId = req.admin?._id;
            await existingSub.save();
        }

        res.status(201).json({});
    } catch (error) {
        console.error('Error saving push subscription:', error);
        res.status(500).json({ message: 'Error saving push subscription' });
    }
});

// Test route
router.post('/test', adminAuth(), async (req: Request, res: Response) => {
    try {
        await sendPushNotification({
            title: 'Test Notification',
            body: 'Web push is working perfectly!',
            url: '/admin/orders'
        });
        res.status(200).json({ message: 'Test sent' });
    } catch (error) {
        res.status(500).json({ message: 'Test failed' });
    }
});

export default router;
