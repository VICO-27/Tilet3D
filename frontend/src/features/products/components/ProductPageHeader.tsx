import React, { useRef, useEffect, useState } from "react";
import { CATEGORY_ORDER } from "../utils/productHelpers";
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { useScrollDirection } from "../../../shared/hooks/useScrollDirection";

interface Props {
  categories: string[];
  activeCategory?: string;
  onCategorySelect: (category: string) => void;
  isNewActive?: boolean;
  onSelectNew?: () => void;
}

const ProductPageHeader: React.FC<Props> = ({
  categories,
  activeCategory = "All",
  onCategorySelect,
  isNewActive = false,
  onSelectNew,
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { navbarHidden, categoryHidden } = useScrollDirection();
  const navScrollRef = useRef<HTMLDivElement>(null);
  const wasDraggedRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const navbarCategories = CATEGORY_ORDER.filter(
    (category) => category === "All" || categories.includes(category)
  );

  useEffect(() => {
    const track = navScrollRef.current;
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;
    let hasDragged = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        hasDragged = true;
        wasDraggedRef.current = true;
      }
      track.scrollLeft = scrollLeftStart - dx * 1.2;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      track.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (hasDragged) {
        setTimeout(() => {
          wasDraggedRef.current = false;
        }, 120);
      } else {
        wasDraggedRef.current = false;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      wasDraggedRef.current = false;
      track.style.cursor = 'grabbing';
      startX = e.clientX;
      scrollLeftStart = track.scrollLeft;

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    track.addEventListener('mousedown', onMouseDown);
    return () => {
      track.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleOpenFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('open_filters', 'true');
    setSearchParams(newParams);
  };

  return (
    <>
      {/* ================= CATEGORY NAV (FIXED AT TOP) ================= */}
      <nav
        className={`
          fixed
          top-[48px]
          inset-x-0
          z-40
          bg-white/90
          backdrop-blur-2xl
          border-y
          border-black/5
          transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${categoryHidden 
            ? '-translate-y-[92px]' 
            : navbarHidden 
              ? '-translate-y-[48px]' 
              : 'translate-y-0'
          }
        `}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between md:justify-center px-3 sm:px-4 md:px-8 h-11 w-full">
          
          {/* ================= MOBILE VIEW (PHONE USERS) ================= */}
          <div className={`flex md:hidden items-center ${isExpanded ? 'justify-between' : 'justify-start'} w-full gap-2.5 overflow-hidden`}>
            {/* Category selection: 2 categories in contracted mode, all in expanded mode */}
            <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-1">
              {(isExpanded ? navbarCategories : navbarCategories.slice(0, 2)).map((category) => {
                const isActive = !isNewActive && activeCategory.toLowerCase() === category.toLowerCase();
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
                      duration-200
                      ${isActive ? 'text-purple-600 font-black' : 'text-ink/65 hover:text-purple-600'}
                    `}
                  >
                    {t(`products.categories.${category}`, category)}
                  </button>
                );
              })}

              {/* Expand / Contrast Toggle Button (>> and <<) */}
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2 py-0.5 text-[11px] font-black text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-all active:scale-95 shrink-0 border border-purple-200/80"
                title={isExpanded ? "Collapse categories" : "Show more categories"}
              >
                {isExpanded ? "<<" : ">>"}
              </button>
            </div>

            {/* Separated action buttons: Filter and New (NOT included in category list) */}
            <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-black/10">
              <button
                onClick={handleOpenFilter}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-ink/75 hover:text-purple-600 rounded-full border border-black/10 bg-white/70 active:scale-95 transition-all"
              >
                <SlidersHorizontal size={12} />
                <span>{t("common.filter", "Filter")}</span>
              </button>

              <button
                onClick={onSelectNew}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full transition-all active:scale-95 ${
                  isNewActive
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm shadow-purple-900/30'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>{t("products.drops.allNew", "New")}</span>
              </button>
            </div>
          </div>

          {/* ================= DESKTOP VIEW ================= */}
          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 w-auto">
            <div
              ref={navScrollRef}
              onClickCapture={(e) => {
                if (wasDraggedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              className="
                flex
                justify-center
                items-center
                gap-6
                lg:gap-8
                overflow-x-auto
                no-scrollbar
                w-auto
                cursor-grab
                active:cursor-grabbing
                select-none
              "
            >
              {navbarCategories.map((category) => {
                const isActive = !isNewActive && activeCategory.toLowerCase() === category.toLowerCase();
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
                      ${isActive ? 'text-purple-600 font-black' : 'text-ink/65 hover:text-purple-600'}
                    `}
                  >
                    {t(`products.categories.${category}`, category)}
                  </button>
                );
              })}
            </div>

            <div className="pl-4 border-l border-black/10 shrink-0 flex items-center gap-3">
              <button
                onClick={handleOpenFilter}
                className="flex items-center gap-1.5 text-[12px] font-bold text-ink/75 hover:text-purple-600 transition-colors"
              >
                <SlidersHorizontal size={14} />
                <span>{t("products.filters.title", "Filters")}</span>
              </button>

              <button
                onClick={onSelectNew}
                className={`flex items-center gap-1 px-3 py-1 text-[12px] font-bold rounded-full transition-all ${
                  isNewActive
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm shadow-purple-900/30'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{t("products.drops.allNew", "New")}</span>
              </button>
            </div>
          </div>

        </div>
      </nav>

      {/* ================= HERO ================= */}
      <section className="pt-28 sm:pt-32 pb-4 sm:pb-6 md:pb-8 px-6 sm:px-8 md:px-10 relative overflow-hidden select-none w-full max-w-[100vw]">
        
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
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 sm:gap-6 lg:gap-12 relative z-10">
          
          {/* LEFT */}
          <div className="max-w-3xl">
            <span
              className="block mb-3 sm:mb-5 uppercase tracking-[0.32em] text-[11px] font-semibold text-plum-500"
              style={{
                fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',sans-serif",
              }}
            >
              {t("products.badge", "✦ ጥ Tilet3D · THE COLLECTION")}
            </span>

            <h1
              className="text-[28px] md:text-[38px] leading-tight font-bold text-ink tracking-[-0.02em]"
              style={{
                fontFamily: "'Iowan Old Style','Palatino Linotype','Book Antiqua','Times New Roman',serif",
              }}
            >
              {t("products.title", "Heritage couture, woven for now.")}
            </h1>
          </div>

          {/* RIGHT - LUXURY EDITORIAL AMHARIC STYLE */}
          <div className="max-w-md lg:pb-1">
            <p
              className="text-[15px] sm:text-[16px] md:text-[17px] leading-[1.7] sm:leading-[1.8] text-ink/80 font-normal tracking-wide antialiased"
              style={{
                fontFamily: "inherit, 'Nyala', 'Kefa', 'Abyssinica SIL', serif",
                fontFeatureSettings: '"kern" 1',
              }}
            >
              {t("products.amharicQuote", "በኢትዮጵያ ምርጥ የዕደ-ጥበብ ማዕከላት በእጅ የተሰሩ ውብ የሀበሻ አልባሳት፣ ማንኛውንም ልብስ በ3ዲ አቫታርዎ ላይ በቀጥታ ይሞክሩ።")}
            </p>
          </div>

        </div>
      </section>
    </>
  );
};

export default ProductPageHeader;