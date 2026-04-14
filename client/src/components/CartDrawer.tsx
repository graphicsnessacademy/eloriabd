import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CartDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { cart, removeFromCart, updateCartQuantity } = useStore();

    const subtotal = cart.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[120]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[130] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ShoppingBag size={20} className="text-eloria-purple" />
                                <h2 className="text-xl font-serif font-bold uppercase tracking-tight">Shopping Bag ({cart.length})</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 no-scrollbar">
                            {cart.length > 0 ? (
                                cart.map((item: any) => (
                                    <div key={item._id || item.id} className="flex gap-4 group">
                                        <div className="w-24 h-32 bg-gray-50 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col flex-grow">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-xs font-bold uppercase tracking-tight text-gray-800 line-clamp-1">{item.name}</h3>
                                                <button
                                                    onClick={() => removeFromCart(item._id || item.id)}
                                                    className="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mb-4">{item.category}</p>

                                            <div className="mt-auto flex items-center justify-between">
                                                <div className="flex items-center border border-gray-200 rounded-md">
                                                    <button
                                                        onClick={() => updateCartQuantity(item._id || item.id, (item.quantity || 1) - 1)}
                                                        className="p-1 px-2 hover:bg-gray-50"
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-xs font-bold w-8 text-center">{item.quantity || 1}</span>
                                                    <button
                                                        onClick={() => updateCartQuantity(item._id || item.id, (item.quantity || 1) + 1)}
                                                        className="p-1 px-2 hover:bg-gray-50"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                                <span className="text-sm font-bold text-eloria-purple">₹{(item.price * (item.quantity || 1)).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                        <ShoppingBag size={32} />
                                    </div>
                                    <p className="text-gray-400 font-serif italic">Your bag is empty</p>

                                    <button onClick={onClose} className="px-8 py-4">
                                        <Link
                                            to="/shop"
                                            className="inline-flex items-center gap-3 bg-eloria-dark text-white px-8 py-4 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-eloria-purple transition-all duration-300">
                                            Start Shopping <ArrowRight size={14} />
                                        </Link>

                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-6 bg-gray-50 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Subtotal</span>
                                    <span className="text-xl font-bold text-eloria-dark">₹{subtotal.toLocaleString()}.00</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mb-6 uppercase tracking-tight text-center">Shipping & taxes calculated at checkout</p>
                                <button className="w-full bg-eloria-dark text-white py-4 rounded-full font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-eloria-purple transition-all duration-500 shadow-xl group">
                                    Proceed to Checkout
                                    <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}