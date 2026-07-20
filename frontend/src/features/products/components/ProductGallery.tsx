import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { ProductMedia } from '../types';

interface Props {
  media: ProductMedia[];
  productName: string;
}

const ProductGallery: React.FC<Props> = ({ media, productName }) => {
  const sorted = [...media].sort((a, b) => a.display_order - b.display_order);
  const [activeId, setActiveId] = useState(sorted[0]?.id);
  const active = sorted.find((m) => m.id === activeId) || sorted[0];

  if (!sorted.length) {
    return <div className="aspect-[4/5] w-full bg-zinc-100 rounded-2xl" />;
  }

  return (
    <div className="w-full lg:sticky lg:top-24">
      {/* Main viewer */}
      <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-zinc-50">
        {active.media_type === 'video' ? (
          <video
            key={active.id}
            src={active.file}
            controls
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            key={active.id}
            src={active.file}
            alt={productName}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar pb-1">
          {sorted.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                m.id === activeId ? 'border-plum-600' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {m.media_type === 'video' ? (
                <>
                  <video src={m.file} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play size={16} className="text-white" fill="white" />
                  </div>
                </>
              ) : (
                <img src={m.file} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;