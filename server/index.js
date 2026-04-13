const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. CORS Configuration (Allow your frontend to talk to your backend)
app.use(cors());
app.use(express.json());

// 2. Optimized Connection Logic for Vercel (Serverless)
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb) {
    console.log("=> Using existing database connection");
    return cachedDb;
  }

  console.log("=> Creating new database connection");
  mongoose.set('strictQuery', true);

  const db = await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // This helps prevent the buffering timeout
    serverSelectionTimeoutMS: 5000,
  });

  cachedDb = db;
  return db;
};

// 3. Middleware to ensure DB is connected before any route is processed
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed", details: err.message });
  }
});

// 4. Routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// Welcome route to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.send('ELORIA API IS LIVE AND CONNECTED');
});

// 5. Export for Vercel
module.exports = app;

// 6. Only listen if running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running locally on port ${PORT}`));
}