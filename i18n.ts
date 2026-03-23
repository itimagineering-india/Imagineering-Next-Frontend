"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/locales/en/common.json";
import enHeader from "@/locales/en/header.json";
import enFooter from "@/locales/en/footer.json";
import hiCommon from "@/locales/hi/common.json";
import hiHeader from "@/locales/hi/header.json";
import hiFooter from "@/locales/hi/footer.json";

const LANG_STORAGE_KEY = "app_lang";

export const SUPPORTED_LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
] as const;

export type SupportedLangCode = (typeof SUPPORTED_LANGS)[number]["code"];

function getStoredLang(): SupportedLangCode | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === "en" || stored === "hi") return stored;
    return null;
  } catch {
    return null;
  }
}

export function persistLanguage(lang: string): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore
  }
}

const stored = getStoredLang();

i18n.use(initReactI18next).init({
  lng: stored ?? "en",
  fallbackLng: "en",
  supportedLngs: ["en", "hi"],
  ns: ["common", "header", "footer"],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: { common: enCommon, header: enHeader, footer: enFooter },
    hi: { common: hiCommon, header: hiHeader, footer: hiFooter },
  },
  react: {
    useSuspense: false,
  },
});

// Persist when language changes
i18n.on("languageChanged", (lng) => {
  persistLanguage(lng);
});

export default i18n;
