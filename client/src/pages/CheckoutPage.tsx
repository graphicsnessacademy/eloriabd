/**
 * CheckoutPage.tsx
 * Unified checkout — Path A (logged-in), Path B (new guest), Path C (OTP bridge)
 * Features: Standardized Name, BD Phone Validation, Linked District-Area Dropdowns
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
import { useSiteConfig } from '../context/SiteConfigContext';
import { districts } from '../utils/districts';

// --- DATA: DISTRICT TO AREA MAPPING ---
const AREA_DATA: Record<string, string[]> = {
    "ঢাকা": ["মিরপুর", "গুলশান", "বনানী", "ধানমন্ডি", "উত্তরা", "মোহাম্মদপুর", "সাভার", "কেরানীগঞ্জ", "টঙ্গী", "গাজীপুর সদর"],
    "চট্টগ্রাম": ["পতেঙ্গা", "পাঁচলাইশ", "হালিশহর", "খুলশী", "বাকলিয়া", "কোতোয়ালী"],
    "সিলেট": ["জিন্দাবাজার", "উপশহর", "অম্বোরখানা", "দক্ষিণ সুরমা", "শাহপরান"],
    "রাজশাহী": ["বোয়ালিয়া", "মতিহার", "রাজপাড়া", "শাহ মখদুম"],
    "খুলনা": ["খালিশপুর", "দৌলতপুর", "সোনাডাঙ্গা", "খান জাহান আলী"],
    "বরিশাল": ["সদর", "কাউনিয়া", "বন্দর"],
    "রংপুর": ["সদর", "কাউনিয়া", "মিঠাপুকুর"],
    "নারায়ণগঞ্জ": ["ফতুল্লা", "সিদ্ধিরগঞ্জ", "চাষাড়া", "আড়াইহাজার"],
    "কুমিল্লা": ["সদর", "সদর দক্ষিণ", "চৌদ্দগ্রাম", "লাকসাম"]
};

// --- HELPERS ---
const formatName = (name: string) => {
    return name.toLowerCase().trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};
const isValidBDPhone = (phone: string) => /^01[3-9]\d{8}$/.test(phone);
const isValidEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

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
    const { config } = useSiteConfig();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('checkout');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successOrder, setSuccessOrder] = useState<any>(null);

    // Guest states
    const [guestForm, setGuestForm] = useState({
        fullName: '', phone: '', email: '', password: '',
        addressLabel: 'Home' as 'Home' | 'Office',
        district: '', area: '', addressDetail: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [guestError, setGuestError] = useState('');

    // OTP states
    const [sessionId, setSessionId] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Totals
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const subtotal = cart.reduce((s: number, i: any) => s + i.price * (i.quantity || 1), 0);
    const shipping = subtotal > (config?.freeShippingThreshold || 2000) ? 0 : 60;
    const total = subtotal + shipping - (appliedCoupon?.discountAmount || 0);

    useEffect(() => {
        if (cart.length === 0 && step === 'checkout') navigate('/shop');
    }, [cart, navigate, step]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // ── MAIN GUEST ORDER LOGIC ──
    const handleGuestOrder = async () => {
        const { fullName, phone, email, password, district, area, addressDetail } = guestForm;

        // Validation
        if (!fullName || !phone || !email || !password || !district || !area || !addressDetail) {
            setGuestError('সবগুলো তারকাচিহ্নিত (*) ঘর পূরণ করুন।'); return;
        }
        if (!isValidBDPhone(phone)) {
            setGuestError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।'); return;
        }
        if (!isValidEmail(email)) {
            setGuestError('একটি সঠিক ইমেইল ঠিকানা দিন।'); return;
        }

        setGuestError('');
        setIsProcessing(true);

        try {
            const res = await fetch(`${API_URL}/api/hybrid-checkout/place-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...guestForm,
                    fullName: formatName(fullName), // Standardize name case
                    cart,
                    totalAmount: total,
                    couponCode: appliedCoupon?.code,
                    couponDiscount: appliedCoupon?.discountAmount
                })
            });
            const data = await res.json();

            if (!res.ok) { setGuestError(data.message); return; }

            if (data.status === 'created' || data.status === 'logged_in') {
                loginSync(data); clearCart(); setSuccessOrder(data.order); setStep('success');
            } else if (data.status === 'otp_required') {
                // Email matches but password was wrong -> Trigger OTP
                setSessionId(data.sessionId);
                setMaskedEmail(data.maskedPhone);
                setResendCooldown(60);
                setStep('otp');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch { setGuestError('সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।'); }
        finally { setIsProcessing(false); }
    };

    // ── OTP VERIFICATION ──
    const handleVerifyOtp = async () => {
        const otp = otpDigits.join('');
        if (otp.length < 6) return setOtpError('৬ সংখ্যার কোডটি সম্পূর্ণ করুন।');
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/api/hybrid-checkout/verify-otp`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, otp })
            });
            const data = await res.json();
            if (!res.ok) { setOtpError(data.message); return; }
            loginSync(data); clearCart(); setSuccessOrder(data.order); setStep('success');
        } catch { setOtpError('নেটওয়ার্ক ত্রুটি।'); }
        finally { setIsProcessing(false); }
    };

    const handleOtpChange = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otpDigits]; next[idx] = val; setOtpDigits(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    // --- UI STEPS ---
    if (step === 'success') return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-2 text-gray-900">অর্ডার সম্পন্ন হয়েছে!</h1>
            <p className="text-gray-500 mb-8 max-w-sm">বিস্তারিত তথ্য আপনার ইমেইলে পাঠানো হয়েছে।</p>
            <Link to="/shop" className="bg-[#534AB7] text-white px-10 py-3 rounded-full font-bold uppercase tracking-widest text-xs">অব্যাহত রাখুন</Link>
        </div>
    );

    if (step === 'otp') return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 pt-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-sm shadow-xl max-w-sm w-full text-center">
                <ShieldCheck className="w-12 h-12 text-[#534AB7] mx-auto mb-4" />
                <h2 className="text-xl font-serif font-bold mb-2">Security Verification</h2>
                <p className="text-xs text-gray-500 mb-1">আপনার ইমেইল ঠিকানায় একটি কোড পাঠানো হয়েছে</p>
                <p className="text-sm font-bold text-gray-800 mb-6">{maskedEmail}</p>

                <div className="flex gap-2 justify-center mb-6">
                    {otpDigits.map((d, i) => (

                        <input key={i} ref={el => { otpRefs.current[i] = el }} type="text" maxLength={1} value={d}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => e.key === 'Backspace' && !otpDigits[i] && i > 0 && otpRefs.current[i - 1]?.focus()}
                            className="w-10 h-12 border border-gray-200 text-center text-lg font-bold focus:border-[#534AB7] focus:outline-none" />
                    ))}
                </div>
                {otpError && <p className="text-xs text-red-500 mb-4 font-bold">{otpError}</p>}
                <button onClick={handleVerifyOtp} disabled={isProcessing} className="w-full bg-[#2C2C2A] text-white py-4 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all">
                    {isProcessing ? 'যাচাই হচ্ছে...' : 'যাচাই করুন ও অর্ডার দিন'}
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className="pt-24 pb-20 min-h-screen bg-[#fafafa]">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 items-start">

                    {/* LEFT: FORM */}
                    <div className="w-full lg:flex-1 space-y-6">
                        <section className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                            <h2 className="text-2xl font-serif font-bold mb-6 text-gray-900">Checkout Information</h2>

                            <div className="space-y-5">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] border-b pb-2">Customer Info</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>আপনার পূর্ণ নাম *</label>
                                        <input className={inputCls} placeholder="উদা: আহসান হাবীব" value={guestForm.fullName} onChange={e => setGuestForm({ ...guestForm, fullName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>মোবাইল নম্বর *</label>
                                        <input className={inputCls} placeholder="017XXXXXXXX" value={guestForm.phone} onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>ইমেইল ঠিকানা *</label>
                                        <input className={inputCls} placeholder="example@mail.com" value={guestForm.email} onChange={e => setGuestForm({ ...guestForm, email: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>পাসওয়ার্ড *</label>
                                        <div className="relative">
                                            <input className={inputCls} type={showPassword ? 'text' : 'password'} placeholder="Account Password" value={guestForm.password} onChange={e => setGuestForm({ ...guestForm, password: e.target.value })} />
                                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] border-b pb-2 pt-4">Delivery Address</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>জেলা *</label>
                                        <select className={inputCls} value={guestForm.district} onChange={e => setGuestForm({ ...guestForm, district: e.target.value, area: '' })}>
                                            <option value="">নির্বাচন করুন</option>
                                            {districts.map(d => <option key={d.bn} value={d.bn}>{d.bn}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelCls}>এলাকা *</label>
                                        <select className={inputCls} value={guestForm.area} disabled={!guestForm.district} onChange={e => setGuestForm({ ...guestForm, area: e.target.value })}>
                                            <option value="">নির্বাচন করুন</option>
                                            {guestForm.district && (AREA_DATA[guestForm.district] || ["সদর"]).map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>বিস্তারিত ঠিকানা *</label>
                                        <textarea className={`${inputCls} h-20 resize-none`} placeholder="বাড়ি নম্বর, রোড নম্বর বা ল্যান্ডমার্ক..." value={guestForm.addressDetail} onChange={e => setGuestForm({ ...guestForm, addressDetail: e.target.value })} />
                                    </div>
                                </div>

                                {guestError && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
                                        <AlertCircle size={14} /> {guestError}
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7]"><CreditCard className="w-4 h-4" /></div>
                                <h2 className="text-lg font-serif font-bold text-gray-900">পেমেন্ট পদ্ধতি</h2>
                            </div>
                            <label className="flex items-center gap-3 p-4 border border-[#534AB7] bg-[#534AB7]/5 rounded-sm cursor-pointer">
                                <div className="w-4 h-4 rounded-full border border-[#534AB7] flex items-center justify-center shrink-0"><div className="w-2 h-2 rounded-full bg-[#534AB7]" /></div>
                                <div><p className="text-sm font-bold text-gray-800">ক্যাশ অন ডেলিভারি</p><p className="text-xs text-gray-500 mt-0.5">পন্য হাতে পেয়ে পেমেন্ট করুন।</p></div>
                            </label>
                            <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> ডিজিটাল পেমেন্ট শীঘ্রই আসছে।</p>

                        </section>
                    </div>

                    {/* RIGHT: SUMMARY */}
                    <div className="w-full lg:w-[400px]">
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-lg sticky top-28">
                            <h2 className="text-xl font-serif font-bold mb-6">Order Summary</h2>
                            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                                {cart.map((item: any, idx: number) => (
                                    <div key={idx} className="flex gap-4">
                                        <img src={item.image} className="w-14 h-14 object-cover rounded-sm border" alt="" />
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold uppercase text-gray-800 truncate">{item.name}</p>
                                            <p className="text-[10px] text-gray-400">Qty: {item.quantity} | Size: {item.size}</p>
                                        </div>
                                        <p className="text-xs font-bold">৳{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                                <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `৳${shipping}`}</span></div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
                                    <span>Total</span><span className="text-[#534AB7]">৳{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <button onClick={handleGuestOrder} disabled={isProcessing} className="w-full mt-8 bg-[#2C2C2A] text-white py-4 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10">
                                {isProcessing ? 'Processing...' : 'Confirm Order'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}