import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';

interface Props {
  products: Product[];
  currentProductId: string;
  categoryName: string;
}

const RelatedProducts: React.FC<Props> = ({ products, currentProductId, categoryName }) => {
  const navigate = useNavigate();
  const related = products
    .filter((p) => p.id !== currentProductId && p.category_name === categoryName)
    .slice(0, 12);

  if (!related.length) return null;

  return (
    <div className="pt-16 border-t border-zinc-100">
      <h2
        className="text-xl font-bold text-zinc-900 mb-6"
        style={{ fontFamily: "'Iowan Old Style','Palatino Linotype',serif" }}
      >
        You may also like
      </h2>

      <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
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
                {p.variants[0]?.price ? `${p.variants[0].price} ETB` : 'Bespoke'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;