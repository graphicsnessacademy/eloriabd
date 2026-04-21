import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSiteConfig } from '../context/SiteConfigContext';
import { X } from 'lucide-react';

export default function PopupAd() {
    const { config } = useSiteConfig();
    const popupZone = config?.offerZones?.popup;

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!popupZone?.isActive) return;

        // Check session storage
        const hasSeenPopup = sessionStorage.getItem('hasSeenPopup');
        if (hasSeenPopup) return;

        const delay = (popupZone.delay || 3) * 1000;

        const timer = setTimeout(() => {
            setIsVisible(true);
            sessionStorage.setItem('hasSeenPopup', 'true');
        }, delay);

        return () => clearTimeout(timer);
    }, [popupZone]);

    const handleClose = () => {
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && popupZone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image Area */}
                        {popupZone.image && (
                            <div className="relative w-full aspect-[4/3] sm:aspect-video overflow-hidden bg-gray-100">
                                <img
                                    src={popupZone.image}
                                    alt={popupZone.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                
                                <div className="absolute bottom-0 left-0 w-full p-6 text-center text-white">
                                    <h3 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide drop-shadow-md">
                                        {popupZone.title || "Special Offer"}
                                    </h3>
                                </div>
                            </div>
                        )}

                        {/* Content Area (if no image or just spacing for button) */}
                        <div className={`p-6 text-center ${!popupZone.image ? 'pt-12' : 'pt-4'}`}>
                            {!popupZone.image && (
                                <h3 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mb-4">
                                    {popupZone.title || "Special Offer"}
                                </h3>
                            )}
                            
                            <p className="text-gray-500 mb-6 font-sans">
                                Don't miss out on our exclusive deals. Click below to explore.
                            </p>
                            
                            <Link
                                to={popupZone.targetUrl || "/shop"}
                                onClick={handleClose}
                                className="inline-block w-full sm:w-auto bg-[#534AB7] text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-[#3d3599] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                            >
                                Shop Now
                            </Link>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
