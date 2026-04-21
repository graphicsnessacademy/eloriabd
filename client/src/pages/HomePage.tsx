import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import ProductGrid from '../components/ProductGrid';
import CountdownBanner from '../components/CountdownBanner';

interface HomePageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
}

export default function HomePage({ products }: HomePageProps) {
  const newArrivals = products.filter(p => p.category === 'New Arrival' || p.isNewProduct);
  const traditional = products.filter(p => p.category === 'Traditional wear');
  const tshirts = products.filter(p => p.category === 'T-shirts');
  const bestSellers = products.filter(p => p.category === 'Best Seller' || p.isBestSeller);

  return (
    <main className="pt-[68px]">
      <Hero />
      <TrustBar />

      <ProductGrid
        title="NEW ARRIVAL"
        products={newArrivals}
        maxItems={18}
        columns={6}
      />

      <ProductGrid
        title="TRADITIONAL WEAR"
        products={traditional}
        maxItems={8}
        columns={4}
        featureImage="https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=800"
        featureLabel="Panjabi, Sherwani & Kabli"
      />

      <ProductGrid
        title="T-SHIRTS"
        products={tshirts}
        maxItems={8}
        columns={4}
        featureImage="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800"
        featureLabel="Basic, Printed & Polo"
        reverse={true}
      />

      <ProductGrid
        title="BEST SELLER"
        products={bestSellers}
        maxItems={12}
        columns={6}
      />

      {/* CountdownBanner reads from SiteConfigContext — no props needed */}
      <CountdownBanner />
    </main>
  );
}