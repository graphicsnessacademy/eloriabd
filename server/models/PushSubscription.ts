import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  adminId: mongoose.Types.ObjectId;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  adminId: { type: Schema.Types.ObjectId, ref: 'AdminUser', required: true }
}, { timestamps: true });

export const PushSubscription = mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
