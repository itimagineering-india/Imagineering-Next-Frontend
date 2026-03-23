"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { BASE_URL } from "@/lib/constants";

/**
 * Tracking params to strip from canonical URL for cleaner SEO.
 * Keeps meaningful params like category, search, etc.
 */
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "gclsrc",
  "ref",
];

function getCanonicalUrl(pathname: string, search: string): string {
  const base = BASE_URL.replace(/\/$/, "");
  const url = new URL(pathname + search, `${base}/`);

  TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));

  const searchString = url.searchParams.toString();
  const canonicalPath = url.pathname + (searchString ? `?${searchString}` : "");

  const path = canonicalPath || "/";
  const normalized =
    path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
  return `${base}${normalized}`;
}

/**
 * Sets per-route canonical URL (client-side) for SEO when mounted.
 * Prefer `metadata.alternates.canonical` on each page where possible.
 */
export function CanonicalHead() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const canonicalUrl = getCanonicalUrl(pathname ?? "", search);

  useEffect(() => {
    let el = document.querySelector(
      'link[rel="canonical"][data-imagineering-canonical]'
    ) as HTMLLinkElement | null;
    if (!el) {
      el = document.createElement("link");
      el.setAttribute("rel", "canonical");
      el.setAttribute("data-imagineering-canonical", "true");
      document.head.appendChild(el);
    }
    el.setAttribute("href", canonicalUrl);
  }, [canonicalUrl]);

  return null;
}
