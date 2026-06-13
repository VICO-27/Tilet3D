import { useState, type MouseEvent } from 'react';
import { useAvatarStore } from "../../avatar/store/useAvatarStore";import PRODUCTS from "../data/products";
import type { Product } from "../types/product";
import { Heart, Search, Sparkles, ArrowRight } from 'lucide-react'; // Removed Filter

const CATEGORIES = [
  'ALL',
  'HABESHA KEMIS',
  'SURI',
  'SHEMIZ',
  'T-SHIRT',
  'SCARF',
  'SHURAB',
  'SHASH',
  'NETELA',
  'GABI'
];

export default function ProductsPage() {
  // FIX: Cast store to any to allow equipItem and unequipCategory destructing 
  const { equipItem, unequipCategory } = useAvatarStore() as any;
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Toggle favorite
  const toggleFavorite = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Filter items
  const filteredProducts = PRODUCTS.filter(p => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTryOn = (product: Product) => {
    // Fixed: Passing product.category (or whatever your ClothingCategory type corresponds to)
    unequipCategory(product.category as any); 
    // Fixed: Passing the actual product object instead of the string 'avatar'
    equipItem(product as any); 
  };

  return (
    <div className="bg-white min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Category Header Bar - exact duplicate of screenshot #2 */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-100 pb-2 mb-8 gap-4">
          
          {/* Scrollable category list */}
          <div className="flex items-center gap-1 overflow-x-auto w-full no-scrollbar pb-2 md:pb-0 select-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-4 py-2 text-xs md:text-sm font-bold tracking-wider transition-all uppercase shrink-0 ${
                  selectedCategory === cat
                    ? 'text-purple-600'
                    : 'text-neutral-500 hover:text-purple-400'
                }`}
              >
                <span>{cat}</span>
                {selectedCategory === cat && (
                  <div className="absolute bottom-[-10px] left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Search field */}
          <div className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              placeholder="Search traditional items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-gray-200 focus:outline-none focus:border-purple-600 focus:bg-white text-sm text-neutral-800 px-10 py-2.5 rounded-full transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-4.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

        </div>

        {/* Info Banner */}
        <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-6.5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 sm:p-2.5 bg-purple-600 rounded-xl text-white mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base">Configure Your Live 3D Fit</h3>
              <p className="text-xs text-neutral-500 mt-0.5 max-w-xl">
                Ready to preview traditional Habesha embroidery on an active avatar? Click <span className="font-semibold text-purple-600">Try On Avatar</span> on any garment below to load our customization studio.
              </p>
            </div>
          </div>
          <button
            onClick={() => { /* Fixed: removed broken "product" reference. Optionally put a navigation handler here */ }}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1.5 shrink-0 group self-end sm:self-center"
          >
            <span>Open Try-On Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No traditional products found in this category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
              className="mt-4 px-5 py-2 text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100 rounded-full hover:bg-purple-100 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product Grid - replicates screenshot styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6.5">
          {filteredProducts.map((product) => {
            const isFav = !!favorites[product.id];
            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="group relative flex flex-col justify-between overflow-hidden bg-neutral-50 rounded-2xl border border-gray-100 hover:border-purple-200 transition-all p-3 hover:shadow-lg hover:shadow-purple-50"
              >
                {/* Image Section */}
                <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-white mb-4 shadow-inner">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating heart icon - Top right */}
                  <button
                    onClick={(e) => toggleFavorite(product.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 hover:bg-white active:scale-90 flex items-center justify-center text-neutral-600 border border-gray-100 transition-all z-10 shadow-sm"
                  >
                    <Heart className={`w-4 h-4 transition-colors ${isFav ? 'fill-red-500 text-red-500' : 'text-neutral-500'}`} />
                  </button>

                  {/* Category Pill - Bottom Left */}
                  <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-[9px] font-bold tracking-widest text-white px-2 py-0.5 rounded uppercase">
                    {product.category}
                  </span>
                </div>

                {/* Details Section */}
                <div className="px-1 flex flex-col justify-between flex-grow gap-3">
                  <div>
                    {/* fallback optional chaining if product.fabric is occasionally undefined */}
                    <span className="text-[10px] uppercase tracking-widest font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full select-none">
                      {product.fabric || 'Cotton'} 
                    </span>
                    <h4 className="font-bold text-sm text-neutral-900 mt-2 tracking-tight line-clamp-1">
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-2 border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center mb-3.5">
                      <span className="text-[11px] text-gray-400 font-medium">Retail Price</span>
                      <span className="font-extrabold text-neutral-900 text-sm">
                        ETB {product.price.toLocaleString('.2f')}.00
                      </span>
                    </div>

                    <button
                      id={`try-on-btn-${product.id}`}
                      onClick={() => handleTryOn(product)}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white text-xs font-black tracking-widest rounded-xl transition-all shadow-md shadow-purple-100 hover:shadow-purple-200"
                    >
                      TRY ON AVATAR
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}