// PERFORMANCE FIXES:
// 1. Removed the full-screen loading blocker — app renders immediately,
//    products stream in when ready (pages show skeleton/empty state instead)
// 2. stale-while-revalidate cache — products stored in sessionStorage so
//    repeat visits within the same tab are instant (no network wait)
// 3. Switched from fetch() to the shared axios instance so base URL and
//    interceptors are consistent with the rest of the app

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import WishlistPage from './pages/WishlistPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AccountPage from './pages/AccountPage';
import CheckoutPage from './pages/CheckoutPage';
import { StaticPage } from './pages/StaticPage';
import PopupAd from './components/PopupAd';
import WhatsAppButton from './components/WhatsAppButton';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { trackEvent } from './utils/tracker';
import { api } from './api/axios';

const CACHE_KEY = 'eloria_products_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname, search: location.search });
  }, [location]);
  return null;
}

export default function App() {
  const [products, setProducts] = useState<any[]>(() => {
    // Initialise from cache so products are available synchronously on first render
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });

  useEffect(() => {
    // Check if cache is still fresh — skip network call if so
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL && Array.isArray(data) && data.length > 0) return; // cache hit — no fetch needed
      }
    } catch { /* ignore */ }

    // Fetch in background — does NOT block render
    api.get('/api/products')
      .then(res => {
        setProducts(res.data);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: res.data, ts: Date.now() }));
        } catch { /* quota exceeded — ignore */ }
      })
      .catch(err => console.error('Products fetch error:', err));
  }, []);

  // NO loading spinner — app renders immediately with empty products ([])
  // Each page handles its own empty/skeleton state

  return (
    <SiteConfigProvider>
      <Router>
        <PageTracker />
        <WhatsAppButton />
        <div className="min-h-screen bg-white">
          <Header />
          <PopupAd />
          <Routes>
            <Route path="/" element={<HomePage products={products} />} />
            <Route path="/shop" element={<ShopPage products={products} />} />
            <Route path="/shop/:category" element={<ShopPage products={products} />} />
            <Route path="/search" element={<SearchPage products={products} />} />
            <Route path="/wishlist" element={<WishlistPage products={products} />} />
            <Route path="/product/:id" element={<ProductDetailPage products={products} />} />
            <Route path="/account" element={<AccountPage products={products} />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/pages/:slug" element={<StaticPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </SiteConfigProvider>
  );
}