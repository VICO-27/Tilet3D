import React from 'react';

const ProductsSkeleton: React.FC = () => (
  <div className="w-full flex flex-col gap-24 py-12 overflow-hidden animate-pulse">
    <style>{`
      @keyframes shimmerSweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .shimmer-sweep {
        animation: shimmerSweep 2s infinite linear;
      }
    `}</style>

    {[1, 2].map((row) => (
      <div key={row} className="w-full">
        <div className="px-6 md:px-10 mb-8 flex justify-between items-end">
          <div className="w-48 md:w-64 h-10 bg-stone-100 rounded-lg overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
          </div>
        </div>

        <div className="flex gap-6 px-6 md:px-10 overflow-hidden w-max">
          {[1, 2, 3, 4, 5].map((card) => (
            <div key={card} className="min-w-[300px] md:min-w-[400px] shrink-0">
              <div className="w-full aspect-[3/4] bg-stone-100 rounded-2xl relative overflow-hidden mb-5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
              </div>
              <div className="w-3/4 h-5 bg-stone-100 rounded mb-2 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
              </div>
              <div className="w-1/3 h-5 bg-stone-100 rounded overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const CategoryGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 animate-pulse">
    <style>{`
      @keyframes shimmerSweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .shimmer-sweep {
        animation: shimmerSweep 2s infinite linear;
      }
    `}</style>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
      <div key={card} className="w-full">
        <div className="w-full aspect-[3/4] bg-stone-100 rounded-2xl relative overflow-hidden mb-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
        </div>
        <div className="w-3/4 h-5 bg-stone-100 rounded mb-2 overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
        </div>
        <div className="w-1/3 h-5 bg-stone-100 rounded overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
        </div>
      </div>
    ))}
  </div>
);

export default ProductsSkeleton;
