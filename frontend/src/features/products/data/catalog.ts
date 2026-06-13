import type { ClothingItem } from "../../avatar/types/avatar.types";

/**
 * Collection catalogue for the Products page.
 *
 * Strategy: every card uses a REAL local asset (image or video) under
 * `public/products/**`, so nothing 404s and no card ever goes black. The three
 * asset-backed categories (Habesha Kemis, Suri, Shemiz) use their own files
 * including a genuine second variant for the hover image-swap; the remaining
 * categories reuse the local Ethiopian-fashion pool so imagery stays on-brand.
 */

export interface CatalogProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number; // ETB
  fabric: string;
  img: string; // cover
  imgHover: string; // shown on hover (crossfade)
  video?: string; // optional video media
  badge?: string;
}

/* ── asset path helpers ─────────────────────────────────────────────────── */
const kImg = (n: number, v: number) =>
  `/products/images/habesha-kemis/habesha-kemis${n}-${v}.jpg`;
const sImg = (n: number, v: number) => `/products/images/suri/suri${n}-${v}.jpg`;
const zImg = (n: number, v: number) =>
  `/products/images/shemiz/shemiz${n}-${v}.jpg`;
const fVid = (n: number) => `/products/featured/featured${n}.mp4`;
const kVid = (n: number) =>
  `/products/videos/habesha-kemis/habesha-kemis-loop${n}-1.mp4`;
const zVid = (n: number) => `/products/videos/shemiz/shemiz-loop${n}-1.mp4`;

const BRANDS = [
  "Yefikir Design",
  "Mafi Mafi",
  "Kunjina",
  "Zaaf Collection",
  "Sabahar",
  "Paradise Fashion",
  "Lewage Atelier",
];
const NAMES = [
  "Signature",
  "Heritage",
  "Royal",
  "Atelier",
  "Festive",
  "Imperial",
  "Modern",
  "Noble",
  "Bespoke",
  "Classic",
];

/** General local-image pool (cover + a distinct hover counterpart). */
const POOL = [
  kImg(1, 1), kImg(2, 1), kImg(3, 1), kImg(4, 1), kImg(5, 1), kImg(6, 1), kImg(7, 1),
  sImg(1, 1), sImg(2, 1), sImg(3, 1), sImg(4, 1), sImg(5, 1), sImg(6, 1), sImg(7, 1), sImg(8, 1), sImg(9, 1),
  zImg(2, 1), zImg(3, 1), zImg(4, 1), zImg(5, 1), zImg(6, 1),
];
const POOL_HOVER = [
  kImg(1, 2), kImg(2, 2), kImg(3, 2), kImg(4, 2), kImg(5, 2), kImg(6, 2), kImg(7, 2),
  sImg(1, 2), sImg(2, 2), sImg(3, 2), sImg(4, 2), sImg(5, 1), sImg(6, 1), sImg(7, 1), sImg(8, 1), sImg(9, 1),
  zImg(2, 2), zImg(3, 1), zImg(4, 1), zImg(5, 1), zImg(6, 1),
];
const VIDEOS = Array.from({ length: 22 }, (_, i) => fVid(i + 1));

const FABRIC: Record<string, string> = {
  "Habesha Kemis": "Hand-woven cotton · gold Tilet",
  Shirt: "Crisp poplin cotton",
  "T-Shirt": "Combed jersey · Tilet print",
  Shemiz: "Fine poplin · tonal placket",
  Suri: "Brushed cotton blend",
  Netela: "Gossamer two-layer cotton",
  Gabi: "Handspun four-layer cotton",
  Shash: "Silk-blend head wrap",
  Accessories: "Artisan woven detail",
};

const BASE_PRICE: Record<string, number> = {
  "Habesha Kemis": 8200,
  Shirt: 3600,
  "T-Shirt": 2400,
  Shemiz: 3900,
  Suri: 6400,
  Netela: 4200,
  Gabi: 5200,
  Shash: 1800,
  Accessories: 1500,
};

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

interface BuildOpts {
  count: number;
  imgs: string[];
  hovers: string[];
  videos: string[];
}

function build(category: string, opts: BuildOpts): CatalogProduct[] {
  const { count, imgs, hovers, videos } = opts;
  return Array.from({ length: count }, (_, i) => ({
    id: `${slug(category)}-${i + 1}`,
    name: `${category} · ${NAMES[i % NAMES.length]}`,
    brand: BRANDS[i % BRANDS.length],
    category,
    price: BASE_PRICE[category] + (i % 5) * 350,
    fabric: FABRIC[category] ?? "Hand-woven cotton",
    img: imgs[i % imgs.length],
    imgHover: hovers[i % hovers.length] ?? imgs[i % imgs.length],
    video: videos.length ? videos[i % videos.length] : undefined,
    badge: i === 0 ? "Bestseller" : i === 2 ? "New" : undefined,
  }));
}

/** Rotate an array so the hover image differs from the cover. */
const rot = <T,>(arr: T[], by = 1) => arr.map((_, i) => arr[(i + by) % arr.length]);

