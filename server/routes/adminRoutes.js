const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const Order = require('../models/Order').default;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');

// POST /api/admin/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const admin = await AdminUser.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!admin.isActive) {
            return res.status(403).json({ message: 'Account is deactivated' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Update lastLogin
        admin.lastLogin = new Date();
        await admin.save();

        // Generate JWT
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '8h' }
        );

        // Set HttpOnly Cookie (maxAge: 8 hours)
        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 8 * 60 * 60 * 1000 // 8 hours in milliseconds
        });

        res.status(200).json({
            message: 'Logged in successfully',
            user: {
                _id: admin._id,
                email: admin.email,
                name: admin.name,
                role: admin.role
            }
        });
    } catch (err) {
        console.error('Admin Login Error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /api/admin/me
router.get('/me', adminAuth(), async (req, res) => {
    try {
        // req.admin is set by adminAuth middleware
        const { _id, email, name, role } = req.admin;
        res.status(200).json({
            user: { _id, email, name, role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// Admin Product Management
const Product = require('../models/Product').default;
const { body, validationResult } = require('express-validator');
const EventEmitter = require('events');

// Export product events if needed elsewhere
const productEvents = new EventEmitter();
router.productEvents = productEvents;

const ALLOWED_CATEGORIES = [
    'Traditional wear', 'T-shirts', 'Shirts', 'Pants & bottom wear',
    'Winter wear', 'Sports & active wear', 'Home & comfort wear',
    'Formal & office wear', 'Kids boys wear', 'Accessories'
];

// GET /api/admin/products
router.get('/products', adminAuth(), async (req, res) => {
    try {
        const { search = '', category = '', subcategory = '', sort = 'date_desc', page = 1, limit = 20 } = req.query;
        
        // Exclude soft-deleted products by default
        let query = { isDeleted: { $ne: true } };
        
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'All') {
            query.category = category;
        }
        if (subcategory && subcategory !== 'All') {
            query.subcategory = subcategory;
        }

        let sortOption = { _id: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };
        if (sort === 'name_asc') sortOption = { name: 1 };

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort(sortOption)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        res.status(200).json({
            products,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (err) {
        console.error('Admin Products Error:', err);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// GET /api/admin/products/:id
router.get('/products/:id', adminAuth(), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json(product);
    } catch (err) {
        console.error('Fetch Product Error:', err);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// POST /api/admin/products
router.post('/products', adminAuth(['super_admin', 'editor']), [
    body('name').notEmpty().withMessage('Name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a valid positive number'),
    body('category').isIn(ALLOWED_CATEGORIES).withMessage('Invalid category')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const product = new Product(req.body);
        // let pre('save') compute inStock automatically
        await product.save();
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        console.error('Create Product Error:', err);
        res.status(500).json({ message: err.message || 'Failed to create product' });
    }
});

// PATCH /api/admin/products/:id
router.patch('/products/:id', adminAuth(['super_admin', 'editor']), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const oldPrice = product.price;
        // manually calculate old stock in case inStock is unreliable or wasn't recalculated yet
        const oldTotalStock = product.variants ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;

        Object.assign(product, req.body);
        
        // let pre('save') compute inStock automatically
        await product.save();

        // Check if price dropped
        if (req.body.price !== undefined && product.price < oldPrice) {
            productEvents.emit('productUpdated', { product, type: 'price_drop' });
        }

        // Check if restocked (0 to >0)
        const newTotalStock = product.variants ? product.variants.reduce((acc, v) => acc + (v.stock || 0), 0) : 0;
        if (oldTotalStock === 0 && newTotalStock > 0) {
            productEvents.emit('productUpdated', { product, type: 'restock' });
        }
        
        res.status(200).json({ message: 'Product updated successfully', product });
    } catch (err) {
        console.error('Update Product Error:', err);
        res.status(500).json({ message: 'Failed to update product' });
    }
});

// PATCH /api/admin/products/:id/toggle-label
router.patch('/products/:id/toggle-label', adminAuth(['super_admin', 'editor']), async (req, res) => {
    try {
        const { field, value } = req.body;
        if (!['isNewProduct', 'isBestSeller'].includes(field)) {
            return res.status(400).json({ message: 'Invalid field' });
        }
        
        const product = await Product.findByIdAndUpdate(req.params.id, { [field]: value }, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        res.status(200).json({ message: 'Label updated successfully', product });
    } catch (err) {
        console.error('Toggle Label Error:', err);
        res.status(500).json({ message: 'Failed to toggle label' });
    }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', adminAuth(['super_admin', 'editor']), async (req, res) => {
    try {
        const { hard } = req.query;
        // only super_admin can query ?hard=true
        if (hard === 'true' && req.admin && req.admin.role === 'super_admin') {
            const product = await Product.findByIdAndDelete(req.params.id);
            if (!product) return res.status(404).json({ message: 'Product not found' });
            return res.status(200).json({ message: 'Product permanently deleted' });
        } else {
            const product = await Product.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
            if (!product) return res.status(404).json({ message: 'Product not found' });
            return res.status(200).json({ message: 'Product deleted (soft)' });
        }
    } catch (err) {
        console.error('Delete Product Error:', err);
        res.status(500).json({ message: 'Failed to delete product' });
    }
});

// GET /api/admin/stats
router.get('/stats', adminAuth(), async (req, res) => {
    try {
        const orderStats = await Order.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalOrders: { $sum: 1 } } }
        ]);

        const totalProducts = await Product.countDocuments({ isDeleted: { $ne: true } });
        const totalUsers = await User.countDocuments();

        res.status(200).json({
            revenue: orderStats[0]?.totalRevenue || 0,
            orders: orderStats[0]?.totalOrders || 0,
            products: totalProducts,
            users: totalUsers
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
});

// GET /api/admin/users
const User = require('../models/User');
router.get('/users', adminAuth(['super_admin']), async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;
        let query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            users,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});

module.exports = router;