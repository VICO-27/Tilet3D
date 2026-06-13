import type { ClothingItem } from "../types/avatar.types";

/**
 * Sample catalogue for the avatar studio.
 *
 * All imagery points at the local assets under `public/products/images/**`
 * (so cards always render — no external/broken URLs). Brand and garment names
 * are drawn from the real Ethiopian fashion scene for an authentic editorial feel.
 */

const KEMIS_IMG = (set: number, variant: number) =>
  `/products/images/habesha-kemis/habesha-kemis${set}-${variant}.jpg`;
const SURI_IMG = (set: number, variant: number) =>
  `/products/images/suri/suri${set}-${variant}.jpg`;
const SHEMIZ_IMG = (set: number, variant: number) =>
  `/products/images/shemiz/shemiz${set}-${variant}.jpg`;

/** Real Ethiopian fashion houses, used as sample brand names. */
export const BRANDS = {
  yefikir: "Yefikir Design",
  mafi: "Mafi Mafi",
  kunjina: "Kunjina",
  zaaf: "Zaaf Collection",
  sabahar: "Sabahar",
  paradise: "Paradise Fashion",
  lewage: "Lewage Atelier",
} as const;

/**
 * Curated rail for the "Most Purchased This Week" section.
 * Each item is a standalone garment (no variant grouping needed here).
 */
export const MOST_PURCHASED: ClothingItem[] = [
  {
    id: "mp-kemis-1",
    name: "Tibeb Zuria Gown",
    brand: BRANDS.yefikir,
    price: 8200,
    image: KEMIS_IMG(1, 1),
    category: "Habesha Kemis",
    fabric: "Hand-woven cotton · gold Tilet",
    badge: "Bestseller",
    description:
      "A flowing Zuria silhouette finished with a hand-embroidered gold Tibeb border.",
  },
  {
    id: "mp-suri-1",
    name: "Menen Two-Piece",
    brand: BRANDS.mafi,
    price: 6400,
    image: SURI_IMG(2, 1),
    category: "Suri",
    fabric: "Brushed cotton blend",
    badge: "Trending",
    description: "Tailored vest-and-trouser set with contemporary Tilet detailing.",
  },
  {
    id: "mp-kemis-2",
    name: "Axum Royal Kemis",
    brand: BRANDS.zaaf,
    price: 11800,
    image: KEMIS_IMG(3, 1),
    category: "Habesha Kemis",
    fabric: "Silk-cotton · royal blue Tilet",
    badge: "Limited",
    description: "Statement bridal-grade Kemis with deep royal-blue threadwork.",
  },
  {
    id: "mp-shemiz-1",
    name: "Lalibela Shemiz",
    brand: BRANDS.kunjina,
    price: 3900,
    image: SHEMIZ_IMG(2, 1),
    category: "Shemiz",
    fabric: "Crisp poplin cotton",
    description: "Minimalist men's Shemiz with a fine geometric neckline stitch.",
  },
  {
    id: "mp-suri-2",
    name: "Sheba Linen Set",
    brand: BRANDS.sabahar,
    price: 7100,
    image: SURI_IMG(4, 1),
    category: "Suri",
    fabric: "Organic Arba Minch linen",
    badge: "New",
    description: "Breathable linen co-ord woven on traditional pit looms.",
  },
  {
    id: "mp-kemis-3",
    name: "Gondar Emerald Kemis",
    brand: BRANDS.paradise,
    price: 9600,
    image: KEMIS_IMG(5, 1),
    category: "Habesha Kemis",
    fabric: "Cotton · emerald Tilet",
    description: "Festive Kemis with an emerald-and-gold woven hem.",
  },
  {
    id: "mp-shemiz-2",
    name: "Harar Heritage Shirt",
    brand: BRANDS.lewage,
    price: 4300,
    image: SHEMIZ_IMG(3, 1),
    category: "Shemiz",
    fabric: "Handspun cotton",
    description: "Heritage cut with a subtle tonal Tilet placket.",
  },
  {
    id: "mp-suri-3",
    name: "Adwa Tailored Suri",
    brand: BRANDS.mafi,
    price: 6900,
    image: SURI_IMG(6, 1),
    category: "Suri",
    fabric: "Structured cotton twill",
    badge: "Trending",
    description: "Sharp modern Suri with hand-finished Tilet cuffs.",
  },
];

/** Category → brand map for items reconstructed from a product entry. */
const CATEGORY_BRAND: Record<string, string> = {
  "habesha-kemis": BRANDS.yefikir,
  suri: BRANDS.mafi,
  shemiz: BRANDS.kunjina,
};

const CATEGORY_LABEL: Record<string, string> = {
  "habesha-kemis": "Habesha Kemis",
  suri: "Suri",
  shemiz: "Shemiz",
};

const CATEGORY_FABRIC: Record<string, string> = {
  "habesha-kemis": "Hand-woven cotton · gold Tilet",
  suri: "Brushed cotton blend",
  shemiz: "Crisp poplin cotton",
};

/** Variant count per category (matches the assets present in /public). */
const CATEGORY_VARIANTS: Record<string, number> = {
  "habesha-kemis": 3,
  suri: 2,
  shemiz: 1,
};

const VARIANT_NAMES = ["Signature", "Royal Blue", "Emerald"];

/**
 * Rebuild a small set of clothing variants from a product-card entry
 * (`/avatar?id=<category>&item=<n>&variant=<v>`). Used when the user arrives
 * from `ProductCategory2` / `FeaturedCollectionSection`, which pass query params
 * rather than router state.
 */
export function buildVariantsFromEntry(
  categoryId: string,
  itemNum: number,
  activeVariant = 1,
): ClothingItem[] {
  const id = categoryId.toLowerCase();
  const label = CATEGORY_LABEL[id] ?? prettify(id);
  const brand = CATEGORY_BRAND[id] ?? BRANDS.yefikir;
  const fabric = CATEGORY_FABRIC[id] ?? "Hand-woven cotton";
  const variantCount = CATEGORY_VARIANTS[id] ?? 1;

  const imageFor = (variant: number) => {
    if (id === "suri") return SURI_IMG(itemNum, Math.min(variant, 2));
    if (id === "shemiz") return SHEMIZ_IMG(Math.max(itemNum, 2), 1);
    if (id === "habesha-kemis") return KEMIS_IMG(itemNum, variant);
    return `/products/images/${id}/${id}${itemNum}-${variant}.jpg`;
  };

  const variants: ClothingItem[] = Array.from(
    { length: variantCount },
    (_, i) => {
      const v = i + 1;
      return {
        id: `${id}-${itemNum}-${v}`,
        name: `${label} · ${VARIANT_NAMES[i] ?? `Edition ${v}`}`,
        brand,
        price: 3400 + i * 600,
        image: imageFor(v),
        category: label,
        fabric,
        badge: i === 0 ? "Your pick" : undefined,
        variantGroup: `${id}-${itemNum}`,
        variantIndex: v,
        description: `Bespoke ${label.toLowerCase()} woven to your avatar's exact proportions.`,
      };
    },
  );

  // Surface the variant the user was hovering when they clicked.
  const idx = Math.max(0, Math.min(activeVariant - 1, variants.length - 1));
  if (idx > 0) {
    const [picked] = variants.splice(idx, 1);
    variants.unshift(picked);
  }
  return variants;
}

function prettify(slug: string) {
  return slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
