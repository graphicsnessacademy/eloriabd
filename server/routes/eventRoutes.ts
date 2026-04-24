import express from 'express';
import { VisitorEvent } from '../models/VisitorEvent';

const router = express.Router();

// POST / - Tracks a visitor event
router.post('/', async (req, res) => {
    try {
        const { visitorId, sessionId, userId, eventType, payload, path } = req.body;

        if (!visitorId || !eventType) {
            return res.status(400).json({ error: 'visitorId and eventType are required' });
        }

        const newEvent = new VisitorEvent({
            visitorId,
            sessionId: sessionId || 'unknown',
            userId,
            eventType,
            payload: { ...payload, path }
        });

        await newEvent.save();
        res.status(201).json({ success: true, event: newEvent });
    } catch (error) {
        console.error('Error saving visitor event:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /merge - Merges anonymous visitor history with an authenticated user
router.post('/merge', async (req, res) => {
    try {
        const { visitorId, userId } = req.body;

        if (!visitorId || !userId) {
            return res.status(400).json({ error: 'visitorId and userId are required' });
        }

        await VisitorEvent.updateMany(
            { visitorId },
            { $set: { userId } }
        );

        res.status(200).json({ success: true, message: 'Identity merged' });
    } catch (error) {
        console.error('Error merging visitor identity:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
