import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants/categories';

const Facebook = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const Instagram = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// X (formerly Twitter) icon
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4l16 16" />
    <path d="M4 20L20 4" />
  </svg>
);

export default function Footer() {
    return (
        <footer className="bg-eloria-dark text-white pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Info */}
                    <div className="space-y-6">
                        <h2 className="text-3xl font-serif font-bold tracking-[0.2em]">ELORIA</h2>
                        <p className="text-white/60 text-sm leading-relaxed">
                            "Wear Your Glory" — Celebrating the elegance of heritage craftsmanship through timeless silhouettes. Handcrafted for the modern woman.
                        </p>
                        <div className="flex gap-4">
                            {[Instagram, Facebook, X].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-eloria-purple hover:border-eloria-purple transition-all duration-300">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Collections */}
                    <div>
                        <h4 className="text-eloria-lavender font-bold text-xs uppercase tracking-[0.2em] mb-8">Collections</h4>
                        <ul className="space-y-4 text-white/70 text-sm">
                            {CATEGORIES.slice(0, 4).map(cat => (
                                <li key={cat.slug}><Link to={`/shop/${cat.slug}`} className="hover:text-eloria-pink transition-colors">{cat.name}</Link></li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-eloria-lavender font-bold text-xs uppercase tracking-[0.2em] mb-8">Customer Care</h4>
                        <ul className="space-y-4 text-white/70 text-sm">
                            <li><a href="#" className="hover:text-eloria-pink transition-colors">Shipping Policy</a></li>
                            <li><a href="#" className="hover:text-eloria-pink transition-colors">Returns & Exchanges</a></li>
                            <li><a href="#" className="hover:text-eloria-pink transition-colors">Size Guide</a></li>
                            <li><a href="#" className="hover:text-eloria-pink transition-colors">Contact Us</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="text-eloria-lavender font-bold text-xs uppercase tracking-[0.2em] mb-8">Join the Glory</h4>
                        <p className="text-white/60 text-sm mb-6">Subscribe for exclusive early access to our new drops.</p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 focus:outline-none focus:border-eloria-purple transition-colors"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-eloria-purple text-white p-1.5 rounded-md hover:bg-eloria-rose transition-colors duration-300">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 text-center">
                    <p className="text-white/30 text-[10px] tracking-widest uppercase">
                        © 2025 ELORIA. তোমার গৌরব পরো. Crafted with love in Bengal.
                    </p>
                </div>
            </div>
        </footer>
    );
}