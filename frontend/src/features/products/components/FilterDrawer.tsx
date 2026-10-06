import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const FilterDrawer = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.delete('page'); // Reset pagination on filter change
    setSearchParams(newParams);
  };

  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  const applyPricePreset = (min: string, max: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (min) newParams.set('min_price', min);
    else newParams.delete('min_price');
    
    if (max) newParams.set('max_price', max);
    else newParams.delete('max_price');
    
    newParams.delete('page');
    setSearchParams(newParams);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-[100] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900">Filters & Sort</h2>
              <button onClick={onClose} className="p-2 -mr-2 text-zinc-400 hover:text-zinc-900">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10">
              
              {/* SORT */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Sort By</h3>
                <div className="space-y-2">
                  {[
                    { value: '', label: 'Relevance' },
                    { value: 'price_asc', label: 'Price: Low → High' },
                    { value: 'price_desc', label: 'Price: High → Low' },
                    { value: 'newest', label: 'Newest Arrivals' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${currentSort === opt.value ? 'border-plum-600 bg-plum-600' : 'border-zinc-300 group-hover:border-plum-400'}`}>
                        {currentSort === opt.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                      <span className={`text-sm ${currentSort === opt.value ? 'font-medium text-zinc-900' : 'text-zinc-600'}`}>
                        {opt.label}
                      </span>
                      <input type="radio" className="hidden" checked={currentSort === opt.value} onChange={() => updateParam('sort', opt.value)} />
                    </label>
                  ))}
                </div>
              </div>

              {/* CATEGORY */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {['Women', 'Men', 'Dresses', 'Shirts', 'Accessories', 'Bridal'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => updateParam('category', currentCategory === cat ? null : cat)}
                      className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-colors ${
                        currentCategory === cat ? 'bg-plum-600 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRICE */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Price Range</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => applyPricePreset('', '2000')} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs rounded-full hover:bg-zinc-200">Budget (Under 2K)</button>
                  <button onClick={() => applyPricePreset('2000', '6000')} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs rounded-full hover:bg-zinc-200">Mid-range</button>
                  <button onClick={() => applyPricePreset('6000', '')} className="px-3 py-1.5 bg-zinc-100 text-zinc-600 text-xs rounded-full hover:bg-zinc-200">Premium</button>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    placeholder="Min" 
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-plum-500"
                    value={minPrice}
                    onChange={(e) => updateParam('min_price', e.target.value)}
                  />
                  <span className="text-zinc-400">-</span>
                  <input 
                    type="number" 
                    placeholder="Max" 
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-plum-500"
                    value={maxPrice}
                    onChange={(e) => updateParam('max_price', e.target.value)}
                  />
                </div>
              </div>
              
              {/* AVAILABILITY */}
              <div className="space-y-4">
                 <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-zinc-300 text-plum-600 focus:ring-plum-500"
                      checked={searchParams.get('availability') === 'in_stock'}
                      onChange={(e) => updateParam('availability', e.target.checked ? 'in_stock' : null)}
                    />
                    <span className="text-sm text-zinc-600 font-medium">In Stock Only</span>
                 </label>
              </div>

            </div>

            <div className="p-6 border-t border-zinc-100">
              <button 
                onClick={onClose}
                className="w-full py-4 bg-zinc-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors shadow-lg"
              >
                View Results
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
