import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';

interface ShopPageProps {
  products: any[];
}

export default function ShopPage({ products }: ShopPageProps) {
  const { category } = useParams();
  const navigate = useNavigate();

  // States for filters
  const [priceRange, setPriceRange] = useState(10000);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [openFilters, setOpenFilters] = useState({ price: true, type: true, size: true });

  // 1. DYNAMIC HEADER TITLE LOGIC
  // Converts "new-arrival" -> "NEW ARRIVAL" or "t-shirt" -> "T-SHIRT"
  const getPageTitle = () => {
    if (!category || category === 'all') return "ALL COLLECTIONS";
    return category.replace(/-/g, ' ').toUpperCase();
  };

  // 2. ADVANCED SEARCH & FILTER LOGIC
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Logic A: URL Category Match (Acts like a search keyword)
      let categoryMatch = true;
      if (category && category !== 'all') {
        const searchKey = category.toLowerCase();
        
        if (searchKey === 'new-arrival') {
          // Show products marked as New
          categoryMatch = p.isNewProduct === true || p.category?.toLowerCase() === 'new arrival';
        } else if (searchKey === 'best-seller') {
          // Show products marked as Best Seller
          categoryMatch = p.isBestSeller === true || p.category?.toLowerCase() === 'best seller';
        } else {
          // Match by exact category name (e.g., "kurti" or "t-shirt")
          categoryMatch = p.category?.toLowerCase().replace(/\s+/g, '-') === searchKey;
        }
      }

      // Logic B: Sidebar Price Slider
      const priceMatch = p.price <= priceRange;

      // Logic C: Sidebar Checkboxes
      const typeMatch = selectedTypes.length > 0 
        ? selectedTypes.includes(p.category) 
        : true;

      return categoryMatch && priceMatch && typeMatch;
    });
  }, [products, category, priceRange, selectedTypes]);

  // Handle Filter Toggles
  const toggleFilter = (section: 'price' | 'type' | 'size') => {
    setOpenFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // RESET FUNCTION: Clears filters and URL
  const handleReset = () => {
    setPriceRange(10000);
    setSelectedTypes([]);
    navigate('/shop'); 
  };

  return (
    <div className="pt-[72px] bg-white">
      {/* --- DYNAMIC PAGE HEADER --- */}
      <div className="bg-[#f3f4f7] py-14 px-6 border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 tracking-tight transition-all duration-500">
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

      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-12">
        
        {/* --- SIDEBAR FILTERS --- */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="flex items-center justify-between mb-8 border-b border-black pb-2">
            <h2 className="text-xl font-serif font-medium">Filters</h2>
            <button 
              onClick={handleReset}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black underline underline-offset-4 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="space-y-6">
            {/* PRICE FILTER */}
            <div className="border-b border-gray-100 pb-6">
              <button onClick={() => toggleFilter('price')} className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-[0.2em] text-gray-800 mb-4">
                Price {openFilters.price ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
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
              <button onClick={() => toggleFilter('type')} className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-[0.2em] text-gray-800 mb-4">
                Product Type {openFilters.type ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
              {openFilters.type && (
                <div className="space-y-3">
                  {['Saree', 'Kurti', 'T-Shirt', 'Gown'].map((type) => (
                    <label key={type} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                          checked={selectedTypes.includes(type)}
                          onChange={() => {
                            setSelectedTypes(prev => 
                              prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                            )
                          }}
                        />
                        <span className="text-sm text-gray-600 group-hover:text-black transition-colors">{type}</span>
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold">(24)</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* SIZE FILTER */}
            <div className="border-b border-gray-100 pb-6">
              <button onClick={() => toggleFilter('size')} className="flex items-center justify-between w-full text-xs font-bold uppercase tracking-[0.2em] text-gray-800 mb-4">
                Size {openFilters.size ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              </button>
              {openFilters.size && (
                <div className="space-y-3">
                  {['S', 'M', 'L', 'XL', '2XL'].map((size) => (
                    <label key={size} className="flex items-center justify-between group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black" />
                        <span className="text-sm text-gray-600 group-hover:text-black transition-colors">{size}</span>
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold">(12)</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* --- MAIN PRODUCT GRID --- */}
        <div className="flex-grow">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Showing 1–{filteredProducts.length} of {filteredProducts.length} results
            </p>
            
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sort By</span>
              <select className="text-xs font-bold border-none bg-transparent focus:ring-0 cursor-pointer uppercase tracking-tighter outline-none">
                <option>Latest</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Optimized Grid Layout */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-32 text-center">
              <p className="text-xl font-serif text-gray-400 italic">No products found for this search.</p>
              <button onClick={handleReset} className="mt-4 text-eloria-purple text-xs font-bold uppercase tracking-widest">Clear search filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}