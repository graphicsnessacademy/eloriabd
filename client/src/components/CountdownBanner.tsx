import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Ensure the image exists at this path
import flashBanner from '../assets/Flashsalebg.jpg';

interface CountdownProps {
    offerName?: string;
    description?: string;
    targetDate?: string;
    isVisible?: boolean;
}

const TimeUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
        <div className="w-16 h-16 md:w-20 lg:w-24 md:h-20 lg:h-24 bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center hover:border-eloria-rose transition-all duration-300 group shadow-2xl relative overflow-hidden">
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={value}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl md:text-4xl lg:text-5xl font-bold text-white tabular-nums group-hover:text-eloria-pink transition-colors z-10"
                >
                    {String(value).padStart(2, '0')}
                </motion.span>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        </div>
        <span className="text-[8px] md:text-[10px] font-bold text-white/70 mt-3 tracking-[0.2em] uppercase">
            {label}
        </span>
    </div>
);

const LightningBolt = () => (
    <motion.span
        animate={{ scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-5xl md:text-7xl lg:text-8xl drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
    >
        ⚡
    </motion.span>
);

export default function CountdownBanner({
    offerName = "FLASH DEAL",
    description = "Offer on all products! Hurry before it ends.",
    targetDate = "2025-06-01T00:00:00",
    isVisible = true
}: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const distance = new Date(targetDate).getTime() - now;
            if (distance < 0) return;
            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [targetDate]);

    if (!isVisible) return null;

    return (
        <section className="relative py-20 px-6 overflow-hidden text-center border-y-4 border-eloria-rose">

            {/* BACKGROUND IMAGE LAYER */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] hover:scale-105"
                style={{
                    backgroundImage: `url(${flashBanner})`,
                    backgroundColor: "#1a1a1a"
                }}
            />

            {/* DARK OVERLAY */}
            <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-[2px]" />

            {/* 3-COLUMN CONTENT LAYER */}
            <div className="max-w-7xl mx-auto relative z-30 grid grid-cols-1 md:grid-cols-4 items-center gap-8 md:gap-4">

                {/* 1st Column: Side Lightning */}
                <div className="hidden md:flex justify-center items-center">
                    <LightningBolt />
                </div>

                {/* Middle Column (Width 2x): Main Content */}
                <div className="col-span-1 md:col-span-2 flex flex-col items-center">
                    <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">

                        <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
                            {offerName}
                        </h2>
                        <div className="bg-eloria-rose text-white px-6 py-2 rounded-full font-bold text-xs md:text-sm tracking-[0.2em] shadow-lg animate-bounce">
                            UP TO 50% OFF
                        </div>
                    </div>

                    {/* Description */}
                    <p className="text-lg md:text-2xl text-white/90 font-light mb-6 italic tracking-wide max-w-2xl  mx-auto">
                        "{description}"
                    </p>
                    {/* Countdown Timer */}
                    <div className="flex justify-center gap-2 md:gap-8 mb-8">
                        <TimeUnit value={timeLeft.days} label="Days" />
                        <TimeUnit value={timeLeft.hours} label="Hours" />
                        <TimeUnit value={timeLeft.minutes} label="Mins" />
                        <TimeUnit value={timeLeft.seconds} label="Secs" />
                    </div>

                    {/* Button */}
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 bg-white text-eloria-dark hover:bg-eloria-purple hover:text-white font-bold text-lg px-8 md:px-12 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-105 active:scale-95 group"
                    >
                        SHOP THE SALE
                        <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-sm"
                        >
                            →
                        </motion.span>
                    </Link>
                </div>

                {/* Last Column: Side Lightning */}
                <div className="hidden md:flex justify-center items-center">
                    <LightningBolt />
                </div>

                {/* Mobile-only Bolt (Visible only on phone instead of side columns) */}
                <div className="md:hidden flex justify-center mt-4">
                    <LightningBolt />
                </div>
            </div>
        </section>
    );
}