import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { Heart, ArrowRight } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function WishlistPage({ products }: { products: any[] }) {
    const { wishlist } = useStore();

    // Filter the full product list to only show what's in the wishlist
    const wishlistedItems = products.filter(p => wishlist.includes(p._id || p.id));

    return (
        <div className="pt-[72px] min-h-screen bg-white">
            {/* 1. HEADER SECTION */}
            <div className="bg-[#fcf9f6] py-16 px-6 border-b border-gray-100">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight mb-4">
                        My Wishlist
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                        <Link to="/" className="hover:text-black transition-colors">Home</Link>
                        <span>/</span>
                        <span className="text-eloria-purple">Wishlist</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                {wishlistedItems.length > 0 ? (
                    <>
                        {/* 2. ITEM COUNT */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                {wishlistedItems.length} {wishlistedItems.length === 1 ? 'Item' : 'Items'} Saved
                            </p>
                        </div>

                        {/* 3. PRODUCT GRID */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {wishlistedItems.map((product) => (
                                <div key={product._id || product.id} className="relative group">
                                    <ProductCard product={product} />
                                    {/* Additional Remove Button for Wishlist Page specifically */}
                                    <button
                                        onClick={() => { /* toggleWishlist logic will handle removal */ }}
                                        className="mt-2 w-full py-2 text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        Remove from list
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* 4. EMPTY STATE */
                    <div className="py-24 text-center max-w-md mx-auto">
                        <div className="w-20 h-20 bg-eloria-lavender/10 rounded-full flex items-center justify-center mx-auto mb-6 text-eloria-purple">
                            <Heart size={32} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-serif text-slate-800 mb-4">Your Wishlist is Empty</h2>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8">
                            Save your favorite ethnic pieces here to keep track of what you love.
                            They'll be waiting for you whenever you're ready to make them yours.
                        </p>
                        <Link
                            to="/shop"
                            className="inline-flex items-center gap-3 bg-eloria-dark text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-eloria-purple transition-all duration-300"
                        >
                            Start Exploring <ArrowRight size={14} />
                        </Link>
                    </div>
                )}
            </div>

            {/* 5. RECENTLY VIEWED / SUGGESTIONS (Optional) */}
            {wishlistedItems.length > 0 && (
                <div className="bg-[#fcf9f6] py-16 mt-12">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h3 className="text-2xl font-serif italic mb-8 text-slate-800">You might also love</h3>
                        {/* You can map 4 random products here */}
                    </div>
                </div>
            )}
        </div>
    );
}