const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
name: String,
price: Number,
originalPrice: Number,
description: String,
category: String,
subcategory: String,
images: [{ url: String, publicId: String, isPrimary: Boolean }],
image: String,
variants: [{ size: String, color: String, stock: Number }],
stock: Number,
totalStock: Number,
inStock: Boolean,
isNewProduct: Boolean,
isBestSeller: Boolean,
isDeleted: { type: Boolean, default: false },
relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({}));
const categories = [
{ name: 'Saree', count: 5 },
{ name: 'Salwar Kameez', count: 5 },
{ name: 'Kurti', count: 4 },
{ name: 'Tops', count: 4 },
{ name: 'Pants & Jeans', count: 3 },
{ name: 'Ethnic Wear', count: 3 },
{ name: 'Western Wear', count: 3 },
{ name: 'New Arrival', count: 3 }
];
const colors = ['Deep Purple', 'Rose Pink', 'Emerald Green', 'Midnight Blue', 'Gold', 'Crimson'];
const sizes = ['S', 'M', 'L', 'XL'];
const seed = async () => {
try {
const uri = process.env.MONGODB_URI;
if (!uri) {
console.error('Error: MONGODB_URI is not defined in environment variables.');
process.exit(1);
}


await mongoose.connect(uri);
console.log('Connected to MongoDB...');

// Clean up
await Product.deleteMany({});
await Review.deleteMany({});
console.log('Cleared existing products and reviews.');

const products = [];
let productCount = 0;

for (const cat of categories) {
  for (let i = 1; i <= cat.count; i++) {
    productCount++;
    
    // 1. Determine Sale status (10 products total)
    const isOnSale = productCount <= 10;
    const price = Math.floor(Math.random() * (5000 - 1200) + 1200);
    const originalPrice = isOnSale ? price + Math.floor(Math.random() * 1000 + 500) : undefined;

    // 2. Determine Flags
    const isBestSeller = productCount <= 8;
    const isNewProduct = productCount > 24; // 30 - 6 = 24

    // 3. Determine Stock (2 products OOS: indices 15 and 20)
    const isOOS = productCount === 15 || productCount === 20;

    // 4. Generate Variants
    const productVariants = sizes.map(size => ({
      size,
      color: colors[productCount % colors.length],
      stock: isOOS ? 0 : Math.floor(Math.random() * 15 + 2)
    }));

    const totalStock = productVariants.reduce((acc, v) => acc + v.stock, 0);

    // 5. Setup Images
    const imgUrls = [
      `https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80`,
      `https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80`,
      `https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80`
    ];

    const productImages = imgUrls.map((url, idx) => ({
      url,
      publicId: `seed/prod_${productCount}_${idx}`,
      isPrimary: idx === 0
    }));

    products.push({
      name: `${cat.name} Elegant Piece ${i}`,
      price,
      originalPrice,
      description: `Luxury ${cat.name} from Eloria BD. Designed with premium fabrics for a minimal yet sophisticated look. Perfect for special occasions in Bangladesh.`,
      category: cat.name,
      subcategory: 'Premium Collection',
      images: productImages,
      image: productImages[0].url,
      variants: productVariants,
      totalStock,
      stock: totalStock, // matching model sync logic
      inStock: totalStock > 0,
      isNewProduct,
      isBestSeller,
      isDeleted: false,
      relatedProducts: []
    });
  }
}

await Product.insertMany(products);
console.log(`Successfully seeded ${products.length} products to Eloria BD database.`);

process.exit(0);


} catch (error) {
console.error('Seed Error:', error);
process.exit(1);
}
};
seed();