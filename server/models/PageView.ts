import mongoose, { Document, Schema } from 'mongoose';

export interface IPageView extends Document {
    path: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    userAgent?: string;
    geoCountry?: string;
    geoCity?: string;
    timestamp: Date;
}

const pageViewSchema = new Schema<IPageView>({
    path: { type: String, required: true },
    referrer: { type: String },
    utmSource: { type: String },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    userAgent: { type: String },
    geoCountry: { type: String },
    geoCity: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// TTL Index to automatically delete documents after 90 days (7776000 seconds)
pageViewSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

export const PageView = mongoose.models.PageView || mongoose.model<IPageView>('PageView', pageViewSchema);
