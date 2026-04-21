import express, { Request, Response } from 'express';
import SiteConfig from '../models/SiteConfig';
import adminAuth from '../middleware/adminAuth';

const router = express.Router();

interface AdminRequest extends Request { admin?: any; }

const merge = (existing: any, incoming: any) => {
  const base = typeof existing?.toObject === 'function' ? existing.toObject() : (existing ?? {});
  return { ...base, ...incoming };
};

// GET /api/admin/config
router.get('/', adminAuth(['super_admin', 'editor']), async (_req: AdminRequest, res: Response) => {
  try {
    let config = await SiteConfig.findOne();
    if (!config) config = await SiteConfig.create({});
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ message: 'Error fetching config', error: err.message });
  }
});

// PATCH /api/admin/config
router.patch('/', adminAuth(['super_admin']), async (req: AdminRequest, res: Response) => {
  try {
    let config = await SiteConfig.findOne();

    if (!config) {
      config = await SiteConfig.create(req.body);
      return res.json({ message: 'Configuration created!', config });
    }

    const b = req.body;

    if (b.freeShippingThreshold !== undefined) config.freeShippingThreshold = b.freeShippingThreshold;
    if (b.returnPolicyDays      !== undefined) config.returnPolicyDays      = b.returnPolicyDays;
    if (b.storeName)  config.storeName  = b.storeName;
    if (b.storePhone) config.storePhone = b.storePhone;
    if (b.storeEmail) config.storeEmail = b.storeEmail;

    if (b.announcementBar) config.announcementBar = merge(config.announcementBar, b.announcementBar);
    if (b.socialLinks)     config.socialLinks     = merge(config.socialLinks,     b.socialLinks);
    if (b.defaultMeta)     config.defaultMeta     = merge(config.defaultMeta,     b.defaultMeta);

    if (b.offerZones) {
      const oz = b.offerZones;
      if (Array.isArray(oz.hero))  config.offerZones.hero      = oz.hero;
      if (oz.countdown)            config.offerZones.countdown = merge(config.offerZones.countdown, oz.countdown);
      if (oz.popup)                config.offerZones.popup     = merge(config.offerZones.popup,     oz.popup);
      config.markModified('offerZones');
    }

    await config.save();
    res.json({ message: 'Configuration updated!', config });
  } catch (err: any) {
    console.error('Config PATCH error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;