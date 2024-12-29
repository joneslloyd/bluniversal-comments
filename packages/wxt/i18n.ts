import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import jpTranslations from "./locales/jp.json";

const isDevMode = import.meta.env?.MODE === "development" ?? false;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: isDevMode,
    detection: {
      caches: [],
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: enTranslations,
      },
      fr: {
        translation: frTranslations,
      },
      ja: {
        translation: jpTranslations,
      },
    },
  });

export default i18n;
