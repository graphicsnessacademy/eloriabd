// server/models/Product.ts
// CHANGES:
// 1. Added relatedProducts as ObjectId array ref
// 2. Added totalStock field to interface + schema
// 3. Pre-save hook: stock = totalStock = sum of variants; low-stock notification if < 3
// 4. _id is default ObjectId — no custom ID generation

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
  totalStock: number;
  inStock: boolean;
  isNewProduct: boolean;
  isBestSeller: boolean;
  isDeleted: boolean;
  relatedProducts: mongoose.Types.ObjectId[];
  sizeChart?: {
    show: boolean;
    data: Array<{
      size: string;
      chest?: string;
      length?: string;
      sleeve?: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name:          { type: String, required: true, trim: true },
    price:         { type: Number, required: true },
    originalPrice: { type: Number },
    description:   { type: String },
    category:      { type: String, required: true },
    subcategory:   { type: String },

    images: [{
      url:       { type: String, required: true },
      publicId:  { type: String, required: true },
      isPrimary: { type: Boolean, default: false }
    }],
    image: { type: String }, // Legacy

    variants: [{
      size:  { type: String, required: true },
      color: { type: String, required: true },
      stock: { type: Number, default: 0 }
    }],

    stock:      { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
    inStock:    { type: Boolean, default: true },

    isNewProduct:  { type: Boolean, default: false },
    isBestSeller:  { type: Boolean, default: false },
    isDeleted:     { type: Boolean, default: false },

    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    sizeChart: {
      show: { type: Boolean, default: false },
      data: [{
        size:   { type: String },
        chest:  { type: String },
        length: { type: String },
        sleeve: { type: String }
      }]
    }
  },
  { timestamps: true }
);

// Pre-save hook:
//   1. totalStock = sum of all variant stocks
//   2. stock = totalStock (keep both in sync)
//   3. inStock = totalStock > 0
//   4. image synced from primary image
//   5. low-stock notification if totalStock < 3
ProductSchema.pre<IProduct>('save', function () {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce(
      (acc, variant) => acc + (variant.stock || 0),
      0
    );
  } else {
    this.totalStock = this.stock || 0;
  }

  this.stock   = this.totalStock;
  this.inStock = this.totalStock > 0;

  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary) || this.images[0];
    this.image = primary.url;
  }

  if (this.totalStock < 3) {
    console.warn(
      `⚠️  LOW STOCK ALERT: "${this.name}" has only ${this.totalStock} unit(s) left.`
    );
  }
});

export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);