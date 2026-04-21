import express, { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import adminAuth from '../middleware/adminAuth';

const router = express.Router();

/** Random 8-character uppercase alphanumeric code */
const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// GET /api/admin/coupons – list all
router.get('/', adminAuth(), async (_req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to fetch coupons.', error: err.message });
  }
});

// POST /api/admin/coupons – create
router.post('/', adminAuth(['super_admin', 'editor']), async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.code) body.code = generateCode();
    body.code = body.code.toUpperCase().trim();

    const coupon = await Coupon.create(body);
    res.status(201).json(coupon);
  } catch (err: any) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'এই কোড ইতিমধ্যে বিদ্যমান। অন্য কোড ব্যবহার করুন।' });
    res.status(500).json({ message: 'Coupon creation failed.', error: err.message });
  }
});

// PATCH /api/admin/coupons/:id – update
router.patch('/:id', adminAuth(['super_admin', 'editor']), async (req: Request, res: Response) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found.' });
    res.json(coupon);
  } catch (err: any) {
    res.status(500).json({ message: 'Update failed.', error: err.message });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/:id', adminAuth(['super_admin']), async (req: Request, res: Response) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Delete failed.', error: err.message });
  }
});

export default router;
