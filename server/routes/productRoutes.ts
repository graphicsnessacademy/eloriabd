import express, { Request, Response } from 'express';
import Product from '../models/Product';

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Only return products that are not deleted
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
