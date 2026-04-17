import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Filter, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import CountdownBanner from '../components/CountdownBanner';

interface ShopPageProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** "New Arrival" → "new-arrival", "T-Shirt" → "t-shirt" */
const toSlug = (str: string) =>
  (str ?? '').toLowerCase().trim().replace(/\s+/g, '-');

/** Case-insensitive equality */
const ciEquals = (a: string = '', b: string = '') =>
  a.toLowerCase().trim() === b.toLowerCase().trim();

/** Special URL slugs that map to boolean flags, not a category string */
const SPECIAL_SLUGS = ['new-arrival', 'best-seller'];

// ─── Filter Sidebar Content (extracted to avoid re-creation inside render) ──

interface FilterContentProps {
  openFilters: { price: boolean; type: boolean; size: boolean };
  toggleSection: (s: 'price' | 'type' | 'size') => void;
  priceRange: number;
  setPriceRange: (v: number) => void;
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  availableTypes: string[];
}

function FilterContent({
  openFilters, toggleSection,
  priceRange, setPriceRange,
  selectedTypes, setSelectedTypes,
  selectedSizes, setSelectedSizes,
  availableTypes,
}: FilterContentProps) {
  const SIZES = ['S', 'M', 'L', 'XL', '2XL'];

  // Use TYPES passed from parent (dynamic from DB), fallback to static list
  const TYPES = availableTypes.length > 0
    ? availableTypes
    : ['Saree', 'Kurti', 'T-Shirt', 'Gown', 'Western', 'Party Wear'];

  const toggleType = (type: string) =>
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);

  const toggleSize = (size: string) =>
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);

  return (
    <div className="space-y-8">
      {/* PRICE FILTER */}
      <div className="border-b border-gray-100 pb-6">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-[0.2em] text-gray-800 mb-4"
        >
          Price {openFilters.price ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {openFilters.price && (
          <div className="px-2">
            <input
              type="range" min="0" max="10000" step="100"
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              value={priceRange}
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
            />
            <p className="text-[11px] mt-4 text-gray-500 font-medium">
              Price: <span className="text-black font-bold">Tk 0 — Tk {priceRange.toLocaleString()}</span>
            </p>
          </div>
        )}
      </div>

      {/* PRODUCT TYPE FILTER */}
      <div className="border-b border-gray-100 pb-6">
        <button
          onClick={() => toggleSection('type')}
          className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-[0.2em] text-gray-800 mb-4"
        >
          Product Type {openFilters.type ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {openFilters.type && (
          <div className="space-y-3">
            {TYPES.map((type) => (
              <label key={type} className="flex items-center gap-3 group cursor-pointer select-none">
                <div
                  className={`w-4 h-4 border rounded flex items-center justify-center transition-all shrink-0 ${
                    selectedTypes.includes(type) ? 'bg-black border-black text-white' : 'border-gray-300'
                  }`}
                  onClick={() => toggleType(type)}
                >
                  {selectedTypes.includes(type) && <Check size={10} />}
                </div>
                <input
                  type="checkbox" className="hidden"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleType(type)}
                />
                <span className="text-sm text-gray-600 group-hover:text-black transition-colors">{type}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* SIZE FILTER */}
      <div className="pb-6">
        <button
          onClick={() => toggleSection('size')}
          className="flex items-center justify-between w-full text-[11px] font-bold uppercase tracking-[0.2em] text-gray-800 mb-4"
        >
          Size {openFilters.size ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {openFilters.size && (
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className={`w-10 h-10 border text-[10px] font-bold transition-all rounded-sm uppercase ${
                  selectedSizes.includes(size)
                    ? 'bg-black border-black text-white'
                    : 'border-gray-200 text-gray-400 hover:border-black'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ShopPage({ products = [] }: ShopPageProps) {
  const { category } = useParams();
  const navigate = useNavigate();

  // --- States ---
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(10000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState('Latest');
  const [openFilters, setOpenFilters] = useState({ price: true, type: true, size: true });

  const toggleSection = (section: 'price' | 'type' | 'size') =>
    setOpenFilters(prev => ({ ...prev, [section]: !prev[section] }));

  // --- Logic: Page Title ---
  const getPageTitle = () => {
    if (!category || category === 'all') return 'ALL COLLECTIONS';
    return category.replace(/-/g, ' ').toUpperCase();
  };

  // --- Reset sidebar type/size when the URL category changes ---
  // Prevents sidebar filters from conflicting with URL navigation
  useEffect(() => {
    setSelectedTypes([]);
    setSelectedSizes([]);
  }, [category]);

  // --- Unique categories derived from the real product list ---
  const availableTypes = useMemo(() => {
    const seen = new Set<string>();
    const types: string[] = [];
    for (const p of products) {
      const cat = (p.category ?? '').trim();
      // Exclude special flag-based categories from the sidebar list
      if (cat && !SPECIAL_SLUGS.includes(toSlug(cat)) && !seen.has(cat.toLowerCase())) {
        seen.add(cat.toLowerCase());
        types.push(cat); // keep original casing for display
      }
    }
    return types.sort(); // alphabetical
  }, [products]);

  // --- Logic: Advanced Filtering & Sorting ---
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {

      // 1. ── URL Category Match ────────────────────────────────────────────
      //    The URL param uses slugs (e.g. "new-arrival", "saree", "t-shirt").
      //    We compare against the product's `category` field using slugs.
      let categoryMatch = true;
      if (category && category !== 'all') {
        const slug = category.toLowerCase();

        if (slug === 'new-arrival') {
          // Match products flagged as new OR whose category text contains "new arrival"
          categoryMatch =
            p.isNewProduct === true ||
            (p.category ?? '').toLowerCase().includes('new arrival');
        } else if (slug === 'best-seller') {
          categoryMatch =
            p.isBestSeller === true ||
            (p.category ?? '').toLowerCase().includes('best seller');
        } else {
          // Slugify both the URL param and the DB category, then compare.
          // "T-Shirt" → "t-shirt", "Party Wear" → "party-wear"
          categoryMatch = toSlug(p.category ?? '') === slug;
        }
      }

      // 2. ── Price Filter ──────────────────────────────────────────────────
      const priceMatch = p.price <= priceRange;

      // 3. ── Sidebar Type Checkboxes (case-insensitive) ────────────────────
      //    Only active on /shop (no URL category).  When a URL category is
      //    already set, the sidebar type filter is skipped to avoid double-
      //    filtering (which caused "0 results" on category pages).
      const typeMatch =
        category && category !== 'all'
          ? true  // URL category already filters — sidebar type is bypassed
          : selectedTypes.length === 0
            ? true
            : selectedTypes.some(t => ciEquals(p.category, t));

      // 4. ── Size Filter ────────────────────────────────────────────────────
      const sizeMatch =
        selectedSizes.length === 0
          ? true
          : !p.sizes || p.sizes.length === 0
            ? true
            : selectedSizes.some(s => (p.sizes as string[]).some(ps => ciEquals(ps, s)));

      return categoryMatch && priceMatch && typeMatch && sizeMatch;
    });

    // Sort
    if (sortOption === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else {
      result.sort((a, b) => (b._id || b.id || '').localeCompare(a._id || a.id || ''));
    }

    return result;
  }, [products, category, priceRange, selectedTypes, selectedSizes, sortOption]);

  // --- Reset ---
  const handleReset = () => {
    setPriceRange(10000);
    setSelectedTypes([]);
    setSelectedSizes([]);
    setSortOption('Latest');
    navigate('/shop');
  };

  // --- Shared filter props ---
  const filterProps: FilterContentProps = {
    openFilters,
    toggleSection,
    priceRange,
    setPriceRange,
    selectedTypes,
    setSelectedTypes,
    selectedSizes,
    setSelectedSizes,
    availableTypes,
  };

  return (
    <div className="pt-[72px] bg-white min-h-screen">

      {/* --- PAGE HEADER --- */}
      <div className="bg-[#f3f4f7] py-12 md:py-16 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight transition-all duration-500 uppercase">
            {getPageTitle()}
          </h1>
          <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]">
            <Link to="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
            {category && (
              <>
                <span>/</span>
                <span className="text-eloria-purple">{category.replace(/-/g, ' ')}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* --- MOBILE FILTER TRIGGER BAR --- */}
        <div className="flex lg:hidden items-center justify-between border border-gray-100 rounded-sm p-4 mb-8 bg-gray-50/50 sticky top-[75px] z-40 backdrop-blur-md">
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-700"
          >
            <Filter size={16} className="text-eloria-purple" />
            Filters {(selectedTypes.length + selectedSizes.length > 0) && `(${selectedTypes.length + selectedSizes.length})`}
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-gray-400 uppercase">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="text-[10px] font-bold border-none bg-transparent focus:ring-0 uppercase tracking-widest outline-none pr-6"
            >
              <option>Latest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* --- DESKTOP SIDEBAR --- */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="flex items-center justify-between mb-8 border-b border-black pb-2">
              <h2 className="text-xl font-serif font-medium uppercase tracking-tight">Filters</h2>
              <button
                onClick={handleReset}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black underline underline-offset-4 transition-colors"
              >
                Reset
              </button>
            </div>
            <FilterContent {...filterProps} />
          </aside>

          {/* --- PRODUCT GRID --- */}
          <div className="flex-grow">
            {/* Desktop top bar */}
            <div className="hidden lg:flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                Showing {filteredProducts.length} results
              </p>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sort By</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="text-xs font-bold border-none bg-transparent focus:ring-0 cursor-pointer uppercase tracking-tighter outline-none pr-8"
                >
                  <option>Latest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
              </div>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map(p => (
                  <ProductCard key={p._id || p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="py-32 text-center">
                <p className="text-xl font-serif text-gray-400 italic">No products found matching these filters.</p>
                <button
                  onClick={handleReset}
                  className="mt-4 text-eloria-purple text-xs font-bold uppercase tracking-widest underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MOBILE FILTER DRAWER --- */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[140]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-[85%] max-w-sm bg-white z-[150] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <h2 className="text-xl font-serif font-bold uppercase tracking-tight text-eloria-dark">Refine By</h2>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto p-6 no-scrollbar">
                <FilterContent {...filterProps} />
              </div>
              <div className="p-6 border-t border-gray-100 grid grid-cols-2 gap-4 bg-gray-50">
                <button
                  onClick={handleReset}
                  className="py-4 border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-500 rounded-sm hover:bg-white transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="py-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-sm shadow-lg active:scale-95 transition-transform"
                >
                  Show Results
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- FOOTER BANNER --- */}
      <div className="mt-20">
        <CountdownBanner targetDate="2026-04-20T23:59:59" isVisible={true} />
      </div>
    </div>
  );
}