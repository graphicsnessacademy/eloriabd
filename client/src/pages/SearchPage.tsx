import { useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import Fuse from 'fuse.js';
import ProductCard from '../components/ProductCard';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SearchPage({ products }: { products: any[] }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // ── Fuse instance (rebuilt only when products change) ──────────────────────
  const fuse = useMemo(
    () =>
      new Fuse(products, {
        // Fields to search across — add "description" here if your product has one
        keys: [
          { name: 'name', weight: 0.6 },  // Product title matters most
          { name: 'category', weight: 0.3 },  // Category second
          { name: 'description', weight: 0.1 },  // Description if present
        ],

        // ── Fuzzy tuning ─────────────────────────────────────────────────────
        threshold: 0.4,        // 0 = exact only, 1 = match everything. 0.4 is forgiving without being noisy.
        distance: 200,         // How far into the string to look for a match pattern
        minMatchCharLength: 2, // Ignore single-character noise
        ignoreLocation: true,  // Don't penalise matches that appear late in the string
        useExtendedSearch: false,

        // Returns match positions (useful for highlighting later if needed)
        includeMatches: true,
        includeScore: true,
      }),
    [products]
  );

  // ── Run search ─────────────────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!query.trim()) return products; // Empty query → show everything

    const raw = fuse.search(query);

    // Sort is already by score (best first). Unwrap the item.
    return raw.map((r: any) => r.item);
  }, [fuse, products, query]);

  return (
    <div className="pt-[72px] min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 border-b pb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Search Results for:
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 uppercase underline decoration-eloria-lavender underline-offset-8">
            "{query}"
          </h1>
          <p className="mt-4 text-sm text-gray-500">
            {results.length} {results.length === 1 ? 'product' : 'products'} found
          </p>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {results.map((product: any) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <h2 className="text-2xl font-serif text-gray-400 italic">
              We couldn't find anything matching your search.
            </h2>
            <p className="text-gray-400 mt-2">
              Try checking for typos or using broader keywords.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}