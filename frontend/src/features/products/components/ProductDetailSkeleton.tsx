import React from 'react';

const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-20 pb-24 animate-pulse">
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-sweep {
          animation: shimmerSweep 2s infinite linear;
        }
      `}</style>
      
      {/* Back button skeleton */}
      <div className="fixed top-28 left-6 md:left-10 z-40 w-24 h-10 rounded-full bg-stone-100 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery Skeleton */}
        <div className="w-full aspect-[3/4] rounded-2xl bg-stone-100 overflow-hidden relative">
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
        </div>

        {/* Buy Box Skeleton */}
        <div className="flex flex-col pt-8">
          <div className="w-32 h-4 rounded-md bg-stone-100 mb-6 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
          </div>
          
          <div className="w-3/4 h-10 rounded-lg bg-stone-100 mb-4 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
          </div>
          
          <div className="w-24 h-8 rounded-lg bg-stone-100 mt-4 mb-8 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
          </div>

          <div className="space-y-3 mt-6">
            <div className="w-full h-4 rounded-md bg-stone-100 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
            </div>
            <div className="w-5/6 h-4 rounded-md bg-stone-100 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
            </div>
            <div className="w-4/6 h-4 rounded-md bg-stone-100 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <div className="w-full h-14 rounded-full bg-stone-100 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
            </div>
            <div className="w-full h-14 rounded-full bg-stone-100 overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent shimmer-sweep" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
