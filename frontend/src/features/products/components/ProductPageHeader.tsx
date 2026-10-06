import React from "react";
import { CATEGORY_ORDER } from "../utils/productHelpers";
import { SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useScrollDirection } from "../../../shared/hooks/useScrollDirection";

interface Props {
  categories: string[];
  activeCategory?: string;
  onCategorySelect: (category: string) => void;
}

const ProductPageHeader: React.FC<Props> = ({ categories, activeCategory = "All", onCategorySelect }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { scrollDirection, scrollY } = useScrollDirection();
  
  // When top navbar is hidden (scrolling down), category nav should slide up to top-0
  const isNavHidden = scrollDirection === 'down' && scrollY > 50;

  const navbarCategories = CATEGORY_ORDER.filter(
    (category) => category === "All" || categories.includes(category)
  );

  return (
    <>
      {/* ================= CATEGORY NAV (FIXED AT TOP) ================= */}
      <nav
        className={`
          fixed
          inset-x-0
          z-40
          bg-white/85
          backdrop-blur-2xl
          border-y
          border-black/5
          transition-all
          duration-300
          ${isNavHidden ? 'top-0' : 'top-[48px]'}
        `}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-center px-4 md:px-8 h-11 w-full">
          <div
            className="
              flex
              justify-start
              md:justify-center
              items-center
              gap-5
              md:gap-8
              overflow-x-auto
              no-scrollbar
              w-full
              md:w-auto
            "
          >
            {navbarCategories.map((category) => {
              const isActive = activeCategory.toLowerCase() === category.toLowerCase();
              return (
                <button
                  key={category}
                  onClick={() => onCategorySelect(category)}
                  style={{
                    fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
                  }}
                  className={`
                    shrink-0
                    text-[12px]
                    font-bold
                    tracking-wide
                    transition-colors
                    duration-300
                    ${isActive ? 'text-plum-600' : 'text-ink/55 hover:text-plum-500'}
                  `}
                >
                  {category}
                </button>
              );
            })}
            
            <div className="pl-2 md:pl-4 border-l border-black/10 shrink-0 flex items-center">
              <button
                 onClick={() => {
                   const newParams = new URLSearchParams(searchParams);
                   newParams.set('open_filters', 'true');
                   setSearchParams(newParams);
                 }}
                 className="flex items-center gap-1.5 text-[12px] font-bold text-ink/70 hover:text-plum-600 transition-colors"
              >
                <SlidersHorizontal size={14} />
                <span className="inline">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="pt-32 pb-16 px-8 md:px-10 relative overflow-hidden select-none w-full max-w-[100vw]">
        
        {/* GIANT BACKGROUND WATERMARK TEXT (AMHARIC FORM) */}
        <div 
          className="absolute inset-0 flex items-center justify-start -left-4 md:left-8 pointer-events-none font-bold text-[15vw] md:text-[18vw] tracking-tighter leading-none text-zinc-200/80 z-0 overflow-hidden"
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
    </>
  );
};

export default ProductPageHeader;