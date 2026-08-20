import type { Metadata } from "next";
import { Suspense } from "react";
import { B2BServicesHub } from "@/components/b2b/B2BServicesHub";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "B2B Services | Imagineering India",
  description:
    "Get best quotes on construction materials, electrical, furniture and hardware. Every listed supplier is notified — no distance limit.",
  alternates: { canonical: `${BASE_URL}/b2b-services` },
  openGraph: {
    title: "B2B Services | Imagineering India",
    description:
      "Browse B2B products and request quotes from every supplier who lists the item.",
    url: `${BASE_URL}/b2b-services`,
  },
};

export default function B2BServicesPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-slate-500">Loading…</div>}>
      <B2BServicesHub />
    </Suspense>
  );
}
