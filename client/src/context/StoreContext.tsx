/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const StoreContext = createContext<any>(null);

// Normalize cart items coming from MongoDB (productId) → frontend format (_id)
const normalizeCart = (cartItems: any[]) =>
  cartItems.map((item: any) => ({
    ...item,
    _id: item._id || item.productId,
    id: item._id || item.productId,
  }));

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialDbLoaded, setIsInitialDbLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedWish = localStorage.getItem('eloria_wishlist');
      const savedCart = localStorage.getItem('eloria_cart');
      const token = localStorage.getItem('eloria_token');

      if (savedWish) setWishlist(JSON.parse(savedWish));
      if (savedCart) setCart(JSON.parse(savedCart));

      if (token) {
        fetch(`${API_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(res => {
            if (res.status === 401) {
              localStorage.removeItem('eloria_token');
              throw new Error('Session Expired');
            }
            if (!res.ok) throw new Error('Server issues, maintaining token state');
            return res.json();
          })
          .then(userData => {
          setUser(userData);
            if (userData.wishlist) setWishlist(userData.wishlist);
            if (userData.cart) setCart(normalizeCart(userData.cart));
          })
          .catch((err) => {
            console.error("Session sync issue:", err);
          })
          .finally(() => {
            setIsInitialDbLoaded(true);
          });
      } else {
        setIsInitialDbLoaded(true);
      }
    } catch (error) {
      console.error("Failed to parse storage:", error);
      setIsInitialDbLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('eloria_wishlist', JSON.stringify(wishlist));
      localStorage.setItem('eloria_cart', JSON.stringify(cart));
    }
  }, [wishlist, cart, user]);

  useEffect(() => {
    if (isInitialDbLoaded && user) {
      const timeout = setTimeout(() => {
        const token = localStorage.getItem('eloria_token');
        fetch(`${API_URL}/api/user/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ wishlist, cart })
        }).catch(console.error);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [wishlist, cart, user, isInitialDbLoaded]);

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

  const addToCart = (product: any) => {
    setCart((prev) => {
      const productId = product._id || product.id;
      const selectedSize = product.size || 'Standard';
      const selectedColor = product.color || 'Default';

      const existingItemIndex = prev.findIndex((item: any) =>
        (item._id || item.id) === productId &&
        item.size === selectedSize &&
        item.color === selectedColor
      );

      if (existingItemIndex !== -1) {
        const updatedCart = [...prev];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: (updatedCart[existingItemIndex].quantity || 1) + (product.quantity || 1)
        };
        return updatedCart;
      }

      return [...prev, { ...product, quantity: product.quantity || 1, size: selectedSize, color: selectedColor }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart((prev) => prev.filter((item) =>
      !((item._id || item.id) === productId && item.size === size && item.color === color)
    ));
  };

  const updateCartQuantity = (productId: string, size: string, color: string, newQty: number) => {
    if (newQty < 1) return removeFromCart(productId, size, color);
    setCart((prev) =>
      prev.map((item) =>
        (item._id || item.id) === productId && item.size === size && item.color === color
          ? { ...item, quantity: newQty }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    if (!user) localStorage.removeItem('eloria_cart');
  };

  /**
   * Order Now — adds product to cart (merging quantities for same SKU)
   * then navigates to /checkout without opening the cart drawer.
   * Caller must pass the react-router navigate function.
   */
  const orderNow = (product: any, navigateFn: (path: string) => void) => {
    const productId    = product._id || product.id;
    const selectedSize  = product.size  || 'Standard';
    const selectedColor = product.color || 'Default';

    setCart((prev) => {
      const existingIdx = prev.findIndex((item: any) =>
        (item._id || item.id) === productId &&
        item.size  === selectedSize &&
        item.color === selectedColor
      );
      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: (updated[existingIdx].quantity || 1) + (product.quantity || 1)
        };
        return updated;
      }
      return [...prev, { ...product, quantity: product.quantity || 1, size: selectedSize, color: selectedColor }];
    });

    navigateFn('/checkout');
  };

  const loginSync = (data: any) => {
    setUser(data.user);
    localStorage.setItem('eloria_token', data.token);

    if (data.user.wishlist) setWishlist(data.user.wishlist);
    if (data.user.cart) setCart(normalizeCart(data.user.cart));

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

  const updateUserProfile = (updatedData: any) => {
    setUser((prev: any) => ({ ...prev, ...updatedData }));
  };

  return (
    <StoreContext.Provider value={{
      wishlist,
      cart,
      user,
      isAuthOpen,
      isSearchOpen,
      isCartOpen,

      // State Setters
      setIsAuthOpen,
      setIsSearchOpen,
      setIsCartOpen,

      // Logic Functions
      toggleWishlist,
      removeFromWishlist,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      loginSync,
      logout,
      updateUserProfile,
      orderNow
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