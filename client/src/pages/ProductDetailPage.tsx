import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, ChevronRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function ProductDetailPage({ products }: { products: any[] }) {
  const { id } = useParams();
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const [selectedSize, setSelectedSize] = useState('');

  // Find the product from the list
  const product = useMemo(() => products.find(p => (p._id || p.id) === id), [id, products]);
  const isWishlisted = wishlist.includes(product?._id || product?.id);

  if (!product) return <div className="h-screen flex items-center justify-center font-serif text-2xl">Product not found...</div>;

  return (
    <div className="pt-[100px] min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-10">
          <Link to="/" className="hover:text-black">Home</Link>
          <ChevronRight size={10} />
          <Link to={`/shop/${product.category.toLowerCase()}`} className="hover:text-black">{product.category}</Link>
          <ChevronRight size={10} />
          <span className="text-eloria-purple">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
              />
            </div>
            {/* Small Thumbnails could go here later */}
          </div>

          {/* RIGHT: Product Info */}
          <div className="flex flex-col">
            <p className="text-eloria-purple font-bold text-xs uppercase tracking-[0.3em] mb-3">
              {product.category}
            </p>
            <h1 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center gap-4 mb-8">
              <span className="text-2xl font-bold text-black">₹{product.price}.00</span>
              {product.originalPrice && (
                <span className="text-lg text-gray-300 line-through">₹{product.originalPrice}.00</span>
              )}
              <span className="bg-eloria-rose/10 text-eloria-rose text-[10px] font-bold px-2 py-1 rounded">
                SAVE {Math.round(((product.originalPrice - product.price)/product.originalPrice)*100)}%
              </span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed mb-10 border-l-2 border-eloria-lavender pl-4">
              Experience the luxury of handcrafted heritage. This {product.category} is designed with premium fabrics and detailed craftsmanship, perfect for making a statement at any occasion.
            </p>

            {/* SIZE SELECTION */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest">Select Size</span>
                <button className="text-[10px] font-bold uppercase underline text-gray-400 hover:text-black">Size Guide</button>
              </div>
              <div className="flex gap-3">
                {['S', 'M', 'L', 'XL', '2XL'].map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 rounded-xl border-2 font-bold text-xs transition-all ${
                      selectedSize === size 
                      ? 'border-eloria-purple bg-eloria-purple text-white shadow-lg' 
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button 
                onClick={() => addToCart({...product, size: selectedSize})}
                className="flex-grow bg-eloria-dark text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-eloria-purple transition-all duration-500 shadow-xl"
              >
                <ShoppingBag size={18} />
                Add to Shopping Bag
              </button>
              <button 
                onClick={() => toggleWishlist(product._id || product.id)}
                className={`p-5 rounded-full border-2 transition-all ${
                  isWishlisted ? 'border-eloria-rose bg-eloria-rose text-white' : 'border-gray-100 hover:border-gray-200 text-gray-400'
                }`}
              >
                <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
              </button>
            </div>

            {/* TRUST INDICATORS */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-100">
                <div className="flex flex-col items-center text-center">
                    <Truck size={18} className="text-gray-400 mb-2" />
                    <span className="text-[9px] font-bold uppercase text-gray-400">Fast Shipping</span>
                </div>
                <div className="flex flex-col items-center text-center border-x border-gray-100 px-2">
                    <ShieldCheck size={18} className="text-gray-400 mb-2" />
                    <span className="text-[9px] font-bold uppercase text-gray-400">Authentic Only</span>
                </div>
                <div className="flex flex-col items-center text-center">
                    <RotateCcw size={18} className="text-gray-400 mb-2" />
                    <span className="text-[9px] font-bold uppercase text-gray-400">7-Day Returns</span>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}