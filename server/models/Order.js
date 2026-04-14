const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: { type: String, required: true },
        image: { type: String, required: true },
        size: { type: String },
        color: { type: String },
        price: { type: Number, required: true },
        quantity: { type: Number, default: 1 }
    }],
    shippingAddress: { type: Object, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    orderStatus: { 
        type: String, 
        enum: ['Ongoing', 'Completed', 'Cancelled'], 
        default: 'Ongoing' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
