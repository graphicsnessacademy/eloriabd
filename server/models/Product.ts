// server/models/Product.ts
// PERFORMANCE CHANGES:
// 1. Added 5 compound indexes — eliminates full collection scans
//    - { isDeleted, createdAt } covers GET /api/products (main listing)
//    - { category, isDeleted }  covers shop page category filtering
//    - { isNewProduct, isDeleted } covers homepage New Arrivals section
//    - { isBestSeller, isDeleted } covers homepage Best Seller section
//    - { name: 'text' }           covers search
// Without these, MongoDB scans every document on every request.

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
  image?: string;
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
    image: { type: String },

    variants: [{
      size:  { type: String, required: true },
      color: { type: String, required: true },
      stock: { type: Number, default: 0 }
    }],

    stock:      { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
    inStock:    { type: Boolean, default: true },

    isNewProduct:    { type: Boolean, default: false },
    isBestSeller:    { type: Boolean, default: false },
    isDeleted:       { type: Boolean, default: false },

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

// ─── INDEXES ──────────────────────────────────────────────────────────────────
// These are the single most impactful performance change.
// Without indexes every Product.find() is an O(n) full collection scan.
// With indexes MongoDB resolves queries in O(log n) using a B-tree.

// Covers: GET /api/products → find({ isDeleted: {$ne:true} }).sort({ createdAt: -1 })
ProductSchema.index({ isDeleted: 1, createdAt: -1 });

// Covers: shop page category filter → find({ category, isDeleted })
ProductSchema.index({ category: 1, isDeleted: 1 });

// Covers: homepage New Arrivals section
ProductSchema.index({ isNewProduct: 1, isDeleted: 1 });

// Covers: homepage Best Seller section
ProductSchema.index({ isBestSeller: 1, isDeleted: 1 });

// Covers: inStock filtering in shop
ProductSchema.index({ inStock: 1, isDeleted: 1 });

// Covers: text search on search page
ProductSchema.index({ name: 'text', description: 'text' });

// ─── PRE-SAVE HOOK ────────────────────────────────────────────────────────────
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
    console.warn(`⚠️  LOW STOCK ALERT: "${this.name}" has only ${this.totalStock} unit(s) left.`);
  }
});

export default mongoose.models.Product ||
  mongoose.model<IProduct>('Product', ProductSchema);