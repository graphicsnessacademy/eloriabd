const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: 'Elora Member' },
    phone: { type: String, default: '' },
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
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    cart: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);