import { Product } from "../../products/types";

export interface ProductViewItem {
  type: "view";
  id: string;
  url: string;
  mediaType: "image" | "video";
  label: string;
  rawView: string;
}

export interface CategoryAlternativeItem {
  type: "alternative";
  product: Product;
  url: string;
  mediaType: "image" | "video";
  label: string;
  categoryName: string;
}

export type SidebarItem = ProductViewItem | CategoryAlternativeItem;

export interface ShowcaseGeometry {
  W: number;
  H: number;
  cardW: number;
  cardH: number;
  rx: number;
  rz: number;
  stepAngle: number;
  centerY: number;
}

export const getCategoryName = (product: Product): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = product as any;
  if (p.category?.name) return p.category.name;
  if (product.category_name) return product.category_name;
  if (typeof p.category === "string") return p.category;
  const name = product.name.toLowerCase();
  if (name.includes("kemis")) return "Kemis";
  if (name.includes("shemiz")) return "Shemiz";
  if (name.includes("netela")) return "Netela";
  if (name.includes("scarf")) return "Scarf";
  if (name.includes("suri")) return "Suri";
  if (name.includes("gabi")) return "Gabi";
  if (name.includes("wedding")) return "Wedding";
  return "Bespoke Couture";
};

const VIEW_KEYWORDS = [
  { match: "front", label: "Front View" },
  { match: "back", label: "Back View" },
  { match: "side", label: "Side View" },
  { match: "top", label: "Top Detailing" },
  { match: "detail", label: "Close Detail" },
  { match: "runway", label: "Runway View" },
];

/**
 * Extracts genuine views of a single product.
 */
export const getProductViews = (product: Product): ProductViewItem[] => {
  const mediaList = product.media || [];
  const seenUrls = new Set<string>();
  const items: ProductViewItem[] = [];

  mediaList.forEach((m, idx) => {
    if (!m?.file || seenUrls.has(m.file)) return;
    seenUrls.add(m.file);

    const desc = `${m.alt_text || ""} ${m.file}`.toLowerCase();
    let label = "";

    for (const kw of VIEW_KEYWORDS) {
      if (desc.includes(kw.match)) {
        label = kw.label;
        break;
      }
    }

    if (!label) {
      if (m.media_type === "video") {
        label = `Runway Simulation ${idx + 1}`;
      } else {
        label = idx === 0 ? "Primary Angle" : `Perspective ${idx + 1}`;
      }
    }

    items.push({
      type: "view",
      id: m.id || `${product.id}-media-${idx}`,
      url: m.file,
      mediaType: m.media_type,
      label,
      rawView: label,
    });
  });

  return items;
};

/**
 * Computes 3D circular orbit geometry where all cards are aligned along
 * a completely straight horizontal centerline (centerY = (H - cardH) / 2),
 * with symmetrical scaling from BOTH top and bottom (zero pyramid shape).
 */
export const computeGeometry = (W: number, H: number): ShowcaseGeometry => {
  const isNarrow = W < 640;
  const isMid = W >= 640 && W < 1024;

  // Responsive card dimensions — enlarged for striking editorial presence
  const cardW = isNarrow
    ? Math.min(W * 0.44, 200)
    : isMid
      ? Math.min(W * 0.28, 245)
      : Math.min(W * 0.24, 275);
  const cardH = Math.min(cardW * 1.48, Math.max(250, H * 0.78));

  // Angular spacing between cards
  const stepAngle = isNarrow ? 0.62 : isMid ? 0.50 : 0.46;

  // Horizontal spread radius: spreads the 5 cards across the entire stage width
  // eliminating empty space on the left and right edges
  const margin = isNarrow ? 10 : 20;
  const rx = Math.max(
    cardW * 1.35,
    (W / 2 - margin) / Math.sin(stepAngle * 2)
  );

  // 3D depth radius into the screen (z-axis)
  const rz = Math.min(cardW * 1.6, 440);

  // Straight horizontal centerline: exactly vertically centered in the stage
  const centerY = Math.max(8, (H - cardH) / 2);

  return { W, H, cardW, cardH, rx, rz, stepAngle, centerY };
};
