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
import { SiteConfigProvider } from './context/SiteConfigContext';
import { trackEvent } from './utils/tracker';

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_view', { path: location.pathname, search: location.search });
  }, [location]);

  return null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { console.error("Fetch Error:", err); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="mb-4">
          <h1 className="text-4xl font-serif tracking-[0.3em] animate-pulse text-gray-900">ELORIA</h1>
        </div>
        <div className="w-48 h-[1px] bg-gray-100 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#534AB7] animate-loading-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <SiteConfigProvider>
      <Router>
        <PageTracker />
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