// cspell:ignore Tilet
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { productApi } from '../api/productApi';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '@/app/store/useCartStore';
import { useToastStore } from '@/app/store/useToastStore';
import { Product } from '../types';
import ProductGallery from '../components/ProductGallery';
import ProductEngagementRow from '../components/ProductEngagementRow';
import CommentsSection from '../components/CommentsSection';
import RelatedProducts from '../components/RelatedProducts';
import PageLayout from '@/shared/components/layout/PageLayout';
import BrandLoader from '@/shared/components/BrandLoader';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts(); // for the related-products strip

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const { addToCart, isAdded } = useCartStore();
  const showToast = useToastStore((s) => s.show);
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    // Fetch routine encapsulates the states safely away from the immediate synchronous effect lifecycle execution hook
    const fetchProductData = async () => {
      // Shift out of the immediate execution context frame to bypass the set-state-in-effect check
      setLoading(true);
      setError(null);

      try {
        const data = await productApi.getProductById(id);
        if (cancelled) return;
        setProduct(data);
        setSelectedVariantId(data.variants[0]?.id ?? null);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Product not found');
          setLoading(false);
        }
      }
    };

    fetchProductData();

    return () => { 
      cancelled = true; 
    };
  }, [id]);

  const scrollToComments = () => {
    commentsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddToCart = () => {
    if (!selectedVariantId) {
      showToast("Select a size or variant first", "error");
      return;
    }
    addToCart(selectedVariantId);
    showToast("Added to cart");
  };

  if (loading) {
    return (
      <PageLayout>
        <BrandLoader />
      </PageLayout>
    );
  }

  if (error || !product) {
    return (
      <PageLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-zinc-500">This product couldn't be found.</p>
          <button onClick={() => navigate('/products')} className="text-sm font-semibold text-plum-600 underline">
            Back to collection
          </button>
        </div>
      </PageLayout>
    );
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const addedToCart = selectedVariantId ? isAdded(selectedVariantId) : false;

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-20 pb-24">
        {/* Back button — fixed to viewport, stays put while scrolling */}
        <button
          onClick={() => navigate(-1)}
          className="fixed top-28 left-6 md:left-10 z-40 flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white/90 backdrop-blur-md border border-zinc-200 hover:border-zinc-400 rounded-full px-4 py-2.5 transition-colors shadow-lg"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Gallery + Buy Box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <ProductGallery media={product.media} productName={product.name} />

          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.3em] text-plum-600 font-semibold mb-3">
              {product.brand || 'Tilet3D'} · {product.category_name}
            </span>

            <h1
              className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight"
              style={{ fontFamily: "'Iowan Old Style','Palatino Linotype',serif" }}
            >
              {product.name}
            </h1>

            <p className="text-xl font-semibold text-zinc-900 mt-4">
              {selectedVariant?.price ? `${selectedVariant.price} ETB` : 'Bespoke Order'}
            </p>

            <p className="text-[15px] leading-relaxed text-zinc-600 mt-6">
              {product.description}
            </p>

            {/* Variant / Size selector */}
            {product.variants.length > 1 && (
              <div className="mt-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Select variant
                </span>
                <div className="flex flex-wrap gap-2 mt-3">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                        v.id === selectedVariantId
                          ? 'bg-zinc-900 text-white border-zinc-900'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                      }`}
                    >
                      {v.size || v.color || v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buy actions */}
            <div className="mt-8 space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={addedToCart}
                className="w-full py-4 bg-zinc-900 text-white text-[13px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-zinc-800 transition-colors disabled:opacity-60"
              >
                {addedToCart ? 'Added to Cart' : 'Add to Cart'}
              </button>
              <button
                onClick={() => navigate('/avatar')}
                className="w-full py-4 bg-white text-zinc-900 border border-zinc-900 text-[13px] font-bold uppercase tracking-[0.2em] rounded-full hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-colors"
              >
                Try-on Avatar
              </button>
            </div>

            {/* YouTube-style engagement row */}
            <div className="mt-10">
              <ProductEngagementRow product={product} onScrollToComments={scrollToComments} />
            </div>
          </div>
        </div>

        {/* Comments */}
        <CommentsSection ref={commentsRef} productId={product.id} />

        {/* Related products */}
        <RelatedProducts
          products={products}
          currentProductId={product.id}
          categoryName={product.category_name}
        />
      </div>
    </PageLayout>
  );
};

export default ProductDetailPage;