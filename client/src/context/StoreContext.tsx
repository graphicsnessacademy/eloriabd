import React, { createContext, useContext, useState, useEffect } from 'react';

const StoreContext = createContext<any>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 1. INITIAL LOAD: Pull from LocalStorage on mount
  useEffect(() => {
    try {
      const savedWish = localStorage.getItem('eloria_wishlist');
      const savedCart = localStorage.getItem('eloria_cart');
      const token = localStorage.getItem('eloria_token');

      if (savedWish) setWishlist(JSON.parse(savedWish));
      if (savedCart) setCart(JSON.parse(savedCart));
      
      // If a token exists, you could potentially fetch user data here
      // For now, we assume user state is set via loginSync
    } catch (error) {
      console.error("Failed to parse storage:", error);
    }
  }, []);

  // 2. PERSISTENCE: Save to LocalStorage ONLY if user is a Guest
  useEffect(() => {
    if (!user) {
      localStorage.setItem('eloria_wishlist', JSON.stringify(wishlist));
      localStorage.setItem('eloria_cart', JSON.stringify(cart));
    }
  }, [wishlist, cart, user]);

  // --- WISHLIST ACTIONS ---
const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) 
        ? prev.filter((id) => id !== productId) 
        : [...prev, productId]
    );
};

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
  };

  // --- CART ACTIONS ---

  const addToCart = (product: any) => {
    setCart((prev) => {
      const productId = product._id || product.id;
      const exists = prev.find((item: any) => (item._id || item.id) === productId);

      if (exists) {
        return prev.map((item: any) =>
          (item._id || item.id) === productId 
            ? { ...item, quantity: (item.quantity || 1) + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
};


  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => (item._id || item.id) !== productId));
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return removeFromCart(productId);
    setCart((prev) =>
      prev.map((item) =>
        (item._id || item.id) === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    if (!user) localStorage.removeItem('eloria_cart');
  };

  // --- AUTH ACTIONS ---

  const loginSync = (data: any) => {
    // 1. Set User Profile
    setUser(data.user);
    
    // 2. Set Token
    localStorage.setItem('eloria_token', data.token);

    // 3. Sync Logic: 
    // Usually, the backend handles merging and returns the final combined arrays.
    // If the backend returns merged data, we use it directly:
    if (data.user.wishlist) setWishlist(data.user.wishlist);
    if (data.user.cart) setCart(data.user.cart);

    // 4. Clean up Guest storage
    localStorage.removeItem('eloria_wishlist');
    localStorage.removeItem('eloria_cart');
  };

  const logout = () => {
    setUser(null);
    setWishlist([]);
    setCart([]);
    localStorage.removeItem('eloria_token');
    localStorage.removeItem('eloria_wishlist');
    localStorage.removeItem('eloria_cart');
  };

  return (
    <StoreContext.Provider value={{ 
      // State
      wishlist, 
      cart, 
      user, 
      isAuthOpen, 
      isSearchOpen,

      // State Setters (UI Control)
      setIsAuthOpen,
      setIsSearchOpen,

      // Logic Functions
      toggleWishlist,
      removeFromWishlist,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      loginSync,
      logout
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};