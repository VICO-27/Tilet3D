import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from "../../../i18n";
import { LanguageFlag } from "./LanguageFlag";

interface LanguageSelectorProps {
  variant?: "nav" | "footer" | "mobile";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "nav",
  className = "",
}) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) ||
    SUPPORTED_LANGUAGES.find((l) => l.code === "om") ||
    SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectLanguage = (code: SupportedLanguageCode) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  if (variant === "footer") {
    return (
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select language"
          className="flex items-center gap-2 text-xs text-[#1d1d1f] font-semibold hover:text-purple-600 hover:underline transition-colors py-1 px-2 rounded-md hover:bg-black/5"
        >
          <LanguageFlag code={currentLang.code} className="w-4 h-3" />
          <span>{currentLang.nativeName}</span>
          <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-black/10 py-2 z-50 animate-fade-in backdrop-blur-xl">
            <div className="px-3 py-1.5 border-b border-black/5 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              Languages · ቋንቋዎች · Afaanota
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = i18n.language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => selectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-purple-50 text-purple-700 font-bold"
                        : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LanguageFlag code={lang.code} className="w-4 h-3" />
                      <div className="flex flex-col">
                        <span className="font-medium">{lang.nativeName}</span>
                        <span className="text-[10px] text-zinc-400">{lang.name}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-purple-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Navbar / Desktop & Mobile Variant
  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
        className="flex items-center gap-2 h-8 px-2.5 rounded-full text-[11px] font-semibold text-ink/75 hover:text-purple-700 hover:bg-purple-50 transition-all border border-black/5 bg-white/60 active:scale-95"
      >
        <LanguageFlag code={currentLang.code} className="w-4 h-3" />
        <span className="hidden sm:inline font-medium">{currentLang.nativeName}</span>
        <span className="sm:hidden uppercase font-bold text-[10px]">{currentLang.code}</span>
        <ChevronDown className={`h-2.5 w-2.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-black/10 py-2 z-50 animate-fade-in">
          <div className="px-3.5 py-1.5 border-b border-black/5 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
            {t("nav.selectLanguage", "Select Language")}
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors ${
                    isSelected
                      ? "bg-purple-50 text-purple-700 font-bold"
                      : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LanguageFlag code={lang.code} className="w-4 h-3" />
                    <div className="flex flex-col">
                      <span className="font-medium">{lang.nativeName}</span>
                      <span className="text-[10px] text-zinc-400">{lang.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="h-3.5 w-3.5 text-purple-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
