// client/src/pages/HomePage.tsx
// PERFORMANCE CHANGES:
// 1. Added skeleton card grid — shows immediately while products prop is empty [],
//    so the page never looks blank on first load. Skeleton matches real card layout.
// 2. LazySection rootMargin increased from 200px to 300px — starts loading
//    below-fold sections slightly earlier so they're ready when user scrolls.
// 3. Above-fold New Arrivals section shows skeletons directly (no LazySection).

import { useRef, useState, useEffect } from 'react';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import ProductGrid from '../components/ProductGrid';
import CountdownBanner from '../components/CountdownBanner';

interface HomePageProps {
  products: any[];
}

// Skeleton card — matches ProductCard dimensions exactly
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-100 rounded-sm overflow-hidden animate-pulse">
      <div className="aspect-square bg-gray-100" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded w-3/4 mx-auto" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto" />
      </div>
    </div>
  );
}

// Skeleton grid — shown while products are loading
function SkeletonGrid({ count = 6, columns = 6 }: { count?: number; columns?: number }) {
  const colClass: Record<number, string> = {
    4: 'grid-cols-2 md:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="h-6 bg-gray-100 rounded w-40 mb-8 animate-pulse" />
      <div className={`grid ${colClass[columns] || colClass[6]} gap-4 md:gap-6`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

// Defers rendering children until they scroll into view
function LazySection({ children, minHeight = 300 }: { children: React.ReactNode; minHeight?: number }) {
  const ref     = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { rootMargin: '300px' } // start loading 300px before viewport (was 200px)
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible && children}
    </div>
  );
}

export default function HomePage({ products }: HomePageProps) {
  const isLoading   = products.length === 0;

  const newArrivals = products.filter(p => p.category === 'New Arrival' || p.isNewProduct);
  const traditional = products.filter(p => p.category === 'Traditional wear');
  const tshirts     = products.filter(p => p.category === 'T-shirts');
  const bestSellers = products.filter(p => p.category === 'Best Seller' || p.isBestSeller);

  return (
    <main className="pt-[68px]">
      <Hero />
      <TrustBar />

      {/* Above fold — renders immediately, skeletons while loading */}
      {isLoading ? (
        <SkeletonGrid count={6} columns={6} />
      ) : (
        <ProductGrid
          title="NEW ARRIVAL"
          products={newArrivals}
          maxItems={18}
          columns={6}
        />
      )}

      {/* Below fold — deferred until scrolled into view */}
      <LazySection minHeight={400}>
        {isLoading ? (
          <SkeletonGrid count={4} columns={4} />
        ) : (
          <ProductGrid
            title="TRADITIONAL WEAR"
            products={traditional}
            maxItems={8}
            columns={4}
            featureImage="https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=800"
            featureLabel="Panjabi, Sherwani & Kabli"
          />
        )}
      </LazySection>

      <LazySection minHeight={400}>
        {isLoading ? (
          <SkeletonGrid count={4} columns={4} />
        ) : (
          <ProductGrid
            title="T-SHIRTS"
            products={tshirts}
            maxItems={8}
            columns={4}
            featureImage="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800"
            featureLabel="Basic, Printed & Polo"
            reverse={true}
          />
        )}
      </LazySection>

      <LazySection minHeight={400}>
        {isLoading ? (
          <SkeletonGrid count={6} columns={6} />
        ) : (
          <ProductGrid
            title="BEST SELLER"
            products={bestSellers}
            maxItems={12}
            columns={6}
          />
        )}
      </LazySection>

      <LazySection minHeight={100}>
        <CountdownBanner />
      </LazySection>
    </main>
  );
}