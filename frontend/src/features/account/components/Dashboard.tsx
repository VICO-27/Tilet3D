// features/account/components/Dashboard.tsx
// cspell:words Tilet Tilet3D
import React from "react";
import { Link } from "react-router-dom";
import { Package, Ruler, Heart, Bookmark, ArrowUpRight } from "lucide-react";
import { useEngagementStore } from "../../../app/store/useEngagementStore";
import { useAvatarStore } from "../../avatar/store/useAvatarStore";
import { useProducts } from "../../products/hooks/useProducts";
import { type Product } from "../../products/components/ProductCard";
import { type AuthUser } from "../types/auth";
import { useOrders } from "../../orders/hooks/useOrders";
import { type OrderListType } from "../../orders/api/orderApi";

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

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  // Extract profile safely
  const avatarStore = useAvatarStore() as { profile?: AvatarProfile; avatar?: AvatarProfile };
  const profile = avatarStore.profile || avatarStore.avatar || null;

  // Use your actual useOrders hook!
  const { orders } = useOrders();

  const { groupedProducts } = useProducts();
  const eng = useEngagementStore();

  // Flatten out all active products from our category dictionary map
  const allProducts = React.useMemo(() => {
    return Object.values(groupedProducts).flat();
  }, [groupedProducts]);

  const productById = (id: string) => allProducts.find((p) => p.id === id);

  const savedIds: string[] =
    "savedIds" in eng && typeof eng.savedIds === "function" ? eng.savedIds() : [];
  const likedIds: string[] =
    "likedIds" in eng && typeof eng.likedIds === "function" ? eng.likedIds() : [];

  const saved = savedIds.map(productById).filter(Boolean) as Product[];
  const liked = likedIds.map(productById).filter(Boolean) as Product[];

  // Transform the Product structure into clothing parameters for the avatar canvas context
  const tryOn = (p: Product) => {
    const primaryMedia = p.media.find((m) => m.is_primary) || p.media[0];
    const targetVariant = p.variants[0];

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

  return (
    <div className="p-6">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Avatar Settings */}
        <Card
          icon={<Ruler className="h-5 w-5" />}
          title="Avatar Settings"
          action={() => onNavigate("/avatar")}
          actionLabel={profile ? "Edit avatar" : "Create avatar"}
        >
          {profile ? (
            <div className="grid grid-cols-2 gap-3">
              <Spec label="Nickname" value={profile.nickname} />
              <Spec label="Gender" value={profile.gender} />
              <Spec label="Height" value={`${profile.height} cm`} />
              <Spec label="Weight" value={`${profile.weight} kg`} />
              <Spec label="Body type" value={profile.bodyType} />
              <Spec label="Skin tone" value={profile.skinTone} />
            </div>
          ) : (
            <Empty text="No avatar yet. Create one to start trying on couture." />
          )}
        </Card>

        {/* Saved items */}
        <Card
          icon={<Bookmark className="h-5 w-5" />}
          title="Saved Pieces"
          action={() => onNavigate("/products")}
          actionLabel="Browse collection"
        >
          {saved.length === 0 ? (
            <Empty text="Tap the bookmark on any piece to save it here." />
          ) : (
            <EngagementGrid products={saved} onTryOn={tryOn} />
          )}
        </Card>

        {/* Liked items */}
        <Card
          icon={<Heart className="h-5 w-5" />}
          title="Liked Pieces"
          action={() => onNavigate("/products")}
          actionLabel="Browse collection"
        >
          {liked.length === 0 ? (
            <Empty text="Tap the heart on any piece to like it here." />
          ) : (
            <EngagementGrid products={liked} onTryOn={tryOn} />
          )}
        </Card>

        {/* Order history */}
        <div className="md:col-span-2">
          <Card
            icon={<Package className="h-5 w-5" />}
            title="Order History"
            action={() => onNavigate("/orders")}
            actionLabel="View all"
          >
            {!orders || orders.length === 0 ? (
              <Empty text="No bespoke orders yet." />
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 3).map((o: OrderListType) => (
                  <div
                    key={o.id}
                    className="flex items-center gap-4 rounded-2xl border border-ink/[0.06] bg-neutral-50 p-3"
                  >
                    {/* Placeholder icon since OrderListType doesn't include an image */}
                    <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-lg bg-neutral-200/60 text-ink/30">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-bold text-plum-600">
                        {o.order_number}
                      </p>
                      <p className="truncate font-serif text-sm font-semibold text-ink">
                        {o.item_count} Item{o.item_count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[11px] text-ink/45">
                        {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-ink">
                        ETB {Number(o.total).toLocaleString()}
                      </p>
                      <p className={`text-[9px] font-bold uppercase tracking-wider ${o.status === 'cancelled' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {o.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 transition-colors hover:text-plum-600"
      >
        Back to home
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};

/* ────────────────────────────── Sub Components ──────────────────────────── */

const Card: React.FC<{
  icon: React.ReactNode;
  title: string;
  action: () => void;
  actionLabel: string;
  children: React.ReactNode;
}> = ({ icon, title, action, actionLabel, children }) => (
  <div className="rounded-3xl border border-ink/[0.07] bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-plum-50 text-plum-600">
          {icon}
        </span>
        <h3 className="display text-lg font-semibold text-ink">{title}</h3>
      </div>
      <button
        onClick={action}
        className="inline-flex items-center gap-1 text-xs font-semibold text-plum-600 transition-colors hover:text-plum-700"
      >
        {actionLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
    {children}
  </div>
);

const Spec: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-ink/[0.06] bg-neutral-50 px-3 py-2.5">
    <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">
      {label}
    </p>
    <p className="mt-0.5 text-sm font-semibold capitalize text-ink">{value}</p>
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-ink/10 bg-neutral-50/60 px-5 py-8 text-center">
    <p className="text-sm text-ink/45">{text}</p>
  </div>
);

const EngagementGrid: React.FC<{
  products: Product[];
  onTryOn: (p: Product) => void;
}> = ({ products, onTryOn }) => (
  <div className="grid grid-cols-3 gap-2.5">
    {products.slice(0, 6).map((p) => {
      const displayMedia = p.media.find((m) => m.is_primary) || p.media[0];
      const displayPrice = p.variants[0]?.price || 0;

      return (
        <button key={p.id} onClick={() => onTryOn(p)} className="group text-left">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100">
            {displayMedia?.media_type === "video" ? (
              <video
                src={displayMedia.file}
                muted
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={displayMedia?.file}
                alt={p.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
          </div>
          <p className="mt-1.5 truncate text-[11px] font-semibold text-ink">{p.name}</p>
          <p className="text-[10px] text-ink/45">ETB {Number(displayPrice).toLocaleString()}</p>
        </button>
      );
    })}
  </div>
);