const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        lowercase: true
    },
    password: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['super_admin', 'editor', 'viewer'], 
        default: 'viewer' 
    },
    lastLogin: { 
        type: Date 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    }
}, { timestamps: true });

module.exports = mongoose.model('AdminUser', adminUserSchema);
