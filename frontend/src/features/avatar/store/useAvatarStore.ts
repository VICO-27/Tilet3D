import { useCallback, useEffect, useState } from "react";
import type {
  AvatarProfile,
  BodyMorphs,
  ClothingItem,
} from "../types/avatar.types";

export interface Order {
  id: string;
  profile: AvatarProfile;
  morphs: BodyMorphs;
  clothing: ClothingItem;
  date: string;
  status: "Processing" | "Completed" | "Shipped";
}

export interface DeliveryInfo {
  fullName: string;
  phone: string;
  address: string;
}

const DEFAULT_MORPHS: BodyMorphs = { height: 1.0, build: 1.0 };

const KEYS = {
  profile: "tilet3d_profile",
  morphs: "tilet3d_morphs",
  selected: "tilet3d_selected_clothing",
  orders: "tilet3d_orders",
  garment: "tilet3d_garment_color",
} as const;

const DEFAULT_GARMENT = "#f4efe2"; // ivory (white with Tilet design)

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Derive the body-scale multipliers from a profile's metrics + body type.
 * Height ~ vertical scale, weight + body type ~ lateral (build) scale.
 * Clamped to keep the mesh believable.
 */
export function deriveMorphs(profile: AvatarProfile): BodyMorphs {
  const height = clamp(0.92 + (profile.height - 170) / 170, 0.9, 1.12);

  const bodyTypeBias: Record<AvatarProfile["bodyType"], number> = {
    slim: -0.05,
    athletic: 0.0,
    average: 0.03,
    plus: 0.1,
  };
  const weightBias = (profile.weight - 70) / 260;
  const build = clamp(1.0 + weightBias + bodyTypeBias[profile.bodyType], 0.86, 1.2);

  return { height, build };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export const useAvatarStore = () => {
  const [profile, setProfile] = useState<AvatarProfile | null>(() =>
    load<AvatarProfile | null>(KEYS.profile, null),
  );
  const [morphs, setMorphs] = useState<BodyMorphs>(() =>
    load<BodyMorphs>(KEYS.morphs, DEFAULT_MORPHS),
  );
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem | null>(
    () => load<ClothingItem | null>(KEYS.selected, null),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    load<Order[]>(KEYS.orders, []),
  );

  // Items surfaced in the panel's primary section (from a product entry).
  const [primaryClothing, setPrimaryClothing] = useState<ClothingItem[]>([]);

  const [garmentColor, setGarmentColorState] = useState<string>(() =>
    load<string>(KEYS.garment, DEFAULT_GARMENT),
  );

  const [isEditingBody, setIsEditingBody] = useState(false);
  const [isConfirmingOrder, setIsConfirmingOrder] = useState(false);

  useEffect(() => {
    localStorage.setItem(KEYS.garment, JSON.stringify(garmentColor));
  }, [garmentColor]);

  const setGarmentColor = useCallback((hex: string) => setGarmentColorState(hex), []);

  // ── Persistence ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile) localStorage.setItem(KEYS.profile, JSON.stringify(profile));
    else localStorage.removeItem(KEYS.profile);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(KEYS.morphs, JSON.stringify(morphs));
  }, [morphs]);

  useEffect(() => {
    if (selectedClothing)
      localStorage.setItem(KEYS.selected, JSON.stringify(selectedClothing));
    else localStorage.removeItem(KEYS.selected);
  }, [selectedClothing]);

  useEffect(() => {
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  }, [orders]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const updateProfile = useCallback((next: AvatarProfile | null) => {
    setProfile(next);
    if (next) {
      setMorphs(deriveMorphs(next));
    } else {
      // Full reset on profile clear.
      setMorphs(DEFAULT_MORPHS);
      setSelectedClothing(null);
    }
  }, []);

  /** Live-edit a single body-scale axis (height | build) without a full profile rebuild. */
  const updateMorph = useCallback((key: keyof BodyMorphs, val: number) => {
    setMorphs((prev) => ({ ...prev, [key]: val }));
  }, []);

  const setSkinTone = useCallback((tone: AvatarProfile["skinTone"]) => {
    setProfile((prev) => (prev ? { ...prev, skinTone: tone } : prev));
  }, []);

  const setBodyType = useCallback((bodyType: AvatarProfile["bodyType"]) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, bodyType };
      setMorphs(deriveMorphs(next));
      return next;
    });
  }, []);

  const selectClothing = useCallback((item: ClothingItem) => {
    setSelectedClothing(item);
  }, []);

  const placeOrder = useCallback(
    (_delivery?: DeliveryInfo) => {
      if (!profile || !selectedClothing) return;
      const newOrder: Order = {
        id: "TLT-" + Math.floor(Math.random() * 90000 + 10000),
        profile,
        morphs,
        clothing: selectedClothing,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        status: "Processing",
      };
      setOrders((prev) => [newOrder, ...prev]);
      setIsConfirmingOrder(false);
    },
    [profile, morphs, selectedClothing],
  );

  return {
    profile,
    morphs,
    selectedClothing,
    primaryClothing,
    orders,
    garmentColor,
    setGarmentColor,
    isEditingBody,
    isConfirmingOrder,
    updateProfile,
    updateMorph,
    setMorphs,
    setSkinTone,
    setBodyType,
    selectClothing,
    setSelectedClothing,
    setPrimaryClothing,
    placeOrder,
    setIsEditingBody,
    setIsConfirmingOrder,
    setOrders,
  };
};
