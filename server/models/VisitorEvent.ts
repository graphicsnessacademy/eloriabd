import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitorEvent extends Document {
    visitorId: string;
    sessionId: string;
    userId?: mongoose.Types.ObjectId;
    eventType: string;
    payload: any;
    createdAt: Date;
}

const visitorEventSchema = new Schema<IVisitorEvent>({
    visitorId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    eventType: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});

export const VisitorEvent = mongoose.models.VisitorEvent || mongoose.model<IVisitorEvent>('VisitorEvent', visitorEventSchema);
