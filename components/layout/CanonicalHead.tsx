"use client";
import { Helmet } from "react-helmet-async";
import { usePathname, useSearchParams } from "next/navigation";

const BASE_URL = "https://imagineeringindia.com";

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
  const url = new URL(pathname + search, BASE_URL);

  // Remove tracking params for cleaner canonical
  TRACKING_PARAMS.forEach((param) => url.searchParams.delete(param));

  const searchString = url.searchParams.toString();
  const canonicalPath = url.pathname + (searchString ? `?${searchString}` : "");

  const path = canonicalPath || "/";
  return `${BASE_URL}${path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path}`;
}

/**
 * Sets per-page canonical URL for SEO.
 * Each route gets its own canonical URL to prevent duplicate content issues.
 */
export function CanonicalHead() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const canonicalUrl = getCanonicalUrl(pathname ?? "", search);

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
