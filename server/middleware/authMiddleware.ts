/**
 * server/middleware/authMiddleware.ts
 * 
 * CHANGES:
 * 1. Added strict mongoose.isValidObjectId validation for the decoded user ID.
 * 2. Improved TypeScript interfaces for DecodedToken and AuthRequest.
 * 3. Consistent error logging for debugging blocked requests.
 * 4. Checks for account suspension status as per Eloria brand rules.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';

// Define the shape of the JWT payload
interface DecodedToken {
    id: string;
    iat: number;
    exp: number;
}

// Extend Express Request type to include the user
export interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Extract Token from Header
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.replace('Bearer ', '') 
        : null;
    
    if (!token) {
        return res.status(401).json({ 
            message: "No token provided, authorization denied." 
        });
    }

    try {
        // 2. Verify Token
        const secret = process.env.JWT_SECRET || 'secret';
        const decoded = jwt.verify(token, secret) as DecodedToken;

        // 3. Strict ID Validation (Single Most Important Rule)
        if (!mongoose.isValidObjectId(decoded.id)) {
            console.error(`[Auth] Blocked: Malformed ID in token for ${req.originalUrl}`);
            return res.status(401).json({ message: "Invalid session format." });
        }

        // 4. Check Database for User existence and status
        // We use .select('_id status') for performance since we only need to verify the user exists/active
        const user = await User.findById(decoded.id).select('_id status');

        if (!user) {
            return res.status(401).json({ message: "User no longer exists." });
        }

        // 5. Check Suspension Status
        if (user.status === 'suspended') {
            return res.status(403).json({ 
                message: 'Your account has been suspended. Please contact Eloria BD support.' 
            });
        }

        // 6. Attach sanitized ID to request object
        req.user = { id: String(user._id) };
        
        next();
    } catch (err: any) {
        // Handle expired or malformed tokens
        const errorMessage = err.name === 'TokenExpiredError' ? 'Session expired.' : 'Invalid token.';
        console.error(`[Auth] Error on ${req.originalUrl}:`, err.message);
        
        res.status(401).json({ message: errorMessage });
    }
};

export default authMiddleware;