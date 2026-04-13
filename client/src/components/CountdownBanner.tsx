import { useState, useEffect } from 'react';

export default function CountdownBanner() {
    // Initialize timer (Set to 24 hours for demo, but can be a fixed date)
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 23,
        minutes: 59,
        seconds: 45
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const TimeUnit = ({ value, label }: { value: number, label: string }) => (
        <div className="flex flex-col items-center">
            <div className="bg-eloria-dark text-white w-16 h-16 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-2xl relative overflow-hidden group">
                {/* Subtle background glow on hover */}
                <div className="absolute inset-0 bg-eloria-purple opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

                <span className="text-2xl md:text-4xl font-serif font-bold relative z-10">
                    {value.toString().padStart(2, '0')}
                </span>

                {/* Bottom decorative line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-eloria-purple/30"></div>
            </div>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-eloria-dark/50 mt-4">
                {label}
            </span>
        </div>
    );

    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Decorative floral-inspired background elements (Subtle) */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-eloria-lavender/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-eloria-pink/10 rounded-full blur-3xl"></div>

            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="h-px w-8 bg-eloria-rose/40"></div>
                    <span className="text-eloria-rose font-bold text-xs md:text-sm uppercase tracking-[0.4em]">
                        Limited Time Offer
                    </span>
                    <div className="h-px w-8 bg-eloria-rose/40"></div>
                </div>

                <h2 className="text-3xl md:text-5xl font-serif text-eloria-dark mb-12">
                    The Heritage Sale Ends In
                </h2>

                <div className="flex justify-center gap-4 md:gap-8 mb-16">
                    <TimeUnit value={timeLeft.days} label="Days" />
                    <TimeUnit value={timeLeft.hours} label="Hours" />
                    <TimeUnit value={timeLeft.minutes} label="Minutes" />
                    <TimeUnit value={timeLeft.seconds} label="Seconds" />
                </div>

                <button className="group relative overflow-hidden bg-eloria-purple text-white px-12 py-4 rounded-full font-bold tracking-[0.2em] text-xs uppercase transition-all duration-500 hover:shadow-[0_10px_30px_rgba(83,74,183,0.3)]">
                    <span className="relative z-10">Shop the Sale Now</span>
                    <div className="absolute inset-0 bg-eloria-rose translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>

                <p className="mt-8 text-eloria-dark/40 text-[10px] uppercase tracking-widest font-medium">
                    *Terms and conditions apply. Valid on selected collections.
                </p>
            </div>
        </section>
    );
}