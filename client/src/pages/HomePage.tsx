// PERFORMANCE FIX:
// Below-fold ProductGrids (Traditional, T-Shirts, Best Seller) now only
// mount when they enter the viewport using IntersectionObserver.
// New Arrivals renders immediately (above the fold).

import { useRef, useState, useEffect } from 'react';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import ProductGrid from '../components/ProductGrid';
import CountdownBanner from '../components/CountdownBanner';

interface HomePageProps {
  products: any[];
}

// Wrapper that defers rendering children until they scroll into view
function LazySection({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' } // start loading 200px before entering viewport
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reserve approximate height so page doesn't jump when content loads
  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : '300px' }}>
      {visible && children}
    </div>
  );
}

export default function HomePage({ products }: HomePageProps) {
  const newArrivals  = products.filter(p => p.category === 'New Arrival' || p.isNewProduct);
  const traditional  = products.filter(p => p.category === 'Traditional wear');
  const tshirts      = products.filter(p => p.category === 'T-shirts');
  const bestSellers  = products.filter(p => p.category === 'Best Seller' || p.isBestSeller);

  return (
    <main className="pt-[68px]">
      <Hero />
      <TrustBar />

      {/* Above fold — renders immediately */}
      <ProductGrid
        title="NEW ARRIVAL"
        products={newArrivals}
        maxItems={18}
        columns={6}
      />

      {/* Below fold — deferred until scrolled into view */}
      <LazySection>
        <ProductGrid
          title="TRADITIONAL WEAR"
          products={traditional}
          maxItems={8}
          columns={4}
          featureImage="https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=800"
          featureLabel="Panjabi, Sherwani & Kabli"
        />
      </LazySection>

      <LazySection>
        <ProductGrid
          title="T-SHIRTS"
          products={tshirts}
          maxItems={8}
          columns={4}
          featureImage="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800"
          featureLabel="Basic, Printed & Polo"
          reverse={true}
        />
      </LazySection>

      <LazySection>
        <ProductGrid
          title="BEST SELLER"
          products={bestSellers}
          maxItems={12}
          columns={6}
        />
      </LazySection>

      <LazySection>
        <CountdownBanner />
      </LazySection>
    </main>
  );
}