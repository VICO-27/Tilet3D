import { useRef } from "react";
import { ProductRow } from "./ProductRow";
import {
  PRODUCTS_BY_CATEGORY,
  type CatalogProduct,
} from "../data/catalog";

interface Props {
  categories: string[]; // exactly 3
  onTryOn: (p: CatalogProduct) => void;
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

/**
 * One themed block = 3 rows.
 * Row 1 auto-scrolls (bidirectional) + draggable.
 * Rows 2 & 3 are linked in OPPOSING directions: scrolling one mirrors the other.
 */
export const ProductBlock: React.FC<Props> = ({ categories, onTryOn }) => {
  const [c1, c2, c3] = categories;
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);
  const syncing = useRef(false);

  const mirror = (
    primary: React.RefObject<HTMLDivElement | null>,
    secondary: React.RefObject<HTMLDivElement | null>,
  ) => {
    if (syncing.current || !primary.current || !secondary.current) return;
    syncing.current = true;
    const p = primary.current;
    const s = secondary.current;
    const maxP = p.scrollWidth - p.clientWidth;
    const maxS = s.scrollWidth - s.clientWidth;
    if (maxP > 0) s.scrollLeft = (1 - p.scrollLeft / maxP) * maxS;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  };

  return (
    <div>
      <RowBlock category={c1}>
        <ProductRow
          products={PRODUCTS_BY_CATEGORY[c1]}
          mode="auto"
          videoFirst
          onTryOn={onTryOn}
        />
      </RowBlock>

      <RowBlock category={c2}>
        <ProductRow
          products={PRODUCTS_BY_CATEGORY[c2]}
          mode="linked"
          videoFirst={false}
          scrollRef={row2Ref}
          onScroll={() => mirror(row2Ref, row3Ref)}
          onTryOn={onTryOn}
        />
      </RowBlock>

      <RowBlock category={c3}>
        <ProductRow
          products={PRODUCTS_BY_CATEGORY[c3]}
          mode="linked"
          videoFirst
          scrollRef={row3Ref}
          onScroll={() => mirror(row3Ref, row2Ref)}
          onTryOn={onTryOn}
        />
      </RowBlock>
    </div>
  );
};

/** Anchor target for the category nav — no visible heading (rows sit flush). */
const RowBlock: React.FC<{ category: string; children: React.ReactNode }> = ({
  category,
  children,
}) => (
  <section id={slug(category)} className="scroll-mt-32">
    {children}
  </section>
);
