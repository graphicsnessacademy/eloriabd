import mongoose, { Document, Schema } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderValue: number;
  usageLimit: number;
  usageCount: number;
  perUserLimit: number;
  usedBy: mongoose.Types.ObjectId[];
  expiryDate: Date;
  isActive: boolean;
}

const CouponSchema: Schema = new Schema(
  {
    code:           { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType:   { type: String, enum: ['flat', 'percent'], required: true },
    discountValue:  { type: Number, required: true, min: 0 },
    minOrderValue:  { type: Number, default: 0 },
    usageLimit:     { type: Number, default: 100 },
    usageCount:     { type: Number, default: 0 },
    perUserLimit:   { type: Number, default: 1 },
    usedBy:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    expiryDate:     { type: Date, required: true },
    isActive:       { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', CouponSchema);
