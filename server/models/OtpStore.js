const mongoose = require('mongoose');

// Each OTP doc auto-deletes after 5 minutes via TTL index
const otpStoreSchema = new mongoose.Schema({
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    otp:       { type: String, required: true },           // Stored as bcrypt hash
    attempts:  { type: Number, default: 0 },
    // pendingOrderData: the full order payload waiting to be placed after OTP success
    pendingOrder: { type: mongoose.Schema.Types.Mixed },
    // TTL: Mongoose will remove document 300 seconds (5 min) after createdAt
    createdAt: { type: Date, default: Date.now, expires: 300 }
});

module.exports = mongoose.model('OtpStore', otpStoreSchema);