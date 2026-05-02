// server/index.ts
// PERFORMANCE CHANGES:
// 1. pageViewMiddleware now SKIPPED for all /api/ routes — previously it ran
//    a DB write on every product fetch, adding 100–500ms per request.
// 2. seedPages() made fire-and-forget (no await) — previously it blocked
//    the first cold-start request while seeding ran.
// 3. mongoose.connection.readyState check added to connectDB — avoids
//    attempting a new connection when Mongoose is already connected (state=1)
//    or connecting (state=2), which was causing duplicate connection attempts
//    on Vercel warm function instances.
// 4. serverSelectionTimeoutMS kept at 5000 but connectTimeoutMS added at 10000
//    to give Atlas time to respond under load.

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

// ─── DB CONNECTION ────────────────────────────────────────────────────────────
// Module-level cache survives across warm Vercel invocations.
let cachedDb: typeof mongoose | null = null;

const connectDB = async () => {
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  // If already connected or in the process of connecting, skip reconnect.
  const state = mongoose.connection.readyState;
  if (state === 1 || state === 2) return cachedDb ?? mongoose;
  if (cachedDb) return cachedDb;

  cachedDb = await mongoose.connect(process.env.MONGODB_URI!, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS:         10000,
    maxPoolSize:              10,     // keep up to 10 connections ready
    minPoolSize:              2,      // always keep 2 warm
  });

  // FIX: seedPages is fire-and-forget — do NOT await it.
  // Previously this blocked the first cold-start request.
  seedPages().catch(err => console.error('[seedPages]', err));

  return cachedDb;
};

// DB connection middleware — runs before every route
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await connectDB();
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// ─── PAGE VIEW TRACKING ───────────────────────────────────────────────────────
// FIX: Skip pageViewMiddleware for ALL /api/ routes.
// Previously it ran on every request including GET /api/products,
// adding a DB write to every product fetch (100–500ms extra per call).
// Page views only make sense for frontend page navigations, not API calls.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/')) return next();
  return pageViewMiddleware(req, res, next);
});

// ─── ROUTE IMPORTS ────────────────────────────────────────────────────────────
const authRoutes          = require('./routes/authRoutes');
const userRoutes          = require('./routes/userRoutes');
const orderRoutes         = require('./routes/orderRoutes');
const hybridCheckoutRoute = require('./routes/hybridCheckoutRoute');
const adminRoutes         = require('./routes/adminRoutes');
const uploadRoutes        = require('./routes/uploadRoutes');

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use('/api/products',         productRoutes);
app.use('/api/auth',             authRoutes);
app.use('/api/user',             userRoutes);
app.use('/api/orders',           orderRoutes);
app.use('/api/hybrid-checkout',  hybridCheckoutRoute);
app.use('/api/upload',           uploadRoutes);
app.use('/api/admin/orders',     adminOrderRoutes);
app.use('/api/admin/coupons',    adminCouponRoutes);
app.use('/api/coupons',          couponRoutes);
app.use('/api/reviews',          reviewRoutes);
app.use('/api/events',           eventRoutes);
app.use('/api/shipping',         shippingRoutes);

// ── CRITICAL ORDER — /api/admin/config BEFORE /api/admin ─────────────────────
app.use('/api/config',               configRoutes);
app.use('/api/admin/config',         adminConfigRoutes);
app.use('/api/admin/analytics',      adminAnalyticsRoutes);
app.use('/api/admin/users',          adminUserRoutes);
app.use('/api/admin/notifications',  adminNotificationRoutes);
app.use('/api/admin/shipping',       adminShippingRoutes);
app.use('/api/admin/push',           adminPushRoutes);
app.use('/api/pages',                contentPageRoutes);
app.use('/api/admin',                adminExportRoutes);
app.use('/api/admin',                adminRoutes);
// ─────────────────────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) =>
  res.send('ELORIA API V2 - REVIEWS ACTIVE')
);

initAnalyticsCron();

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}