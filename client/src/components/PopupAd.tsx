import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function PopupAd() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const hasSeen = sessionStorage.getItem('eloria_popup_seen');
        if (!hasSeen) {
            const timer = setTimeout(() => setIsOpen(true), 2500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('eloria_popup_seen', 'true');
    };

    const handleShopNow = () => {
        handleClose();
        navigate('/shop');
    };

    // ── SVG path strings ────────────────────────────────────────────
    const outerGearPath =
        'M229.6,191.4c0,5.7-7.3,10.6-8.4,16c-1.1,5.5,3.8,12.9,1.6,18c-2.2,5.2-10.8,6.9-13.9,11.5' +
        'c-3.1,4.6-1.4,13.3-5.4,17.2c-3.9,3.9-12.6,2.3-17.2,5.4c-4.6,3.1-6.3,11.7-11.5,13.9c-5.1,2.1-12.4-2.7-18-1.6' +
        'c-5.4,1.1-10.3,8.4-16,8.4c-5.7,0-10.6-7.3-16-8.4c-5.5-1.1-12.9,3.8-18,1.6c-5.2-2.2-6.9-10.8-11.5-13.9' +
        'c-4.6-3.1-13.3-1.4-17.2-5.4c-3.9-3.9-2.3-12.6-5.4-17.2c-3.1-4.6-11.7-6.3-13.9-11.5c-2.1-5.1,2.7-12.4,1.6-18' +
        'c-1.1-5.4-8.4-10.3-8.4-16c0-5.7,7.3-10.6,8.4-16c1.1-5.5-3.8-12.9-1.6-18c2.2-5.2,10.8-6.9,13.9-11.5' +
        'c3.1-4.6,1.4-13.3,5.4-17.2c3.9-3.9,12.6-2.3,17.2-5.4c4.6-3.1,6.3-11.7,11.5-13.9c5.1-2.1,12.4,2.7,18,1.6' +
        'c5.4-1.1,10.3-8.4,16-8.4c5.7,0,10.6,7.3,16,8.4c5.5,1.1,12.9-3.8,18-1.6c5.2,2.2,6.9,10.8,11.5,13.9' +
        'c4.6,3.1,13.3,1.4,17.2,5.4c3.9,3.9,2.3,12.6,5.4,17.2c3.1,4.6,11.7,6.3,13.9,11.5' +
        'c2.1,5.1-2.7,12.4-1.6,18C222.2,180.8,229.6,185.7,229.6,191.4z';

    const innerGearPath =
        'M222.3,191.4c0,5.2-6.7,9.7-7.7,14.7c-1,5.1,3.5,11.8,1.5,16.5c-2,4.8-9.9,6.4-12.7,10.6' +
        'c-2.9,4.3-1.3,12.2-4.9,15.8c-3.6,3.6-11.5,2.1-15.8,4.9c-4.2,2.8-5.8,10.8-10.6,12.7' +
        'c-4.7,1.9-11.4-2.5-16.5-1.5c-4.9,1-9.4,7.7-14.7,7.7c-5.2,0-9.7-6.7-14.7-7.7' +
        'c-5.1-1-11.8,3.5-16.5,1.5c-4.8-2-6.4-9.9-10.6-12.7c-4.3-2.9-12.2-1.3-15.8-4.9' +
        'c-3.6-3.6-2.1-11.5-4.9-15.8c-2.8-4.2-10.8-5.8-12.7-10.6c-1.9-4.7,2.5-11.4,1.5-16.5' +
        'c-1-4.9-7.7-9.4-7.7-14.7c0-5.2,6.7-9.7,7.7-14.7c1-5.1-3.5-11.8-1.5-16.5c2-4.8,9.9-6.4,12.7-10.6' +
        'c2.9-4.3,1.3-12.2,4.9-15.8c3.6-3.6,11.5-2.1,15.8-4.9c4.2-2.8,5.8-10.8,10.6-12.7' +
        'c4.7-1.9,11.4,2.5,16.5,1.5c4.9-1,9.4-7.7,14.7-7.7c5.2,0,9.7,6.7,14.7,7.7c5.1,1,11.8-3.5,16.5-1.5' +
        'c4.8,2,6.4,9.9,10.6,12.7c4.3,2.9,12.2,1.3,15.8,4.9c3.6,3.6,2.1,11.5,4.9,15.8' +
        'c2.8,4.2,10.8,5.8,12.7,10.6c1.9,4.7-2.5,11.4-1.5,16.5C215.6,181.7,222.3,186.2,222.3,191.4z';

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="popup-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    // REMOVED paddingTop to allow connection to the top of screen
                    className="fixed inset-0 z-[200] flex items-start justify-center bg-black/55 backdrop-blur-[2px]"
                    onClick={handleClose}
                >
                    <motion.div
                        key="popup-card"
                        initial={{ y: -600, opacity: 0 }}
                        animate={{ y: 0, opacity: 1, rotate: [-2, 2, -2] }} // Subtle air swing
                        exit={{ y: -600, opacity: 0 }}
                        transition={{
                            y: { type: 'spring', stiffness: 80, damping: 20 },
                            opacity: { duration: 0.3 },
                            rotate: { repeat: Infinity, duration: 5, ease: "easeInOut" }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        // transformOrigin set to top to swing from the line start
                        style={{ width: 'clamp(260px, 60vw, 580px)', transformOrigin: 'top center' }}
                    >
                        <svg
                            viewBox="0 0 281.8 301"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        >
                            {/* 1. Hanging line — Starts from y=0 (absolute top of viewport) */}
                            <line
                                x1="140.9" y1="0"
                                x2="140.9" y2="95"
                                stroke="#ffffff"
                                strokeWidth="2.5"
                            />

                            {/* 2. Eyelet circle */}
                            <circle
                                cx="140.9" cy="90" r="3.5"
                                fill="white"
                                stroke="#ffffff"
                                strokeWidth=""
                            />

                            {/* 3. Gear Shape Layers */}
                            <g style={{ transformOrigin: '140.9px 191.4px', transform: 'scale(1.1)' }}>
                                <path fill="#eeeeee" stroke="#ffffff" strokeWidth="3" d={outerGearPath} />
                                <motion.path
                                    fill="#eeeeee"
                                    stroke="#D4AF37"
                                    strokeWidth="1.2"
                                    d={innerGearPath}
                                    animate={{
                                        rotate: [-4, 4, -4],
                                        scale: [1, 0.99, 1]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 10,
                                        ease: "easeInOut"
                                    }}
                                    style={{ transformOrigin: '140.9px 191.4px' }}
                                />
                            </g>

                            {/* 4. TEXT CONTENT (Y-positions adjusted to fit perfectly) */}
                            <text x="140.9" y="142" textAnchor="middle" fontWeight="700" fontSize="9" fill="#000000">
                                New Collections
                            </text>

                            <line x1="110" y1="148" x2="172" y2="148" stroke="#000000" strokeWidth="0.5" opacity="0.3" />

                            <text x="140.9" y="180" textAnchor="middle" fontWeight="900" fontSize="34" fill="#1a1a1a">
                                15%
                            </text>

                            <text x="140.9" y="212" textAnchor="middle" fontWeight="900" fontSize="30" fill="#1a1a1a">
                                Discount
                            </text>

                            <text x="140.9" y="225" textAnchor="middle" fontSize="5" fill="#666666">
                                Grab these exclusive deals before they are gone!
                            </text>

                            <text x="140.9" y="234" textAnchor="middle" fontWeight="700" fontSize="6" fill="#AF6B00">
                                Limited time offer.
                            </text>

                            {/* 5. SHOP NOW button */}
                            <g onClick={handleShopNow} style={{ cursor: 'pointer' }}>
                                <rect x="98" y="245" width="86" height="15" rx="7.5" fill="#534AB7" />
                                <text x="140.9" y="255" textAnchor="middle" fontWeight="600" fontSize="8" fill="#FFFFFF">
                                    Shop Now
                                </text>
                            </g>

                            {/* 6. CLOSE button */}
                            <g onClick={handleClose} style={{ cursor: 'pointer' }}>
                                <circle cx="225" cy="115" r="10" fill="black" opacity="0.4" />
                                <line x1="221" y1="111" x2="229" y2="119" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                <line x1="229" y1="111" x2="221" y2="119" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </g>
                        </svg>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}