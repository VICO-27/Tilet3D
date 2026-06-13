import type { SkinTone } from "../types/avatar.types";

/** Warm, true-to-tone Habesha complexion swatches used across the studio + modals. */
export const SKIN_TONE_HEX: Record<SkinTone | string, string> = {
  light: "#F1C9A5",
  "medium-light": "#E0A878",
  medium: "#C68642",
  "medium-dark": "#8D5524",
  dark: "#5A3415",
};

export interface SkinToneSwatch {
  value: SkinTone;
  hex: string;
  label: string;
}

export const SKIN_TONE_SWATCHES: SkinToneSwatch[] = [
  { value: "light", hex: SKIN_TONE_HEX.light, label: "Light" },
  { value: "medium-light", hex: SKIN_TONE_HEX["medium-light"], label: "Med. Light" },
  { value: "medium", hex: SKIN_TONE_HEX.medium, label: "Medium" },
  { value: "medium-dark", hex: SKIN_TONE_HEX["medium-dark"], label: "Med. Dark" },
  { value: "dark", hex: SKIN_TONE_HEX.dark, label: "Dark" },
];
