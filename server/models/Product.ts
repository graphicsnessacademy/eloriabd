import mongoose, { Document, Schema } from 'mongoose';
import { createNotification } from '../utils/createNotification';

export interface IProduct extends Document {
  name: string;
  price: number;
  originalPrice?: number;
  description?: string;
  category: string;
  subcategory?: string;
  images: Array<{
    url: string;
    publicId: string;
    isPrimary: boolean;
  }>;
  image?: string; // Legacy fallback
  variants: Array<{
    size: string;
    color: string;
    stock: number;
  }>;
  totalStock: number;
  stock: number;
  inStock: boolean;
  isNewProduct: boolean;
  isBestSeller: boolean;
  isDeleted: boolean;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  relatedProducts?: mongoose.Types.ObjectId[] | any[];
  sizeChart?: {
    show: boolean;
    data: Array<{
      size: string;
      chest: string;
      length: string;
      sleeve: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  description: { type: String },
  category: { type: String, required: true },
  subcategory: { type: String },
  images: [{
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
  }],
  image: { type: String }, // Legacy
  variants: [{
    size: { type: String, required: true },
    color: { type: String, required: true },
    stock: { type: Number, default: 0 }
  }],
  totalStock: { type: Number, default: 0 },
  stock: { type: Number, default: 0 }, // Legacy fallback
  inStock: { type: Boolean, default: true },
  isNewProduct: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  tags: [String],
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  relatedProducts: {
    type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    validate: {
      validator: function(val: any[]) { return val.length <= 6; },
      message: 'Maximum 6 related products allowed'
    }
  },
  sizeChart: {
    show: { type: Boolean, default: false },
    data: [{
      size: String,
      chest: String,
      length: String,
      sleeve: String
    }]
  }
}, { timestamps: true });

// Pre-save hook: auto-calculate totalStock and inStock from variants
ProductSchema.pre<IProduct>('save', async function () {
  try {
    if (this.variants && this.variants.length > 0) {
      const total = this.variants.reduce((acc, variant) => acc + (variant.stock || 0), 0);
      this.totalStock = total;
      this.stock = total; // keep legacy field in sync
      this.inStock = total > 0;
    } else {
      // Legacy fallback: if no variants, use the legacy stock field
      this.totalStock = Math.max(0, this.stock || 0);
      this.inStock = this.totalStock > 0;
    }

    // Sync legacy `image` field with the primary image URL
    if (this.images && this.images.length > 0) {
      const primary = this.images.find(img => img.isPrimary) || this.images[0];
      this.image = primary.url;
    }

    // Fire low-stock notification (3 or fewer units remaining)
    if (this.totalStock > 0 && this.totalStock < 3) {
      createNotification(
        'low_stock',
        `${this.name} is running low on stock (${this.totalStock} left)`,
        `/admin/products/${this._id}/edit`
      ).catch(err => console.error('Low stock notification error:', err));
    }
    
  } catch (err: any) {
    throw err;
  }
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
