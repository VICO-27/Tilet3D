import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, History, X, Home } from "lucide-react";

import { useAvatarStore } from "../store/useAvatarStore";
import { AvatarStudio } from "../components/AvatarStudio";
import { ClothingPanel } from "../components/ClothingPanel";
import { AvatarCreationModal } from "../components/AvatarCreationModal";
import { AvatarEditPanel } from "../components/AvatarEditPanel";
import { ConfirmOrderModal } from "../components/ConfirmOrderModal";
import { buildVariantsFromEntry } from "../data/clothing";
import type { AvatarProfile, ClothingItem } from "../types/avatar.types";

export const AvatarPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    profile,
    morphs,
    selectedClothing,
    primaryClothing,
    orders,
    isEditingBody,
    isConfirmingOrder,
    garmentColor,
    setGarmentColor,
    updateProfile,
    selectClothing,
    setSelectedClothing,
    setPrimaryClothing,
    placeOrder,
    setIsEditingBody,
    setIsConfirmingOrder,
    setOrders,
  } = useAvatarStore();

  const [showOrders, setShowOrders] = useState(false);

  // ── Resolve clothing passed from the entry point (state or query params) ──
  const entryItems = useMemo<ClothingItem[]>(() => {
    const stateClothing = (location.state as { clothing?: ClothingItem[] } | null)
      ?.clothing;
    if (Array.isArray(stateClothing) && stateClothing.length) return stateClothing;

    const id = searchParams.get("id");
    const item = Number(searchParams.get("item"));
    const variant = Number(searchParams.get("variant")) || 1;
    if (id && item) return buildVariantsFromEntry(id, item, variant);

    return [];
    // location.key changes per navigation; recompute when the entry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, searchParams]);

  useEffect(() => {
    if (entryItems.length) {
      setPrimaryClothing(entryItems);
      setSelectedClothing(entryItems[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryItems]);

  const handleReset = () => {
    if (
      window.confirm(
        "Reset your avatar? Your measurements and current fitting will be cleared.",
      )
    ) {
      updateProfile(null);
      setSelectedClothing(null);
      setPrimaryClothing([]);
    }
  };

  const handleProfilePatch = (patch: Partial<AvatarProfile>) => {
    if (!profile) return;
    updateProfile({ ...profile, ...patch });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex h-screen flex-col overflow-hidden bg-white text-slate-900"
    >
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-100 bg-white/90 px-5 backdrop-blur-md md:px-7">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5"
          aria-label="Home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-purple-500 text-base font-black text-white shadow-md shadow-violet-300/40">
            ጥ
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight">
            Tilet<span className="text-violet-600">3D</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {profile && (
            <div className="mr-1 hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="capitalize text-slate-500">
                <strong className="font-semibold text-slate-900">
                  {profile.nickname}
                </strong>{" "}
                · {profile.gender}
              </span>
            </div>
          )}

          <HeaderButton onClick={() => setShowOrders(true)} label="Orders">
            <History className="h-4 w-4" />
            {orders.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white">
                {orders.length}
              </span>
            )}
          </HeaderButton>

          {profile && (
            <HeaderButton onClick={handleReset} label="Reset avatar">
              <RotateCcw className="h-4 w-4" />
            </HeaderButton>
          )}
        </div>
      </header>

      {/* ── Main split layout ───────────────────────────────────────────── */}
      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* LEFT — studio (65%) */}
        <div className="relative h-[50vh] w-full shrink-0 overflow-hidden bg-[#f7f6fb] lg:h-full lg:w-[65%]">
          {profile ? (
            <AvatarStudio
              profile={profile}
              morphs={morphs}
              garmentColor={garmentColor}
              onGarmentColorChange={setGarmentColor}
              onEditClick={() => setIsEditingBody(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#f7f6fb]">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
            </div>
          )}

          {/* Edit drawer lives over the studio */}
          <AnimatePresence>
            {profile && isEditingBody && (
              <AvatarEditPanel
                profile={profile}
                onChange={handleProfilePatch}
                onClose={() => setIsEditingBody(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT — clothing panel (35%) */}
        <div className="flex h-[50vh] min-h-0 w-full flex-col border-t border-slate-100 lg:h-full lg:w-[35%] lg:border-l lg:border-t-0">
          <ClothingPanel
            primaryItems={primaryClothing}
            selectedItem={selectedClothing}
            onSelect={selectClothing}
            onConfirm={() => setIsConfirmingOrder(true)} garmentColor={""} onGarmentColorChange={function (hex: string): void {
              throw new Error("Function not implemented.");
            } }          />
        </div>
      </main>

      {/* ── Onboarding (new users) ──────────────────────────────────────── */}
      <AnimatePresence>
        {!profile && <AvatarCreationModal onComplete={updateProfile} />}
      </AnimatePresence>

      {/* ── Confirm order ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {profile && isConfirmingOrder && selectedClothing && (
          <ConfirmOrderModal
            profile={profile}
            morphs={morphs}
            clothing={selectedClothing}
            onOrder={placeOrder}
            onClose={() => setIsConfirmingOrder(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Orders history ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOrders && (
          <OrdersModal
            orders={orders}
            onClear={() => setOrders([])}
            onClose={() => setShowOrders(false)}
            onBrowse={() => {
              setShowOrders(false);
              navigate("/products");
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const HeaderButton: React.FC<{
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ onClick, label, children }) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    aria-label={label}
    title={label}
    className="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-violet-600"
  >
    {children}
  </motion.button>
);

const OrdersModal: React.FC<{
  orders: ReturnType<typeof useAvatarStore>["orders"];
  onClear: () => void;
  onClose: () => void;
  onBrowse: () => void;
}> = ({ orders, onClear, onClose, onBrowse }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="w-full max-w-[460px] overflow-hidden rounded-[28px] bg-white shadow-2xl"
      style={{ maxHeight: "88vh" }}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-500">
            Your Atelier
          </p>
          <h3 className="font-serif text-xl font-semibold text-slate-900">
            Order History
          </h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-6">
        {orders.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <History className="h-5 w-5" />
            </div>
            <h4 className="mt-4 font-serif text-lg font-semibold text-slate-900">
              No orders yet
            </h4>
            <p className="mx-auto mt-1.5 max-w-[240px] text-[13px] text-slate-500">
              Try on a garment and place your first bespoke order.
            </p>
            <button
              onClick={onBrowse}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-violet-500"
            >
              <Home className="h-3.5 w-3.5" />
              Browse Collection
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5"
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {o.clothing.image && (
                    <img
                      src={o.clothing.image}
                      alt={o.clothing.name}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-violet-600">
                      {o.id}
                    </span>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                      {o.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-serif text-sm font-semibold text-slate-900">
                    {o.clothing.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {o.date} · {o.clothing.currency ?? "ETB"}{" "}
                    {o.clothing.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="border-t border-slate-100 p-5">
          <button
            onClick={onClear}
            className="w-full rounded-full border border-slate-200 py-3 text-xs font-bold uppercase tracking-wider text-rose-500 transition-colors hover:bg-rose-50"
          >
            Clear History
          </button>
        </div>
      )}
    </motion.div>
  </div>
);

export default AvatarPage;
