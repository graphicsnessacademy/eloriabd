import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import adminOrderRoutes from './routes/adminOrderRoutes';
import configRoutes from './routes/configRoutes';
import adminConfigRoutes from './routes/adminConfigRoutes';
import productRoutes from './routes/productRoutes';
import adminCouponRoutes from './routes/adminCouponRoutes';
import couponRoutes from './routes/couponRoutes';
import reviewRoutes from './routes/reviewRoutes';
import eventRoutes from './routes/eventRoutes';
import { pageViewMiddleware } from './middleware/pageViewMiddleware';
import adminAnalyticsRoutes from './routes/adminAnalyticsRoutes';
import adminUserRoutes from './routes/adminUserRoutes';
import adminNotificationRoutes from './routes/adminNotificationRoutes';
import contentPageRoutes from './routes/contentPageRoutes';
import adminShippingRoutes from './routes/adminShippingRoutes';
import shippingRoutes from './routes/shippingRoutes';
import adminPushRoutes from './routes/adminPushRoutes';
import adminExportRoutes from './routes/adminExportRoutes';
import { initAnalyticsCron } from './jobs/analyticsCron';
import { seedPages } from './utils/seedPages';






dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "https://eloriabd.vercel.app",
    "https://eloriabd-shop.vercel.app",
    "https://eloriabd-admin.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

let cachedDb: typeof mongoose | null = null;
const connectDB = async () => {
  if (cachedDb) return cachedDb;
  // Increased timeout for Vercel cold starts
  const db = await mongoose.connect(process.env.MONGODB_URI!, { 
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000 
  });
  cachedDb = db;
  return db;
};

// Seeding logic moved to a separate check to prevent request blocking
let seeded = false;

app.use(async (req: Request, res: Response, next: NextFunction) => {
  try { 
    await connectDB(); 
    if (!seeded && req.path === '/api/products') {
        seeded = true;
        seedPages().catch(err => console.error('Seed error:', err));
    }
    next(); 
  }
  catch (err: any) { 
    console.error('DB Connection Middleware Error:', err.message);
    res.status(500).json({ error: "Database connection failed", details: err.message }); 
  }
});

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const hybridCheckoutRoute = require('./routes/hybridCheckoutRoute');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

app.use(pageViewMiddleware);

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/hybrid-checkout', hybridCheckoutRoute);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin/orders', adminOrderRoutes);

app.use('/api/admin/coupons', adminCouponRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/shipping', shippingRoutes);

// ── CRITICAL ORDER ──────────────────────────────────────────────────────────
// /api/admin/config MUST be registered BEFORE /api/admin
// Express matches prefixes greedily — /api/admin catches /api/admin/config
// if it is listed first, and adminRoutes.js never has a /config handler.
app.use('/api/config', configRoutes);
app.use('/api/admin/config', adminConfigRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/notifications', adminNotificationRoutes);
app.use('/api/admin/shipping', adminShippingRoutes);
app.use('/api/admin/push', adminPushRoutes);
app.use('/api/pages', contentPageRoutes);
app.use('/api/admin', adminExportRoutes);
app.use('/api/admin', adminRoutes);
// ────────────────────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => res.send('ELORIA API V2 - REVIEWS ACTIVE'));

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  // Only run local cron in development
  initAnalyticsCron();
} else if (!process.env.VERCEL) {
  // Run cron on production only if NOT on Vercel (e.g. VPS)
  initAnalyticsCron();
}

export default app;