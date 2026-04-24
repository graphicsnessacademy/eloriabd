import mongoose, { Document, Schema } from 'mongoose';

export interface IContentPage extends Document {
    slug: string;
    title: string;
    body: string;
    updatedAt: Date;
    updatedBy?: mongoose.Types.ObjectId;
}

const contentPageSchema = new Schema<IContentPage>({
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
}, { timestamps: true });

export const ContentPage = mongoose.models.ContentPage || mongoose.model<IContentPage>('ContentPage', contentPageSchema);
export default ContentPage;
