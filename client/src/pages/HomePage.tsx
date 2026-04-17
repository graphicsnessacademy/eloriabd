import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import ProductGrid from '../components/ProductGrid';
import CountdownBanner from '../components/CountdownBanner';

interface HomePageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
}

export default function HomePage({ products }: HomePageProps) {
  // Filter Data for specific home sections
  const newArrivals = products.filter(p => p.category === 'New Arrival' || p.isNewProduct);
  const kurtis = products.filter(p => p.category === 'Kurti');
  const tshirts = products.filter(p => p.category === 'T-Shirt');
  const bestSellers = products.filter(p => p.category === 'Best Seller' || p.isBestSeller);

  return (
    <main className="pt-[68px]">
      <Hero />
      <TrustBar />

      {/* 1. NEW ARRIVAL - Max 18, 6 Columns */}
      <ProductGrid
        title="NEW ARRIVAL"
        products={newArrivals}
        maxItems={18}
        columns={6}
      />

      {/* 2. THE KURTI - Max 8, 4 Columns, Banner Left */}
      <ProductGrid
        title="THE KURTI"
        products={kurtis}
        maxItems={8}
        columns={4}
        featureImage="https://images.unsplash.com/photo-1693988102135-ffbe05f056ec?q=80&w=800"
        featureLabel="Kurti, Tunic & Tops"
      />

      {/* 3. T-SHIRT - Max 8, 4 Columns, Banner Right */}
      <ProductGrid
        title="T-SHIRT"
        products={tshirts}
        maxItems={8}
        columns={4}
        featureImage="https://images.unsplash.com/photo-1622445275992-e7efb32d2257?q=80&w=800"
        featureLabel="Women's Designer T-shirt"
        reverse={true}
      />

      {/* 4. BEST SELLER - Max 12, 6 Columns */}
      <ProductGrid
        title="BEST SELLER"
        products={bestSellers}
        maxItems={12}
        columns={6}
      />
    <CountdownBanner 
  targetDate="2026-04-20T23:59:59" 
  isVisible={true} 
/>
    </main>
  );
}