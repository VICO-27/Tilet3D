import { CATEGORY_NAV } from "../data/catalog";

interface Props {
  active: string;
  onSelect: (category: string) => void;
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

/** Apple.com-style product sub-navigation. Click scrolls to that category row. */
const CategoryNav: React.FC<Props> = ({ active, onSelect }) => {
  const handle = (cat: string) => {
    onSelect(cat);
    if (cat === "All") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(slug(cat));
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="sticky top-[68px] z-40 border-b border-ink/[0.06] bg-white/85 backdrop-blur-xl">
      <div className="no-scrollbar mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-6 md:justify-center md:px-10">
        {CATEGORY_NAV.map((cat) => (
          <button
            key={cat}
            onClick={() => handle(cat)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-3 text-[12px] font-medium transition-colors ${
              active === cat
                ? "text-plum-600"
                : "text-ink/55 hover:text-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryNav;
