export type Gender = "male" | "female";
export type BodyType = "slim" | "athletic" | "average" | "plus";
export type SkinTone =
  | "light"
  | "medium-light"
  | "medium"
  | "medium-dark"
  | "dark";

export interface AvatarProfile {
  nickname: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: Gender;
  bodyType: BodyType;
  skinTone: SkinTone;
}

/**
 * Normalised body scale multipliers applied to the loaded GLB mesh.
 * Height drives vertical scale, build drives lateral (x/z) scale.
 * Kept as a small object so it can be persisted and re-applied live.
 */
export interface BodyMorphs {
  height: number; // ~0.92 – 1.08
  build: number; // ~0.90 – 1.12 (weight + body type combined)
}

export interface ClothingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency?: string; // defaults to "ETB"
  image: string;
  category: string;
  fabric?: string;
  badge?: string;
  description?: string;
  /** Groups variants of the same garment (e.g. colourways). */
  variantGroup?: string;
  variantIndex?: number;
}