export const PRODUCTS_BY_CATEGORY: Record<string, CatalogProduct[]> = {
  "Habesha Kemis": build("Habesha Kemis", {
    count: 7,
    imgs: [kImg(1, 1), kImg(2, 1), kImg(3, 1), kImg(4, 1), kImg(5, 1), kImg(6, 1), kImg(7, 1)],
    hovers: [kImg(1, 2), kImg(2, 2), kImg(3, 2), kImg(4, 2), kImg(5, 2), kImg(6, 2), kImg(7, 2)],
    videos: [kVid(1), kVid(3), kVid(5), kVid(7), kVid(9)],
  }),
  Suri: build("Suri", {
    count: 9,
    imgs: [sImg(1, 1), sImg(2, 1), sImg(3, 1), sImg(4, 1), sImg(5, 1), sImg(6, 1), sImg(7, 1), sImg(8, 1), sImg(9, 1)],
    hovers: [sImg(1, 2), sImg(2, 2), sImg(3, 2), sImg(4, 2), sImg(6, 1), sImg(7, 1), sImg(8, 1), sImg(9, 1), sImg(5, 1)],
    videos: [fVid(2), fVid(6), fVid(10), fVid(14)],
  }),
  Shemiz: build("Shemiz", {
    count: 6,
    imgs: [zImg(2, 1), zImg(3, 1), zImg(4, 1), zImg(5, 1), zImg(6, 1), zImg(2, 1)],
    hovers: [zImg(2, 2), zImg(4, 1), zImg(5, 1), zImg(6, 1), zImg(3, 1), zImg(2, 2)],
    videos: [zVid(1), zVid(2), zVid(3), zVid(4)],
  }),
  Shirt: build("Shirt", { count: 8, imgs: POOL, hovers: POOL_HOVER, videos: VIDEOS }),
  "T-Shirt": build("T-Shirt", { count: 8, imgs: rot(POOL, 3), hovers: rot(POOL_HOVER, 3), videos: rot(VIDEOS, 4) }),
  Netela: build("Netela", { count: 8, imgs: rot(POOL, 6), hovers: rot(POOL_HOVER, 6), videos: rot(VIDEOS, 8) }),
  Gabi: build("Gabi", { count: 8, imgs: rot(POOL, 9), hovers: rot(POOL_HOVER, 9), videos: rot(VIDEOS, 12) }),
  Shash: build("Shash", { count: 8, imgs: rot(POOL, 12), hovers: rot(POOL_HOVER, 12), videos: rot(VIDEOS, 16) }),
  Accessories: build("Accessories", { count: 8, imgs: rot(POOL, 15), hovers: rot(POOL_HOVER, 15), videos: rot(VIDEOS, 2) }),
};

export const CATEGORIES = Object.keys(PRODUCTS_BY_CATEGORY);

/** Apple-style category nav (ordered) + "All". */
export const CATEGORY_NAV = [...CATEGORIES, "All"];

/** Themed blocks of 3 categories each, matching the product nav order. */
export const BLOCKS: { id: string; categories: string[] }[] = [
  { id: "block-1", categories: ["Habesha Kemis", "Shirt", "T-Shirt"] },
  { id: "block-2", categories: ["Shemiz", "Suri", "Netela"] },
  { id: "block-3", categories: ["Gabi", "Shash", "Accessories"] },
];

/** Cultural interludes shown between blocks (each rendered with a different design). */
export const INTERLUDES = [
  {
    kicker: "ጥለት · The Thread",
    title: "Every pattern tells a story",
    body: "For centuries, Ethiopian weavers have encoded geography, faith and family into the Tilet — the woven border that crowns every Habesha garment.",
  },
  {
    kicker: "እጅ · The Hand",
    title: "Woven on pit looms, by hand",
    body: "From the cotton fields of Arba Minch to the looms of Shiro Meda, each piece passes through dozens of artisan hands before it ever reaches yours.",
  },
];

const VARIANT_LABELS = ["Signature", "Variation", "Edition"];

/** Map a catalogue product → avatar ClothingItem[] for the Fitting Room. */
export function toClothingVariants(p: CatalogProduct): ClothingItem[] {
  const images = p.imgHover && p.imgHover !== p.img ? [p.img, p.imgHover] : [p.img];
  return images.map((image, i) => ({
    id: `${p.id}-v${i + 1}`,
    name: images.length > 1 ? `${p.name} · ${VARIANT_LABELS[i]}` : p.name,
    brand: p.brand,
    price: p.price + i * 300,
    currency: "ETB",
    image,
    category: p.category,
    fabric: p.fabric,
    badge: i === 0 ? p.badge : undefined,
    variantGroup: p.id,
    variantIndex: i + 1,
    description: `Bespoke ${p.category.toLowerCase()} tailored to your avatar's exact proportions.`,
  }));
}

export const PRODUCT_FALLBACK_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='520'><rect width='100%' height='100%' fill='#f1edfb'/><text x='50%' y='50%' font-family='Georgia, serif' font-size='22' fill='#a78bfa' text-anchor='middle'>ጥለት3D</text></svg>`,
  );
