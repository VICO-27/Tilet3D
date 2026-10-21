import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface Props {
  products: Product[];
  currentProductId: string;
  categoryName: string;
}

const RelatedProducts: React.FC<Props> = ({ products, currentProductId, categoryName }) => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const wasDraggedRef = useRef(false);

  const related = products
    .filter((p) => p.id !== currentProductId && p.category_name === categoryName)
    .slice(0, 12);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasDragged = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        hasDragged = true;
        wasDraggedRef.current = true;
      }
      track.scrollLeft = scrollLeftStart - dx * 1.2;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      track.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasDragged) {
        setTimeout(() => {
          wasDraggedRef.current = false;
        }, 120);
      } else {
        wasDraggedRef.current = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      wasDraggedRef.current = false;
      track.style.cursor = 'grabbing';
      startX = e.clientX;
      scrollLeftStart = track.scrollLeft;

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    track.addEventListener('mousedown', onMouseDown);
    return () => {
      track.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [related.length]);

  if (!related.length) return null;

  return (
    <div className="pt-16 border-t border-zinc-100">
      <h2
        className="text-xl font-bold text-zinc-900 mb-6"
        style={{ fontFamily: "'Iowan Old Style','Palatino Linotype',serif" }}
      >
        You may also like
      </h2>

      <div 
        ref={trackRef}
        onClickCapture={(e) => {
          if (wasDraggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        className="flex gap-5 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
      >
        {related.map((p) => {
          const primary = p.media.find((m) => m.is_primary) || p.media[0];
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/products/${p.id}`)}
              className="text-left group shrink-0 w-[240px] snap-start"
            >
              <div className="aspect-[4/5] w-[240px] rounded-2xl overflow-hidden bg-zinc-100">
                {primary && (
                  <img
                    src={primary.file}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="text-sm font-medium text-zinc-800 mt-3 truncate">{p.name}</p>
              <p className="text-[13px] text-zinc-500">
                {(p.price || p.variants?.[0]?.price) ? `${p.price || p.variants?.[0]?.price} ETB` : 'Bespoke'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;