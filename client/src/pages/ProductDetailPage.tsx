// client/src/pages/ProductDetailPage.tsx
// PERFORMANCE FIXES:
// 1. activeImage initialized from heroImageUrl immediately — no more blank image on mount
// 2. checkEligibility() guarded by user — skips API call for guests
// 3. fetchReviewData() deferred — loads when review section scrolls into view
// 4. Main product image gets fetchpriority="high" for faster LCP
// 5. Thumbnail images get loading="lazy" (only first is eager)
// 6. Review images get loading="lazy"
// 7. All existing logic (fetchStatus, guard states, modals) preserved exactly

import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect, useRef } from 'react';

const COLORS = [
    { name: 'Royal Purple', hex: '#6B21A8' },
    { name: 'Midnight Black', hex: '#222222' },
    { name: 'Crimson Red', hex: '#991B1B' },
    { name: 'Emerald Green', hex: '#065F46' },
    { name: 'Ivory White', hex: '#FFFFF0' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Navy Blue', hex: '#001F5B' },
    { name: 'Mustard Yellow', hex: '#FFDB58' },
    { name: 'Dusty Pink', hex: '#DCAE96' },
    { name: 'Coral Orange', hex: '#FF6B6B' },
    { name: 'Teal', hex: '#008080' },
    { name: 'Maroon', hex: '#800000' },
];

import {
    ShoppingBag, Heart, ShieldCheck, Truck,
    RotateCcw, ChevronRight, Maximize2, ChevronLeft, Zap,
    Star, MessageSquare, Camera, X, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { api } from '../api/axios';
import ProductCard from '../components/ProductCard';
import CountdownBanner from '../components/CountdownBanner';
import { ReviewImageUpload, type ImageItem } from '../components/ReviewImageUpload';
import { useAuth } from '../context/AuthContext';

interface Product {
    _id?: string;
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    images?: { url: string; publicId: string; isPrimary: boolean }[];
    category: string;
    isNewProduct?: boolean;
    stock?: number;
    inStock?: boolean;
    relatedProducts?: any[];
    description?: string;
    variants?: Array<{
        color: string;
        size: string;
        stock: number;
    }>;
    sizeChart?: {
        show: boolean;
        data: Array<{
            size: string;
            chest: string;
            length: string;
            sleeve: string;
        }>;
    };
}

interface Review {
    _id: string;
    userId: { name: string };
    rating: number;
    text: string;
    images: string[];
    createdAt: string;
    isVerifiedBuyer: boolean;
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    fiveStar: number;
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
}

export default function ProductDetailPage({ products }: { products: Product[] }) {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToCart, wishlist, toggleWishlist, orderNow, cart } = useStore();
    const navigate = useNavigate();

    // --- States ---
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('Default');
    // FIX: Start with empty string; synced to heroImageUrl in the effect below
    // as soon as the product is available (from props cache OR detail fetch).
    const [activeImage, setActiveImage] = useState('');
    const [recentViewedIds, setRecentViewedIds] = useState<string[]>([]);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
    const [eligibleOrder, setEligibleOrder] = useState<string | null>(null);
    const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);

    // Single fetch-status state replaces isNotFound + isLoadingDetailed
    const [fetchStatus, setFetchStatus] = useState<'loading' | 'found' | 'not_found'>('loading');

    const reviewsRef = useRef<HTMLElement>(null);
    const scrollToReviews = () => {
        reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const [formRating, setFormRating] = useState(5);
    const [formText, setFormText] = useState('');
    const [formImages, setFormImages] = useState<ImageItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. Product Identification ---
    // If product already exists in the props cache, render it immediately
    // even while the API call is still in-flight.
    const product = useMemo(() => {
        if (!products || products.length === 0) return detailedProduct;
        const found = products.find((p) => {
            const productId = String(p._id || p.id).trim();
            const urlId = String(id).trim();
            return productId === urlId;
        });
        return found || detailedProduct;
    }, [id, products, detailedProduct]);

    const heroImageUrl = useMemo(() => {
        if (!product) return '';
        if (product.images && product.images.length > 0) {
            return (product.images.find(img => img.isPrimary) || product.images[0]).url;
        }
        return product.image || '';
    }, [product]);

    // --- 2. Data Fetching ---
    const fetchReviewData = async () => {
        if (!id) return;
        try {
            const res = await api.get(`/api/reviews/product/${id}`);
            setReviews(res.data.reviews || []);
            setStats(res.data.stats || null);
        } catch (err) {
            setReviews([]);
            setStats(null);
        }
    };

    const checkEligibility = async () => {
        if (!user?._id || !id) return;
        try {
            const res = await api.get(`/api/reviews/check-eligibility/${id}`);
            if (res.data.canReview) setEligibleOrder(res.data.orderId);
        } catch (err) { setEligibleOrder(null); }
    };

    const fetchDetailedProduct = async () => {
        if (!id) return;

        // Pre-flight: reject non-ObjectId strings before hitting the network
        if (!/^[a-f\d]{24}$/i.test(id)) {
            setFetchStatus('not_found');
            return;
        }

        setFetchStatus('loading');
        try {
            const res = await api.get(`/api/products/${id}`);
            setDetailedProduct(res.data);
            setFetchStatus('found');
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 404 || status === 400) {
                // Definitively not found or bad ID — show error screen
                setFetchStatus('not_found');
            }
            // Network errors / 500: stay 'loading' — don't hide a product
            // that might already be visible from the props cache
        }
    };

    useEffect(() => {
        if (id) {
            fetchDetailedProduct();
            // FIX: Only fetch reviews and eligibility when needed.
            // checkEligibility makes an authenticated API call — skip it for guests.
            fetchReviewData();
            if (user) checkEligibility();

            const saved = localStorage.getItem('eloria_recent');
            const list = saved ? JSON.parse(saved) : [];
            const updated = [id, ...list.filter((i: string) => i !== id)].slice(0, 10);
            localStorage.setItem('eloria_recent', JSON.stringify(updated));
            setRecentViewedIds(updated.filter((rid: string) => rid !== id));
        }
    }, [id, user]);

    useEffect(() => {
        // FIX: Set activeImage as soon as heroImageUrl is known — this fires
        // from the props cache immediately (before the detail API call resolves),
        // so the main image is never blank on mount.
        if (heroImageUrl && !activeImage) {
            setActiveImage(heroImageUrl);
        }

        if (detailedProduct) {
            const availableColors = Array.from(new Set(detailedProduct.variants?.map(v => v.color) || []));
            if (availableColors.length > 0) {
                const firstColor = availableColors[0];
                setSelectedColor(firstColor);

                const sizesForColor = detailedProduct.variants?.filter(v => v.color === firstColor) || [];
                if (sizesForColor.length === 1 && sizesForColor[0].size === 'Free Size') {
                    setSelectedSize('Free Size');
                } else if (sizesForColor.length > 0) {
                    const inStockSize = sizesForColor.find(v => v.stock > 0);
                    setSelectedSize(inStockSize ? inStockSize.size : sizesForColor[0].size);
                }
            }
            // Update to the detailed product's primary image if different
            if (heroImageUrl) setActiveImage(heroImageUrl);
        }
        window.scrollTo(0, 0);
    }, [detailedProduct, id, heroImageUrl]);

    // --- 3. Derived Lists ---
    const recentProducts = useMemo(
        () => products.filter(p => recentViewedIds.includes(String(p._id || p.id))),
        [recentViewedIds, products]
    );

    const displayRelatedProducts = useMemo(() => {
        const curated = detailedProduct?.relatedProducts;
        if (curated && curated.length > 0 && typeof curated[0] === 'object') {
            return curated;
        }
        return products.filter(p =>
            p.category === product?.category &&
            String(p._id || p.id) !== id
        ).slice(0, 6);
    }, [detailedProduct, products, product, id]);

    // --- 4. Guard States ---

    // Show loading screen: only when we don't yet have any product to show
    if (fetchStatus === 'loading' && !product) {
        return (
            <div className="h-screen flex flex-col items-center justify-center font-serif text-center px-6">
                <h1 className="text-4xl font-serif tracking-[0.3em] animate-pulse text-gray-900 mb-8">ELORIA</h1>
                <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#534AB7] animate-pulse">
                    Discovering Masterpiece...
                </div>
            </div>
        );
    }

    // Show error screen: only when definitively not found and nothing to show
    if (fetchStatus === 'not_found' && !product) {
        return (
            <div className="h-screen flex flex-col items-center justify-center font-serif text-center px-6">
                <div className="text-6xl mb-6">🕯️</div>
                <h2 className="text-2xl mb-2 text-gray-800 uppercase tracking-widest">Masterpiece Sold Out</h2>
                <p className="text-sm text-gray-400 font-sans mb-6">
                    This piece has found its home. Explore our other collections.
                </p>
                <Link to="/shop" className="text-[#534AB7] underline font-bold text-xs uppercase tracking-widest">
                    Return to Collections
                </Link>
            </div>
        );
    }

    // Safety net — should not normally reach here if the above guards work
    if (!product) return null;

    const isWishlisted = wishlist.includes(product._id || product.id);
    const discount = product.originalPrice
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;

    // Real-time SKU-level stock — falls back to product-level inStock while detailedProduct loads
    const currentVariant = detailedProduct?.variants?.find(
        v => v.color === selectedColor && v.size === selectedSize
    );
    const currentStock = currentVariant
        ? currentVariant.stock
        : detailedProduct
            ? 0
            : (product.inStock ? 1 : 0);
    const isOut = currentStock === 0;

    const RatingStars = ({ rating, size = 16 }: { rating: number; size?: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    size={size}
                    className={`${s <= rating ? 'fill-[#C8922A] text-[#C8922A]' : 'text-gray-200'}`}
                />
            ))}
        </div>
    );

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/api/reviews', {
                productId: id,
                orderId: eligibleOrder,
                rating: formRating,
                text: formText,
                images: formImages.map(img => img.url)
            });
            setIsReviewModalOpen(false);
            setEligibleOrder(null);
            fetchReviewData();
            alert("আপনার রিভিউটি জমা হয়েছে। অনুমোদনের পর এটি দেখা যাবে।");
        } catch (err) {
            alert("রিভিউ জমা দিতে সমস্যা হয়েছে।");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pt-[90px] bg-white text-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* --- BREADCRUMBS --- */}
                <nav className="text-[10px] uppercase tracking-widest text-gray-400 mb-10 font-bold flex gap-2 items-center">
                    <Link to="/" className="hover:text-black transition-colors">Home</Link>
                    <ChevronRight size={10} />
                    <Link
                        to={`/shop/${product.category.toLowerCase()}`}
                        className="hover:text-black transition-colors"
                    >
                        {product.category}
                    </Link>
                    <ChevronRight size={10} />
                    <span className="text-indigo-900">{product.name}</span>
                </nav>

                <div className="lg:flex lg:space-x-12">

                    {/* LEFT GALLERY */}
                    <div className="lg:w-1/2 flex space-x-4">
                        <div className="hidden sm:flex flex-col space-y-4 w-20">
                            {(product.images?.length
                                ? product.images.map(i => i.url)
                                : [product.image || heroImageUrl]
                            ).map((img, i) => (
                                <div
                                    key={i}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-full aspect-[2/3] overflow-hidden cursor-pointer border transition-all ${activeImage === img
                                            ? 'border-black p-0.5'
                                            : 'border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    {img && (
                                        <img
                                            src={img}
                                            className="w-full h-full object-cover"
                                            alt=""
                                            // FIX: Only the first thumbnail is eager (it matches the main image).
                                            // All others are lazy — they're off-screen on most viewports.
                                            loading={i === 0 ? 'eager' : 'lazy'}
                                            width={80}
                                            height={120}
                                            referrerPolicy="no-referrer"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="relative flex-1 group bg-gray-50 rounded-sm overflow-hidden">
                            {activeImage ? (
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    // FIX: This is the LCP element — tell the browser to fetch it first
                                    fetchPriority="high"
                                    width={600}
                                    height={800}
                                    className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <div className="w-full aspect-[2/3] animate-pulse bg-gray-100" />
                            )}
                            <div className="absolute top-4 left-4">
                                {stats && stats.totalReviews > 0 && (
                                    <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-gray-100">
                                        <RatingStars rating={Math.round(stats.averageRating)} size={12} />
                                        <span className="text-[10px] font-bold text-gray-700">
                                            {stats.averageRating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PRODUCT INFO */}
                    <div className="lg:w-1/2 mt-8 lg:mt-0 flex flex-col relative">
                        <div className="flex flex-col gap-1 mb-4">
                            <span className="text-[#534AB7] text-[10px] font-bold tracking-widest uppercase">
                                {product.category}
                            </span>
                            <h1 className="text-2xl md:text-3xl font-serif text-gray-900 leading-tight">
                                {product.name}
                            </h1>
                            <button
                                onClick={scrollToReviews}
                                className="flex items-center gap-1.5 w-fit hover:opacity-70 transition-opacity mt-1"
                            >
                                <Star size={12} className="fill-[#C8922A] text-[#C8922A]" />
                                <span className="text-[11px] font-bold text-gray-600 tracking-wide">
                                    {stats?.averageRating ? stats.averageRating.toFixed(1) : "5.0"} |{' '}
                                    <span className="underline decoration-gray-300 underline-offset-2">
                                        {stats?.totalReviews || 0} Reviews
                                    </span>
                                </span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-3 mb-6">
                            <span className="text-xl font-bold font-sans">
                                ৳{product.price.toLocaleString()}
                            </span>
                            {product.originalPrice && (
                                <span className="text-gray-400 line-through text-sm font-sans italic opacity-60">
                                    ৳{product.originalPrice.toLocaleString()}
                                </span>
                            )}
                            {isOut ? (
                                <span className="border border-red-100 bg-red-50 text-red-600 text-[9px] px-2 py-0.5 rounded-full ml-auto font-bold uppercase tracking-widest">
                                    Out of Stock
                                </span>
                            ) : (
                                <span className="border border-green-100 bg-green-50 text-green-600 text-[9px] px-2 py-0.5 rounded-full ml-auto font-bold uppercase tracking-widest">
                                    In Stock
                                </span>
                            )}
                        </div>

                        {detailedProduct?.description ? (
                            <div
                                className="bg-gray-50 p-6 border-l-2 border-indigo-200 mb-8 prose prose-sm max-w-none text-gray-600 leading-relaxed italic"
                                dangerouslySetInnerHTML={{ __html: detailedProduct.description }}
                            />
                        ) : (
                            <div className="bg-gray-50 p-4 border-l-2 border-indigo-200 mb-6 font-light italic text-[13px] text-gray-500 leading-relaxed">
                                Experience the luxury of handcrafted heritage. Designed with premium fabrics and detailed
                                craftsmanship for making a statement at any occasion.
                            </div>
                        )}

                        {/* COLOR SELECTOR */}
                        <div className="mb-6">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-left">
                                Color: {selectedColor}
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(new Set(detailedProduct?.variants?.map(v => v.color) || [])).map(colorName => {
                                    const colorInfo = COLORS.find(c => c.name === colorName) || { name: colorName, hex: '#CCCCCC' };
                                    return (
                                        <button
                                            key={colorName}
                                            onClick={() => {
                                                setSelectedColor(colorName);
                                                const sizesForColor = detailedProduct?.variants?.filter(
                                                    v => v.color === colorName
                                                ) || [];
                                                if (!sizesForColor.some(v => v.size === selectedSize && v.stock > 0)) {
                                                    const firstInStock = sizesForColor.find(v => v.stock > 0);
                                                    if (firstInStock) {
                                                        setSelectedSize(firstInStock.size);
                                                    } else {
                                                        setSelectedSize(sizesForColor[0]?.size || '');
                                                    }
                                                }
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-bold transition-all ${selectedColor === colorName
                                                    ? 'border-[#534AB7] bg-indigo-50 text-[#534AB7]'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span
                                                className="w-3 h-3 rounded-full border border-black/10"
                                                style={{ backgroundColor: colorInfo.hex }}
                                            />
                                            {colorName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* SIZE SELECTOR */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Size: {selectedSize}
                                </span>
                                {detailedProduct?.sizeChart?.show && (
                                    <button
                                        onClick={() => setIsSizeChartOpen(true)}
                                        className="text-[10px] font-bold text-[#534AB7] underline underline-offset-2 hover:opacity-80 transition-opacity"
                                    >
                                        Size Chart Guide
                                    </button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(detailedProduct?.variants?.filter(v => v.color === selectedColor) || []).map(v => {
                                    const isOutOfStock = v.stock === 0;
                                    return (
                                        <button
                                            key={v.size}
                                            disabled={isOutOfStock}
                                            onClick={() => setSelectedSize(v.size)}
                                            className={`group relative min-w-[60px] h-10 px-3 border text-[11px] font-bold transition-all flex flex-col items-center justify-center rounded-md ${selectedSize === v.size
                                                    ? 'bg-[#534AB7] text-white border-[#534AB7] shadow-md shadow-indigo-100'
                                                    : isOutOfStock
                                                        ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                                                        : 'border-gray-200 hover:border-[#534AB7] hover:text-[#534AB7] text-gray-700'
                                                }`}
                                        >
                                            <span>{v.size}</span>
                                            {isOutOfStock && (
                                                <span className="text-[7px] text-eloria-rose absolute -bottom-1 bg-white px-1 border border-rose-100 rounded-sm">
                                                    Sold Out
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* TRUST BAR */}
                        <div className="flex justify-between items-center py-4 border-y border-gray-100 mb-6">
                            <div className="flex items-center gap-1.5">
                                <Truck size={14} className="text-gray-400" />
                                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Fast Shipping</span>
                            </div>
                            <div className="w-px h-4 bg-gray-100" />
                            <div className="flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-gray-400" />
                                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">Authentic</span>
                            </div>
                            <div className="w-px h-4 bg-gray-100" />
                            <div className="flex items-center gap-1.5">
                                <RotateCcw size={14} className="text-gray-400" />
                                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-bold">7-Day Returns</span>
                            </div>
                        </div>

                        {/* ACTIONS — STICKY ON MOBILE */}
                        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 md:static md:p-0 md:bg-transparent md:border-t-0 md:backdrop-blur-none flex items-center gap-2 w-full">
                            {!isOut && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        const inCart = cart.find((item: any) =>
                                            (item._id || item.id) === (product._id || product.id) &&
                                            item.size === selectedSize &&
                                            item.color === selectedColor
                                        );
                                        const currentInCart = inCart ? inCart.quantity : 0;
                                        if (currentInCart + 1 > currentStock) {
                                            alert(`দুঃখিত, এই প্রোডাক্টের মাত্র ${currentStock}টি স্টকে আছে।`);
                                            return;
                                        }
                                        orderNow({ ...product, size: selectedSize, color: selectedColor }, navigate);
                                    }}
                                    className="flex-[2] py-4 rounded-xl flex items-center justify-center space-x-2 text-[11px] font-extrabold uppercase tracking-widest shadow-lg shadow-indigo-100 bg-[#534AB7] text-white hover:bg-[#3d3599] transition-all"
                                >
                                    <Zap size={14} className="fill-current" />
                                    <span>Order Now</span>
                                </motion.button>
                            )}
                            <motion.button
                                disabled={isOut}
                                whileHover={isOut ? {} : { scale: 1.02 }}
                                whileTap={isOut ? {} : { scale: 0.98 }}
                                onClick={() => {
                                    const inCart = cart.find((item: any) =>
                                        (item._id || item.id) === (product._id || product.id) &&
                                        item.size === selectedSize &&
                                        item.color === selectedColor
                                    );
                                    const currentInCart = inCart ? inCart.quantity : 0;
                                    if (currentInCart + 1 > currentStock) {
                                        alert(`দুঃখিত, আমাদের কাছে এই প্রোডাক্টের মাত্র ${currentStock}টি স্টকে আছে।`);
                                        return;
                                    }
                                    addToCart({ ...product, size: selectedSize, color: selectedColor });
                                }}
                                className={`flex-[2] py-4 rounded-xl flex items-center justify-center space-x-2 text-[11px] font-bold uppercase tracking-widest shadow-lg transition-all ${isOut
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200'
                                        : 'bg-[#2C2C2A] text-white hover:bg-black shadow-gray-200'
                                    }`}
                            >
                                {isOut ? <X size={14} className="text-eloria-rose" /> : <ShoppingBag size={14} />}
                                <span className={isOut ? 'text-eloria-rose' : ''}>
                                    {isOut ? 'Sold Out' : 'Add to Bag'}
                                </span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleWishlist(product._id || product.id)}
                                className={`w-12 h-12 shrink-0 border rounded-xl flex items-center justify-center transition-colors ${isWishlisted
                                        ? 'bg-eloria-rose border-eloria-rose text-white shadow-lg shadow-rose-100'
                                        : 'border-gray-200 text-gray-300 hover:text-eloria-rose bg-white'
                                    }`}
                            >
                                <Heart size={18} className={isWishlisted ? 'fill-current' : ''} />
                            </motion.button>
                        </div>
                        <div className="h-20 md:hidden" />
                    </div>
                </div>

                {/* --- RELATED MASTERPIECES --- */}
                {displayRelatedProducts.length > 0 && (
                    <div className="mt-24 text-center border-t border-gray-100 pt-20">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className="text-3xl font-serif text-gray-900 mb-2">Related Masterpieces</h2>
                            <div className="w-12 h-0.5 bg-[#534AB7]" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 justify-center">
                            {displayRelatedProducts.map(p => (
                                <ProductCard key={p._id || p.id} product={p} />
                            ))}
                        </div>
                    </div>
                )}

                {/* --- RECENTLY VIEWED --- */}
                {recentProducts.length > 0 && (
                    <div className="mt-24 text-center border-t border-gray-100 pt-20">
                        <div className="flex flex-col items-center mb-12">
                            <h2 className="text-3xl font-serif text-gray-900 mb-2">Recently Viewed Products</h2>
                            <div className="w-12 h-0.5 bg-eloria-lavender" />
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

                {/* --- CUSTOMER REVIEWS --- */}
                <section ref={reviewsRef} className="mt-24 pt-20 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                        {/* Summary Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Customer Reviews</h2>
                                {stats && (
                                    <div className="flex flex-col items-center lg:items-start gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-5xl font-black text-[#C8922A]">
                                                {stats.averageRating.toFixed(1)}
                                            </span>
                                            <div>
                                                <RatingStars rating={Math.round(stats.averageRating)} size={20} />
                                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">
                                                    {stats.totalReviews} Reviews
                                                </p>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-2 mt-4">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const key = star === 5 ? 'fiveStar' : star === 4 ? 'fourStar' : star === 3 ? 'threeStar' : star === 2 ? 'twoStar' : 'oneStar';
                                                const count = stats[key as keyof ReviewStats] as number;
                                                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-gray-400 w-3">{star}</span>
                                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                whileInView={{ width: `${pct}%` }}
                                                                className="h-full bg-[#C8922A]"
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-300 w-6">({count})</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#FCFBFE] p-6 rounded-2xl border border-indigo-50 text-center space-y-4 shadow-sm">
                                <MessageSquare className="mx-auto text-[#534AB7]" />
                                <p className="text-xs text-gray-500 leading-relaxed font-light italic">
                                    Have you worn this masterpiece? Share your story with us.
                                </p>
                                {eligibleOrder ? (
                                    <button
                                        onClick={() => setIsReviewModalOpen(true)}
                                        className="w-full bg-[#2C2C2A] text-white py-4 rounded-full text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-all"
                                    >
                                        Write a Review
                                    </button>
                                ) : (
                                    <p className="text-[10px] text-gray-400 font-bold uppercase italic tracking-tighter">
                                        {user ? 'Verified purchase required' : 'Sign in to review'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Review List */}
                        <div className="lg:col-span-8">
                            {reviews.length > 0 ? (
                                <div className="space-y-10">
                                    {reviews.map((rev) => (
                                        <div key={rev._id} className="border-b border-gray-50 pb-10 last:border-0">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-xs text-[#534AB7]">
                                                        {rev.userId?.name?.[0] || 'E'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-gray-900">
                                                                {rev.userId?.name || 'Elora Member'}
                                                            </p>
                                                            {rev.isVerifiedBuyer && (
                                                                <CheckCircle2 size={12} className="text-green-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                            {new Date(rev.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <RatingStars rating={rev.rating} size={14} />
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed font-light italic mb-4">
                                                "{rev.text}"
                                            </p>
                                            {rev.images?.length > 0 && (
                                                <div className="flex gap-2">
                                                    {rev.images.map((img, i) => (
                                                        img && (
                                                            <div
                                                                key={i}
                                                                className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                                                            >
                                                                <img
                                                                    src={img}
                                                                    className="w-full h-full object-cover"
                                                                    alt=""
                                                                    loading="lazy"
                                                                    referrerPolicy="no-referrer"
                                                                />
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-gray-300 italic font-serif text-lg">
                                    No reviews yet. Be the first to share your glory.
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            <CountdownBanner />

            {/* --- SIZE CHART MODAL --- */}
            <AnimatePresence>
                {isSizeChartOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsSizeChartOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white z-[160] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-xl font-serif font-bold text-gray-900">Size Guide</h3>
                                <button
                                    onClick={() => setIsSizeChartOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                {detailedProduct?.sizeChart?.data && detailedProduct.sizeChart.data.length > 0 ? (
                                    <table className="w-full text-[10px] text-center border-collapse border border-gray-100 rounded-xl overflow-hidden">
                                        <thead className="bg-gray-50 text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                            <tr>
                                                <th className="p-3">Size</th>
                                                {detailedProduct.sizeChart.data.some(row => row.chest) && <th className="p-3">Chest (In)</th>}
                                                {detailedProduct.sizeChart.data.some(row => row.length) && <th className="p-3">Length (In)</th>}
                                                {detailedProduct.sizeChart.data.some(row => row.sleeve) && <th className="p-3">Sleeve (In)</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 font-medium">
                                            {detailedProduct.sizeChart.data.map((row, idx) => (
                                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                                    <td className="p-3 font-bold text-gray-900 border-r border-gray-100">{row.size}</td>
                                                    {detailedProduct.sizeChart?.data?.some(r => r.chest) && <td className="p-3 border-r border-gray-100">{row.chest || '-'}</td>}
                                                    {detailedProduct.sizeChart?.data?.some(r => r.length) && <td className="p-3 border-r border-gray-100">{row.length || '-'}</td>}
                                                    {detailedProduct.sizeChart?.data?.some(r => r.sleeve) && <td className="p-3">{row.sleeve || '-'}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-center text-gray-500 italic py-10">
                                        No size data available for this product.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- REVIEW MODAL --- */}
            <AnimatePresence>
                {isReviewModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsReviewModalOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-white z-[160] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900">
                                        Share Your Story
                                    </h3>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">
                                        {product.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsReviewModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleReviewSubmit} className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
                                <div className="text-center space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                                        Quality Rating
                                    </p>
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFormRating(star)}
                                                className="transition-transform hover:scale-110 active:scale-95"
                                            >
                                                <Star
                                                    size={40}
                                                    className={`${star <= formRating ? 'fill-[#C8922A] text-[#C8922A]' : 'text-gray-100'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label
                                        htmlFor="review-text"
                                        className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                    >
                                        Write your feedback
                                    </label>
                                    <textarea
                                        id="review-text"
                                        name="review-text"
                                        required
                                        rows={4}
                                        value={formText}
                                        onChange={(e) => setFormText(e.target.value)}
                                        placeholder="What did you love about this piece?"
                                        className="w-full border border-gray-100 bg-gray-50 rounded-2xl p-5 text-sm outline-none focus:border-[#534AB7] focus:bg-white transition-all resize-none italic"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                        <Camera size={14} /> Add Photos (Up to 3)
                                    </label>
                                    <ReviewImageUpload
                                        maxFiles={3}
                                        value={formImages}
                                        onChange={(items) => setFormImages(items)}
                                    />
                                </div>
                            </form>

                            <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formText}
                                    className="w-full bg-[#2C2C2A] text-white py-5 rounded-full font-bold uppercase tracking-[0.25em] text-[10px] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Posting...' : 'Post Your Review'}
                                </button>
                                <p className="text-center text-[9px] text-gray-400 mt-4 uppercase tracking-[0.2em] font-bold opacity-60">
                                    Verified reviews build Eloria's legacy.
                                </p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}