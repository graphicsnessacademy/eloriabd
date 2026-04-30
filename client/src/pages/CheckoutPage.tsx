/**
 * CheckoutPage.tsx
 * CHANGES:
 * 1. Order Summary: quantity +/- controls and remove (×) button per item
 * 2. Coupon: visible input + Apply button — discount shown live in totals
 * 3. Address: 3-level dropdown — District → Thana (Elaka) → Area
 * 4. Shipping: FREE only for সিলেট district + সিলেট সদর thana. Otherwise ৳60.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, ShieldCheck, CheckCircle,
    Eye, EyeOff, AlertCircle, Tag,
    Plus, Minus, X, Trash2
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { districts } from '../utils/districts';

// ─── 3-LEVEL LOCATION DATA ────────────────────────────────────────────────────
// Structure: District → Thana/Elaka → Areas[]
// Sylhet is fully detailed (free shipping zone).
// Other major districts have representative data.
const LOCATION_DATA: Record<string, Record<string, string[]>> = {
    "সিলেট": {
        "সিলেট সদর":    ["জিন্দাবাজার", "আম্বরখানা", "উপশহর", "মিরাবাজার", "বন্দরবাজার", "কুমারপাড়া", "তালতলা", "সোবহানীঘাট", "শিবগঞ্জ", "কদমতলী", "মজুমদারী", "হাওলাদারপাড়া", "শাহজালাল উপশহর", "টিলাগড়", "পাঠানটুলা", "লামাবাজার", "দরগাহ গেট", "শাহী ঈদগাহ"],
        "বিয়ানীবাজার": ["বিয়ানীবাজার সদর", "মাথিউরা", "লাউতা", "শেওলা", "মুড়িয়া"],
        "গোলাপগঞ্জ":    ["গোলাপগঞ্জ সদর", "ঢাকাদক্ষিণ", "ফুলবাড়ি", "লক্ষণাবন্দ", "বাঘা"],
        "জকিগঞ্জ":      ["জকিগঞ্জ সদর", "বারঠাকুরী", "কসবা", "সুলতানপুর"],
        "কানাইঘাট":     ["কানাইঘাট সদর", "দিঘীরপার", "লক্ষীপ্রসাদ", "চতুল"],
        "কোম্পানীগঞ্জ": ["কোম্পানীগঞ্জ সদর", "ইসলামপুর পশ্চিম", "ইসলামপুর পূর্ব"],
        "বিশ্বনাথ":     ["বিশ্বনাথ সদর", "দৌলতপুর", "লামাকাজী", "দেওকলস"],
        "ওসমানীনগর":    ["ওসমানীনগর সদর", "দয়ামীর", "পাঁচগাঁও", "তাজপুর"],
        "ফেঞ্চুগঞ্জ":   ["ফেঞ্চুগঞ্জ সদর", "উত্তর ফেঞ্চুগঞ্জ", "দক্ষিণ ফেঞ্চুগঞ্জ"],
        "বালাগঞ্জ":     ["বালাগঞ্জ সদর", "দেওয়ানবাজার", "পূর্ব পৈলনপুর", "বোয়ালজুর"],
        "দক্ষিণ সুরমা":  ["শিলাম", "মোগলাবাজার", "কুচাই", "লালাবাজার"],
        "গোয়াইনঘাট":    ["গোয়াইনঘাট সদর", "রুস্তমপুর", "পশ্চিম জাফলং", "পূর্ব জাফলং"]
    },
    "ঢাকা": {
        "মিরপুর":      ["মিরপুর-১", "মিরপুর-২", "মিরপুর-১০", "মিরপুর-১২", "মিরপুর-১৪", "কাজীপাড়া", "শেওড়াপাড়া", "পল্লবী"],
        "গুলশান":      ["গুলশান-১", "গুলশান-২", "বারিধারা", "নিকুঞ্জ-১", "নিকুঞ্জ-২", "বসুন্ধরা"],
        "ধানমন্ডি":    ["ধানমন্ডি-১", "ধানমন্ডি-২", "ধানমন্ডি-৭", "ধানমন্ডি-১৫", "ধানমন্ডি-২৭", "কলাবাগান", "জিগাতলা"],
        "উত্তরা":      ["উত্তরা-১", "উত্তরা-৩", "উত্তরা-৪", "উত্তরা-৬", "উত্তরা-১০", "উত্তরা-১১", "উত্তরা-১২"],
        "মোহাম্মদপুর": ["মোহাম্মদপুর বাসস্ট্যান্ড", "আদাবর", "শ্যামলী", "রিং রোড", "বাশবাড়ি"],
        "বনানী":       ["বনানী-১", "বনানী-১১", "বনানী-১৭", "কাকলী"],
        "পল্টন":       ["মতিঝিল", "পল্টন", "আরামবাগ", "ফকিরাপুল", "দিলকুশা"],
        "লালবাগ":      ["লালবাগ", "আজিমপুর", "হাজারীবাগ", "কামরাঙ্গীরচর"],
        "সাভার":       ["সাভার সদর", "আশুলিয়া", "ধামরাই", "হেমায়েতপুর"],
        "কেরানীগঞ্জ":  ["কেরানীগঞ্জ সদর", "জিঞ্জিরা", "আটিবাজার", "বাস্তা"],
        "ডেমরা":       ["ডেমরা", "শ্যামপুর", "মাতুয়াইল", "সারুলিয়া"],
        "রামপুরা":     ["রামপুরা", "বনশ্রী", "মেরুল বাড্ডা", "ত্রিমোহনী"]
    },
    "চট্টগ্রাম": {
        "পাঁচলাইশ":    ["পাঁচলাইশ", "খুলশী", "চকবাজার", "আন্দরকিল্লা", "ওয়াসা"],
        "হালিশহর":     ["হালিশহর", "পতেঙ্গা", "বন্দর", "আগ্রাবাদ", "নিউমুরিং"],
        "কোতোয়ালী":   ["রহমতগঞ্জ", "ফিরিঙ্গিবাজার", "পাথরঘাটা", "বক্শিরহাট"],
        "বাকলিয়া":    ["বাকলিয়া", "বায়েজিদ বোস্তামী", "চান্দগাঁও", "শুলকবহর"],
        "ডবলমুরিং":   ["ডবলমুরিং", "আকবরশাহ", "পশ্চিম মাদারবাড়ি", "শুলকবহর"],
        "সীতাকুণ্ড":   ["সীতাকুণ্ড সদর", "ভাটিয়ারী", "কুমিরা", "বারআউলিয়া"],
        "মীরসরাই":     ["মীরসরাই সদর", "জোরারগঞ্জ", "করেরহাট", "ওয়াহেদপুর"],
        "হাটহাজারী":   ["হাটহাজারী সদর", "গড়দুয়ারা", "ফরহাদাবাদ", "মেখল"],
        "বোয়ালখালী":  ["বোয়ালখালী সদর", "সারোয়াতলী", "কধুরখীল"]
    },
    "রাজশাহী": {
        "বোয়ালিয়া":   ["সাহেব বাজার", "রেলগেট", "নওদাপাড়া", "কাজলা", "বিনোদপুর"],
        "মতিহার":      ["মতিহার", "বিনোদপুর", "রাজশাহী বিশ্ববিদ্যালয়", "কাটাখালী"],
        "রাজপাড়া":    ["রাজপাড়া", "লক্ষ্মীপুর", "তেরখাদিয়া"],
        "শাহ মখদুম":   ["শাহ মখদুম", "দাসুড়িয়া", "হরিয়ান"],
        "পবা":         ["নওহাটা", "পারিলা", "হরিপুর", "বায়া"],
        "গোদাগাড়ী":   ["গোদাগাড়ী সদর", "মোহনপুর", "রিশিকুল", "চাঁপাই"],
        "তানোর":       ["তানোর সদর", "মুন্ডুমালা", "গোকুল-মথুরা", "কামারগাঁ"]
    },
    "খুলনা": {
        "খালিশপুর":    ["খালিশপুর", "দৌলতপুর", "বয়রা", "হাজীরহাট"],
        "সোনাডাঙ্গা":  ["সোনাডাঙ্গা", "নিউমার্কেট", "ময়লাপোতা", "মিস্ত্রীপাড়া"],
        "কোতোয়ালী":   ["কোতোয়ালী", "লবণচরা", "মিরেরডাঙ্গা", "রায়েরমহল"],
        "বটিয়াঘাটা":  ["বটিয়াঘাটা সদর", "জলমা", "সুরখালী", "বালিয়াডাঙ্গা"],
        "ডুমুরিয়া":   ["ডুমুরিয়া সদর", "মাগুরা", "শোভনা", "রুদাঘরা"],
        "ফুলতলা":     ["ফুলতলা সদর", "আটরা", "দামোদর", "জামিরা"]
    },
    "বরিশাল": {
        "কোতোয়ালী":   ["নতুল্লাবাদ", "বগুড়া রোড", "বন্দর রোড", "সদর রোড", "হেমায়েতপুর"],
        "বন্দর":       ["চাঁদমারী", "চরমোনাই", "রসুলপুর"],
        "কাউনিয়া":    ["কাউনিয়া সদর", "চরকাউয়া", "বাথা"],
        "বাকেরগঞ্জ":   ["বাকেরগঞ্জ সদর", "গারুরিয়া", "দাড়িয়াল", "রঙ্গশ্রী"],
        "উজিরপুর":    ["উজিরপুর সদর", "গুঠিয়া", "বামরাইল", "শিকারপুর"]
    },
    "রংপুর": {
        "রংপুর সদর":   ["মাহিগঞ্জ", "সদর", "রংপুর শহর", "পায়রাবন্দ", "হরিদেবপুর"],
        "কাউনিয়া":    ["কাউনিয়া সদর", "সাহেবগঞ্জ", "হারাগাছ"],
        "মিঠাপুকুর":  ["মিঠাপুকুর সদর", "বড়বালা", "ময়েনপুর", "ভেন্ডাবাড়ি"],
        "গঙ্গাচড়া":   ["গঙ্গাচড়া সদর", "বেতগাড়ী", "লক্ষ্মীটারী"],
        "তারাগঞ্জ":    ["তারাগঞ্জ সদর", "ইকরচালী", "আলমবিদিতর"],
        "পীরগাছা":    ["পীরগাছা সদর", "মদনখালী", "কান্দি", "তাম্বুলপুর"]
    },
    "ময়মনসিংহ": {
        "ময়মনসিংহ সদর": ["নতুনবাজার", "সানকিপাড়া", "মাসকান্দা", "আকুয়া", "চরপাড়া"],
        "ভালুকা":     ["ভালুকা সদর", "ধিতপুর", "রাজৈ", "উথুরা"],
        "ত্রিশাল":    ["ত্রিশাল সদর", "কানিহারী", "রামপুর", "সাখুয়া"],
        "মুক্তাগাছা":  ["মুক্তাগাছা সদর", "কুমারগাতা", "বাজিতপুর", "তারাটি"],
        "গফরগাঁও":    ["গফরগাঁও সদর", "পাঁচবাগ", "নিগুয়ারী", "টোক"]
    },
    "কুমিল্লা": {
        "কুমিল্লা সদর":   ["ক্যান্টনমেন্ট", "ঝাউতলা", "মোগলটুলী", "থানারপাড়", "চকবাজার"],
        "সদর দক্ষিণ":  ["বিজয়পুর", "জগন্নাথপুর", "পেরুল", "গালিমপুর"],
        "চৌদ্দগ্রাম":  ["চৌদ্দগ্রাম সদর", "গুণবতী", "শুভপুর", "আলকরা"],
        "লাকসাম":     ["লাকসাম সদর", "উত্তর লাকসাম", "লাকসাম পূর্ব", "আজগরা"],
        "মুরাদনগর":   ["মুরাদনগর সদর", "টনকী", "পূর্বধইর", "বাঙ্গরা"],
        "দেবীদ্বার":   ["দেবীদ্বার সদর", "ধামতী", "সুবিল", "রাজামেহার"]
    },
    "নারায়ণগঞ্জ": {
        "ফতুল্লা":    ["ফতুল্লা", "কাশীপুর", "গোদনাইল", "এনায়েতনগর"],
        "সিদ্ধিরগঞ্জ": ["সিদ্ধিরগঞ্জ", "মিজমিজি", "আদমজীনগর"],
        "চাষাড়া":    ["চাষাড়া", "তোলারাম কলেজ এলাকা", "নিতাইগঞ্জ"],
        "আড়াইহাজার":  ["আড়াইহাজার সদর", "গোপালদী", "বরপা", "ব্রাহ্মণদী"],
        "রূপগঞ্জ":    ["রূপগঞ্জ সদর", "তারাব", "ভুলতা", "মুড়াপাড়া"]
    },
    "গাজীপুর": {
        "গাজীপুর সদর":  ["জয়দেবপুর", "চান্দনা চৌরাস্তা", "বাসন", "কোনাবাড়ি", "ভোগড়া"],
        "কালীগঞ্জ":   ["কালীগঞ্জ সদর", "নাগরী", "বক্তারপুর", "মোক্তারপুর"],
        "টঙ্গী":      ["টঙ্গী পূর্ব", "টঙ্গী পশ্চিম", "এরুলিয়া", "আজমপুর"],
        "শ্রীপুর":    ["শ্রীপুর সদর", "তেলিহাটি", "রাজাবাড়ি", "মাওনা"],
        "কাপাসিয়া":  ["কাপাসিয়া সদর", "ঘাগটিয়া", "সিংহাশ্রী", "চন্দন বাইদ"]
    }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const formatName = (name: string) =>
    name.toLowerCase().trim().split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const isValidBDPhone = (phone: string) => /^01[3-9]\d{8}$/.test(phone);
const isValidEmail   = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const API_URL  = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const inputCls = 'w-full border border-gray-200 rounded-sm px-3 py-2.5 text-xs text-gray-800 placeholder-gray-300 focus:outline-none focus:border-[#534AB7] transition-colors bg-white font-sans';
const labelCls = 'block text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1.5 font-sans';

type Step = 'checkout' | 'otp' | 'success';

export default function CheckoutPage() {
    const { user, cart, clearCart, updateCartQuantity, removeFromCart, loginSync } = useStore();
    const { config } = useSiteConfig();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('checkout');
    const [isProcessing, setIsProcessing] = useState(false);
    const [successOrder, setSuccessOrder] = useState<any>(null);

    // Guest form — added `thana` for the 3rd level
    const [guestForm, setGuestForm] = useState({
        fullName:      '',
        phone:         '',
        email:         '',
        password:      '',
        addressLabel:  'Home' as 'Home' | 'Office',
        district:      '',
        thana:         '',    // Level 2: Elaka / Thana
        area:          '',    // Level 3: Specific area
        addressDetail: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [guestError, setGuestError]     = useState('');

    // OTP states
    const [sessionId, setSessionId]       = useState('');
    const [maskedEmail, setMaskedEmail]   = useState('');
    const [otpDigits, setOtpDigits]       = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError]         = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Coupon states
    const [couponInput, setCouponInput]   = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError]   = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

    // ── Derived location lists ────────────────────────────────────────────────
    const thanaList = guestForm.district
        ? Object.keys(LOCATION_DATA[guestForm.district] || {})
        : [];

    const areaList = guestForm.district && guestForm.thana
        ? (LOCATION_DATA[guestForm.district]?.[guestForm.thana] || [])
        : [];

    // ── Shipping logic ────────────────────────────────────────────────────────
    // FREE only for সিলেট district + সিলেট সদর thana
    // Otherwise: free if subtotal exceeds threshold, else ৳60
    const subtotal = cart.reduce((s: number, i: any) => s + i.price * (i.quantity || 1), 0);
    const isSylhetSadar = guestForm.district === 'সিলেট' && guestForm.thana === 'সিলেট সদর';
    const shipping = isSylhetSadar
        ? 0
        : subtotal > (config?.freeShippingThreshold || 2000) ? 0 : 60;
    const couponDiscount = appliedCoupon?.discountAmount || 0;
    const total = subtotal + shipping - couponDiscount;

    useEffect(() => {
        if (cart.length === 0 && step === 'checkout') navigate('/shop');
    }, [cart, navigate, step]);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    // Reset thana + area when district changes
    const handleDistrictChange = (val: string) => {
        setGuestForm(f => ({ ...f, district: val, thana: '', area: '' }));
    };
    const handleThanaChange = (val: string) => {
        setGuestForm(f => ({ ...f, thana: val, area: '' }));
    };

    // ── Coupon apply ──────────────────────────────────────────────────────────
    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponError('');
        setCouponLoading(true);
        try {
            const token = localStorage.getItem('eloria_token');
            const res = await fetch(`${API_URL}/api/coupons/validate`, {
                method:  'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ code: couponInput.trim(), orderTotal: subtotal, userId: user?._id })
            });
            const data = await res.json();
            if (!res.ok) {
                setCouponError(data.message || 'কুপন কোড অবৈধ।');
                setAppliedCoupon(null);
            } else {
                setAppliedCoupon(data); // { code, discountAmount, ... }
                setCouponError('');
            }
        } catch {
            setCouponError('সার্ভারে সমস্যা হয়েছে।');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('');
    };

    // ── Main order submit ─────────────────────────────────────────────────────
    const handleGuestOrder = async () => {
        const { fullName, phone, email, password, district, thana, area, addressDetail } = guestForm;

        if (!fullName || !phone || !email || !password || !district || !thana || !area || !addressDetail) {
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
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...guestForm,
                    fullName: formatName(fullName),
                    cart,
                    totalAmount:    total,
                    couponCode:     appliedCoupon?.code,
                    couponDiscount: couponDiscount
                })
            });
            const data = await res.json();

            if (!res.ok) { setGuestError(data.message); return; }

            if (data.status === 'created' || data.status === 'logged_in') {
                loginSync(data); clearCart(); setSuccessOrder(data.order); setStep('success');
            } else if (data.status === 'otp_required') {
                setSessionId(data.sessionId);
                setMaskedEmail(data.maskedPhone);
                setResendCooldown(60);
                setStep('otp');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch {
            setGuestError('সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── OTP verification ──────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        const otp = otpDigits.join('');
        if (otp.length < 6) return setOtpError('৬ সংখ্যার কোডটি সম্পূর্ণ করুন।');
        setIsProcessing(true);
        try {
            const res = await fetch(`${API_URL}/api/hybrid-checkout/verify-otp`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ sessionId, otp })
            });
            const data = await res.json();
            if (!res.ok) { setOtpError(data.message); return; }
            loginSync(data); clearCart(); setSuccessOrder(data.order); setStep('success');
        } catch {
            setOtpError('নেটওয়ার্ক ত্রুটি।');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleOtpChange = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otpDigits]; next[idx] = val; setOtpDigits(next);
        if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (step === 'success') return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-2 text-gray-900">অর্ডার সম্পন্ন হয়েছে!</h1>
            <p className="text-gray-500 mb-2 max-w-sm">আপনার অর্ডার নম্বর:</p>
            <p className="text-[#534AB7] font-mono font-bold text-lg mb-6">
                {successOrder?.orderNumber || '—'}
            </p>
            <p className="text-gray-400 text-sm mb-8">বিস্তারিত তথ্য আপনার ইমেইলে পাঠানো হয়েছে।</p>
            <Link to="/shop" className="bg-[#534AB7] text-white px-10 py-3 rounded-full font-bold uppercase tracking-widest text-xs">
                অব্যাহত রাখুন
            </Link>
        </div>
    );

    // ── OTP screen ────────────────────────────────────────────────────────────
    if (step === 'otp') return (
        <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 pt-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-sm shadow-xl max-w-sm w-full text-center"
            >
                <ShieldCheck className="w-12 h-12 text-[#534AB7] mx-auto mb-4" />
                <h2 className="text-xl font-serif font-bold mb-2">Security Verification</h2>
                <p className="text-xs text-gray-500 mb-1">আপনার ইমেইল ঠিকানায় একটি কোড পাঠানো হয়েছে</p>
                <p className="text-sm font-bold text-gray-800 mb-6">{maskedEmail}</p>

                <div className="flex gap-2 justify-center mb-6">
                    {otpDigits.map((d, i) => (
                        <input
                            key={i}
                            ref={el => { otpRefs.current[i] = el; }}
                            type="text" maxLength={1} value={d}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => e.key === 'Backspace' && !otpDigits[i] && i > 0 && otpRefs.current[i - 1]?.focus()}
                            className="w-10 h-12 border border-gray-200 text-center text-lg font-bold focus:border-[#534AB7] focus:outline-none rounded-sm"
                        />
                    ))}
                </div>

                {otpError && <p className="text-xs text-red-500 mb-4 font-bold">{otpError}</p>}

                <button
                    onClick={handleVerifyOtp}
                    disabled={isProcessing}
                    className="w-full bg-[#2C2C2A] text-white py-4 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
                >
                    {isProcessing ? 'যাচাই হচ্ছে...' : 'যাচাই করুন ও অর্ডার দিন'}
                </button>

                <button
                    disabled={resendCooldown > 0}
                    onClick={async () => {
                        setResendCooldown(60);
                        await fetch(`${API_URL}/api/hybrid-checkout/resend-otp`, {
                            method: 'POST', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId })
                        });
                    }}
                    className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest disabled:opacity-40"
                >
                    {resendCooldown > 0 ? `পুনরায় পাঠান (${resendCooldown}s)` : 'কোড পুনরায় পাঠান'}
                </button>
            </motion.div>
        </div>
    );

    // ── Main checkout screen ──────────────────────────────────────────────────
    return (
        <div className="pt-24 pb-20 min-h-screen bg-[#fafafa]">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col lg:flex-row gap-12 items-start">

                    {/* ── LEFT: FORM ── */}
                    <div className="w-full lg:flex-1 space-y-6">

                        {/* Customer Info */}
                        <section className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                            <h2 className="text-2xl font-serif font-bold mb-6 text-gray-900">Checkout Information</h2>

                            <div className="space-y-5">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] border-b pb-2">
                                    Customer Info
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>আপনার পূর্ণ নাম *</label>
                                        <input className={inputCls} placeholder="উদা: আহসান হাবীব"
                                            value={guestForm.fullName}
                                            onChange={e => setGuestForm({ ...guestForm, fullName: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>মোবাইল নম্বর *</label>
                                        <input className={inputCls} placeholder="017XXXXXXXX"
                                            value={guestForm.phone}
                                            onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>ইমেইল ঠিকানা *</label>
                                        <input className={inputCls} placeholder="example@mail.com"
                                            value={guestForm.email}
                                            onChange={e => setGuestForm({ ...guestForm, email: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>পাসওয়ার্ড *</label>
                                        <div className="relative">
                                            <input className={inputCls}
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="কমপক্ষে ৬ অক্ষর"
                                                value={guestForm.password}
                                                onChange={e => setGuestForm({ ...guestForm, password: e.target.value })} />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Delivery Address — 3-level dropdown ── */}
                                <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#534AB7] border-b pb-2 pt-4">
                                    Delivery Address
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Level 1: District */}
                                    <div>
                                        <label className={labelCls}>জেলা (District) *</label>
                                        <select
                                            className={inputCls}
                                            value={guestForm.district}
                                            onChange={e => handleDistrictChange(e.target.value)}
                                        >
                                            <option value="">জেলা নির্বাচন করুন</option>
                                            {districts.map((d: any) => (
                                                <option key={d.bn} value={d.bn}>{d.bn}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Level 2: Thana / Elaka */}
                                    <div>
                                        <label className={labelCls}>
                                            থানা / এলাকা (Elaka) *
                                            {isSylhetSadar && (
                                                <span className="ml-2 text-green-600 normal-case tracking-normal">
                                                    🎉 ফ্রি ডেলিভারি!
                                                </span>
                                            )}
                                        </label>
                                        <select
                                            className={inputCls}
                                            value={guestForm.thana}
                                            disabled={!guestForm.district}
                                            onChange={e => handleThanaChange(e.target.value)}
                                        >
                                            <option value="">থানা নির্বাচন করুন</option>
                                            {thanaList.length > 0
                                                ? thanaList.map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))
                                                : guestForm.district && (
                                                    <option value="সদর">সদর</option>
                                                )
                                            }
                                        </select>
                                    </div>

                                    {/* Level 3: Specific Area */}
                                    <div>
                                        <label className={labelCls}>এলাকা / মহল্লা (Area) *</label>
                                        <select
                                            className={inputCls}
                                            value={guestForm.area}
                                            disabled={!guestForm.thana}
                                            onChange={e => setGuestForm({ ...guestForm, area: e.target.value })}
                                        >
                                            <option value="">এলাকা নির্বাচন করুন</option>
                                            {areaList.length > 0
                                                ? areaList.map(a => (
                                                    <option key={a} value={a}>{a}</option>
                                                ))
                                                : guestForm.thana && (
                                                    <option value="সদর">সদর</option>
                                                )
                                            }
                                        </select>
                                    </div>

                                    {/* Shipping badge */}
                                    <div className="flex items-end">
                                        {guestForm.district && guestForm.thana && (
                                            <div className={`w-full text-center py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${
                                                isSylhetSadar
                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                                            }`}>
                                                {isSylhetSadar
                                                    ? '✓ ফ্রি ডেলিভারি প্রযোজ্য'
                                                    : `ডেলিভারি চার্জ: ৳${shipping}`
                                                }
                                            </div>
                                        )}
                                    </div>

                                    {/* Detail address */}
                                    <div className="md:col-span-2">
                                        <label className={labelCls}>বিস্তারিত ঠিকানা *</label>
                                        <textarea
                                            className={`${inputCls} h-20 resize-none`}
                                            placeholder="বাড়ি নম্বর, রোড নম্বর বা ল্যান্ডমার্ক..."
                                            value={guestForm.addressDetail}
                                            onChange={e => setGuestForm({ ...guestForm, addressDetail: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {guestError && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex items-center gap-2">
                                        <AlertCircle size={14} /> {guestError}
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Payment Method */}
                        <section className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-sm">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-8 h-8 rounded-full bg-[#534AB7]/10 flex items-center justify-center text-[#534AB7]">
                                    <CreditCard className="w-4 h-4" />
                                </div>
                                <h2 className="text-lg font-serif font-bold text-gray-900">পেমেন্ট পদ্ধতি</h2>
                            </div>
                            <label className="flex items-center gap-3 p-4 border border-[#534AB7] bg-[#534AB7]/5 rounded-sm cursor-pointer">
                                <div className="w-4 h-4 rounded-full border border-[#534AB7] flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 rounded-full bg-[#534AB7]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800">ক্যাশ অন ডেলিভারি</p>
                                    <p className="text-xs text-gray-500 mt-0.5">পন্য হাতে পেয়ে পেমেন্ট করুন।</p>
                                </div>
                            </label>
                            <p className="text-[10px] text-gray-400 mt-4 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> ডিজিটাল পেমেন্ট শীঘ্রই আসছে।
                            </p>
                        </section>
                    </div>

                    {/* ── RIGHT: ORDER SUMMARY ── */}
                    <div className="w-full lg:w-[420px]">
                        <div className="bg-white p-6 md:p-8 border border-gray-100 rounded-sm shadow-lg sticky top-28 space-y-6">
                            <h2 className="text-xl font-serif font-bold">Order Summary</h2>

                            {/* Cart items with qty + remove controls */}
                            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                                {cart.map((item: any, idx: number) => {
                                    const pid   = item._id || item.id;
                                    const qty   = item.quantity || 1;
                                    const color = item.color || 'Default';
                                    const size  = item.size  || 'Standard';
                                    return (
                                        <div key={`${pid}-${size}-${color}-${idx}`} className="flex gap-3 items-start">
                                            <img
                                                src={item.image}
                                                className="w-14 h-14 object-cover rounded-sm border border-gray-100 shrink-0"
                                                alt={item.name}
                                                referrerPolicy="no-referrer"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold uppercase text-gray-800 truncate leading-tight">
                                                    {item.name}
                                                </p>
                                                <div className="flex gap-1.5 mt-0.5 flex-wrap">
                                                    {size !== 'Standard' && (
                                                        <span className="text-[9px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-sm">
                                                            {size}
                                                        </span>
                                                    )}
                                                    {color !== 'Default' && (
                                                        <span className="text-[9px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded-sm">
                                                            {color}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Qty controls */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            if (qty <= 1) {
                                                                removeFromCart(pid, size, color);
                                                            } else {
                                                                updateCartQuantity(pid, size, color, qty - 1);
                                                            }
                                                        }}
                                                        className="w-6 h-6 border border-gray-200 rounded-sm flex items-center justify-center text-gray-500 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
                                                    >
                                                        <Minus size={10} />
                                                    </button>
                                                    <span className="text-xs font-bold text-gray-800 w-5 text-center">{qty}</span>
                                                    <button
                                                        onClick={() => updateCartQuantity(pid, size, color, qty + 1)}
                                                        className="w-6 h-6 border border-gray-200 rounded-sm flex items-center justify-center text-gray-500 hover:border-[#534AB7] hover:text-[#534AB7] transition-colors"
                                                    >
                                                        <Plus size={10} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <p className="text-xs font-bold text-gray-900">
                                                    ৳{(item.price * qty).toLocaleString()}
                                                </p>
                                                <button
                                                    onClick={() => removeFromCart(pid, size, color)}
                                                    className="text-gray-300 hover:text-red-400 transition-colors"
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ── Coupon input ── */}
                            <div className="border-t pt-4">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                                    <Tag size={11} /> কুপন কোড (Optional)
                                </p>

                                {appliedCoupon ? (
                                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-sm px-3 py-2.5">
                                        <div>
                                            <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider">
                                                {appliedCoupon.code}
                                            </p>
                                            <p className="text-[10px] text-green-600">
                                                ৳{couponDiscount.toLocaleString()} ছাড় প্রযোজ্য
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleRemoveCoupon}
                                            className="text-green-500 hover:text-red-400 transition-colors ml-2"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
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
                                            disabled={couponLoading || !couponInput.trim()}
                                            className="px-4 py-2.5 bg-[#534AB7] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#3d3599] transition-colors disabled:opacity-50 whitespace-nowrap"
                                        >
                                            {couponLoading ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                )}

                                {couponError && (
                                    <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                                        <AlertCircle size={10} /> {couponError}
                                    </p>
                                )}
                            </div>

                            {/* ── Price breakdown ── */}
                            <div className="border-t pt-4 space-y-2.5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>৳{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Shipping</span>
                                    <span className={isSylhetSadar ? 'text-green-600 font-bold' : ''}>
                                        {shipping === 0 ? 'Free' : `৳${shipping}`}
                                    </span>
                                </div>
                                {couponDiscount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Coupon ({appliedCoupon?.code})</span>
                                        <span>- ৳{couponDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3 mt-1">
                                    <span>Total</span>
                                    <span className="text-[#534AB7]">৳{total.toLocaleString()}</span>
                                </div>

                                {isSylhetSadar && (
                                    <p className="text-[10px] text-green-600 font-bold text-center bg-green-50 rounded-sm py-1.5 border border-green-100">
                                        🎉 সিলেট সদরে ফ্রি ডেলিভারি!
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleGuestOrder}
                                disabled={isProcessing}
                                className="w-full bg-[#2C2C2A] text-white py-4 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-black/10"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Order →'}
                            </button>

                            <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                <ShieldCheck className="inline w-3 h-3 mr-1 text-green-500" />
                                Secure Checkout — Cash on Delivery
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}