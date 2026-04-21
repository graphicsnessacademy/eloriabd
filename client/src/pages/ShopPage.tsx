import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Filter, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import CountdownBanner from '../components/CountdownBanner';
import { CATEGORIES } from '../constants/categories';

interface ShopPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const normalize = (s: string): string =>
  (s || '').toLowerCase().replace(/[\s\-_]+/g, '');

const fuzzyMatch = (field: string, keyword: string): boolean => {
  if (!field || !keyword) return false;
  const nField = normalize(field);
  const nKey = normalize(keyword);
  return nField.includes(nKey) || nKey.includes(nField);
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

interface FilterContentProps {
  openFilters: { price: boolean; type: boolean; size: boolean };
  setOpenFilters: React.Dispatch<React.SetStateAction<{ price: boolean; type: boolean; size: boolean }>>;
  priceRange: number;
  setPriceRange: React.Dispatch<React.SetStateAction<number>>;
  selectedTypes: string[];
  toggleType: (type: string) => void;
}

const FilterContent = ({
  openFilters,
  setOpenFilters,
  priceRange,
  setPriceRange,
  selectedTypes,
  toggleType
}: FilterContentProps) => (
  <div className="space-y-8">
    <div className="border-b border-gray-100 pb-6">
      <button
        onClick={() => setOpenFilters((f) => ({ ...f, price: !f.price }))}
        className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
      >
        Price {openFilters.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {openFilters.price && (
        <div className="px-2">
          <input
            type="range" min="0" max="15000" step="100"
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            value={priceRange}
            onChange={(e) => setPriceRange(parseInt(e.target.value))}
          />
          <p className="text-[11px] mt-4 text-gray-500 font-medium">
            Max Price: <span className="text-black font-bold">Tk {priceRange.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>

    <div className="border-b border-gray-100 pb-6">
      <button
        onClick={() => setOpenFilters((f) => ({ ...f, type: !f.type }))}
        className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
      >
        Refine Category {openFilters.type ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {openFilters.type && (
        <div className="space-y-3 h-[250px] overflow-y-auto no-scrollbar pr-2">
          {CATEGORIES.map((cat) => (
            <label
              key={cat.name}
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => toggleType(cat.name)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center transition-all ${selectedTypes.includes(cat.name)
                    ? 'bg-black border-black text-white'
                    : 'border-gray-300 group-hover:border-black'
                    }`}
                >
                  {selectedTypes.includes(cat.name) && <Check size={10} />}
                </div>
                <input type="checkbox" className="hidden" readOnly checked={selectedTypes.includes(cat.name)} />
                <span className="text-xs text-gray-600 group-hover:text-black transition-colors">{cat.name}</span>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default function ShopPage({ products = [] }: ShopPageProps) {
  const { category } = useParams();
  const navigate = useNavigate();

  // --- UI States ---
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [openFilters, setOpenFilters] = useState({ price: true, type: true, size: true });
  const [recentViewedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('eloria_recent');
    return saved ? JSON.parse(saved) : [];
  });

  // --- Filter States ---
  const [priceRange, setPriceRange] = useState(15000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState('Latest');



  // --- Logic: 1. Dynamic Header Title ---
  const getPageTitle = () => {
    if (!category || category === 'all') return 'ALL COLLECTIONS';
    return category.replace(/-/g, ' ').toUpperCase();
  };

  // --- Logic: 2. Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      let matchesUrlKeyword = true;

      if (category && category !== 'all' && selectedTypes.length === 0) {
        const searchKey = category.toLowerCase().replace(/-/g, ' ');

        if (searchKey === 'new arrival') {
          matchesUrlKeyword =
            p.isNewProduct === true ||
            fuzzyMatch(p.category, 'new') ||
            fuzzyMatch(p.category, 'newarrival');
        } else if (searchKey === 'best seller') {
          matchesUrlKeyword =
            p.isBestSeller === true ||
            fuzzyMatch(p.category, 'bestseller') ||
            fuzzyMatch(p.category, 'best');
        } else {
          matchesUrlKeyword =
            fuzzyMatch(p.category, searchKey) ||
            fuzzyMatch(p.name, searchKey);
        }
      }

      let matchesCheckbox = true;
      if (selectedTypes.length > 0) {
        matchesCheckbox = selectedTypes.some(
          (type) =>
            fuzzyMatch(p.category, type) ||
            fuzzyMatch(p.name, type)
        );
      }

      const matchesPrice = (p.price ?? 0) <= priceRange;

      return matchesUrlKeyword && matchesCheckbox && matchesPrice;
    });
  }, [products, category, priceRange, selectedTypes]);

  // --- Logic: 3. Sorting ---
  const sortedProducts = useMemo(() => {
    const result = [...filteredProducts];
    if (sortOption === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort((a, b) =>
        (b._id || b.id || '').localeCompare(a._id || a.id || '')
      );
    }
    return result;
  }, [filteredProducts, sortOption]);

  // --- Logic: 4. Extra Sections (Related & Recent) ---
  const recentProducts = useMemo(() =>
    products.filter((p) => recentViewedIds.includes((p._id || p.id) as string)).slice(0, 6),
    [recentViewedIds, products]
  );

  const relatedProducts = useMemo(() => {
    // If we are in a category, show more from that category. 
    // If not, show best sellers as "Related Masterpieces"
    const baseList = category
      ? products.filter(p => fuzzyMatch(p.category, category))
      : products.filter(p => p.isBestSeller);

    return baseList.slice(0, 5);
  }, [products, category]);

  const handleReset = () => {
    setPriceRange(15000);
    setSelectedTypes([]);
    setSortOption('Latest');
    navigate('/shop');
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };



  return (
    <div className="pt-[72px] bg-white min-h-screen">
      <div className="bg-[#f3f4f7] py-12 md:py-16 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight uppercase">{getPageTitle()}</h1>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
            {category && <><span>/</span><span className="text-eloria-purple">{category.replace(/-/g, ' ')}</span></>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Mobile Filter Bar */}
        <div className="flex lg:hidden items-center justify-between border border-gray-100 p-4 mb-8 bg-gray-50/50 sticky top-[75px] z-40 backdrop-blur-md">
          <button onClick={() => setIsFilterDrawerOpen(true)} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-700">
            <Filter size={16} className="text-eloria-purple" /> Filters {selectedTypes.length > 0 && `(${selectedTypes.length})`}
          </button>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="text-[10px] font-bold border-none bg-transparent outline-none">
            <option>Latest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-2">
              <h2 className="text-xl font-serif font-medium uppercase tracking-tight text-eloria-dark">Filters</h2>
              <button onClick={handleReset} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black underline underline-offset-4">Reset</button>
            </div>
            <FilterContent 
              openFilters={openFilters}
              setOpenFilters={setOpenFilters}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              selectedTypes={selectedTypes}
              toggleType={toggleType}
            />
          </aside>

          <div className="flex-grow">
            <div className="hidden lg:flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Showing {sortedProducts.length} results</p>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="text-xs font-bold border-none bg-transparent cursor-pointer uppercase outline-none pr-8">
                <option>Latest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {sortedProducts.map((p) => <ProductCard key={p._id || p.id} product={p} />)}
            </div>

            {sortedProducts.length === 0 && (
              <div className="py-32 text-center">
                <p className="text-xl font-serif text-gray-400 italic">No products found for this selection.</p>
                <button onClick={handleReset} className="mt-4 text-eloria-purple text-xs font-bold uppercase tracking-widest underline underline-offset-4">Reset all filters</button>
              </div>
            )}

          </div>

        </div>



        {/* --- 1. RELATED MASTERPIECES (CENTERED GRID) --- */}
        <div className="mt-24 text-center border-t border-gray-100 pt-20">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl font-serif text-gray-900 mb-2">Related Masterpieces</h2>
            <div className="w-12 h-0.5 bg-eloria-lavender"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p._id || p.id} product={p} />
            ))}
          </div>
        </div>

        {/* --- 2. RECENTLY VIEWED (HORIZONTAL SCROLL) --- */}

        {recentProducts.length > 0 && (
          <div className="mt-24 text-center border-t border-gray-100 pt-20">
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-3xl font-serif text-gray-900 mb-2">Recently Viewed Products</h2>
              <div className="w-12 h-0.5 bg-eloria-lavender"></div>
            </div>
            <div className="flex overflow-x-auto gap-6 no-scrollbar pb-6">
              {recentProducts.map(p => (
                <div key={p._id || p.id} className="min-w-[200px] w-[200px] flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterDrawerOpen(false)} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed left-0 top-0 h-full w-[85%] max-w-sm bg-white z-[150] shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-serif font-bold uppercase tracking-tight">Refine By</h2>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 text-gray-400 hover:text-black"><X size={24} /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 no-scrollbar">
                <FilterContent 
                  openFilters={openFilters}
                  setOpenFilters={setOpenFilters}
                  priceRange={priceRange}
                  setPriceRange={setPriceRange}
                  selectedTypes={selectedTypes}
                  toggleType={toggleType}
                />
              </div>
              <div className="p-6 border-t border-gray-100 grid grid-cols-2 gap-4 bg-gray-50">
                <button onClick={handleReset} className="py-4 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 rounded-sm">Clear All</button>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">Show Results</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CountdownBanner targetDate="2026-05-30T23:59:59" isVisible={true} />
    </div>
  );
}