import mongoose, { Document, Schema } from 'mongoose';

export interface IDailySummary extends Document {
    date: Date;
    totalViews: number;
    uniquePaths: Array<{ path: string; count: number }>;
    topReferrers: Array<{ source: string; count: number }>;
    topUTMSources: Array<{ source: string; count: number }>;
    topCities: Array<{ city: string; count: number }>;
}

const dailySummarySchema = new Schema<IDailySummary>({
    date: { type: Date, required: true, unique: true },
    totalViews: { type: Number, default: 0 },
    uniquePaths: [{ path: String, count: Number }],
    topReferrers: [{ source: String, count: Number }],
    topUTMSources: [{ source: String, count: Number }],
    topCities: [{ city: String, count: Number }]
});

export const DailySummary = mongoose.models.DailySummary || mongoose.model<IDailySummary>('DailySummary', dailySummarySchema);
