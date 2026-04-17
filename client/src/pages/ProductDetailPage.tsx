import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';

import {
    ShoppingBag, Heart, ShieldCheck, Truck,
    RotateCcw, ChevronRight, Maximize2, ChevronLeft, Zap
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import CountdownBanner from '../components/CountdownBanner';

interface Product {
    _id?: string;
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
    isNewProduct?: boolean;
}


export default function ProductDetailPage({ products }: { products: Product[] }) {
    const { id } = useParams();
    const { addToCart, wishlist, toggleWishlist, orderNow } = useStore();
    const navigate = useNavigate();

    // States for user selections
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('Default');
    const [activeImage, setActiveImage] = useState('');
    const [recentViewedIds, setRecentViewedIds] = useState<string[]>([]);

    // Find the current product
    const product = useMemo(() => products.find((p) => (p._id || p.id) === id), [id, products]);

    // 1. Logic for Recently Viewed (Local Storage Tracking)
    useEffect(() => {
        if (id) {
            const saved = localStorage.getItem('eloria_recent');
            const list: string[] = saved ? JSON.parse(saved) : [];

            // Update list: Put current ID at start, remove duplicates, limit to 10
            const updatedList = [id, ...list.filter(item => item !== id)].slice(0, 10);
            localStorage.setItem('eloria_recent', JSON.stringify(updatedList));

            // We only want to display items OTHER than the current one in the "Recent" section
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setRecentViewedIds(updatedList.filter(recentId => recentId !== id));
        }
    }, [id]);

    const recentProducts = useMemo(() =>
        products.filter((p) => recentViewedIds.includes((p._id || p.id) as string)),
        [recentViewedIds, products]
    );
    // 2. Logic for Related Masterpieces
    const relatedProducts = useMemo(() =>
        products.filter((p) => p.category === product?.category && (p._id || p.id) !== id).slice(0, 5),
        [product, products, id]
    );

    // Reset page view on ID change
    useEffect(() => {
        if (product) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveImage(product.image);
            setSelectedColor('Default'); // Reset selection
        }
        window.scrollTo(0, 0);
    }, [product, id]);

    if (!product) return <div className="h-screen flex items-center justify-center font-serif text-2xl animate-pulse text-eloria-purple">Loading Your Glory...</div>;

    const isWishlisted = wishlist.includes(product._id || product.id);
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    // Handle Add to Bag with full variations
    const handleAddToBag = () => {
        addToCart({
            ...product,
            size: selectedSize,
            color: selectedColor
        });
    };

    // Handle Order Now — adds product (with current variant) to cart then goes to checkout
    const handleOrderNow = () => {
        orderNow({
            ...product,
            size: selectedSize,
            color: selectedColor
        }, navigate);
    };

    return (
        <div className="pt-[90px] bg-white text-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* --- BREADCRUMBS --- */}
                <nav className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-10 font-bold">
                    <ol className="flex items-center space-x-2">
                        <li><Link to="/" className="hover:text-gray-600 transition-colors">Home</Link></li>
                        <li><ChevronRight size={10} /></li>
                        <li><Link to={`/shop/${product.category.toLowerCase()}`} className="hover:text-gray-600 transition-colors">{product.category}</Link></li>
                        <li><ChevronRight size={10} /></li>
                        <li className="text-eloria-purple font-semibold">{product.name}</li>
                    </ol>
                </nav>

                {/* --- PRODUCT HERO SECTION --- */}
                <div className="lg:flex lg:space-x-12">

                    {/* LEFT: IMAGE GALLERY */}
                    <div className="lg:w-1/2 flex space-x-4">
                        {/* Thumbnails */}
                        <div className="hidden sm:flex flex-col space-y-4 w-20">
                            {[product.image, product.image, product.image].map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-full aspect-[2/3] overflow-hidden cursor-pointer border transition-all ${(activeImage || product.image) === img ? 'border-black p-0.5' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img || undefined} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>

                        {/* Main Image Viewport */}
                        <div className="relative flex-1 group">
                            <img src={activeImage || product.image || undefined} alt={product.name} className="w-full h-auto object-cover rounded-sm" />
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white">
                                <ChevronLeft size={16} />
                            </button>
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow hover:bg-white">
                                <ChevronRight size={16} />
                            </button>
                            <button className="absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow hover:bg-white">
                                <Maximize2 size={18} />
                            </button>
                        </div>
                    </div>



                    {/* RIGHT: PRODUCT INFO & VARIATIONS */}
                    <div className="lg:w-1/2 mt-8 lg:mt-0">
                        <span className="text-eloria-purple text-xs font-bold tracking-[0.3em] uppercase">{product.category}</span>
                        <h1 className="text-4xl font-serif text-gray-900 mt-2 mb-4 leading-tight">{product.name}</h1>

                        <div className="flex items-center space-x-4 mb-6">
                            <span className="text-2xl font-bold text-gray-900">₹{product.price.toLocaleString()}.00</span>
                            {product.originalPrice && (
                                <>
                                    <span className="text-gray-400 line-through text-lg">₹{product.originalPrice.toLocaleString()}.00</span>
                                    <span className="bg-eloria-rose/10 text-eloria-rose text-[10px] px-2 py-1 font-bold rounded uppercase tracking-tighter">SAVE {discount}%</span>
                                </>
                            )}
                            <span className="border border-green-100 bg-green-50 text-green-600 text-[10px] px-3 py-1 rounded ml-auto font-bold uppercase tracking-widest">In Stock</span>
                        </div>

                        <div className="border-b border-gray-100 mb-6">
                            <div className="flex space-x-8">
                                <button className="border-b-2 border-eloria-purple py-2 text-xs font-bold text-eloria-purple uppercase tracking-[0.2em]">Description</button>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 border-l-4 border-eloria-lavender mb-8">
                            <p className="text-sm text-gray-500 leading-relaxed italic font-light">
                                Experience the luxury of handcrafted heritage. This {product.category} is designed with premium fabrics and detailed craftsmanship, perfect for making a statement at any festive occasion.
                            </p>
                        </div>

                        {/* --- SELECTORS: COLOR & SIZE --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            {/* Size Selector */}
                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Select Size: <span className="text-black">{selectedSize}</span></span>
                                <div className="flex flex-wrap gap-2">
                                    {['S', 'M', 'L', 'XL', '2XL'].map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            className={`w-10 h-10 border text-[11px] font-bold transition-all ${selectedSize === size ? 'border-black bg-black text-white shadow-lg' : 'border-gray-200 text-gray-400 hover:border-black hover:text-black'}`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color Selector */}
                            <div>
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Select Color: <span className="text-black">{selectedColor === 'Default' ? 'Original' : selectedColor}</span></span>
                                <div className="flex space-x-3">
                                    {[{ name: 'Original', img: product.image }, { name: 'Vibrant', img: product.image }].map((col, i) => (
                                        <div
                                            key={i}
                                            onClick={() => setSelectedColor(col.name)}
                                            className={`w-10 h-12 border cursor-pointer overflow-hidden transition-all p-0.5 ${selectedColor === col.name ? 'border-eloria-purple scale-110 shadow-md' : 'border-gray-200 opacity-60'}`}
                                        >
                                            <img src={col.img} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- ACTION BUTTONS --- */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 w-full">
                                {/* 1. Order Now (Fast-track) */}
                                <button
                                    onClick={handleOrderNow}
                                    className="flex-[2] bg-[#534AB7] text-white py-4 rounded-full flex items-center justify-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest hover:bg-[#3d3599] transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                >
                                    <Zap size={14} className="fill-current" />
                                    <span>Order Now</span>
                                </button>

                                {/* 2. Add to Bag */}
                                <button
                                    onClick={handleAddToBag}
                                    className="flex-[2] bg-[#2C2C2A] text-white py-4 rounded-full flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                >
                                    <ShoppingBag size={14} />
                                    <span>Add to Bag</span>
                                </button>

                                {/* 3. Wishlist (Small Square/Circle) */}
                                <button
                                    onClick={() => toggleWishlist(product._id || product.id)}
                                    className={`w-14 h-14 shrink-0 border rounded-full flex items-center justify-center transition-all duration-300 ${isWishlisted
                                        ? 'bg-eloria-rose border-eloria-rose text-white shadow-lg'
                                        : 'border-gray-200 text-gray-400 hover:text-eloria-rose hover:border-eloria-rose hover:bg-eloria-rose/5'
                                        }`}
                                >
                                    <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
                                </button>
                            </div>
                        </div>

                        {/* --- TRUST BAR --- */}
                        <div className="grid grid-cols-3 gap-4 mt-12 py-8 border-y border-gray-100">
                            <div className="flex flex-col items-center text-center space-y-1">
                                <Truck size={22} className="text-eloria-lavender" />
                                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold">Fast Shipping</span>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-1 border-x border-gray-50">
                                <ShieldCheck size={22} className="text-eloria-lavender" />
                                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold">Authentic Only</span>
                            </div>
                            <div className="flex flex-col items-center text-center space-y-1">
                                <RotateCcw size={22} className="text-eloria-lavender" />
                                <span className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-bold">7-Day Returns</span>
                            </div>
                        </div>

                        {/* --- SIZE CHART TABLE --- */}
                        <div className="mt-10 overflow-hidden rounded-xl border border-gray-100">
                            <table className="w-full text-[10px] text-center border-collapse">
                                <thead className="bg-gray-50 text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="p-3 font-bold">Size</th>
                                        <th className="p-3 font-bold">Chest (In)</th>
                                        <th className="p-3 font-bold">Sleeve (In)</th>
                                        <th className="p-3 font-bold">Length (In)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600">
                                    {['M', 'L', 'XL', '2XL'].map((s, idx) => (
                                        <tr key={s} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                            <td className="p-3 font-bold text-gray-900 border-r border-gray-50">{s}</td>
                                            <td className="p-3 border-r border-gray-50">{38 + idx * 2}</td>
                                            <td className="p-3 border-r border-gray-50">{7.5 + idx * 0.5}</td>
                                            <td className="p-3">{26.5 + idx * 0.5}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- 1. RELATED MASTERPIECES (CENTERED GRID) --- */}
                <div className="mt-24 text-center border-t border-gray-100 pt-20">
                    <div className="flex flex-col items-center mb-12">
                        <h2 className="text-3xl font-serif text-gray-900 mb-2">Related Masterpieces</h2>
                        <div className="w-12 h-0.5 bg-eloria-lavender"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {relatedProducts.map(p => (
                            <ProductCard key={p._id || p.id} product={p} />
                        ))}
                    </div>
                </div>

                {/* --- 2. RECENTLY VIEWED (HORIZONTAL SCROLL) --- */}

                {recentProducts.length > 0 && (
                    <div className="mt-24 text-center border-t border-gray-100 pt-20">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className="text-3xl font-serif text-gray-900 mb-2">Recently Viewed Products</h2>
                            <div className="w-12 h-0.5 bg-eloria-lavender"></div>
                        </div>
                        <div className="flex overflow-x-auto gap-6 no-scrollbar pb-6">
                            {recentProducts.map(p => (
                                <div key={p._id || p.id} className="min-w-[200px] w-[200px] flex-shrink-0">
                                    <ProductCard product={p} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
            <div className="">
                <CountdownBanner
                    targetDate="2026-04-20T23:59:59"
                    isVisible={true}
                />
            </div>
        </div>
    );
}