import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  items: Array<{
    productId: mongoose.Types.ObjectId;
    product?: any; // For population
    name: string;
    image: string;
    size?: string;
    color?: string;
    price: number;
    quantity: number;
  }>;
  shippingAddress: any;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  couponDiscount: number;
  total: number;
  totalAmount?: number; // Legacy support
  status: string;
  orderStatus?: string; // Legacy support
  timeline: Array<{
    status: string;
    note?: string;
    timestamp: Date;
  }>;
  internalNotes: Array<{
    content: string;
    author?: string;
    timestamp: Date;
  }>;
  courierName?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  orderNumber: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  items: [{
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    image: { type: String, required: true },
    size: { type: String },
    color: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 1 }
  }],
  shippingAddress: { type: Object, required: true },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  subtotal: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  totalAmount: { type: Number }, // Legacy
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Packaged', 'On Courier', 'Delivered', 'Cancelled', 'Returned'], 
    default: 'Pending' 
  },
  orderStatus: { type: String }, // Legacy
  timeline: [{
    status: String,
    note: String,
    timestamp: { type: Date, default: Date.now }
  }],
  internalNotes: [{
    content: { type: String },
    text: { type: String }, // User's manual update used 'text'
    author: String,
    timestamp: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now } // User's manual update used 'createdAt'
  }],
  courierName: String,
  trackingNumber: String
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
