import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
    type: 'new_order' | 'low_stock' | 'new_review';
    message: string;
    link: string;
    isRead: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
    type: { type: String, enum: ['new_order', 'low_stock', 'new_review'], required: true },
    message: { type: String, required: true },
    link: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
