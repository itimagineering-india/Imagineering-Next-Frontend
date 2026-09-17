import type { Metadata } from "next";
import { Suspense } from "react";
import { B2BServicesHub } from "@/components/b2b/B2BServicesHub";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tools | Imagineering India",
  description:
    "Browse welding, power and hand tools. Compare catalog products and get best quotes from listed suppliers on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/tools` },
  openGraph: {
    title: "Tools | Imagineering India",
    description:
      "Browse tools and request quotes from listed suppliers — open to every buyer.",
    url: `${BASE_URL}/tools`,
  },
};

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>}>
      <B2BServicesHub lockedCategorySlug="tools" surface="tools" />
    </Suspense>
  );
}
