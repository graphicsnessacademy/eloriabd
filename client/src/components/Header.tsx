import { useState } from 'react';
import { Search, ShoppingBag, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import SearchOverlay from './SearchOverlay';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md py-4 border-b border-eloria-lavender/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="text-3xl font-serif font-bold tracking-widest text-eloria-dark">ELORIA</Link>
          
          <div className="flex items-center gap-6">
            {/* SEARCH TRIGGER */}
            <button onClick={() => setIsSearchOpen(true)} className="p-2 hover:text-eloria-purple transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <Heart className="w-5 h-5 cursor-pointer hover:text-eloria-rose" />
            <div className="relative cursor-pointer">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-eloria-purple text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">0</span>
            </div>
          </div>
        </div>
      </header>

      {/* RENDER OVERLAY */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}