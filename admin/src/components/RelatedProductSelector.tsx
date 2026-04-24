import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { api } from '../api/axios';

interface ProductMin {
  _id: string;
  name: string;
  images: { url: string; isPrimary: boolean }[];
  image?: string;
}

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  currentProductId?: string; // To exclude self
}

export const RelatedProductSelector: React.FC<Props> = ({ selectedIds, onChange, currentProductId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductMin[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductMin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selectedIds.length > 0 && selectedProducts.length === 0) {
      const fetchSelected = async () => {
        try {
          const promises = selectedIds.map(id => api.get(`/api/admin/products/${id}`));
          const responses = await Promise.all(promises);
          setSelectedProducts(responses.map(r => r.data));
        } catch (err) {
          console.error("Failed to fetch related products details", err);
        }
      };
      fetchSelected();
    }
  }, [selectedIds, selectedProducts.length]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/admin/products?search=${encodeURIComponent(query)}&limit=10`);
        const products: ProductMin[] = res.data.products || [];
        setResults(products.filter(p => p._id !== currentProductId));
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, currentProductId]);

  const handleSelect = (product: ProductMin) => {
    if (selectedIds.includes(product._id)) return;
    if (selectedIds.length >= 6) {
      alert("Maximum 6 products allowed");
      return;
    }

    setSelectedProducts(prev => [...prev, product]);
    onChange([...selectedIds, product._id]);
    setQuery('');
    setResults([]);
  };

  const handleRemove = (id: string) => {
    setSelectedProducts(prev => prev.filter(p => p._id !== id));
    onChange(selectedIds.filter(selectedId => selectedId !== id));
  };

  const getImageUrl = (p: ProductMin) => {
    const primary = p.images?.find(img => img.isPrimary) || p.images?.[0];
    return primary?.url || p.image || '/placeholder.png';
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products to add..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-[#534AB7]/20 focus:border-[#534AB7] transition-all font-sans"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#534AB7] animate-spin" />
          )}
        </div>

        {results.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-64 overflow-y-auto">
            {results.map(product => (
              <button
                key={product._id}
                type="button"
                onClick={() => handleSelect(product)}
                disabled={selectedIds.includes(product._id)}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 disabled:opacity-50 border-b border-slate-100 last:border-0"
              >
                <img src={getImageUrl(product)} alt="" className="w-10 h-10 object-cover rounded bg-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">{selectedIds.includes(product._id) ? 'Already selected' : 'Click to select'}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedProducts.map(product => (
            <div key={product._id} className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
              <img src={getImageUrl(product)} alt="" className="w-12 h-12 object-cover rounded bg-slate-100 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(product._id)}
                className="p-1.5 text-slate-400 hover:bg-[#534AB7]/10 hover:text-[#534AB7] rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500 text-right font-medium">
        {selectedIds.length} / 6 selected
      </p>
    </div>
  );
};
