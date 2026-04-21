import ProductCard from './ProductCard';

interface ProductGridProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
  maxItems: number;
  columns?: number;
  featureImage?: string;
  featureLabel?: string;
  reverse?: boolean;
}

export default function ProductGrid({
  title, products = [], maxItems, columns = 4, featureImage, featureLabel, reverse
}: ProductGridProps) {

  const displayItems = products.slice(0, maxItems - 1);

  if (products.length > 0) {
    displayItems.push({
      id: `view-more-${title}`,
      isViewMore: true,
      image: products[0]?.image,
      categoryTarget: title.toLowerCase().trim().replace(/\s+/g, '-')
    });
  }
  return (
    <section className="mb-10">
      {/* beige Title Bar */}
      <div className="w-full bg-[#fdf3e7] py-2.5 mb-5 text-center">
        <h2 className="text-xs md:text-sm font-bold tracking-[0.4em] text-[#d48d3b] uppercase">
          {title}
        </h2>
      </div>

      {/* Main Container: Flex-col on mobile, Flex-row on desktop */}
      <div className={`max-w-[1440px] mx-auto px-4 flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-4`}>

        {/* RESPONSIVE FEATURE BANNER */}
        {featureImage && (
          <div className="w-full lg:w-1/4 relative group overflow-hidden bg-gray-100 rounded-sm">
            {/* 
               MOBILE/TAB: aspect-[16/7] (Wide and short)
               DESKTOP: aspect-auto lg:h-full (Tall)
            */}
            <div className="relative aspect-[16/7] lg:aspect-auto lg:h-full min-h-[180px]">
              <img
                src={featureImage}
                className="absolute inset-0 w-full h-full object-cover object-top"
                alt="feature"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex flex-col justify-end items-center pb-6 text-white text-center">
                <h3 className="text-lg md:text-xl lg:text-2xl font-serif drop-shadow-lg px-2">
                  {featureLabel}
                </h3>
                {/* Optional decorative line */}
                <div className="w-10 h-0.5 bg-white/60 mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCT GRID */}
        <div className={`${featureImage ? 'lg:w-3/4' : 'w-full'} grid grid-cols-2 md:grid-cols-4 ${columns === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-4'} gap-2 md:gap-3`}>
          {displayItems.map((p) => (
            <ProductCard key={p._id || p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}