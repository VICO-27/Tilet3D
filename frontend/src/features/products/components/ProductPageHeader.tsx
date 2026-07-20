// src/features/products/components/ProductPageHeader.tsx
import React from "react";
import { CATEGORY_ORDER } from "../utils/productHelpers";

interface Props {
  categories: string[];
  onCategorySelect: (category: string) => void;
}

const ProductPageHeader: React.FC<Props> = ({ categories, onCategorySelect }) => {
  const navbarCategories = CATEGORY_ORDER.filter(
    (category) => category === "All" || categories.includes(category)
  );

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="pt-28 pb-16 px-8 md:px-10 relative overflow-hidden select-none">
        
        {/* GIANT BACKGROUND WATERMARK TEXT (AMHARIC FORM) */}
        <div 
          className="absolute inset-0 flex items-center justify-start -left-4 md:left-8 pointer-events-none font-bold text-[15vw] md:text-[18vw] tracking-tighter leading-none text-zinc-200/80 z-0"
          style={{
            fontFamily: "'Iowan Old Style','Palatino Linotype',serif",
          }}
        >
          ጥለት3D
        </div>

        {/* FOREGROUND CONTENT */}
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-end gap-12 relative z-10">
          
          {/* LEFT */}
          <div className="max-w-3xl">
            <span
              className="block mb-5 uppercase tracking-[0.32em] text-[11px] font-semibold text-plum-500"
              style={{
                fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
              }}
            >
              ✦ ጥ Tilet3D · THE COLLECTION
            </span>

            <h1
              className="text-[28px] md:text-[38px] leading-tight font-bold text-ink tracking-[-0.02em]"
              style={{
                fontFamily: "'Iowan Old Style','Palatino Linotype','Book Antiqua','Times New Roman',serif",
              }}
            >
              Heritage couture, woven for now.
            </h1>
          </div>

          {/* RIGHT - LUXURY EDITORIAL AMHARIC STYLE */}
          <div className="max-w-md lg:pb-1">
            <p
              className="text-[16px] md:text-[17px] leading-[1.8] text-ink/80 font-normal tracking-wide antialiased"
              style={{
                fontFamily: "'Nyala', 'Kefa', 'Abyssinica SIL', 'Power Ge'ez', serif",
                fontFeatureSettings: '"kern" 1',
              }}
            >
              በኢትዮጵያ ምርጥ የዕደ-ጥበብ ማዕከላት በእጅ የተሰሩ ውብ የሀበሻ አልባሳት — ማንኛውንም ልብስ በ3ዲ አቫታርዎ ላይ በቀጥታ ይሞክሩ።
            </p>
          </div>

        </div>
      </section>

      {/* ================= CATEGORY NAV ================= */}
      <nav
        className="
          sticky
          top-[48px]
          z-40
          bg-white/85
          backdrop-blur-2xl
          border-y
          border-black/5
        "
      >
        <div
          className="
            max-w-7xl
            mx-auto
            h-14
            px-8
            flex
            justify-center
            items-center
            gap-8
            overflow-x-auto
            no-scrollbar
          "
        >
          {navbarCategories.map((category) => (
            <button
              key={category}
              onClick={() => onCategorySelect(category)}
              style={{
                fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
              }}
              className="
                shrink-0
                text-[13px]
                font-medium
                tracking-normal
                text-ink/55
                hover:text-ink
                transition-colors
                duration-300
              "
            >
              {category}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default ProductPageHeader;