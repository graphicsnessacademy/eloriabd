import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  rating: number;
  text: string;
  images: string[];
  status: 'pending' | 'approved' | 'hidden';
  isVerifiedBuyer: boolean;
  helpfulCount: number;
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  images: [{ type: String }],
  status: { type: String, enum: ['pending', 'approved', 'hidden'], default: 'pending' },
  isVerifiedBuyer: { type: Boolean, default: true },
  helpfulCount: { type: Number, default: 0 }
}, { timestamps: true });

// Indexing for faster lookups
ReviewSchema.index({ productId: 1, status: 1 });

export default mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);