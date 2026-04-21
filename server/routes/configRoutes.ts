import express, { Request, Response } from 'express';
import SiteConfig from '../models/SiteConfig';

const router = express.Router();

// @route   GET /api/config
// @desc    Get public site configuration
router.get('/', async (req: Request, res: Response) => {
    try {
        let config = await SiteConfig.findOne();
        
        // If config doesn't exist, create default
        if (!config) {
            config = await SiteConfig.create({});
        }

        res.json(config);
    } catch (err: any) {
        console.error('Config GET error:', err);
        res.status(500).json({ message: 'Server error fetching configuration', error: err.message });
    }
});

export default router;
