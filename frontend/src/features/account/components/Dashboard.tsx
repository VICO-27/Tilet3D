// features/account/components/Dashboard.tsx
// cspell:words Tilet Tilet3D
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Ruler,
  Heart,
  Bookmark,
  ArrowUpRight,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useEngagementStore } from "../../../app/store/useEngagementStore";
import { useAvatarStore } from "../../avatar/store/useAvatarStore";
import { useProducts } from "../../products/hooks/useProducts";
import { type Product } from "../../products/components/ProductCard";
import { type AuthUser } from "../types/auth";
import { useOrders } from "../../orders/hooks/useOrders";
import { type OrderListType } from "../../orders/api/orderApi";
import { optimizeCloudinaryVideoUrl } from "../../../shared/utils/cloudinary";

interface AvatarProfile {
  nickname: string;
  gender: string;
  height: number;
  weight: number;
  bodyType: string;
  skinTone: string;
}

interface DashboardProps {
  user: AuthUser;
  onSignOut: () => Promise<void>;
  onNavigate: (to: string, opts?: { state?: unknown }) => void;
  onEditProfile?: () => void;
}

type TabKey = "avatar" | "saved" | "liked" | "orders";

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Extract profile safely from avatar store
  const avatarStore = useAvatarStore() as { profile?: AvatarProfile; avatar?: AvatarProfile };
  const profile = avatarStore.profile || avatarStore.avatar || null;

  // Active tab state for TikTok-style horizontal navigation
  const [activeTab, setActiveTab] = useState<TabKey>("avatar");

  // Orders
  const { orders } = useOrders();

  // Catalog & Engagement
  const { groupedProducts } = useProducts();
  const eng = useEngagementStore();

  useEffect(() => {
    eng.fetchEngagements();
  }, []);

  // Flatten active products
  const allProducts = React.useMemo(() => {
    return Object.values(groupedProducts).flat();
  }, [groupedProducts]);

  const productById = (id: string) => allProducts.find((p) => p.id === id);

  // Saved items
  const saved = React.useMemo(() => {
    const map = new Map<string, Product>();
    (eng.savedProducts || []).forEach((p) => {
      if (p && p.id) map.set(p.id, p);
    });
    const ids = typeof eng.savedIds === "function" ? eng.savedIds() : [];
    ids.forEach((id) => {
      if (!map.has(id)) {
        const item = productById(id);
        if (item) map.set(id, item);
      }
    });
    return Array.from(map.values());
  }, [eng.savedProducts, eng.savedIdsList, allProducts]);

  // Liked items
  const liked = React.useMemo(() => {
    const map = new Map<string, Product>();
    (eng.likedProducts || []).forEach((p) => {
      if (p && p.id) map.set(p.id, p);
    });
    const ids = typeof eng.likedIds === "function" ? eng.likedIds() : [];
    ids.forEach((id) => {
      if (!map.has(id)) {
        const item = productById(id);
        if (item) map.set(id, item);
      }
    });
    return Array.from(map.values());
  }, [eng.likedProducts, eng.likedIdsList, allProducts]);

  // Try-on navigation
  const tryOn = (p: Product) => {
    const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
    const targetVariant = p.variants?.[0] || { id: p.default_variant_id, price: p.price };

    onNavigate("/avatar", {
      state: {
        clothing: {
          id: p.id,
          name: p.name,
          image: primaryMedia?.file || "",
          price: targetVariant ? Number(targetVariant.price) : 0,
        },
      },
    });
  };

  // TikTok-Style Horizontal Icon Tabs Definition
  const TABS: { id: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: "avatar",
      label: "Avatar Setting",
      icon: <Ruler className="h-5 w-5" />,
    },
    {
      id: "saved",
      label: "Saved Pieces",
      icon: <Bookmark className="h-5 w-5" />,
      badge: saved.length > 0 ? saved.length : undefined,
    },
    {
      id: "liked",
      label: "Liked Pieces",
      icon: <Heart className="h-5 w-5" />,
      badge: liked.length > 0 ? liked.length : undefined,
    },
    {
      id: "orders",
      label: "Order History",
      icon: <Package className="h-5 w-5" />,
      badge: orders && orders.length > 0 ? orders.length : undefined,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TIKTOK-STYLE HORIZONTAL ICON NAVIGATION BAR                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-ink/[0.08] px-2 sm:px-6">
        <div className="flex items-center justify-between sm:justify-start sm:gap-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 sm:flex-initial sm:min-w-[120px] flex-col sm:flex-row items-center justify-center gap-1.5 py-3.5 px-2 transition-all active:scale-95 group ${
                  isActive
                    ? "text-plum-600 font-bold"
                    : "text-ink/40 hover:text-ink/80 font-medium"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? "bg-plum-50 text-plum-600" : "group-hover:bg-neutral-100"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-plum-600 px-1 text-[9px] font-black text-white shadow-xs">
                      {tab.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>

                {/* TikTok-style bottom indicator bar */}
                {isActive && (
                  <div className="absolute bottom-0 inset-x-2 sm:inset-x-3 h-0.5 bg-plum-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ACTIVE TAB CONTENT VIEW                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 md:p-8">

        {/* 1. AVATAR SETTINGS TAB */}
        {activeTab === "avatar" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  Avatar Settings
                </h3>
                <p className="text-xs text-ink/45 mt-0.5">
                  Calibrated biometric proportions used for bespoke 3D garment tailoring.
                </p>
              </div>
              <button
                onClick={() => onNavigate("/avatar")}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-plum-600 active:scale-95 transition-all shadow-sm"
              >
                <span>{profile ? "Open Atelier" : "Create Avatar"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {profile ? (
              <div className="space-y-5">
                {/* Biometric Specs Grouped Horizontally */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  <Spec label="Nickname" value={profile.nickname || "Not set"} />
                  <Spec label="Gender" value={profile.gender || "Male"} />
                  <Spec label="Height" value={`${profile.height || 175} cm`} />
                  <Spec label="Weight" value={`${profile.weight || 70} kg`} />
                  <Spec label="Body Structure" value={profile.bodyType ? profile.bodyType.replace('_', ' ') : "Average"} />
                  <Spec label="Skin Tone" value={profile.skinTone ? profile.skinTone.replace('_', ' ') : "Medium"} />
                </div>

                {/* Quick 3D CTA Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-plum-900 to-stone-900 p-5 sm:p-6 text-white shadow-md">
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-plum-300">
                        <Sparkles className="h-3 w-3" />
                        <span>Interactive 3D Fit</span>
                      </div>
                      <h4 className="font-serif text-lg font-medium text-white">
                        Try Habesha Couture on your 3D Avatar
                      </h4>
                      <p className="text-xs text-stone-300 max-w-md">
                        Step into our virtual fitting room to inspect drape, embroidery, and fit from 360 degrees.
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate("/avatar")}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-plum-100 transition-colors active:scale-95 shadow-sm"
                    >
                      <span>Launch 3D Studio</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Empty
                text="No avatar calibrated yet. Create your 3D digital twin to start trying on couture."
                actionLabel="Create 3D Avatar"
                onAction={() => onNavigate("/avatar")}
              />
            )}
          </div>
        )}

        {/* 2. SAVED PIECES TAB */}
        {activeTab === "saved" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  Saved Pieces
                </h3>
                <p className="text-xs text-ink/45 mt-0.5">
                  Bookmarked couture garments saved to your private collection.
                </p>
              </div>
              <button
                onClick={() => onNavigate("/products")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 hover:text-plum-700 transition-colors"
              >
                <span>Browse Collection</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {eng.loading && saved.length === 0 ? (
              <SkeletonGrid />
            ) : saved.length === 0 ? (
              <Empty
                text="Tap the bookmark icon on any garment to save your favorites here."
                actionLabel="Explore Catalog"
                onAction={() => onNavigate("/products")}
              />
            ) : (
              <EngagementGrid products={saved} onTryOn={tryOn} onNavigate={onNavigate} />
            )}
          </div>
        )}

        {/* 3. LIKED PIECES TAB */}
        {activeTab === "liked" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  Liked Pieces
                </h3>
                <p className="text-xs text-ink/45 mt-0.5">
                  Handcrafted pieces you have favorited across the atelier.
                </p>
              </div>
              <button
                onClick={() => onNavigate("/products")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 hover:text-plum-700 transition-colors"
              >
                <span>Browse Collection</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {eng.loading && liked.length === 0 ? (
              <SkeletonGrid />
            ) : liked.length === 0 ? (
              <Empty
                text="Tap the heart icon on any piece to curate your favorite designs."
                actionLabel="Explore Catalog"
                onAction={() => onNavigate("/products")}
              />
            ) : (
              <EngagementGrid products={liked} onTryOn={tryOn} onNavigate={onNavigate} />
            )}
          </div>
        )}

        {/* 4. ORDER HISTORY TAB */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-ink">
                  Order History
                </h3>
                <p className="text-xs text-ink/45 mt-0.5">
                  Track and review all your custom-tailored Habesha couture orders.
                </p>
              </div>
              <button
                onClick={() => onNavigate("/orders")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 hover:text-plum-700 transition-colors"
              >
                <span>View Full History</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {!orders || orders.length === 0 ? (
              <Empty
                text="No bespoke orders placed yet."
                actionLabel="Start Shopping"
                onAction={() => onNavigate("/products")}
              />
            ) : (
              <div className="space-y-3">
                {orders.map((o: OrderListType) => (
                  <div
                    key={o.id}
                    onClick={() => onNavigate(`/orders/${o.id}`)}
                    className="flex cursor-pointer items-center gap-3.5 sm:gap-4 rounded-2xl border border-ink/[0.06] bg-neutral-50/70 p-3 sm:p-4 hover:bg-neutral-100/70 transition-all active:scale-[0.99] group"
                  >
                    <div className="flex h-12 w-10 sm:h-14 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white text-ink/30 border border-ink/[0.06] group-hover:text-plum-600 transition-colors shadow-2xs">
                      <Package className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs font-bold text-plum-600">
                          {o.order_number}
                        </p>
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            o.status === "cancelled"
                              ? "bg-rose-50 text-rose-600 border border-rose-100"
                              : o.status === "delivered"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="truncate font-serif text-sm font-semibold text-ink mt-0.5">
                        {o.item_count} Item{o.item_count !== 1 ? "s" : ""}
                      </p>
                      <p className="text-[11px] text-ink/45">
                        {new Date(o.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-ink">
                        ETB {Number(o.total).toLocaleString()}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-plum-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Back to Home Link */}
        <div className="pt-8 border-t border-ink/[0.06] mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 transition-colors hover:text-plum-600"
          >
            <span>Back to Home</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

      </div>
    </div>
  );
};

/* ────────────────────────────── Sub Components ──────────────────────────── */

const Spec: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-ink/[0.06] bg-neutral-50 px-3 py-2.5">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
      {label}
    </p>
    <p className="mt-0.5 text-xs sm:text-sm font-semibold capitalize text-ink truncate">
      {value}
    </p>
  </div>
);

const Empty: React.FC<{ text: string; actionLabel?: string; onAction?: () => void }> = ({
  text,
  actionLabel,
  onAction,
}) => (
  <div className="rounded-2xl border border-dashed border-ink/10 bg-neutral-50/60 px-5 py-10 text-center space-y-3">
    <p className="text-xs sm:text-sm text-ink/45 max-w-sm mx-auto">{text}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-plum-600 transition-colors active:scale-95 shadow-sm"
      >
        <span>{actionLabel}</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    )}
  </div>
);

const SkeletonGrid: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3 animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex flex-col rounded-2xl bg-neutral-100 overflow-hidden">
        <div className="aspect-[3/4] bg-neutral-200/70" />
        <div className="p-2.5 space-y-1.5">
          <div className="h-3 bg-neutral-200 rounded w-3/4" />
          <div className="h-2.5 bg-neutral-200/60 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

const EngagementGrid: React.FC<{
  products: Product[];
  onTryOn: (p: Product) => void;
  onNavigate: (to: string) => void;
}> = ({ products, onTryOn, onNavigate }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
    {products.map((p) => {
      const displayMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
      const displayPrice = p.price || p.variants?.[0]?.price || 0;

      return (
        <div
          key={p.id}
          className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink/[0.06] bg-neutral-50 transition-all hover:shadow-md"
        >
          {/* Media area */}
          <div
            onClick={() => onNavigate(`/products/${p.id}`)}
            className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-neutral-100"
          >
            {displayMedia?.media_type === "video" ? (
              <video
                src={optimizeCloudinaryVideoUrl(displayMedia.file)}
                muted
                loop
                playsInline
                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={displayMedia?.file}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}

            {/* Gradient shadow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

            {/* Like count badge */}
            {(p.like_count || 0) > 0 && (
              <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                <Heart className="h-2.5 w-2.5 fill-rose-500 text-rose-500" />
                <span>{p.like_count}</span>
              </div>
            )}

            {/* Try on floating action button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTryOn(p);
              }}
              title="Try on in 3D Avatar"
              className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-plum-600/90 hover:bg-plum-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="h-3 w-3" />
              <span>Try on</span>
            </button>
          </div>

          {/* Details */}
          <div className="p-2.5">
            <button
              onClick={() => onNavigate(`/products/${p.id}`)}
              className="w-full text-left"
            >
              <p className="truncate text-xs font-semibold text-ink transition-colors group-hover:text-plum-600">
                {p.name}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-ink/50">
                ETB {Number(displayPrice).toLocaleString()}
              </p>
            </button>
          </div>
        </div>
      );
    })}
  </div>
);