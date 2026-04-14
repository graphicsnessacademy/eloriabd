import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CreditCard, ShieldCheck, CheckCircle, Plus, X, Home, Briefcase } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface Address {
    id?: string;
    _id?: string;
    label: string;
    recipientName: string;
    contact: string;
    country: string;
    district: string;
    area: string;
    postCode: string;
    address: string;
    isDefault: boolean;
}

export default function CheckoutPage() {
    const { user, cart, clearCart, setIsAuthOpen, updateUserProfile } = useStore();
    const navigate = useNavigate();

    // Route Guard
    useEffect(() => {
        if (!user && !localStorage.getItem('eloria_token')) {
            navigate('/');
            setIsAuthOpen(true);
        }
    }, [user, navigate, setIsAuthOpen]);

    // Local States
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(user?.addresses?.length > 0 ? 0 : null);
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [successOrder, setSuccessOrder] = useState<any>(null);

    // Form State (New Address)
    const emptyForm: Address = {
        label: 'Home', recipientName: '', contact: '', country: 'Bangladesh',
        district: '', area: '', postCode: '', address: '', isDefault: false
    };
    const [form, setForm] = useState<Address>(emptyForm);

    // API Helper
    const API_URL = 'https://eloriabd.vercel.app';

    // Pricing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * (item.quantity || 1), 0);
    const shipping = subtotal > 999 ? 0 : 60; // 60 BDT/INR default shipping
    const total = subtotal + shipping;

    if (!user) return <div className="min-h-screen bg-[#fafafa]" />; // Guard fallback

    // Handlers
    const handleSaveAddress = async () => {
        if (!form.recipientName || !form.contact || !form.district || !form.area || !form.address) {
            alert('Please fill out all required fields.');
            return;
        }
        
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('eloria_token');
            const newAddresses = [...(user.addresses || []), { ...form, isDefault: user.addresses?.length === 0 }];
            
            const res = await fetch(`${API_URL}/api/user/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ addresses: newAddresses })
            });

            const data = await res.json();
            if (res.ok) {
                updateUserProfile({ addresses: data.user.addresses });
                setShowNewAddressForm(false);
                setSelectedAddressIndex(data.user.addresses.length - 1);
                setForm(emptyForm);
            } else {
                alert(data.message || 'Failed to save address.');
            }
        } catch {
            alert('Network error while saving address.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return alert('Your cart is empty.');
        if (selectedAddressIndex === null || !user.addresses[selectedAddressIndex]) {
            return alert('Please select a shipping address.');
        }

        setIsProcessing(true);
        try {
            const token = localStorage.getItem('eloria_token');
            const targetAddress = user.addresses[selectedAddressIndex];

            const orderPayload = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items: cart.map((c: any) => ({
                    productId: c._id || c.id,
                    name: c.name,
                    image: c.image,
                    size: c.size,
                    color: c.color,
                    price: c.price,
                    quantity: c.quantity || 1
                })),
                shippingAddress: targetAddress,
                totalAmount: total,
                paymentMethod: 'Cash on Delivery'
            };

            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(orderPayload)
            });

            if (res.ok) {
                const newOrder = await res.json();
                clearCart();
                setSuccessOrder(newOrder);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Failed to place order.');
            }
        } catch {
            alert('Network error while placing order.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (successOrder) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center pt-[72px] p-4">
                <div className="bg-white max-w-md w-full border border-gray-100 p-8 rounded-sm text-center shadow-2xl shadow-[#534AB7]/5">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Order Confirmed</h1>
                    <p className="text-sm font-sans text-gray-500 mb-8">
                        Thank you for shopping at ELORIA. Your elegant pieces are being prepared.
                    </p>
                    
                    <div className="bg-gray-50 p-4 rounded-sm text-left mb-8 border border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Order Number</p>
                        <p className="text-xs font-mono font-bold text-gray-900 break-all">{successOrder._id}</p>
                        <div className="h-px bg-gray-200 my-3" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">Total Paid</p>
                        <p className="text-xs font-extrabold text-[#534AB7]">₹{successOrder.totalAmount?.toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link to="/account" className="w-full bg-[#2C2C2A] text-white py-3.5 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-colors active:scale-[0.99] block text-center">
                            Track My Order
                        </Link>
                        <Link to="/shop" className="w-full border border-gray-200 text-gray-700 py-3.5 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-gray-50 transition-colors block text-center">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const inputCls = "w-full border border-gray-200 rounded-sm px-3 py-2.5 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors bg-white font-sans";
    const labelCls = "block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-sans";

    return (
        <div className="pt-[72px] min-h-screen bg-[#fafafa]">
            <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-8">
                    <Link to="/cart" className="hover:text-gray-700 transition-colors">Cart</Link>
                    <span>/</span>
                    <span className="text-[#534AB7]">Checkout</span>
                </div>
                
                <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-8">Secure Checkout</h1>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    
                    {/* LEFT COLUMN: Shipping */}
                    <div className="w-full lg:flex-1 space-y-8">
                        
                        {/* Address Selection Block */}
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7]">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-serif font-bold text-gray-900">Shipping Address</h2>
                            </div>

                            {user.addresses && user.addresses.length > 0 ? (
                                <div className="space-y-4 mb-6">
                                    {user.addresses.map((addr: Address, idx: number) => (
                                        <label 
                                            key={idx} 
                                            className={`relative flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${selectedAddressIndex === idx ? 'border-[#534AB7] bg-[#534AB7]/5' : 'border-gray-200 hover:border-[#534AB7]/50'}`}
                                        >
                                            <div className="mt-1 shrink-0">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressIndex === idx ? 'border-[#534AB7]' : 'border-gray-300'}`}>
                                                    {selectedAddressIndex === idx && <div className="w-2 h-2 rounded-full bg-[#534AB7]" />}
                                                </div>
                                            </div>
                                            <div className="flex-1 font-sans">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#534AB7]">
                                                        {addr.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-800">{addr.recipientName}</p>
                                                <p className="text-xs text-gray-500 mt-1">{addr.address}, {addr.area}, {addr.district}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{addr.country} {addr.postCode}</p>
                                                <p className="text-xs font-semibold text-gray-600 mt-1.5">{addr.contact}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="mb-6 p-4 rounded-sm border border-dashed border-gray-200 text-center">
                                    <p className="text-xs text-gray-500">You don't have any saved addresses yet.</p>
                                </div>
                            )}

                            {/* Add New Address Toggle */}
                            <AnimatePresence initial={false}>
                                {showNewAddressForm ? (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="border border-gray-100 bg-[#fafafa] rounded-sm p-5 space-y-4 font-sans mt-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xs font-extrabold uppercase tracking-[0.3em] text-gray-700">Add New Address</h3>
                                                <button onClick={() => setShowNewAddressForm(false)}>
                                                    <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                                                </button>
                                            </div>

                                            <div>
                                                <label className={labelCls}>Address Type</label>
                                                <div className="flex gap-2">
                                                    {(['Home', 'Office'] as const).map(l => (
                                                        <button key={l}
                                                            type="button"
                                                            onClick={() => setForm(f => ({ ...f, label: l }))}
                                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all ${form.label === l ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#534AB7]/40'}`}
                                                        >
                                                            {l === 'Home' ? <Home className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />} {l}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelCls}>Recipient Name *</label>
                                                    <input className={inputCls} placeholder="Full Name" value={form.recipientName} onChange={e => setForm(f => ({ ...f, recipientName: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Contact Number *</label>
                                                    <input className={inputCls} placeholder="Mobile Number" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>District / City *</label>
                                                    <input className={inputCls} placeholder="e.g. Dhaka" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
                                                </div>
                                                <div>
                                                    <label className={labelCls}>Area / Thana *</label>
                                                    <input className={inputCls} placeholder="e.g. Gulshan" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelCls}>Full Address *</label>
                                                <textarea className={`${inputCls} resize-none`} rows={2} placeholder="House / Building / Street" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                                            </div>

                                            <button 
                                                disabled={isProcessing}
                                                onClick={handleSaveAddress} 
                                                className="w-full bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-black transition-colors disabled:opacity-50"
                                            >
                                                {isProcessing ? 'Saving...' : 'Save & Select Address'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <button 
                                        onClick={() => setShowNewAddressForm(true)}
                                        className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#534AB7] hover:underline"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add New Address
                                    </button>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Payment Method Block */}
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm opacity-90">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7]">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-serif font-bold text-gray-900">Payment Selection</h2>
                            </div>

                            <label className="flex items-center gap-3 p-4 border border-[#534AB7] bg-[#534AB7]/5 rounded-sm cursor-pointer">
                                <div className="w-4 h-4 rounded-full border border-[#534AB7] flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-[#534AB7]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 font-sans">Cash on Delivery</p>
                                    <p className="text-xs text-gray-500 font-sans mt-0.5">Pay conveniently at your doorstep.</p>
                                </div>
                            </label>
                            
                            <p className="text-[10px] text-gray-400 font-sans mt-4 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Digital payments coming soon.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm sticky top-[100px]">
                            <h2 className="text-lg font-serif font-bold text-gray-900 mb-6">Order Summary</h2>

                            <div className="max-h-[320px] overflow-y-auto pr-2 space-y-4 mb-6 font-sans">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {cart.map((item: any, idx: number) => {
                                    const id = item._id || item.id;
                                    return (
                                        <div key={`${id}-${item.size}-${item.color}-${idx}`} className="flex gap-3">
                                            <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-sm border border-gray-100 overflow-hidden">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-tight text-gray-800 truncate">{item.name}</p>
                                                <div className="flex gap-2 mt-0.5">
                                                    {item.size && item.size !== 'Standard' && <span className="text-[9px] text-gray-500">Size: {item.size}</span>}
                                                    {item.color && item.color !== 'Default' && <span className="text-[9px] text-gray-500">Color: {item.color}</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-1 font-bold">Qty {item.quantity || 1}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-gray-900">₹{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-3 font-sans border-t border-gray-100 pt-5">
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-gray-900">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>Shipping</span>
                                    <span className="font-bold text-green-600">{shipping === 0 ? 'Free' : `₹${shipping.toLocaleString()}`}</span>
                                </div>
                                
                                <div className="h-px bg-gray-200 my-4" />
                                
                                <div className="flex justify-between items-center text-gray-900">
                                    <span className="text-sm font-bold">Grand Total</span>
                                    <span className="text-xl font-extrabold text-[#534AB7]">₹{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button 
                                onClick={handlePlaceOrder}
                                disabled={isProcessing}
                                className="w-full mt-8 bg-[#2C2C2A] text-white py-4 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10"
                            >
                                {isProcessing ? 'Processing Order...' : 'Place Order'}
                            </button>
                            
                            <p className="text-center text-[9px] text-gray-400 mt-4 font-sans px-4">
                                By placing your order, you agree to Eloria's Privacy Policy and Conditions of Use.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
