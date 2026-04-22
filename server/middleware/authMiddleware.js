const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        console.warn(`[Auth] Blocked: No token provided for ${req.originalUrl}`);
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded; // { id: user._id }
        next();
    } catch (err) {
        console.error(`[Auth] Invalid Token on ${req.originalUrl}:`, err.message);
        res.status(401).json({ message: "Token is not valid" });
    }
};
