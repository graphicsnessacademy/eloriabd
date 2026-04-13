// server/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product'); // Your Mongoose Model

// This route gets all products from MongoDB
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products); // Sends the real data to the frontend
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;