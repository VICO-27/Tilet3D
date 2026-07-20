// frontend/src/features/products/pages/CategoryDetailPage.tsx
import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { ArrowLeft } from 'lucide-react';
import BrandLoader from '@/shared/components/BrandLoader';

function CategoryDetailPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { groupedProducts, isLoading } = useProducts();

  // Scroll to top instantly on page mount for that smooth, seamless load transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [categoryName]);

  const filteredProducts = useMemo(() => {
    const key = Object.keys(groupedProducts).find(
      (k) => k.toLowerCase() === categoryName?.toLowerCase()
    );
    return key ? groupedProducts[key] : [];
  }, [groupedProducts, categoryName]);

  if (isLoading) return <BrandLoader />;

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white antialiased">
      <style>{`
        @keyframes appleFadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          0% { transform: scale(1.04); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-apple-fadeup {
          animation: appleFadeUp 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .animate-scale-in {
          animation: scaleIn 1.6s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
      `}</style>

      {/* MINIMAL NAV UTILITY STRIP */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 hover:text-black transition-colors duration-300"
        >
          <div className="p-2 border border-zinc-100 rounded-full group-hover:border-zinc-400 transition-colors duration-300">
            <ArrowLeft size={14} className="transform group-hover:-translate-x-0.5 transition-transform" />
          </div>
          Back
        </button>
        <span className="text-[10px] uppercase tracking-[0.35em] text-zinc-400 font-bold">
          Tilet3D Haute Couture
        </span>
        <div className="w-16" /> {/* Visual Balance Spacing */}
      </nav>

      {/* HERO EDITORIAL SECTION */}
      <header className="max-w-[1600px] mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-end border-b border-zinc-100">
        <div className="lg:col-span-7 space-y-6 animate-apple-fadeup">
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-purple-600 block">
            Exclusively Tailored
          </span>
          <h1 
            className="text-6xl md:text-8xl font-bold tracking-tight text-zinc-900 capitalize leading-[0.95]"
            style={{ fontFamily: "'Iowan Old Style', 'Palatino Linotype', serif" }}
          >
            {categoryName}
          </h1>
          <p className="text-zinc-500 max-w-xl text-sm md:text-base font-normal leading-relaxed tracking-wide pt-4">
            Discover bespoke silhouettes meticulously woven with timeless precision. Every detail encapsulates heritage re-imagined through digital high-fashion architectures.
          </p>
        </div>

        <div className="lg:col-span-5 text-left lg:text-right font-mono text-[11px] uppercase tracking-widest text-zinc-400 space-y-1 pb-2 animate-apple-fadeup [animation-delay:200ms] opacity-0 [animation-fill-mode:forwards]">
          <div>Collection Range &mdash; Vol. I</div>
          <div>Total Available &mdash; {filteredProducts.length} Editions</div>
          <div>Handcrafted Production &mdash; Addis Ababa</div>
        </div>
      </header>

      {/* LUXURY GRID SPACE */}
      <main className="max-w-[1800px] mx-auto px-6 py-16 md:py-24">
        {filteredProducts.length === 0 ? (
          <div className="py-32 text-center space-y-4 animate-apple-fadeup">
            <p className="font-serif text-2xl italic text-zinc-400">The atelier is currently preparing this catalog.</p>
            <button 
              onClick={() => navigate(-1)} 
              className="text-xs uppercase font-bold tracking-widest text-purple-600 underline underline-offset-4"
            >
              Return to Showcase
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            {filteredProducts.map((product, index) => {
              // Asymmetric staggered offset pattern to mimic premium layout books (Apple Look)
              const isStaggered = index % 4 === 1 || index % 4 === 3;
              
              return (
                <div
                  key={product.id}
                  className={`animate-apple-fadeup opacity-0 [animation-fill-mode:forwards] transition-all duration-700
                    ${isStaggered ? 'md:translate-y-12' : ''}`}
                  style={{
                    animationDelay: `${(index % 4) * 150}ms`
                  }}
                >
                  <div className="bg-zinc-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                    <ProductCard product={product} index={index} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MINIMAL FOOTER SIGNATURE */}
      <footer className="w-full border-t border-zinc-100 py-16 text-center text-zinc-400 font-mono text-[10px] uppercase tracking-[0.3em]">
        &copy; {new Date().getFullYear()} Tilet3D. All Rights Reserved. Pure Luxury Simulation.
      </footer>
    </div>
  );
}

export default CategoryDetailPage;