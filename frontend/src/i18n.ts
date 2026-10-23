/// <reference types="vite/client" />
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

export const SUPPORTED_LANGUAGES = [
  { code: "om", name: "Afaan Oromoo", nativeName: "Afaan Oromoo", dir: "ltr" },
  { code: "am", name: "Amharic", nativeName: "አማርኛ", dir: "ltr" },
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "ti", name: "Tigrinya", nativeName: "ትግርኛ", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", dir: "ltr" },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

// Function to update HTML document direction and lang attributes
export const applyLanguageDirection = (lng: string) => {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lng);
  const dir = langConfig?.dir || "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
  if (dir === "rtl") {
    document.documentElement.classList.add("rtl");
  } else {
    document.documentElement.classList.remove("rtl");
  }
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["om", "am", "en", "ti", "fr", "ar", "sw"],
    load: "languageOnly",
    debug: false,
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "tilet3d_language",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    react: {
      useSuspense: false,
    },
  });

// Apply document direction whenever language changes
i18n.on("languageChanged", (lng) => {
  applyLanguageDirection(lng);
});

// Set initial direction
if (typeof document !== "undefined") {
  applyLanguageDirection(i18n.language || "en");
}

export default i18n;