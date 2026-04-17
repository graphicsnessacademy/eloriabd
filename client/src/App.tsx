import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import WishlistPage from './pages/WishlistPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AccountPage from './pages/AccountPage';
import CheckoutPage from './pages/CheckoutPage';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = 'https://eloriabd.vercel.app';

  useEffect(() => {
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setLoading(false);
      });
  }, []);
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center font-serif text-eloria-purple text-xl animate-pulse">
        ELORIA...
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />

        {/* Navigation Routes */}
        <Routes>
          <Route path="/" element={<HomePage products={products} />} />
          <Route path="/shop" element={<ShopPage products={products} />} />
          <Route path="/shop/:category" element={<ShopPage products={products} />} />
          <Route path="/search" element={<SearchPage products={products} />} />
          <Route path="/wishlist" element={<WishlistPage products={products} />} />
          <Route path="/product/:id" element={<ProductDetailPage products={products} />} />
          <Route path="/account" element={<AccountPage products={products} />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          

        </Routes>

        <Footer />
      </div>
    </Router>
  );
}