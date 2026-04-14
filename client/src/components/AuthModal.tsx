import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { wishlist, cart, loginSync } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    // Use your Live Vercel URL here
    const API_URL = 'https://eloriabd.vercel.app'; 

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          guestWishlist: wishlist, 
          guestCart: cart 
        })
      });
      const data = await res.json();
      
      if (data.token) {
        loginSync(data); // This function will clear localStorage and update state
        onClose();
      } else {
        alert(data.message || "Error occurred");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl animate-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <X size={20} />
        </button>

        <h2 className="text-3xl font-serif text-center mb-8">
          {isLogin ? 'Welcome Back' : 'Join Eloria'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" placeholder="Email Address" required
            className="w-full border-b border-gray-200 py-3 outline-none focus:border-eloria-purple transition-colors"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full border-b border-gray-200 py-3 outline-none focus:border-eloria-purple transition-colors"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button className="w-full bg-eloria-dark text-white py-4 rounded-full font-bold uppercase tracking-widest hover:bg-eloria-purple transition-all mt-4">
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-eloria-purple font-bold underline">
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}