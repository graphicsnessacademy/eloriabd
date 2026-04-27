const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

const adminAuth = (requiredRoles = []) => {
    return async (req, res, next) => {
        try {
            // Read token from cookie
            const token = req.cookies.admin_token;
            if (!token) {
                return res.status(401).json({ message: 'Authentication required. No token provided.' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            // Fetch admin user
            const admin = await AdminUser.findById(decoded.id).select('-password');
            if (!admin) {
                return res.status(401).json({ message: 'Invalid token. Admin not found.' });
            }

            // Check if account is active
            if (!admin.isActive) {
                return res.status(403).json({ message: 'Account has been deactivated.' });
            }

            // Check role authorization if specified
            if (requiredRoles.length > 0 && !requiredRoles.includes(admin.role)) {
                return res.status(403).json({
                    message: `Access denied. Requires one of: ${requiredRoles.join(', ')}`
                });
            }

            // Attach admin to request object
            req.admin = admin;
            next();
        } catch (err) {
            console.error('Admin Auth Error:', err);
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }
    };
};

module.exports = adminAuth;
