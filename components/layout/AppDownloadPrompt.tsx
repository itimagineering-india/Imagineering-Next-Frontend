"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Smartphone, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const STORAGE_KEY = "ii_customer_app_prompt_dismissed_at";
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000;
/** Phones and tablets only — hide on typical desktop widths. */
const MOBILE_OR_TABLET_MQ = "(max-width: 1024px)";

const ANDROID_APP_URL =
  process.env.NEXT_PUBLIC_ANDROID_APP_URL ||
  "https://play.google.com/store/apps/details?id=com.servicespheremobile";
const IOS_APP_URL =
  process.env.NEXT_PUBLIC_IOS_APP_URL ||
  "https://apps.apple.com/search?term=Imagineering%20India";

function isNativeAppBrowser(ua: string) {
  return /ImagineeringIndia|ServiceSphereMobile|ImagiMitra|wv\)/i.test(ua);
}

function storeUrlForUserAgent(ua: string) {
  if (/iPhone|iPad|iPod/i.test(ua)) return IOS_APP_URL;
  return ANDROID_APP_URL;
}

export function AppDownloadPrompt() {
  const { t } = useTranslation("header");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [href, setHref] = useState(ANDROID_APP_URL);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname?.startsWith("/join-provider")) return;

    const ua = window.navigator.userAgent || "";
    if (isNativeAppBrowser(ua)) return;

    const dismissedAt = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    const dismissedRecently = Boolean(dismissedAt && Date.now() - dismissedAt < DISMISS_MS);
    if (dismissedRecently) return;

    const mq = window.matchMedia(MOBILE_OR_TABLET_MQ);
    const syncVisibility = () => {
      setHref(storeUrlForUserAgent(ua));
      setVisible(mq.matches);
    };

    syncVisibility();
    mq.addEventListener("change", syncVisibility);
    return () => mq.removeEventListener("change", syncVisibility);
  }, [pathname]);

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible || pathname?.startsWith("/join-provider")) return null;

  return (
    <div className="w-full border-b bg-primary text-primary-foreground">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-3 py-2 sm:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
          <Smartphone className="h-4 w-4" />
        </div>
        <p className="min-w-0 flex-1 text-xs leading-snug sm:text-sm">
          <span className="font-semibold">{t("appPromptTitle")}</span>{" "}
          <span className="text-primary-foreground/90">{t("appPromptBody")}</span>
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary-foreground px-3 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
        >
          {t("appPromptCta")}
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-primary-foreground/80 transition hover:bg-primary-foreground/10 hover:text-primary-foreground"
          aria-label={t("appPromptDismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
