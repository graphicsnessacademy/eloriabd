/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';
import { trackEvent } from '../utils/tracker';

const StoreContext = createContext<any>(null);

// Normalize cart items coming from MongoDB (productId) → frontend format (_id)
// FIX: Ensure product IDs are strictly treated as strings
const normalizeCart = (cartItems: any[]) =>
  cartItems.map((item: any) => {
    const rawPid = item._id || item.productId;
    const pid = String(rawPid);
    return {
      ...item,
      _id: pid,
      id: pid,
    };
  });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<unknown[]>([]);
  const [user, setUser] = useState<unknown>(null);
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
      if (savedCart) setCart(normalizeCart(JSON.parse(savedCart)));

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
            if (userData.wishlist) setWishlist(userData.wishlist.map((id: any) => String(id)));
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
    const pid = String(productId);
    setWishlist((prev) => {
      const isRemoving = prev.includes(pid);
      if (!isRemoving) trackEvent('add_to_wishlist', { productId: pid });
      return isRemoving
        ? prev.filter((id) => String(id) !== pid)
        : [...prev, pid];
    });
  };

  const removeFromWishlist = (productId: string) => {
    const pid = String(productId);
    setWishlist((prev) => prev.filter((id) => String(id) !== pid));
  };

  const addToCart = (product: any) => {
    const productId = String(product._id || product.id);
    const selectedSize = product.size || 'Standard';
    const selectedColor = product.color || 'Default';

    setCart((prev) => {
      const existingItemIndex = prev.findIndex((item: any) =>
        String(item._id || item.id) === productId &&
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

      return [...prev, { 
        ...product, 
        _id: productId,
        id: productId,
        quantity: product.quantity || 1, 
        size: selectedSize, 
        color: selectedColor 
      }];
    });

    trackEvent('add_to_cart', {
      productId,
      size: selectedSize,
      color: selectedColor,
      quantity: product.quantity || 1
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    const pid = String(productId);
    setCart((prev) => prev.filter((item) =>
      !(String(item._id || item.id) === pid && item.size === size && item.color === color)
    ));
  };

  const updateCartQuantity = (productId: string, size: string, color: string, newQty: number) => {
    const pid = String(productId);
    if (newQty < 1) return removeFromCart(pid, size, color);
    setCart((prev) =>
      prev.map((item) =>
        String(item._id || item.id) === pid && item.size === size && item.color === color
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
    const productId = String(product._id || product.id);
    const selectedSize = product.size || 'Standard';
    const selectedColor = product.color || 'Default';

    setCart((prev) => {
      const existingIdx = prev.findIndex((item: any) =>
        String(item._id || item.id) === productId &&
        item.size === selectedSize &&
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
      return [...prev, { 
        ...product, 
        _id: productId,
        id: productId,
        quantity: product.quantity || 1, 
        size: selectedSize, 
        color: selectedColor 
      }];
    });

    trackEvent('add_to_cart', {
      productId,
      size: selectedSize,
      color: selectedColor,
      quantity: product.quantity || 1
    });

    navigateFn('/checkout');
  };

  const loginSync = (data: any) => {
    setUser(data.user);
    localStorage.setItem('eloria_token', data.token);

    if (data.user.wishlist) setWishlist(data.user.wishlist.map((id: any) => String(id)));
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