import express, { Request, Response } from 'express';
import ShippingZone from '../models/ShippingZone';
import { districts } from '../utils/districts';

const router = express.Router();

// GET /api/shipping/rate
router.get('/rate', async (req: Request, res: Response) => {
    try {
        const { district } = req.query;
        
        let districtEn = '';

        if (district) {
            const queryDistrict = (district as string).trim();
            // Check if it's a Bangla name and translate to English, or use as is
            const match = districts.find(d => 
                d.bn === queryDistrict || d.en.toLowerCase() === queryDistrict.toLowerCase()
            );
            if (match) {
                districtEn = match.en;
            } else {
                districtEn = queryDistrict; // Fallback to provided name
            }
        }

        if (districtEn) {
            // Find active zone containing this district
            const zone = await ShippingZone.findOne({
                isActive: true,
                districts: { $in: [districtEn] }
            });

            if (zone) {
                return res.json({
                    rate: zone.flatRate,
                    estimatedDays: zone.estimatedDays,
                    carrier: zone.carrier,
                    zoneName: zone.name
                });
            }
        }

        // Fallback: Default rate if no match or no district provided
        res.json({
            rate: 150,
            estimatedDays: '5-7 days',
            carrier: 'Standard Delivery',
            zoneName: 'Default Zone'
        });

    } catch (error) {
        console.error('Error fetching shipping rate:', error);
        res.status(500).json({ message: 'Error fetching shipping rate' });
    }
});

export default router;
