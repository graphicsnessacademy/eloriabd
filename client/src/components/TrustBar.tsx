import { useState, useEffect } from 'react';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrustBar() {
    const [index, setIndex] = useState(0);

    const items = [
        {
            icon: <Truck className="w-5 h-5 text-eloria-purple" />,
            text: "Free Shipping on Orders Over ৳999"
        },
        {
            icon: <RotateCcw className="w-5 h-5 text-eloria-purple" />,
            text: "Easy 7-Day Returns"
        },
        {
            icon: <ShieldCheck className="w-5 h-5 text-eloria-purple" />,
            text: "100% Authentic Handcrafted"
        }
    ];

    // Auto-play logic for mobile slider
    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % items.length);
        }, 3000); // Changes every 3 seconds
        return () => clearInterval(timer);
    }, [items.length]);

    return (
        <div className="bg-white border-b border-eloria-lavender/20 py-6 md:py-8 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-8">

                {/* --- DESKTOP VIEW (Side by Side) --- */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-center gap-4 text-sm font-medium text-eloria-dark/80">
                            <div className="w-10 h-10 rounded-full bg-eloria-lavender/10 flex items-center justify-center shrink-0">
                                {item.icon}
                            </div>
                            <span className="tracking-wide">{item.text}</span>
                            {i < items.length - 1 && (
                                <div className="h-8 w-px bg-eloria-lavender/30 ml-auto" />
                            )}
                        </div>
                    ))}
                </div>

                {/* --- MOBILE VIEW (Auto Slider) --- */}
                <div className="md:hidden relative h-12 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="flex items-center gap-4 text-xs font-medium text-eloria-dark/80"
                        >
                            <div className="w-8 h-8 rounded-full bg-eloria-lavender/10 flex items-center justify-center shrink-0">
                                {items[index].icon}
                            </div>
                            <span className="tracking-wide">{items[index].text}</span>
                        </motion.div>
                    </AnimatePresence>

                    {/* Mobile Dots Indicator */}
                    <div className="absolute -bottom-2 flex gap-1.5">
                        {items.map((_, i) => (
                            <div
                                key={i}
                                className={`w-1 h-1 rounded-full transition-all duration-300 ${i === index ? 'bg-eloria-purple w-3' : 'bg-eloria-lavender/40'}`}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}