"use client";

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "@/locales/en/common.json";
import enHeader from "@/locales/en/header.json";
import enFooter from "@/locales/en/footer.json";
import enHome from "@/locales/en/home.json";
import enServices from "@/locales/en/services.json";
import enServiceDetails from "@/locales/en/serviceDetails.json";
import enProviderProfile from "@/locales/en/providerProfile.json";
import enStaticPages from "@/locales/en/staticPages.json";
import enAuth from "@/locales/en/auth.json";
import hiCommon from "@/locales/hi/common.json";
import hiHeader from "@/locales/hi/header.json";
import hiFooter from "@/locales/hi/footer.json";
import hiHome from "@/locales/hi/home.json";
import hiServices from "@/locales/hi/services.json";
import hiServiceDetails from "@/locales/hi/serviceDetails.json";
import hiProviderProfile from "@/locales/hi/providerProfile.json";
import hiStaticPages from "@/locales/hi/staticPages.json";
import hiAuth from "@/locales/hi/auth.json";

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

i18n.use(initReactI18next).init({
  // Keep the first client render identical to SSR. Stored language is applied
  // after mount from Providers to avoid hydration text mismatches.
  lng: "en",
  fallbackLng: "en",
  supportedLngs: ["en", "hi"],
  ns: [
    "common",
    "header",
    "footer",
    "home",
    "services",
    "serviceDetails",
    "providerProfile",
    "staticPages",
    "auth",
  ],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  resources: {
    en: {
      common: enCommon,
      header: enHeader,
      footer: enFooter,
      home: enHome,
      services: enServices,
      serviceDetails: enServiceDetails,
      providerProfile: enProviderProfile,
      staticPages: enStaticPages,
      auth: enAuth,
    },
    hi: {
      common: hiCommon,
      header: hiHeader,
      footer: hiFooter,
      home: hiHome,
      services: hiServices,
      serviceDetails: hiServiceDetails,
      providerProfile: hiProviderProfile,
      staticPages: hiStaticPages,
      auth: hiAuth,
    },
  },
  react: {
    useSuspense: false,
  },
});

// Persist when language changes
i18n.on("languageChanged", (lng) => {
  persistLanguage(lng);
});

export function applyStoredLanguage(): void {
  const stored = getStoredLang();
  if (stored && i18n.language !== stored) {
    void i18n.changeLanguage(stored);
  }
}

export default i18n;
