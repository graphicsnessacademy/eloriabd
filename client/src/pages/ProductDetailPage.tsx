import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
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
    images?: { url: string, publicId: string, isPrimary: boolean }[];
    category: string;
    isNewProduct?: boolean;
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
    const { user } = useAuth(); // 2. Get user from Auth
    const { addToCart, wishlist, toggleWishlist, orderNow } = useStore(); // 3. Get rest from Store
    const navigate = useNavigate();

    // --- States ---
    const [selectedSize, setSelectedSize] = useState('M');
    const [selectedColor, setSelectedColor] = useState('Default');
    const [activeImage, setActiveImage] = useState('');
    const [recentViewedIds, setRecentViewedIds] = useState<string[]>([]);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [eligibleOrder, setEligibleOrder] = useState<string | null>(null);

    const [formRating, setFormRating] = useState(5);
    const [formText, setFormText] = useState('');
    const [formImages, setFormImages] = useState<ImageItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- 1. Product Identification (Fixed Logic) ---
    const product = useMemo(() => {
        if (!products || products.length === 0) return null;
        return products.find((p) => {
            const productId = String(p._id || p.id).trim();
            const urlId = String(id).trim();
            return productId === urlId;
        });
    }, [id, products]);

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
            setReviews([]); // Graceful fallback
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

    useEffect(() => {
        if (id) {
            fetchReviewData();
            checkEligibility();
            const saved = localStorage.getItem('eloria_recent');
            const list = saved ? JSON.parse(saved) : [];
            const updated = [id, ...list.filter((i: string) => i !== id)].slice(0, 10);
            localStorage.setItem('eloria_recent', JSON.stringify(updated));
            setRecentViewedIds(updated.filter((rid: string) => rid !== id));
        }
    }, [id, user]);

    useEffect(() => {
        if (product && heroImageUrl) {
            setActiveImage(heroImageUrl);
            setSelectedColor('Default');
        }
        window.scrollTo(0, 0);
    }, [product, id, heroImageUrl]);

    // --- 3. Derived Lists ---
    const recentProducts = useMemo(() => products.filter(p => recentViewedIds.includes(String(p._id || p.id))), [recentViewedIds, products]);
    const relatedProducts = useMemo(() => products.filter(p => p.category === product?.category && String(p._id || p.id) !== id).slice(0, 5), [product, products, id]);

    // --- 4. Sub-renders & Error States ---
    if (products.length === 0) {
        return <div className="h-screen flex items-center justify-center font-serif text-2xl animate-pulse text-[#534AB7]">Loading Your Glory...</div>;
    }

    if (!product) {
        return (
            <div className="h-screen flex flex-col items-center justify-center font-serif">
                <h2 className="text-2xl mb-4 text-gray-400 uppercase tracking-widest">Masterpiece Not Found</h2>
                <Link to="/shop" className="text-[#534AB7] underline font-bold text-xs uppercase">Return to Collections</Link>
            </div>
        );
    }

    const isWishlisted = wishlist.includes(product._id || product.id);
    const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

    const RatingStars = ({ rating, size = 16 }: { rating: number, size?: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={size} className={`${s <= rating ? 'fill-[#C8922A] text-[#C8922A]' : 'text-gray-200'}`} />
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
            alert("আপনার রিভিউটি জমা হয়েছে। অনুমোদনের পর এটি দেখা যাবে।");
        } catch (err) { alert("রিভিউ জমা দিতে সমস্যা হয়েছে।"); }
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="pt-[90px] bg-white text-gray-800 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* --- BREADCRUMBS --- */}
                <nav className="text-[10px] uppercase tracking-widest text-gray-400 mb-10 font-bold flex gap-2 items-center">
                    <Link to="/" className="hover:text-black transition-colors">Home</Link> <ChevronRight size={10} />
                    <Link to={`/shop/${product.category.toLowerCase()}`} className="hover:text-black transition-colors">{product.category}</Link> <ChevronRight size={10} />
                    <span className="text-indigo-900">{product.name}</span>
                </nav>

                <div className="lg:flex lg:space-x-12">
                    {/* LEFT GALLERY */}
                    <div className="lg:w-1/2 flex space-x-4">
                        <div className="hidden sm:flex flex-col space-y-4 w-20">
                            {(product.images?.length ? product.images.map(i => i.url) : [product.image || heroImageUrl]).map((img, i) => (
                                <div key={i} onClick={() => setActiveImage(img)} className={`w-full aspect-[2/3] overflow-hidden cursor-pointer border transition-all ${activeImage === img ? 'border-black p-0.5' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                                    {img && <img src={img} className="w-full h-full object-cover" alt="" />}
                                </div>
                            ))}
                        </div>
                        <div className="relative flex-1 group bg-gray-50 rounded-sm overflow-hidden">
                            {activeImage ? (
                                <img src={activeImage} alt={product.name} className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105" />
                            ) : (
                                <div className="w-full aspect-[3/4] animate-pulse bg-gray-100" />
                            )}
                            <div className="absolute top-4 left-4">
                                {stats && stats.totalReviews > 0 && (
                                    <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-gray-100">
                                        <RatingStars rating={Math.round(stats.averageRating)} size={12} />
                                        <span className="text-[10px] font-bold text-gray-700">{stats.averageRating.toFixed(1)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PRODUCT INFO */}
                    <div className="lg:w-1/2 mt-8 lg:mt-0">
                        <span className="text-[#534AB7] text-xs font-bold tracking-widest uppercase">{product.category}</span>
                        <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mt-2 mb-4 leading-tight">{product.name}</h1>
                        <div className="flex items-center space-x-4 mb-6">
                            <span className="text-2xl font-bold font-sans">৳{product.price.toLocaleString()}</span>
                            {product.originalPrice && <span className="text-gray-400 line-through text-lg font-sans italic opacity-60">৳{product.originalPrice.toLocaleString()}</span>}
                            <span className="border border-green-100 bg-green-50 text-green-600 text-[10px] px-3 py-1 rounded-full ml-auto font-bold uppercase tracking-widest">In Stock</span>
                        </div>

                        <div className="bg-gray-50 p-5 border-l-4 border-indigo-200 mb-8 font-light italic text-sm text-gray-500 leading-relaxed">
                            Experience the luxury of handcrafted heritage. Designed with premium fabrics and detailed craftsmanship for making a statement at any occasion.
                        </div>

                        {/* SELECTORS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            <div>
                                <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-left">Size: {selectedSize}</span>
                                <div className="flex space-x-2">
                                    {['S', 'M', 'L', 'XL', '2XL'].map(s => <button key={s} onClick={() => setSelectedSize(s)} className={`w-10 h-10 border text-xs font-bold transition-all ${selectedSize === s ? 'bg-black text-white' : 'border-gray-200 hover:border-black'}`}>{s}</button>)}
                                </div>
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-3 w-full mb-10">
                            <button onClick={() => orderNow({ ...product, size: selectedSize, color: selectedColor }, navigate)} className="flex-[2] bg-[#534AB7] text-white py-4 rounded-full flex items-center justify-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest hover:bg-[#3d3599] transition-all shadow-lg active:scale-95">
                                <Zap size={14} className="fill-current" /><span>Order Now</span>
                            </button>
                            <button onClick={() => addToCart({ ...product, size: selectedSize, color: selectedColor })} className="flex-[2] bg-[#2C2C2A] text-white py-4 rounded-full flex items-center justify-center space-x-2 text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                                <ShoppingBag size={14} /><span>Add to Bag</span>
                            </button>
                            <button onClick={() => toggleWishlist(product._id || product.id)} className={`w-14 h-14 shrink-0 border rounded-full flex items-center justify-center transition-all ${isWishlisted ? 'bg-eloria-rose border-eloria-rose text-white shadow-lg' : 'border-gray-200 text-gray-300 hover:text-eloria-rose'}`}><Heart size={20} className={isWishlisted ? 'fill-current' : ''} /></button>
                        </div>

                        {/* TRUST BAR */}
                        <div className="grid grid-cols-3 gap-4 py-8 border-y border-gray-100">
                            <div className="flex flex-col items-center text-center space-y-1"><Truck size={22} className="text-indigo-200" /><span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Fast Shipping</span></div>
                            <div className="flex flex-col items-center text-center space-y-1 border-x border-gray-100 px-2"><ShieldCheck size={22} className="text-indigo-200" /><span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Authentic Only</span></div>
                            <div className="flex flex-col items-center text-center space-y-1"><RotateCcw size={22} className="text-indigo-200" /><span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">7-Day Returns</span></div>
                        </div>

                        {/* SIZE CHART */}
                        <div className="mt-8 overflow-hidden rounded-xl border border-gray-100">
                            <table className="w-full text-[10px] text-center border-collapse">
                                <thead className="bg-gray-50 text-gray-400 uppercase tracking-widest border-b">
                                    <tr><th className="p-3">Size</th><th className="p-3">Chest (In)</th><th className="p-3">Sleeve (In)</th><th className="p-3">Length (In)</th></tr>
                                </thead>
                                <tbody className="text-gray-600 font-medium">
                                    {['M', 'L', 'XL', '2XL'].map((s, idx) => (
                                        <tr key={s} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                            <td className="p-3 font-bold text-gray-900 border-r">{s}</td>
                                            <td className="p-3 border-r">{38 + idx * 2}</td><td className="p-3 border-r">{7.5 + idx * 0.5}</td><td className="p-3">{26.5 + idx * 0.5}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- CUSTOMER REVIEWS SECTION --- */}
                <section className="mt-24 pt-20 border-t border-gray-100">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Summary Sidebar */}
                        <div className="lg:col-span-4 space-y-8">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-gray-900 mb-2">Customer Reviews</h2>
                                {stats && (
                                    <div className="flex flex-col items-center lg:items-start gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-5xl font-black text-[#C8922A]">{stats.averageRating.toFixed(1)}</span>
                                            <div><RatingStars rating={Math.round(stats.averageRating)} size={20} /><p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{stats.totalReviews} Reviews</p></div>
                                        </div>
                                        <div className="w-full space-y-2 mt-4">
                                            {[5, 4, 3, 2, 1].map(star => {
                                                const key = star === 5 ? 'fiveStar' : star === 4 ? 'fourStar' : star === 3 ? 'threeStar' : star === 2 ? 'twoStar' : 'oneStar';
                                                const count = stats[key as keyof ReviewStats] as number;
                                                const pct = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                                                return (
                                                    <div key={star} className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-gray-400 w-3">{star}</span>
                                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} className="h-full bg-[#C8922A]" /></div>
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
                                <p className="text-xs text-gray-500 leading-relaxed font-light italic">Have you worn this masterpiece? Share your story with us.</p>
                                {eligibleOrder ? (
                                    <button onClick={() => setIsReviewModalOpen(true)} className="w-full bg-[#2C2C2A] text-white py-4 rounded-full text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-all">Write a Review</button>
                                ) : <p className="text-[10px] text-gray-400 font-bold uppercase italic tracking-tighter">{user ? 'Verified purchase required' : 'Sign in to review'}</p>}
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
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-xs text-[#534AB7]">{rev.userId?.name?.[0] || 'E'}</div>
                                                    <div>
                                                        <div className="flex items-center gap-2"><p className="text-sm font-bold text-gray-900">{rev.userId?.name || 'Elora Member'}</p>{rev.isVerifiedBuyer && <CheckCircle2 size={12} className="text-green-500" />}</div>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(rev.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <RatingStars rating={rev.rating} size={14} />
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed font-light italic mb-4">"{rev.text}"</p>
                                            {rev.images?.length > 0 && <div className="flex gap-2">{rev.images.map((img, i) => <div key={i} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 shadow-sm"><img src={img} className="w-full h-full object-cover" alt="" /></div>)}</div>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-gray-300 italic font-serif text-lg">No reviews yet. Be the first to share your glory.</div>
                            )}
                        </div>
                    </div>
                </section>

                {/* RELATED & RECENT */}
                <div className="mt-24 text-center border-t border-gray-100 pt-20">
                    <h2 className="text-2xl font-serif text-gray-900 mb-10">Related Masterpieces</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">{relatedProducts.map(p => <ProductCard key={p._id || p.id} product={p} />)}</div>
                </div>

                {recentProducts.length > 0 && (
                    <div className="mt-24 mb-20">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-center mb-10 text-gray-700">Recently Viewed</h2>
                        <div className="flex overflow-x-auto gap-6 no-scrollbar pb-6 px-2">{recentProducts.map(p => <div key={p._id || p.id} className="min-w-[200px] flex-shrink-0"><ProductCard product={p} /></div>)}</div>
                    </div>
                )}
            </div>

            <CountdownBanner targetDate="2026-05-30T23:59:59" isVisible={true} />

            {/* --- REVIEW MODAL --- */}
            <AnimatePresence>
                {isReviewModalOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReviewModalOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-xl bg-white z-[160] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 md:p-8 border-b border-gray-50 flex items-center justify-between">
                                <div><h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900">Share Your Story</h3><p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">{product.name}</p></div>
                                <button onClick={() => setIsReviewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
                            </div>

                            <form onSubmit={handleReviewSubmit} className="flex-grow overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
                                <div className="text-center space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Quality Rating</p>
                                    <div className="flex justify-center gap-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button key={star} type="button" onClick={() => setFormRating(star)} className="transition-transform hover:scale-110 active:scale-95">
                                                <Star size={40} className={`${star <= formRating ? 'fill-[#C8922A] text-[#C8922A]' : 'text-gray-100'}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Write your feedback</label>
                                    <textarea required rows={4} value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="What did you love about this piece?" className="w-full border border-gray-100 bg-gray-50 rounded-2xl p-5 text-sm outline-none focus:border-[#534AB7] focus:bg-white transition-all resize-none italic" />
                                </div>
                                <div className="space-y-4">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2"><Camera size={14} /> Add Photos (Up to 3)</label>
                                    <ReviewImageUpload maxFiles={3} value={formImages} onChange={(items) => setFormImages(items)} />
                                </div>
                            </form>

                            <div className="p-6 md:p-8 bg-gray-50/50 border-t border-gray-100">
                                <button type="submit" disabled={isSubmitting || !formText} className="w-full bg-[#2C2C2A] text-white py-5 rounded-full font-bold uppercase tracking-[0.25em] text-[10px] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                                    {isSubmitting ? 'Posting...' : 'Post Your Review'}
                                </button>
                                <p className="text-center text-[9px] text-gray-400 mt-4 uppercase tracking-[0.2em] font-bold opacity-60">Verified reviews build Eloria's legacy.</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}