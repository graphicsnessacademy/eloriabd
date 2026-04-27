import { useState, useEffect } from 'react';
import { Truck, RotateCcw, ShieldCheck } from 'lucide-react';

// FIX: Replaced framer-motion (heavy ~120KB) with pure CSS keyframe animation.
// The slide-in/out effect is identical but costs zero bundle weight.

export default function TrustBar() {
    const [index, setIndex] = useState(0);
    const [animKey, setAnimKey] = useState(0);

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

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % items.length);
            setAnimKey(k => k + 1);
        }, 3000);
        return () => clearInterval(timer);
    }, [items.length]);

    return (
        <div className="bg-[white] border-b border-eloria-lavender/20 py-3 md:py-4 mb-8 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-8">

                {/* Desktop — side by side */}
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

                {/* Mobile — CSS slide animation, no framer-motion */}
                <div className="md:hidden relative h-12 flex items-center justify-center">
                    <div
                        key={animKey}
                        className="flex items-center gap-4 text-xs font-medium text-eloria-dark/80 trustbar-slide"
                    >
                        <div className="w-8 h-8 rounded-full bg-eloria-lavender/10 flex items-center justify-center shrink-0">
                            {items[index].icon}
                        </div>
                        <span className="tracking-wide">{items[index].text}</span>
                    </div>

                    {/* Dots indicator */}
                    <div className="absolute -bottom-2 flex gap-1.5">
                        {items.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'bg-eloria-purple w-3' : 'bg-eloria-lavender/40 w-1'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes trustbarSlide {
                    0%   { opacity: 0; transform: translateY(10px); }
                    15%  { opacity: 1; transform: translateY(0); }
                    85%  { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
                .trustbar-slide {
                    animation: trustbarSlide 3s ease-in-out forwards;
                }
            `}} />
        </div>
    );
}