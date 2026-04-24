import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Product from '../models/Product';

dotenv.config({ path: path.join(__dirname, '../.env') });

const COLORS = ['Midnight Noir', 'Royal Purple', 'Blush Rose', 'Petal Pink', 'Emerald Green'];
const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

const STANDARD_SIZE_CHART = [
    { size: 'S', chest: '36', length: '26', sleeve: '7' },
    { size: 'M', chest: '38', length: '27', sleeve: '7.5' },
    { size: 'L', chest: '40', length: '28', sleeve: '8' },
    { size: 'XL', chest: '42', length: '29', sleeve: '8.5' },
    { size: '2XL', chest: '44', length: '30', sleeve: '9' }
];

async function seedDemoData() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('✅ Connected successfully.');

        const products = await Product.find({ isDeleted: { $ne: true } });
        console.log(`📦 Found ${products.length} active products to process.`);

        let updatedCount = 0;

        for (const product of products) {
            const category = (product.category || '').toLowerCase();
            
            // Skip if product already has variants (optional safety check)
            // if (product.variants && product.variants.length > 0) continue;

            const newVariants: any[] = [];
            let showSizeChart = false;
            let sizeChartData: any[] = [];

            if (category === 'saree' || category === 'accessories') {
                // Saree/Accessories Logic: Free Size + Multiple Colors
                showSizeChart = false;
                sizeChartData = [];
                
                // Add 3-4 random colors
                const selectedColors = [...COLORS].sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 2) + 3);
                
                selectedColors.forEach(color => {
                    newVariants.push({
                        color,
                        size: 'Free Size',
                        stock: Math.floor(Math.random() * 41) + 10 // 10-50
                    });
                });
            } else {
                // Apparel Logic: Full Matrix (Every Color x Every Size)
                showSizeChart = true;
                sizeChartData = STANDARD_SIZE_CHART;

                COLORS.forEach(color => {
                    SIZES.forEach(size => {
                        newVariants.push({
                            color,
                            size,
                            stock: Math.floor(Math.random() * 41) + 10 // 10-50
                        });
                    });
                });
            }

            // Apply updates
            product.variants = newVariants;
            product.sizeChart = {
                show: showSizeChart,
                data: sizeChartData
            };

            // Recalculate total stock (though the pre-save hook should handle this, we do it explicitly too)
            const total = newVariants.reduce((sum, v) => sum + v.stock, 0);
            product.totalStock = total;
            product.inStock = total > 0;

            // Initialize SEO fields if missing
            if (!product.tags) product.tags = [];
            if (!product.metaTitle) product.metaTitle = product.name;
            if (!product.metaDescription) product.metaDescription = `Buy ${product.name} at Eloria BD. High quality fashion masterpieces.`;

            await product.save();
            updatedCount++;
            console.log(`✅ Updated [${product.name}] - ${newVariants.length} variants created.`);
        }

        console.log(`\n✨ Successfully seeded ${updatedCount} products with demo inventory data.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedDemoData();
