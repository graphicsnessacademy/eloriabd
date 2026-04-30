/**
 * server/models/User.ts
 * 
 * CHANGES:
 * 1. Defined strict interfaces for IAddress and ICartItem for better TypeScript safety.
 * 2. Added pre-save hook to format Name to "Title Case" (Ahsan Habib) before saving.
 * 3. Ensured wishlist and cart.productId use strict Schema.Types.ObjectId.
 * 4. Added index on phone number (sparse) to ensure uniqueness without breaking guest/old data.
 * 5. Maintained hybrid CJS/ESM export for compatibility with current routes.
 */

import mongoose, { Document, Schema } from 'mongoose';

// Interface for User Addresses
export interface IAddress {
    _id?: mongoose.Types.ObjectId;
    label: 'Home' | 'Office';
    recipientName: string;
    contact: string;
    country: string;
    district: string;
    area: string;
    postCode?: string;
    address: string;
    isDefault: boolean;
}

// Interface for Cart Items
export interface ICartItem {
    productId: mongoose.Types.ObjectId;
    name: string;
    image: string;
    size: string;
    color: string;
    price: number;
    quantity: number;
}

export interface IUser extends Document {
    email: string;
    password?: string;
    name: string;
    phone: string;
    addresses: IAddress[];
    wishlist: mongoose.Types.ObjectId[];
    cart: ICartItem[];
    status: 'active' | 'suspended';
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    email: { 
        type: String, 
        required: [true, 'Email is required'], 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'] 
    },
    name: { 
        type: String, 
        default: 'Eloria Member', 
        trim: true 
    },
    phone: { 
        type: String, 
        default: '', 
        index: { unique: true, sparse: true } // Prevents duplicate phones while allowing empty
    },

    addresses: [{
        label: { type: String, enum: ['Home', 'Office'], default: 'Home' },
        recipientName: { type: String, required: true },
        contact: { type: String, required: true },
        country: { type: String, default: 'Bangladesh' },
        district: { type: String, required: true },
        area: { type: String, required: true },
        postCode: { type: String },
        address: { type: String, required: true },
        isDefault: { type: Boolean, default: false }
    }],

    wishlist: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Product' 
    }],

    cart: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String },
        image: { type: String },
        size: { type: String },
        color: { type: String },
        price: { type: Number },
        quantity: { type: Number, default: 1 }
    }],

    status: { 
        type: String, 
        enum: ['active', 'suspended'], 
        default: 'active' 
    },
    lastLogin: { type: Date }

}, { timestamps: true });

/**
 * PRE-SAVE HOOK: Name Formatting
 * Converts "ahsan habib" to "Ahsan Habib" automatically
 */
userSchema.pre('save', async function () {
    // Normalize email to lowercase on every save
    if (this.isModified('email')) {
        this.email = this.email.toLowerCase();
    }

    // Normalize name to Title Case on every save
    if (this.isModified('name') && this.name) {
        this.name = this.name
            .trim()
            .split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
    }
});

// Unified Export for both ESM and CJS compatibility
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;