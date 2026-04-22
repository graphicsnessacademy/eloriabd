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
  totalAmount?: number;
  status: string;
  orderStatus?: string;
  timeline: Array<{
    status: string;
    note?: string;
    timestamp: Date;
  }>;
  internalNotes: Array<{
    text?: string;
    content?: string;
    author?: string;
    timestamp: Date;
  }>;
  courierName?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper to generate EL-YYMM-RANDOM
const generateOrderNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(10000 + Math.random() * 90000).toString().slice(-4);
    return `EL-${year}${month}-${random}`;
};

const OrderSchema: Schema = new Schema({
  orderNumber: { 
    type: String, 
    unique: true, 
    default: generateOrderNumber 
  },
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
  totalAmount: { type: Number },
  status: { 
    type: String, 
    enum: ['Pending', 'Confirmed', 'Packaged', 'On Courier', 'Delivered', 'Cancelled', 'Returned'], 
    default: 'Pending' 
  },
  orderStatus: { type: String },
  timeline: {
    type: [{
        status: String,
        note: String,
        timestamp: { type: Date, default: Date.now }
    }],
    default: []
  },
  internalNotes: {
    type: [{
        text: String,
        content: String,
        author: String,
        timestamp: { type: Date, default: Date.now }
    }],
    default: []
  },
  courierName: { type: String, default: '' },
  trackingNumber: { type: String, default: '' }
}, { timestamps: true });
  
/**
 * FIX: Pre-save hook
 * 1. We use "this: IOrder" to tell TypeScript exactly what 'this' is.
 * 2. We use an async function which removes the need for next().
 */
OrderSchema.pre('save', async function (this: IOrder) {
    // Sync total/status for legacy field support
    if (this.total && !this.totalAmount) this.totalAmount = this.total;
    if (this.status && !this.orderStatus) this.orderStatus = this.status;

    // Initialize timeline if it's a brand new order
    // Now '.length' and '.push' will work because 'this' is typed as IOrder
    if (this.isNew && this.timeline.length === 0) {
        this.timeline.push({
            status: 'Pending',
            note: 'অর্ডারটি সফলভাবে সম্পন্ন হয়েছে।',
            timestamp: new Date()
        });
    }
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);