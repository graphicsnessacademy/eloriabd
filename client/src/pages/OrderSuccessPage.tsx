import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderSuccessPage() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Extract order data passed from CheckoutPage
    const order = location.state?.order;

    // Security: If no order data exists in state, redirect to home
    useEffect(() => {
        if (!order) {
            navigate('/');
        }
        window.scrollTo(0, 0);
    }, [order, navigate]);

    if (!order) return null;

    return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center pt-[90px] p-4 font-sans text-gray-800">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="bg-white max-w-xl w-full border border-gray-100 p-8 md:p-12 rounded-2xl text-center shadow-2xl shadow-[#534AB7]/5 relative overflow-hidden"
            >
                {/* Visual Branding Background */}
                <ShoppingBag className="absolute -top-10 -right-10 w-40 h-40 text-gray-50 rotate-12 pointer-events-none" />

                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 relative z-10">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-2 relative z-10">Order Confirmed!</h1>
                <p className="text-sm text-gray-500 mb-10 relative z-10 max-w-xs mx-auto leading-relaxed">
                    Thank you, <span className="text-black font-bold">{order.customer?.name}</span>. Your elegant choice has been recorded.
                </p>

                <div className="bg-[#FCFBFE] p-6 rounded-2xl text-left mb-10 border border-gray-100 relative z-10 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1.5">Order Serial Number</p>
                            {/* Displaying the auto-generated EL-XXXXXX number */}
                            <p className="text-base font-mono font-black text-[#534AB7] tracking-wider">
                                {order.orderNumber || 'Processing...'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 mb-1.5">Status</p>
                            <span className="bg-blue-50 text-blue-600 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-blue-100">
                                {order.status || 'Pending'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-px bg-gray-100 my-5" />
                    
                    <div className="flex justify-between items-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400">Total Paid (COD)</p>
                        <p className="text-xl font-black text-gray-900 font-sans">৳{(order.total || order.totalAmount)?.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <Link 
                        to="/account" 
                        className="flex items-center justify-center gap-2 bg-[#2C2C2A] text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        <Package size={14} /> Track Order
                    </Link>
                    <Link 
                        to="/shop" 
                        className="flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-700 py-4 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-50 transition-all active:scale-95"
                    >
                        Continue Shopping <ArrowRight size={14} />
                    </Link>
                </div>
                
                <p className="mt-8 text-[10px] text-gray-400 uppercase tracking-widest font-medium border-t border-gray-50 pt-6">
                    A summary has been sent to {order.customer?.email}
                </p>
            </motion.div>
        </div>
    );
}