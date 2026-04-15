/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, updateCartQuantity, user, setIsAuthOpen } = useStore();
    const navigate = useNavigate();

    // Calculate subtotal based on price * quantity
    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop / Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120]"
                    />

                    {/* Side Drawer Container */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[130] shadow-2xl flex flex-col"
                    >
                        {/* 1. Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <ShoppingBag size={22} className="text-eloria-purple" />
                                    <span className="absolute -top-1 -right-1 bg-eloria-dark text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                        {cart.length}
                                    </span>
                                </div>
                                <h2 className="text-xl font-serif font-bold uppercase tracking-tight text-eloria-dark">Your Bag</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
                                <X size={24} />
                            </button>
                        </div>

                        {/* 2. Cart Items List */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-8 no-scrollbar">
                            {cart.length > 0 ? (
                                cart.map((item: any, idx: number) => {
                                    const itemId = item._id || item.id;
                                    return (
                                        <div key={`${itemId}-${item.size}-${item.color}-${idx}`} className="flex gap-4 group animate-in fade-in slide-in-from-right-4 duration-300">
                                            {/* Item Image */}
                                            <div className="w-24 h-32 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex flex-col flex-grow">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-eloria-dark line-clamp-1">{item.name}</h3>
                                                    <button
                                                        onClick={() => removeFromCart(itemId, item.size, item.color)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>

                                                {/* VARIATIONS DISPLAY (SIZE & COLOR) */}
                                                <div className="flex gap-2 mb-3">
                                                    <span className="text-[9px] font-bold uppercase text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Size: {item.size}</span>
                                                    <span className="text-[9px] font-bold uppercase text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Color: {item.color || 'Original'}</span>
                                                </div>

                                                <div className="mt-auto flex items-center justify-between">
                                                    {/* Quantity Controller */}
                                                    <div className="flex items-center border border-gray-200 rounded-full px-1 py-0.5">
                                                        <button
                                                            onClick={() => updateCartQuantity(itemId, item.size, item.color, (item.quantity || 1) - 1)}
                                                            className="p-1.5 hover:text-eloria-purple transition-colors"
                                                        >
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="text-xs font-bold w-6 text-center">{item.quantity || 1}</span>
                                                        <button
                                                            onClick={() => updateCartQuantity(itemId, item.size, item.color, (item.quantity || 1) + 1)}
                                                            className="p-1.5 hover:text-eloria-purple transition-colors"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>

                                                    {/* Item Subtotal Price */}
                                                    <span className="text-sm font-bold text-eloria-purple">₹{(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                /* Empty Bag State */
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-eloria-lavender/10 rounded-full flex items-center justify-center mb-6 text-eloria-lavender">
                                        <ShoppingBag size={40} />
                                    </div>
                                    <h3 className="text-xl font-serif text-eloria-dark mb-2">Your Bag is Empty</h3>
                                    <p className="text-sm text-gray-400 mb-8 max-w-[200px]">Looks like you haven't added your glory yet.</p>

                                    <Link
                                        to="/shop"
                                        onClick={onClose}
                                        className="inline-flex items-center gap-3 bg-eloria-dark text-white px-10 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-eloria-purple transition-all duration-500 shadow-lg group"
                                    >
                                        Start Shopping
                                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* 3. Footer / Checkout Summary */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Subtotal</span>
                                        <span className="text-sm font-bold text-eloria-dark">₹{subtotal.toLocaleString()}.00</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-500">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Shipping</span>
                                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Calculated at Checkout</span>
                                    </div>
                                    <div className="h-px bg-gray-200 my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-eloria-dark">Estimated Total</span>
                                        <span className="text-xl font-bold text-eloria-purple font-sans">₹{subtotal.toLocaleString()}.00</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        onClose();
                                        navigate('/checkout');
                                    }}
                                    className="w-full bg-eloria-dark text-white py-5 rounded-full font-bold uppercase tracking-[0.25em] text-[10px] flex items-center justify-center gap-3 hover:bg-eloria-purple transition-all duration-500 shadow-xl group active:scale-95"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                                </button>

                                <p className="mt-4 text-[9px] text-gray-400 uppercase tracking-widest text-center">
                                    Secure Checkout Powered by Eloria
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}