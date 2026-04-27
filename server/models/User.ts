// server/models/User.ts
// CHANGES:
// 1. IUser.wishlist typed as mongoose.Types.ObjectId[] (was incorrectly string[])
// 2. wishlist schema: Schema.Types.ObjectId ref 'Product' — confirmed, no change needed
// 3. cart[].productId schema: Schema.Types.ObjectId ref 'Product' — confirmed, no change needed

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password?: string;
    name: string;
    phone: string;
    addresses: any[];
    wishlist: mongoose.Types.ObjectId[];
    cart: any[];
    status: 'active' | 'suspended';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name:     { type: String, default: 'Elora Member' },
    phone:    { type: String, default: '' },

    addresses: [{
        label:         { type: String, enum: ['Home', 'Office'], default: 'Home' },
        recipientName: { type: String, required: true },
        contact:       { type: String, required: true },
        country:       { type: String, default: 'Bangladesh' },
        district:      { type: String, required: true },
        area:          { type: String, required: true },
        postCode:      { type: String },
        address:       { type: String, required: true },
        isDefault:     { type: Boolean, default: false }
    }],

    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

    cart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name:      { type: String },
        image:     { type: String },
        size:      { type: String },
        color:     { type: String },
        price:     { type: Number },
        quantity:  { type: Number, default: 1 }
    }],

    status:    { type: String, enum: ['active', 'suspended'], default: 'active' },
    lastLogin: { type: Date }

}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

// For backward compatibility with existing JS requires:
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
module.exports.User = module.exports;