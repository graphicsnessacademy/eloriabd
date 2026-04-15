import { ShoppingCart, Heart, ArrowRight, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

interface Product {
    id: string;
    _id?: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    category?: string;
    isNewProduct?: boolean;
    isViewMore?: boolean;
    categoryTarget?: string;
    inStock?: boolean;
    stock?: number;
}

export default function ProductCard({ product }: { product: Product }) {
    const { toggleWishlist, wishlist, addToCart, orderNow } = useStore();
    const navigate = useNavigate();

    const productId = product._id || product.id;
    const isWishlisted = wishlist.includes(productId);

    const isNew  = product.isNewProduct || product.category === 'New Arrival';
    const isOut  = product.inStock === false || product.stock === 0;
    const isSale = !isOut && !!(product.originalPrice && product.originalPrice > product.price);
    const discountPct = isSale
        ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
        : 0;

    // ── View-More card ───────────────────────────────────────────
    if (product.isViewMore) {
        return (
            <Link
                to={`/shop/${product.categoryTarget ?? ''}`}
                className="group relative aspect-square overflow-hidden justify-center flex flex-col items-center rounded-sm cursor-pointer"
            > 
                <div className="w-full h-full bg-black flex justify-center items-center object-cover group-hover:scale-110 transition-transform duration-700"> 
                    <img
                        src={product.image}
                        className="absolute inset-0 opacity-50 blur-[2px]"
                        alt="View More"
                    />
                    <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                        <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                            <ArrowRight className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-[10px] font-bold tracking-widest uppercase text-white">
                            View More
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    // ── Main card ────────────────────────────────────────────────
    return (
        <div className="group relative bg-white flex flex-col border border-gray-100 transition-all duration-300 hover:shadow-md rounded-sm overflow-hidden">

            {/* Image Section */}
            <div className="relative aspect-square overflow-hidden bg-gray-50">
                {/* 1. LINK TO PRODUCT DETAIL PAGE (IMAGE) */}
                <Link to={`/product/${productId}`} className="block w-full h-full">
                    <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                            isOut ? 'grayscale opacity-60' : ''
                        }`}
                        referrerPolicy="no-referrer"
                    />
                </Link>

                {/* Stock-out centre overlay */}
                {isOut && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                        <span className="bg-black/75 text-white text-[9px] font-bold tracking-[0.25em] uppercase px-3 py-1.5 rounded-sm">
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Badges — top-left */}
                {!isOut && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
                        {isNew && (
                            <span className="bg-[#534AB7] text-white text-[8px] font-extrabold tracking-[0.2em] uppercase px-2 py-1 leading-none rounded-sm shadow-sm">
                                NEW
                            </span>
                        )}
                        {isSale && (
                            <span className="bg-[#D4537E] text-white text-[8px] font-extrabold tracking-[0.2em] uppercase px-2 py-1 leading-none rounded-sm shadow-sm">
                                SALE
                            </span>
                        )}
                    </div>
                )}

                {/* Discount % — top-right */}
                {isSale && discountPct > 0 && (
                    <span className="absolute top-2 right-2 bg-[#D4537E] text-white text-[8px] font-extrabold leading-none px-1.5 py-1 rounded-sm z-10 pointer-events-none">
                        -{discountPct}%
                    </span>
                )}

                {/*
                    Action bar — slides up on hover (desktop), always visible on mobile
                */}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-1 p-2 transition-all duration-300 lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100">
                   
                    {/* Row 2: order now + Wishlist */}
                    <div className="flex items-center gap-1">
                       
                    <button
                        disabled={isOut}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isOut) orderNow(product, navigate);
                        }}
                        className={`flex items-center gap-1.5 w-full justify-center text-[9px] font-extrabold uppercase tracking-[0.15em] px-3 py-2 rounded-sm whitespace-nowrap transition-all duration-200 active:scale-95 ${
                            isOut
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-[#534AB7] text-white hover:bg-[#3d3599] cursor-pointer shadow-md'
                        }`}
                        aria-label="Order now"
                    >
                        <Zap className="w-3 h-3 shrink-0" />
                        <span>Order Now</span>
                    </button>


                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                toggleWishlist(productId);
                            }}
                            className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-sm border transition-all duration-200 active:scale-95 shadow-sm ${
                                isWishlisted
                                    ? 'bg-[#D4537E] border-[#D4537E] text-white'
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-[#D4537E] hover:border-[#D4537E]'
                            }`}
                            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Section */}
            {/* 2. LINK TO PRODUCT DETAIL PAGE (TEXT) */}
            <Link to={`/product/${productId}`} className="p-2.5 text-center block hover:opacity-70 transition-opacity">
                <h3 className="text-[10px] text-gray-600 truncate mb-1 uppercase font-serif tracking-tight leading-snug">
                    {product.name}
                </h3>
                {isOut ? (
                    <span className="text-[11px] text-gray-400 font-sans">Unavailable</span>
                ) : (
                    <div className="flex items-center justify-center gap-1.5">
                        <span className="font-bold text-[12px] text-black font-sans">
                            ₹{product.price.toLocaleString()}
                        </span>
                        {isSale && product.originalPrice && (
                            <span className="text-[11px] text-gray-400 line-through">
                                ₹{product.originalPrice.toLocaleString()}
                            </span>
                        )}
                    </div>
                )}
            </Link>
        </div>
    );
}