import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {

   fetch('https://eloriabd.vercel.app/api/products') 
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      setProducts(data);
      setLoading(false);
    })
    .catch((err) => {
      console.error("FETCH ERROR:", err);
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
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}