import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import ProductCard from '../components/ProductCard';

export default function SearchPage({ products }: { products: any[] }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const results = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, query]);

  return (
    <div className="pt-[72px] min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 border-b pb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search Results for:</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 uppercase underline decoration-eloria-lavender underline-offset-8">
            "{query}"
          </h1>
          <p className="mt-4 text-sm text-gray-500">{results.length} products found</p>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-serif text-gray-400 italic">We couldn't find anything matching your search.</h2>
            <p className="text-gray-400 mt-2">Try checking for typos or using broader keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}