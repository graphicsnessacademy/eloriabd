// server/routes/productRoutes.ts
// CHANGES:
// 1. id typed as string via "req.params.id as string" — fixes TS string|string[] error
// 2. mongoose.isValidObjectId(id) pre-flight → 400 on invalid ObjectId
// 3. GET /:id now populates relatedProducts with isDeleted filter
// 4. product.isDeleted check → 404
// 5. CastError caught explicitly → 400
// 6. GET / unchanged — already filters isDeleted: { $ne: true }

import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Fix: cast to string to avoid "string | string[]" TS error
    const id = req.params.id as string;

    // Pre-flight: reject non-ObjectId strings before hitting the DB
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const product = await Product.findById(id).populate({
      path:  'relatedProducts',
      match: { isDeleted: { $ne: true } }
    });

    // Not found
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Soft-deleted
    if (product.isDeleted) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    res.json(product);
  } catch (err: any) {
    // CastError means Mongoose couldn't cast the id — treat as bad request
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }
    res.status(500).json({ message: err.message });
  }
});

export default router;