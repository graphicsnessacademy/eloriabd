import express, { Request, Response } from 'express';
import adminAuth from '../middleware/adminAuth';
import ShippingZone from '../models/ShippingZone';

const router = express.Router();

// ─── ADMIN ROUTES (Protected) ────────────────────────────────────────────────

router.use(adminAuth());

// GET /api/admin/shipping
router.get('/', async (req: Request, res: Response) => {
    try {
        const zones = await ShippingZone.find().sort({ createdAt: -1 });
        res.json(zones);
    } catch (error) {
        console.error('Error fetching shipping zones:', error);
        res.status(500).json({ message: 'Error fetching shipping zones' });
    }
});

// POST /api/admin/shipping
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, districts, rateType, flatRate, estimatedDays, carrier, isActive } = req.body;
        
        // Basic validation
        if (!name || !flatRate || !estimatedDays || !carrier) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newZone = new ShippingZone({
            name,
            districts: districts || [],
            rateType: rateType || 'flat',
            flatRate: Number(flatRate),
            estimatedDays,
            carrier,
            isActive: isActive !== undefined ? isActive : true
        });

        await newZone.save();
        res.status(201).json(newZone);
    } catch (error) {
        console.error('Error creating shipping zone:', error);
        res.status(500).json({ message: 'Error creating shipping zone' });
    }
});

// PATCH /api/admin/shipping/:id
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        const zone = await ShippingZone.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!zone) {
            return res.status(404).json({ message: 'Shipping zone not found' });
        }

        res.json(zone);
    } catch (error) {
        console.error('Error updating shipping zone:', error);
        res.status(500).json({ message: 'Error updating shipping zone' });
    }
});

// DELETE /api/admin/shipping/:id (Super Admin Only)
router.delete('/:id', adminAuth(['super_admin']), async (req: Request, res: Response) => {
    try {
        const zone = await ShippingZone.findByIdAndDelete(req.params.id);
        if (!zone) {
            return res.status(404).json({ message: 'Shipping zone not found' });
        }
        res.json({ message: 'Shipping zone deleted successfully' });
    } catch (error) {
        console.error('Error deleting shipping zone:', error);
        res.status(500).json({ message: 'Error deleting shipping zone' });
    }
});

export default router;
