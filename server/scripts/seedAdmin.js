require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminUser = require('../models/AdminUser');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('📦 Connected to Database.');

        const adminCount = await AdminUser.countDocuments();
        
        if (adminCount === 0) {
            console.log('⚠️ No AdminUser found. Creating default super_admin...');
            
            const hashedPassword = await bcrypt.hash('eloriaadmin2026', 10);
            
            const defaultAdmin = new AdminUser({
                email: 'admin@eloriabd.com',
                password: hashedPassword,
                name: 'System Admin',
                role: 'super_admin'
            });

            await defaultAdmin.save();
            console.log('✅ Default super_admin created!');
            console.log('---------------------------------');
            console.log('Email: admin@eloriabd.com');
            console.log('Password: eloriaadmin2026');
            console.log('---------------------------------');
        } else {
            console.log(`ℹ️ Admin collection already exists with ${adminCount} users. Skipping seed.`);
        }
    } catch (err) {
        console.error('❌ Error seeding admin user:', err);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
};

seedAdmin();
