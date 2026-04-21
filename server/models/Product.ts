import mongoose, { Document, Schema } from 'mongoose';

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
  stock: number;
  inStock: boolean;
  isNewProduct: boolean;
  isBestSeller: boolean;
  isDeleted: boolean;
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
  stock: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  isNewProduct: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

// Pre-save hook to calculate total stock and inStock status
ProductSchema.pre<IProduct>('save', function() {
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((acc, variant) => acc + (variant.stock || 0), 0);
    this.inStock = this.stock > 0;
  } else {
    this.inStock = this.stock > 0;
  }
  
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary) || this.images[0];
    this.image = primary.url;
  }
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
