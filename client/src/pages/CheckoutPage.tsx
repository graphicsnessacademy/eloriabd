/**
 * CheckoutPage.tsx
 * Unified checkout — Path A (logged-in), Path B (new guest), Path C (OTP bridge)
 * Bangla UI + Coupon integration
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, CreditCard, ShieldCheck, CheckCircle,
    Plus, X, Home, Briefcase, Eye, EyeOff,
    RefreshCw, AlertCircle, ArrowLeft, Tag
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const inputCls = 'w-full border border-gray-200 rounded-sm px-3 py-2.5 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors bg-white font-sans';
const labelCls = 'block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-sans';

interface Address {
    id?: string; _id?: string;
    label: string; recipientName: string; contact: string;
    country: string; district: string; area: string;
    postCode: string; address: string; isDefault: boolean;
}
type Step = 'checkout' | 'otp' | 'success';

export default function CheckoutPage() {
    const { user, cart, clearCart, setIsAuthOpen, updateUserProfile, loginSync } = useStore();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('checkout');
    const [isProcessing, setIsProcessing] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [successOrder, setSuccessOrder] = useState<any>(null);

    // Path A states
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(
        user?.addresses?.length > 0 ? 0 : null
    );
    const [showNewAddressForm, setShowNewAddressForm] = useState(false);
    const emptyAddr: Address = {
        label: 'Home', recipientName: '', contact: '', country: 'Bangladesh',
        district: '', area: '', postCode: '', address: '', isDefault: false
    };
    const [addrForm, setAddrForm] = useState<Address>(emptyAddr);

    // Path B/C states
    const [guestForm, setGuestForm] = useState({
        fullName: '', phone: '', email: '', password: '',
        addressLabel: 'Home' as 'Home' | 'Office',
        district: '', area: '', addressDetail: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [guestError, setGuestError] = useState('');

    // OTP states
    const [sessionId, setSessionId] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Coupon states
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<{
        code: string; discountAmount: number; message: string;
    } | null>(null);
    const [couponError, setCouponError] = useState('');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subtotal = cart.reduce((s: number, i: any) => s + i.price * (i.quantity || 1), 0);
    const shipping = subtotal > 999 ? 0 : 60;
    const discount = appliedCoupon?.discountAmount ?? 0;
    const total = subtotal + shipping - discount;

    useEffect(() => {
        if (cart.length === 0 && step === 'checkout') navigate('/shop');
    }, [cart, navigate, step]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // ── Coupon handler ──
    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) { setCouponError('কুপন কোড দিন।'); return; }
        setCouponLoading(true); setCouponError('');
        try {
            const res = await fetch(`${API_URL}/api/coupons/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponInput.trim(),
                    orderTotal: subtotal + shipping,
                    userId: user?._id,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.valid) {
                setCouponError(data.message || 'কুপন ব্যবহার করা যাচ্ছে না।');
            } else {
                setAppliedCoupon({ code: couponInput.trim().toUpperCase(), discountAmount: data.discountAmount, message: data.message });
                setCouponInput('');
            }
        } catch { setCouponError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।'); }
        finally { setCouponLoading(false); }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
        setCouponInput('');
    };

    // Path A: save address
    const handleSaveAddress = async () => {
        if (!addrForm.recipientName || !addrForm.contact || !addrForm.district || !addrForm.area || !addrForm.address) {
            alert('সমস্ত প্রয়োজনীয় তথ্য পূরণ করুন।'); return;
        }
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('eloria_token');
            const newAddresses = [...(user.addresses || []), { ...addrForm, isDefault: user.addresses?.length === 0 }];
            const res = await fetch(`${API_URL}/api/user/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ addresses: newAddresses })
            });
            const data = await res.json();
            if (res.ok) {
                updateUserProfile({ addresses: data.user.addresses });
                setShowNewAddressForm(false);
                setSelectedAddressIndex(data.user.addresses.length - 1);
                setAddrForm(emptyAddr);
            } else { alert(data.message || 'ঠিকানা সংরক্ষণ ব্যর্থ।'); }
        } catch { alert('নেটওয়ার্ক সমস্যা।'); }
        finally { setIsProcessing(false); }
    };

    // Path A: place order
    const handleLoggedInOrder = async () => {
        if (cart.length === 0) return alert('কার্ট খালি।');
        if (selectedAddressIndex === null || !user.addresses[selectedAddressIndex])
            return alert('একটি শিপিং ঠিকানা বেছে নিন।');
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('eloria_token');
            const shippingAddress = user.addresses[selectedAddressIndex];
            const res = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    items: cart.map((c: any) => ({ productId: c._id || c.id, name: c.name, image: c.image, size: c.size, color: c.color, price: c.price, quantity: c.quantity || 1 })),
                    shippingAddress,
                    totalAmount: total,
                    paymentMethod: 'Cash on Delivery',
                    couponCode: appliedCoupon?.code,
                })
            });
            if (res.ok) { const order = await res.json(); clearCart(); setSuccessOrder(order); setStep('success'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
            else { alert('অর্ডার প্রদান ব্যর্থ হয়েছে।'); }
        } catch { alert('নেটওয়ার্ক সমস্যা।'); }
        finally { setIsProcessing(false); }
    };

    // Path B/C: guest checkout
    const handleGuestOrder = async () => {
        const { fullName, phone, email, password, addressLabel, district, area, addressDetail } = guestForm;
        if (!fullName || !phone || !email || !password || !district || !area || !addressDetail) {
            setGuestError('সমস্ত তারকাচিহ্নিত (*) তথ্য পূরণ করুন।'); return;
        }
        setGuestError('');
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/api/hybrid-checkout/place-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, phone, email, password, addressLabel, district, area, addressDetail, cart, totalAmount: total, couponCode: appliedCoupon?.code })
            });
            const data = await res.json();
            if (!res.ok) { setGuestError(data.message || 'কিছু একটা ভুল হয়েছে।'); return; }
            if (data.status === 'created' || data.status === 'logged_in') {
                loginSync(data); clearCart(); setSuccessOrder(data.order); setStep('success'); window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (data.status === 'otp_required') {
                setSessionId(data.sessionId); setMaskedPhone(data.maskedPhone); setResendCooldown(60); setStep('otp'); window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch { setGuestError('নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।'); }
        finally { setIsProcessing(false); }
    };

    // OTP helpers
    const handleOtpChange = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otpDigits]; next[idx] = val; setOtpDigits(next); setOtpError('');
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };
    const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    };
    const handleVerifyOtp = async () => {
        const otp = otpDigits.join('');
        if (otp.length < 6) { setOtpError('৬ সংখ্যার কোডটি পূরণ করুন।'); return; }
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/api/hybrid-checkout/verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, otp })
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.code === 'MAX_ATTEMPTS') { setOtpError(data.message); setTimeout(() => { setStep('checkout'); setOtpDigits(['','','','','','']); }, 3000); }
                else { setOtpError(data.message || 'OTP ভুল হয়েছে।'); }
                return;
            }
            loginSync(data); clearCart(); setSuccessOrder(data.order); setStep('success'); window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch { setOtpError('নেটওয়ার্ক সমস্যা।'); }
        finally { setIsProcessing(false); }
    };
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            await fetch(`${API_URL}/api/hybrid-checkout/resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
            setResendCooldown(60); setOtpDigits(['','','','','','']); setOtpError('');
        } catch { /* silent */ }
    };

    // ── SUCCESS ──
    if (step === 'success' && successOrder) return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center pt-[72px] p-4">
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-white max-w-md w-full border border-gray-100 p-8 rounded-sm text-center shadow-2xl shadow-[#534AB7]/5">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">অর্ডার নিশ্চিত!</h1>
                <p className="text-sm text-gray-500 mb-8">ELORIA-তে কেনাকাটার জন্য ধন্যবাদ। আপনার পোশাক প্রস্তুত হচ্ছে।</p>
                <div className="bg-gray-50 p-4 rounded-sm text-left mb-8 border border-gray-100">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">অর্ডার নম্বর</p>
                    <p className="text-xs font-mono font-bold text-gray-900 break-all">{successOrder._id}</p>
                    <div className="h-px bg-gray-200 my-3" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">মোট মূল্য</p>
                    <p className="text-xs font-extrabold text-[#534AB7]">৳{successOrder.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-3">
                    <Link to="/account" className="w-full bg-[#2C2C2A] text-white py-3.5 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-colors block text-center">অর্ডার ট্র্যাক করুন</Link>
                    <Link to="/shop" className="w-full border border-gray-200 text-gray-700 py-3.5 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-gray-50 transition-colors block text-center">কেনাকাটা চালিয়ে যান</Link>
                </div>
            </motion.div>
        </div>
    );

    // ── OTP STEP ──
    if (step === 'otp') return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center pt-[72px] p-4">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-white max-w-sm w-full border border-gray-100 p-8 rounded-sm shadow-xl shadow-[#534AB7]/5">
                <button onClick={() => { setStep('checkout'); setOtpDigits(['','','','','','']); setOtpError(''); }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-700 mb-6 transition-colors">
                    <ArrowLeft className="w-3 h-3" /> ফিরে যান
                </button>
                <div className="w-14 h-14 rounded-full bg-[#534AB7]/10 flex items-center justify-center mx-auto mb-5">
                    <ShieldCheck className="w-7 h-7 text-[#534AB7]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-center text-gray-900 mb-2">পরিচয় যাচাই</h2>
                <p className="text-xs text-gray-500 text-center mb-1">আমরা একটি ৬ সংখ্যার কোড পাঠিয়েছি</p>
                <p className="text-sm font-bold text-center text-gray-800 mb-6">{maskedPhone}</p>
                <div className="flex gap-2 justify-center mb-5">
                    {otpDigits.map((d, i) => (
                        <input key={i} ref={el => { otpRefs.current[i] = el; }}
                            type="text" inputMode="numeric" maxLength={1} value={d}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            className={`w-10 h-12 text-center text-lg font-bold border rounded-sm transition-colors focus:outline-none ${
                                otpError ? 'border-red-300 bg-red-50 text-red-600'
                                : d ? 'border-[#534AB7] bg-[#534AB7]/5 text-[#534AB7]'
                                : 'border-gray-200 text-gray-900 focus:border-[#534AB7]'
                            }`} />
                    ))}
                </div>
                {otpError && (
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-100 rounded-sm">
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <p className="text-[11px] text-red-600 font-bold">{otpError}</p>
                    </div>
                )}
                <button onClick={handleVerifyOtp} disabled={isProcessing || otpDigits.some(d => !d)}
                    className="w-full bg-[#2C2C2A] text-white py-3.5 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-40 mb-4">
                    {isProcessing ? 'যাচাই হচ্ছে…' : 'যাচাই করুন ও অর্ডার করুন'}
                </button>
                <div className="text-center">
                    <p className="text-[11px] text-gray-400 mb-1">কোড পাননি?</p>
                    {resendCooldown > 0
                        ? <p className="text-[11px] font-bold text-gray-400">{resendCooldown} সেকেন্ড পর আবার পাঠান</p>
                        : <button onClick={handleResendOtp} className="flex items-center gap-1 mx-auto text-[11px] font-bold text-[#534AB7] hover:underline"><RefreshCw className="w-3 h-3" /> OTP আবার পাঠান</button>
                    }
                </div>
                <p className="text-[10px] text-center text-gray-300 mt-5">৫ মিনিটে মেয়াদ শেষ · সর্বোচ্চ ৩ বার চেষ্টা</p>
            </motion.div>
        </div>
    );

    // ── MAIN CHECKOUT ──
    return (
        <div className="pt-[72px] min-h-screen bg-[#fafafa]">
            <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-8">
                    <Link to="/" className="hover:text-gray-700 transition-colors">হোম</Link>
                    <span>/</span>
                    <span className="text-[#534AB7]">চেকআউট</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 mb-2">
                    {user ? 'নিরাপদ চেকআউট' : 'প্রায় হয়ে গেছে'}
                </h1>
                {!user && (
                    <p className="text-sm text-gray-500 mb-8">
                        আপনার তথ্য দিন — আমরা তাৎক্ষণিকভাবে আপনার অ্যাকাউন্ট তৈরি করব।{' '}
                        <button onClick={() => setIsAuthOpen(true)} className="text-[#534AB7] font-bold hover:underline">ইতিমধ্যে অ্যাকাউন্ট আছে?</button>
                    </p>
                )}
                {user && <div className="mb-8" />}

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
                    {/* LEFT */}
                    <div className="w-full lg:flex-1 space-y-6">

                        {/* PATH A: Logged-in */}
                        {user && (
                            <>
                                <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7]"><MapPin className="w-4 h-4" /></div>
                                        <h2 className="text-lg font-serif font-bold text-gray-900">শিপিং অ্যাড্রেস</h2>
                                    </div>
                                    {user.addresses?.length > 0 ? (
                                        <div className="space-y-4 mb-6">
                                            {user.addresses.map((addr: Address, idx: number) => (
                                                <label key={idx} onClick={() => setSelectedAddressIndex(idx)}
                                                    className={`relative flex items-start gap-4 p-4 border rounded-sm cursor-pointer transition-all ${selectedAddressIndex === idx ? 'border-[#534AB7] bg-[#534AB7]/5' : 'border-gray-200 hover:border-[#534AB7]/50'}`}>
                                                    <div className="mt-1 shrink-0">
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAddressIndex === idx ? 'border-[#534AB7]' : 'border-gray-300'}`}>
                                                            {selectedAddressIndex === idx && <div className="w-2 h-2 rounded-full bg-[#534AB7]" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 font-sans">
                                                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#534AB7]">{addr.label}</span>
                                                        <p className="text-sm font-bold text-gray-800 mt-0.5">{addr.recipientName}</p>
                                                        <p className="text-xs text-gray-500 mt-1">{addr.address}, {addr.area}, {addr.district}</p>
                                                        <p className="text-xs text-gray-400">{addr.country} {addr.postCode}</p>
                                                        <p className="text-xs font-semibold text-gray-600 mt-1">{addr.contact}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mb-6 p-4 rounded-sm border border-dashed border-gray-200 text-center">
                                            <p className="text-xs text-gray-500">এখনো কোনো ঠিকানা নেই।</p>
                                        </div>
                                    )}
                                    <AnimatePresence initial={false}>
                                        {showNewAddressForm ? (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="border border-gray-100 bg-[#fafafa] rounded-sm p-5 space-y-4 mt-2">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xs font-extrabold uppercase tracking-[0.3em] text-gray-700">নতুন ঠিকানা যোগ করুন</h3>
                                                        <button onClick={() => setShowNewAddressForm(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-700" /></button>
                                                    </div>
                                                    <div>
                                                        <label className={labelCls}>ঠিকানার ধরন</label>
                                                        <div className="flex gap-2">
                                                            {(['Home', 'Office'] as const).map(l => (
                                                                <button key={l} type="button" onClick={() => setAddrForm(f => ({ ...f, label: l }))}
                                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all ${addrForm.label === l ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#534AB7]/40'}`}>
                                                                    {l === 'Home' ? <Home className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />} {l === 'Home' ? 'বাসা' : 'অফিস'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div><label className={labelCls}>প্রাপকের নাম *</label><input className={inputCls} placeholder="আপনার পূর্ণ নাম" value={addrForm.recipientName} onChange={e => setAddrForm(f => ({ ...f, recipientName: e.target.value }))} /></div>
                                                        <div><label className={labelCls}>মোবাইল নম্বর *</label><input className={inputCls} placeholder="01XXXXXXXXX" value={addrForm.contact} onChange={e => setAddrForm(f => ({ ...f, contact: e.target.value }))} /></div>
                                                        <div><label className={labelCls}>জেলা / শহর *</label><input className={inputCls} placeholder="যেমন: ঢাকা" value={addrForm.district} onChange={e => setAddrForm(f => ({ ...f, district: e.target.value }))} /></div>
                                                        <div><label className={labelCls}>এলাকা / থানা *</label><input className={inputCls} placeholder="যেমন: গুলশান" value={addrForm.area} onChange={e => setAddrForm(f => ({ ...f, area: e.target.value }))} /></div>
                                                    </div>
                                                    <div><label className={labelCls}>বিস্তারিত ঠিকানা *</label><textarea className={`${inputCls} resize-none`} rows={2} placeholder="বাড়ি / ভবন / ল্যান্ডমার্ক" value={addrForm.address} onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))} /></div>
                                                    <button disabled={isProcessing} onClick={handleSaveAddress} className="w-full bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest py-3 rounded-sm hover:bg-black transition-colors disabled:opacity-50">
                                                        {isProcessing ? 'সংরক্ষণ হচ্ছে…' : 'ঠিকানা সংরক্ষণ করুন'}
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <button onClick={() => setShowNewAddressForm(true)} className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#534AB7] hover:underline">
                                                <Plus className="w-3.5 h-3.5" /> নতুন ঠিকানা যোগ করুন
                                            </button>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-8 h-8 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7]"><CreditCard className="w-4 h-4" /></div>
                                        <h2 className="text-lg font-serif font-bold text-gray-900">পেমেন্ট পদ্ধতি</h2>
                                    </div>
                                    <label className="flex items-center gap-3 p-4 border border-[#534AB7] bg-[#534AB7]/5 rounded-sm cursor-pointer">
                                        <div className="w-4 h-4 rounded-full border border-[#534AB7] flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-[#534AB7]" /></div>
                                        <div><p className="text-sm font-bold text-gray-800">ক্যাশ অন ডেলিভারি</p><p className="text-xs text-gray-500 mt-0.5">দরজায় পৌঁছে দেওয়ার সময় পেমেন্ট করুন।</p></div>
                                    </label>
                                    <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> ডিজিটাল পেমেন্ট শীঘ্রই আসছে।</p>
                                </div>
                            </>
                        )}

                        {/* PATH B/C: Guest */}
                        {!user && (
                            <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm space-y-5">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#534AB7] mb-4">আপনার তথ্য</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="sm:col-span-2"><label className={labelCls}>আপনার পূর্ণ নাম *</label><input className={inputCls} placeholder="আপনার পূর্ণ নাম" value={guestForm.fullName} onChange={e => { setGuestForm(f => ({...f, fullName: e.target.value})); setGuestError(''); }} /></div>
                                        <div><label className={labelCls}>মোবাইল নম্বর *</label><input className={inputCls} type="tel" placeholder="01XXXXXXXXX" value={guestForm.phone} onChange={e => { setGuestForm(f => ({...f, phone: e.target.value})); setGuestError(''); }} /></div>
                                        <div><label className={labelCls}>ইমেইল ঠিকানা *</label><input className={inputCls} type="email" placeholder="you@email.com" value={guestForm.email} onChange={e => { setGuestForm(f => ({...f, email: e.target.value})); setGuestError(''); }} /></div>
                                        <div className="sm:col-span-2">
                                            <label className={labelCls}>পাসওয়ার্ড *</label>
                                            <div className="relative">
                                                <input className={`${inputCls} pr-10`} type={showPassword ? 'text' : 'password'} placeholder="নতুন অ্যাকাউন্টের জন্য পাসওয়ার্ড সেট করুন" value={guestForm.password} onChange={e => { setGuestForm(f => ({...f, password: e.target.value})); setGuestError(''); }} />
                                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">অর্ডারের পরে স্বয়ংক্রিয়ভাবে আপনার অ্যাকাউন্ট তৈরি হবে।</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100" />
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#534AB7] mb-4">ডেলিভারি ঠিকানা</p>
                                    <div className="mb-3">
                                        <label className={labelCls}>ঠিকানার ধরন</label>
                                        <div className="flex gap-2">
                                            {(['Home', 'Office'] as const).map(l => (
                                                <button key={l} type="button" onClick={() => setGuestForm(f => ({...f, addressLabel: l}))}
                                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all ${guestForm.addressLabel === l ? 'bg-[#534AB7] text-white border-[#534AB7]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#534AB7]/40'}`}>
                                                    {l === 'Home' ? <Home className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />} {l === 'Home' ? 'বাসা' : 'অফিস'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div><label className={labelCls}>জেলা / শহর *</label><input className={inputCls} placeholder="যেমন: ঢাকা" value={guestForm.district} onChange={e => { setGuestForm(f => ({...f, district: e.target.value})); setGuestError(''); }} /></div>
                                        <div><label className={labelCls}>এলাকা / থানা *</label><input className={inputCls} placeholder="যেমন: মিরপুর" value={guestForm.area} onChange={e => { setGuestForm(f => ({...f, area: e.target.value})); setGuestError(''); }} /></div>
                                        <div className="sm:col-span-2"><label className={labelCls}>বিস্তারিত ঠিকানা *</label><textarea className={`${inputCls} resize-none`} rows={3} placeholder="বাড়ি নং / রোড / ভবন / ফ্লোর / ল্যান্ডমার্ক…" value={guestForm.addressDetail} onChange={e => { setGuestForm(f => ({...f, addressDetail: e.target.value})); setGuestError(''); }} /></div>
                                    </div>
                                </div>
                                <div className="h-px bg-gray-100" />
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#534AB7] mb-3">পেমেন্ট পদ্ধতি</p>
                                    <label className="flex items-center gap-3 p-4 border border-[#534AB7] bg-[#534AB7]/5 rounded-sm cursor-pointer">
                                        <div className="w-4 h-4 rounded-full border border-[#534AB7] flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-[#534AB7]" /></div>
                                        <div><p className="text-sm font-bold text-gray-800">ক্যাশ অন ডেলিভারি</p><p className="text-xs text-gray-500 mt-0.5">দরজায় পৌঁছে দেওয়ার সময় পেমেন্ট করুন।</p></div>
                                    </label>
                                </div>
                                {guestError && (
                                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-sm">
                                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-red-600 font-bold">{guestError}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT: অর্ডার বিবরণ */}
                    <div className="w-full lg:w-[400px] shrink-0">
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm sticky top-[100px]">
                            <h2 className="text-lg font-serif font-bold text-gray-900 mb-6">অর্ডার বিবরণ</h2>

                            {/* Cart items */}
                            <div className="max-h-[300px] overflow-y-auto pr-1 space-y-4 mb-6">
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
                                                    {item.size && item.size !== 'Standard' && <span className="text-[9px] text-gray-400">সাইজ: {item.size}</span>}
                                                    {item.color && item.color !== 'Default' && <span className="text-[9px] text-gray-400">রঙ: {item.color}</span>}
                                                </div>
                                                <p className="text-[10px] text-gray-500 mt-1">পরিমাণ {item.quantity || 1}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-gray-900">৳{(item.price * (item.quantity || 1)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Coupon Input */}
                            <div className="mb-5">
                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-sm">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5 text-green-600" />
                                            <span className="text-xs font-bold text-green-700 font-mono tracking-wider">{appliedCoupon.code}</span>
                                            <span className="text-[10px] text-green-600">প্রয়োগ হয়েছে</span>
                                        </div>
                                        <button onClick={removeCoupon} className="text-green-600 hover:text-red-500 transition">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex gap-2">
                                            <input
                                                className={`${inputCls} flex-1`}
                                                placeholder="কুপন কোড লিখুন"
                                                value={couponInput}
                                                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                                                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={couponLoading}
                                                className="px-3 py-2 bg-[#534AB7] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#3d3599] transition disabled:opacity-60 whitespace-nowrap flex items-center gap-1"
                                            >
                                                {couponLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                                                Apply
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 shrink-0" /> {couponError}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="space-y-3 border-t border-gray-100 pt-5">
                                <div className="flex justify-between text-xs text-gray-600"><span>সাবটোটাল</span><span className="font-bold text-gray-900">৳{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-xs text-gray-600">
                                    <span>শিপিং</span>
                                    <span className="font-bold text-green-600">{shipping === 0 ? 'ফ্রি' : `৳${shipping}`}</span>
                                </div>
                                {shipping > 0 && <p className="text-[10px] text-gray-400">৳৯৯৯-এর বেশি অর্ডারে ফ্রি শিপিং</p>}
                                {appliedCoupon && (
                                    <div className="flex justify-between text-xs text-green-600">
                                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> ছাড় ({appliedCoupon.code})</span>
                                        <span className="font-bold">−৳{appliedCoupon.discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="h-px bg-gray-200 my-2" />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-900">সর্বমোট মূল্য</span>
                                    <span className="text-xl font-extrabold text-[#534AB7]">৳{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button onClick={user ? handleLoggedInOrder : handleGuestOrder} disabled={isProcessing}
                                className="w-full mt-8 bg-[#2C2C2A] text-white py-4 rounded-sm text-[10px] font-extrabold uppercase tracking-widest hover:bg-black transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-black/10">
                                {isProcessing ? 'প্রক্রিয়া হচ্ছে…' : user ? 'অর্ডার করুন' : 'অর্ডার করুন ও অ্যাকাউন্ট তৈরি করুন'}
                            </button>
                            <p className="text-center text-[9px] text-gray-400 mt-4 px-4">অর্ডার করার মাধ্যমে আপনি Eloria-এর গোপনীয়তা নীতি ও ব্যবহারের শর্তে সম্মত হচ্ছেন।</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}