// client/src/App.tsx
// PERFORMANCE CHANGES:
// 1. Switched from sessionStorage → localStorage — sessionStorage clears on tab
//    close so every new tab was a cold fetch. localStorage persists across sessions,
//    making repeat visits truly instant.
// 2. Cache TTL increased from 5 min → 10 min — products don't change every 5 min.
// 3. Stale-while-revalidate pattern preserved — show cached data IMMEDIATELY,
//    then silently refresh in background so next visit gets fresh data.
// 4. Added cache version key — increment CACHE_VER when product schema changes
//    to bust stale cache automatically without touching user's browser manually.

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

// Bump CACHE_VER when the product schema changes to auto-bust stale cache
const CACHE_VER = 'v2';
const CACHE_KEY = `eloria_products_${CACHE_VER}`;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function readCache(): any[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts < CACHE_TTL && Array.isArray(data) && data.length > 0) return data;
  } catch { /* parse error — ignore */ }
  return [];
}

function writeCache(data: any[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL && Array.isArray(data) && data.length > 0;
  } catch { return false; }
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname, search: location.search });
  }, [location]);
  return null;
}

export default function App() {
  // Initialise synchronously from cache — products available on first render,
  // no loading state, no blank screen, no spinner.
  const [products, setProducts] = useState<any[]>(() => readCache());

  useEffect(() => {
    // If cache is still fresh — show stale data immediately, fetch in background
    // so the NEXT visit gets updated data (stale-while-revalidate).
    const fetchProducts = () => {
      api.get('/api/products')
        .then(res => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setProducts(res.data);
            writeCache(res.data);
          }
        })
        .catch(err => console.error('[App] Products fetch error:', err));
    };

    if (isCacheFresh()) {
      // Cache hit — show instantly, but revalidate silently in background
      // so cache is refreshed before it expires
      fetchProducts();
    } else {
      // Cache miss or expired — fetch immediately
      fetchProducts();
    }
  }, []);

  return (
    <SiteConfigProvider>
      <Router>
        <PageTracker />
        <WhatsAppButton />
        <div className="min-h-screen bg-white">
          <Header />
          <PopupAd />
          <Routes>
            <Route path="/"             element={<HomePage        products={products} />} />
            <Route path="/shop"         element={<ShopPage        products={products} />} />
            <Route path="/shop/:category" element={<ShopPage      products={products} />} />
            <Route path="/search"       element={<SearchPage      products={products} />} />
            <Route path="/wishlist"     element={<WishlistPage    products={products} />} />
            <Route path="/product/:id"  element={<ProductDetailPage products={products} />} />
            <Route path="/account"      element={<AccountPage     products={products} />} />
            <Route path="/checkout"     element={<CheckoutPage />} />
            <Route path="/pages/:slug"  element={<StaticPage />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </SiteConfigProvider>
  );
}