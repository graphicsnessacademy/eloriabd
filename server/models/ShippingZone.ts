import mongoose, { Document, Schema } from 'mongoose';

export interface IShippingZone extends Document {
    name: string;
    districts: string[];
    rateType: 'flat';
    flatRate: number;
    estimatedDays: string;
    carrier: string;
    isActive: boolean;
}

const shippingZoneSchema = new Schema<IShippingZone>({
    name: { type: String, required: true },
    districts: [{ type: String }],
    rateType: { type: String, enum: ['flat'], default: 'flat' },
    flatRate: { type: Number, required: true },
    estimatedDays: { type: String, required: true },
    carrier: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const ShippingZone = mongoose.models.ShippingZone || mongoose.model<IShippingZone>('ShippingZone', shippingZoneSchema);
export default ShippingZone;
