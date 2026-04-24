import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  AlertCircle,
  PackageX,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { CATEGORIES } from '../constants/categories';

// Interfaces
interface Product {
  _id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice: number;
  inStock: boolean;
  totalStock: number;
  isNewProduct: boolean;
  isBestSeller: boolean;
  image?: string;
  images?: { url: string; isPrimary: boolean }[];
}

export const Products: React.FC = () => {
  const navigate = useNavigate();

  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Pagination States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sort, setSort] = useState('date_desc');
  const [page, setPage] = useState(1);

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/admin/products', {
        params: {
          search: debouncedSearch,
          category: category === 'All' ? '' : category,
          subcategory: subcategory === 'All' ? '' : subcategory,
          sort,
          page,
          limit: 10 // Let's use 10 for better UI fit on standard screens
        }
      });
      setProducts(response.data.products);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, category, subcategory, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/products/${productToDelete._id}`);
      setDeleteModalOpen(false);
      setProductToDelete(null);
      // Refetch current page or go back if it becomes empty
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchProducts();
      }
    } catch (error) {
      console.error('Failed to delete product', error);
      alert('Failed to delete product. Only Editor/Super Admin can delete.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper to extract primary image
  const getPrimaryImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find(img => img.isPrimary);
      return primary ? primary.url : product.images[0].url;
    }
    return product.image || 'https://via.placeholder.com/40';
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your inventory, prices, and categories</p>
        </div>
        <button 
          onClick={() => navigate('/admin/products/new')}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Product</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={category}
              onChange={(e) => { setCategory(e.target.value); setSubcategory(''); setPage(1); }}
              className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select 
              value={subcategory}
              onChange={(e) => { setSubcategory(e.target.value); setPage(1); }}
              disabled={!category}
              className="pl-4 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">All Subcategories</option>
              {category && CATEGORIES.find(c => c.name === category)?.subcategories.map(sub => (
                <option key={sub.slug} value={sub.name}>{sub.name}</option>
              ))}
            </select>
          </div>

          <select 
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          >
            <option value="date_desc">Newest Added</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px] relative">
          
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}

          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-medium">Product</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Stock Status</th>
                <th className="px-6 py-4 font-medium block md:table-cell">Labels</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <PackageX className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="text-lg font-medium text-slate-500">No products found</p>
                      <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0 bg-slate-100">
                          <img 
                            src={getPrimaryImage(product)} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-medium text-slate-800 line-clamp-2 max-w-[200px]" title={product.name}>
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">{product.category || '--'}</td>
                    <td className="px-6 py-3">
                      <div className="font-medium text-slate-800">৳ {product.price}</div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-slate-400 line-through">৳ {product.originalPrice}</div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          product.inStock 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                        }`}>
                          {product.inStock ? 'In Stock' : 'Stock Out'}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 ml-1">
                          {product.totalStock || 0} units available
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 block md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {product.isNewProduct && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] uppercase font-bold tracking-wider">New</span>
                        )}
                        {product.isBestSeller && (
                          <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-600 text-[10px] uppercase font-bold tracking-wider">Top</span>
                        )}
                        {!product.isNewProduct && !product.isBestSeller && (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => navigate(`/admin/products/${product._id}/edit`)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => { setProductToDelete(product); setDeleteModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} products
            </span>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                // Show a shifting window of 5 pages
                let pageNum = page - 2 + i;
                if (page <= 3) pageNum = i + 1;
                if (page >= pages - 2) pageNum = pages - 4 + i;
                
                if (pageNum > 0 && pageNum <= pages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded text-xs font-medium transition ${
                        page === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}

              <button 
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="p-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-rose-100 text-rose-600 rounded-full mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-800 mb-2">Delete Product</h3>
            <p className="text-center text-slate-500 text-sm mb-6">
              Are you sure you want to delete <span className="font-semibold text-slate-700">"{productToDelete.name}"</span>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => { setDeleteModalOpen(false); setProductToDelete(null); }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition flex justify-center items-center"
              >
                {isDeleting ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
