import express, { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * POST /api/coupons/validate
 * Body: { code, orderTotal, userId? }
 * Returns: { valid, discountAmount, message }
 * All error messages are in Bangla.
 */
router.post('/validate', async (req: Request, res: Response) => {
  const { code, orderTotal, userId } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ valid: false, message: 'কুপন কোড দিন।' });
  }
  if (!orderTotal || orderTotal <= 0) {
    return res.status(400).json({ valid: false, message: 'অর্ডারের মূল্য অবৈধ।' });
  }

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'এই কুপন কোডটি বিদ্যমান নেই।' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ valid: false, message: 'এই কুপনটি সক্রিয় নেই।' });
    }
    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ valid: false, message: 'এই কুপনের মেয়াদ শেষ হয়ে গেছে।' });
    }
    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ valid: false, message: 'এই কুপনের ব্যবহারের সীমা শেষ।' });
    }
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `এই কুপন ব্যবহারের জন্য ন্যূনতম ৳${coupon.minOrderValue.toLocaleString()} অর্ডার করতে হবে।`,
      });
    }

    // Per-user limit check (only if userId is provided)
    if (userId && coupon.perUserLimit > 0) {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const timesUsed = coupon.usedBy.filter(id => id.equals(userObjectId)).length;
      if (timesUsed >= coupon.perUserLimit) {
        return res.status(400).json({
          valid: false,
          message: 'আপনি এই কুপনটি ইতিমধ্যে ব্যবহার করেছেন।',
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'flat') {
      discountAmount = Math.min(coupon.discountValue, orderTotal);
    } else {
      discountAmount = Math.round((orderTotal * coupon.discountValue) / 100);
    }

    return res.json({
      valid: true,
      discountAmount,
      couponId: coupon._id,
      message: `🎉 কুপন সফলভাবে প্রয়োগ হয়েছে! আপনি ৳${discountAmount.toLocaleString()} ছাড় পেয়েছেন।`,
    });
  } catch (err: any) {
    console.error('Coupon validate error:', err);
    res.status(500).json({ valid: false, message: 'সার্ভার সমস্যা। আবার চেষ্টা করুন।' });
  }
});

export default router;
