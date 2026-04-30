import { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import SearchOverlay from './SearchOverlay';
import AuthModal from './AuthModal';
import CartDrawer from './CartDrawer';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const {
    wishlist,
    cart,
    user,
    logout,
    setIsAuthOpen,
    setIsSearchOpen,
    isSearchOpen,
    isAuthOpen
  } = useStore();

  const location = useLocation();
  const navigate = useNavigate();

  const handleUserClick = () => {
    if (user) {
      // If logged in, go to Dashboard
      navigate('/account');
    } else {
      // If not logged in, open Login Popup
      setIsAuthOpen(true);
    }
  };

  // 1. SCROLL LOGIC: Header turns from transparent to white on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. DYNAMIC ICON COLORS: White on Hero (Home), Dark elsewhere
  const isHomePage = location.pathname === '/';
  const headerThemeClass = (!isScrolled && isHomePage)
    ? ''
    : 'bg-white/80 backdrop-blur-md text-eloria-dark shadow-sm';


  // 3. CART COUNT: Sum of all item quantities
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cartCount = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 py-4 bg-white  transition-all duration-500 ${headerThemeClass}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="text-3xl font-serif font-bold tracking-widest hover:opacity-80 transition-opacity">
            ELORIA
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            {/* SEARCH TRIGGER */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 hover:text-eloria-purple transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* AUTH / USER PROFILE */}
            <div className="group relative">
              <button
                onClick={handleUserClick}
                className="p-2 hover:text-eloria-purple transition-colors flex items-center gap-1"
                aria-label="User Account"
              >
                <User className={`w-5 h-5 ${user ? 'text-eloria-purple' : 'text-eloria-dark'}`} />
                {user && <span className="hidden lg:block text-[10px] font-bold uppercase tracking-widest">Account</span>}
              </button>

              {/* Logout Dropdown (Only shows when user is logged in) */}
              {user && (
                <div className="absolute right-0 pt-2 hidden group-hover:block animate-in fade-in slide-in-from-top-1">
                  <div className="bg-white shadow-2xl rounded-xl border border-gray-100 p-2 min-w-[160px] text-eloria-dark">
                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">Logged in as</p>
                      <p className="text-[10px] font-bold truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* WISHLIST (DYNAMIC COUNTER) */}
            <Link
              to="/wishlist"
              className="relative p-2 hover:text-eloria-rose transition-colors"
              aria-label="Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlist.length > 0 ? 'fill-eloria-rose text-eloria-rose' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-eloria-rose text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* SHOPPING CART (DYNAMIC COUNTER) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:text-eloria-purple transition-colors"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-eloria-purple text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* GLOBAL OVERLAYS & MODALS */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Side drawer for Cart items */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Auth Modal for Login/Signup */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}