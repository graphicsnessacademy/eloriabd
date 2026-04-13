import { ShoppingCart, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// 1. Define the interface
interface Product {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    isViewMore?: boolean;
    categoryTarget?: string; // Added to fix the link logic
}

// 2. Use the interface instead of 'any'
export default function ProductCard({ product }: { product: Product }) {
    if (product.isViewMore) {
        return (
            <Link
                to={`/shop/${product.categoryTarget}`}
                className="relative aspect-square ..."
            >
                <img src={product.image} className="w-full h-full object-cover opacity-30 grayscale group-hover:scale-110 transition-transform duration-700" alt="View More" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                    <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center mb-2 group-hover:bg-white group-hover:text-black transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">View More</span>
                </div>
            </Link>
        );
    }

    return (
        <div className="group relative bg-white flex flex-col border border-gray-100 transition-all hover:shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button className="bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-eloria-purple"><ShoppingCart className="w-4 h-4" /></button>
                    <button className="bg-white p-2 rounded-full shadow-md text-gray-700 hover:text-eloria-rose"><Heart className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="p-2 text-center">
                <h3 className="text-[10px] text-gray-600 truncate mb-1 uppercase font-serif tracking-tight">{product.name}</h3>
                <div className="flex items-center justify-center gap-2 text-[11px]">
                    <span className="font-bold text-black font-sans">₹{product.price}.00</span>
                    {product.originalPrice && <span className="text-gray-400 line-through">₹{product.originalPrice}.00</span>}
                </div>
            </div>
        </div>
    );
}