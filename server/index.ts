import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import adminOrderRoutes  from './routes/adminOrderRoutes';
import configRoutes      from './routes/configRoutes';
import adminConfigRoutes from './routes/adminConfigRoutes';
import productRoutes     from './routes/productRoutes';
import adminCouponRoutes from './routes/adminCouponRoutes';
import couponRoutes      from './routes/couponRoutes';

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "https://eloriabd-shop.vercel.app",
    "https://eloriabd-admin.vercel.app", // add your deployed admin URL here too
    "http://localhost:5173",
    "http://localhost:5174",  // admin dev server
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

let cachedDb: typeof mongoose | null = null;
const connectDB = async () => {
  if (cachedDb) return cachedDb;
  const db = await mongoose.connect(process.env.MONGODB_URI!, { serverSelectionTimeoutMS: 5000 });
  cachedDb = db;
  return db;
};

app.use(async (req: Request, res: Response, next: NextFunction) => {
  try { await connectDB(); next(); }
  catch (err: any) { res.status(500).json({ error: "Database connection failed", details: err.message }); }
});

const authRoutes          = require('./routes/authRoutes');
const userRoutes          = require('./routes/userRoutes');
const orderRoutes         = require('./routes/orderRoutes');
const hybridCheckoutRoute = require('./routes/hybridCheckoutRoute');
const adminRoutes         = require('./routes/adminRoutes');
const uploadRoutes        = require('./routes/uploadRoutes');

app.use('/api/products',        productRoutes);
app.use('/api/auth',            authRoutes);
app.use('/api/user',            userRoutes);
app.use('/api/orders',          orderRoutes);
app.use('/api/hybrid-checkout', hybridCheckoutRoute);
app.use('/api/upload',          uploadRoutes);
app.use('/api/admin/orders',    adminOrderRoutes);
app.use('/api/admin/coupons',   adminCouponRoutes);
app.use('/api/coupons',         couponRoutes);

// ── CRITICAL ORDER ──────────────────────────────────────────────────────────
// /api/admin/config MUST be registered BEFORE /api/admin
// Express matches prefixes greedily — /api/admin catches /api/admin/config
// if it is listed first, and adminRoutes.js never has a /config handler.
app.use('/api/config',          configRoutes);
app.use('/api/admin/config',    adminConfigRoutes); // <-- BEFORE /api/admin
app.use('/api/admin',           adminRoutes);       // <-- AFTER
// ────────────────────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => res.send('ELORIA API IS LIVE (TS MODE)'));

export default app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}