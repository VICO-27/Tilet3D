import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, ShieldCheck, Truck } from "lucide-react";
import type {
  AvatarProfile,
  BodyMorphs,
  ClothingItem,
} from "../types/avatar.types";
import type { DeliveryInfo } from "../store/useAvatarStore";

interface Props {
  profile: AvatarProfile;
  morphs: BodyMorphs;
  clothing: ClothingItem;
  onOrder: (delivery: DeliveryInfo) => void;
  onClose: () => void;
}

const signed = (v: number) => {
  const d = Math.round((v - 1) * 100);
  return d === 0 ? "Standard" : d > 0 ? `+${d}%` : `${d}%`;
};

export const ConfirmOrderModal: React.FC<Props> = ({
  profile,
  morphs,
  clothing,
  onOrder,
  onClose,
}) => {
  const [delivery, setDelivery] = useState<DeliveryInfo>({
    fullName: profile.nickname,
    phone: "",
    address: "",
  });
  const [error, setError] = useState("");

  const submit = () => {
    if (!delivery.fullName.trim()) return setError("Please enter the recipient's name.");
    if (delivery.phone.trim().length < 9)
      return setError("Please enter a valid phone number.");
    if (!delivery.address.trim())
      return setError("Please add a delivery address.");
    setError("");
    onOrder(delivery);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="relative w-full max-w-[480px] overflow-hidden rounded-[28px] bg-white shadow-2xl"
        style={{ maxHeight: "92vh" }}
      >
        <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-400" />

        <div className="max-h-[calc(92vh-4px)] overflow-y-auto p-7">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-500">
                ጥለት3D · Bespoke Order
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-slate-900">
                Confirm your fit
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Item */}
          <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
              {clothing.image && (
                <img
                  src={clothing.image}
                  alt={clothing.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-500">
                {clothing.brand}
              </p>
              <h4 className="truncate font-serif text-base font-semibold text-slate-900">
                {clothing.name}
              </h4>
              <p className="mt-0.5 text-sm font-bold text-slate-900">
                {clothing.currency ?? "ETB"} {clothing.price.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Fit summary */}
          <div className="mt-5">
            <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tailored To
            </p>
            <div className="grid grid-cols-4 gap-2">
              <Stat label="Height" value={`${profile.height}cm`} />
              <Stat label="Weight" value={`${profile.weight}kg`} />
              <Stat label="Build" value={signed(morphs.build)} />
              <Stat label="Type" value={profile.bodyType} />
            </div>
          </div>

          {/* Delivery */}
          <div className="mt-6 space-y-3">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <Truck className="h-3.5 w-3.5" />
              Delivery Details
            </p>
            <input
              id="client-name-input"
              type="text"
              placeholder="Recipient name"
              value={delivery.fullName}
              onChange={(e) => setDelivery({ ...delivery, fullName: e.target.value })}
              className={inputCls}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +251
                </span>
                <input
                  id="phone-input"
                  type="tel"
                  maxLength={9}
                  placeholder="912345678"
                  value={delivery.phone}
                  onChange={(e) =>
                    setDelivery({
                      ...delivery,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className={`${inputCls} pl-12`}
                />
              </div>
              <input
                id="address-input"
                type="text"
                placeholder="e.g. Bole, Addis Ababa"
                value={delivery.address}
                onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-rose-50 py-2 text-center text-xs font-medium text-rose-600">
              {error}
            </p>
          )}

          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-violet-50 p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <p className="text-[11px] leading-relaxed text-slate-600">
              Master weavers in Addis Ababa will handcraft your garment to these
              exact 3D proportions.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              id="cancel-order-button"
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 transition-colors hover:bg-slate-50"
            >
              Back
            </button>
            <motion.button
              id="confirm-place-order-button"
              whileTap={{ scale: 0.98 }}
              onClick={submit}
              className="flex-[1.6] rounded-full bg-gradient-to-r from-violet-600 to-purple-600 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500"
            >
              Place Order
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100";

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-2 py-2.5 text-center">
    <p className="truncate text-xs font-bold capitalize text-slate-900">{value}</p>
    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
      {label}
    </p>
  </div>
);
