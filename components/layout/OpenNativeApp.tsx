"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "ii_open_app_attempted";
const ANDROID_PACKAGE = "com.servicespheremobile";
const APP_SCHEME = "imagineeringindia";
const MOBILE_OR_TABLET_MQ = "(max-width: 1024px)";

function isNativeAppBrowser(ua: string) {
  return /ImagineeringIndia|ServiceSphereMobile|ImagiMitra|wv\)/i.test(ua);
}

function isAndroid(ua: string) {
  return /Android/i.test(ua);
}

function isIOS(ua: string) {
  return /iPhone|iPad|iPod/i.test(ua);
}

function shouldSkipPath(pathname: string | null) {
  if (!pathname) return false;
  return (
    pathname.startsWith("/join-provider") ||
    pathname.startsWith("/dashboard") ||
    pathname === "/jobs" ||
    pathname.startsWith("/jobs/")
  );
}

function androidIntentUrl(path: string, fallbackUrl: string) {
  return (
    `intent://open?path=${encodeURIComponent(path)}#Intent;` +
    `scheme=${APP_SCHEME};` +
    `package=${ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};` +
    `end`
  );
}

/** Opens the installed Imagineering India app from a mobile browser, like other marketplaces. */
export function OpenNativeApp() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (shouldSkipPath(pathname)) return;
    if (new URLSearchParams(window.location.search).get("stay") === "web") return;

    const ua = window.navigator.userAgent || "";
    if (isNativeAppBrowser(ua)) return;
    if (!window.matchMedia(MOBILE_OR_TABLET_MQ).matches) return;
    if (!isAndroid(ua) && !isIOS(ua)) return;
    if (window.sessionStorage.getItem(SESSION_KEY)) return;

    window.sessionStorage.setItem(SESSION_KEY, "1");

    const path = `${window.location.pathname}${window.location.search}`;
    const fallback = window.location.href.split("#")[0];

    if (isAndroid(ua)) {
      window.location.href = androidIntentUrl(path, fallback);
      return;
    }

    // iOS: custom scheme. If the app is not installed Safari may briefly fail;
    // we only try once per tab so the website remains usable.
    const schemeUrl = `${APP_SCHEME}://open?path=${encodeURIComponent(path)}`;
    window.location.href = schemeUrl;
  }, [pathname]);

  return null;
}
