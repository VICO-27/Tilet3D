import React, { useEffect, useState } from "react";
import { aiApi } from "../api/aiApi";
import ProductCard from "../../products/components/ProductCard";
import { Product } from "../../products/types";

interface AiRecommendationsProps {
  productId: string;
}

export const AiRecommendations: React.FC<AiRecommendationsProps> = ({ productId }) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    aiApi
      .getRecommendations(productId)
      .then((data) => {
        if (isMounted) setRecommendations(data);
      })
      .catch((err) => console.error("Failed to load recommendations", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId]);

  if (loading || recommendations.length === 0) return null;

  return (
    <section className="my-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Curated For Your Taste
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            AI-powered similarity matches based on your aesthetic style profile.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.id} product={product} index={0} />
        ))}
      </div>
    </section>
  );
};