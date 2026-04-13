const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  originalPrice: Number,
  image: String,
  category: String,
  isNewProduct: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
});

module.exports = mongoose.model('Product', productSchema);