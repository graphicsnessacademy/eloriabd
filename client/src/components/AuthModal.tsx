import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { API_URL } from '../config';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { wishlist, cart, loginSync } = useStore();

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setError('');
      setIsLogin(true);
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';

    try {
      const payload = isLogin 
        ? { email, password, guestWishlist: wishlist, guestCart: cart }
        : { email, password, name, phone, guestWishlist: wishlist, guestCart: cart };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.token) {
        loginSync(data);
        onClose();
      } else {
        setError(data.message || "An error occurred");
      }
    } catch {
      setError("Network error. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-3xl font-serif text-center mb-6 text-gray-900">
          {isLogin ? 'Welcome Back' : 'Join Eloria'}
        </h2>

        {error && (
          <div className="flex items-start gap-2 mb-6 p-3 rounded-md bg-eloria-rose/10 border border-eloria-rose/20 text-eloria-rose">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input 
                type="text" placeholder="Full Name" required
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-eloria-purple transition-colors text-sm"
                value={name} onChange={e => { setName(e.target.value); setError(''); }}
              />
              <input 
                type="tel" placeholder="Phone Number" required
                className="w-full border-b border-gray-200 py-3 outline-none focus:border-eloria-purple transition-colors text-sm"
                value={phone} onChange={e => { setPhone(e.target.value); setError(''); }}
              />
            </>
          )}
          <input 
            type="email" placeholder="Email Address" required
            className="w-full border-b border-gray-200 py-3 outline-none focus:border-eloria-purple transition-colors text-sm"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full border-b border-gray-200 py-3 outline-none focus:border-eloria-purple transition-colors text-sm"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
          />
          <button 
            disabled={isLoading}
            className={`w-full bg-[#1a1a1a] text-white py-4 rounded-full font-bold uppercase tracking-widest transition-all mt-6 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-eloria-purple active:scale-95'}`}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }} 
            className="text-eloria-purple font-bold tracking-widest uppercase ml-1 hover:text-[#1a1a1a] transition-colors"
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}