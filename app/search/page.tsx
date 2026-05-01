import type { Metadata } from "next";
import { Suspense } from "react";
import { BASE_URL } from "@/lib/constants";
import { SearchPageClient } from "@/components/search/SearchPageClient";

export const metadata: Metadata = {
  title: "Search services",
  description:
    "Search Imagineering India for services, categories, and providers, then view full results on the services directory.",
  alternates: { canonical: `${BASE_URL}/search` },
  /** Internal search landing — avoid competing with /services in SERPs */
  robots: { index: false, follow: true },
};

function SearchFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-muted-foreground">
      Loading search…
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageClient />
    </Suspense>
  );
}
