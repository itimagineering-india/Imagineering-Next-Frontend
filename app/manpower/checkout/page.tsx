import type { Metadata } from "next";
import { Suspense } from "react";
import { ManpowerCheckoutClient } from "@/components/manpower/ManpowerCheckoutClient";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Manpower checkout | Imagineering India",
  alternates: { canonical: `${BASE_URL}/manpower/checkout` },
};

export default function ManpowerCheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}>
      <ManpowerCheckoutClient />
    </Suspense>
  );
}
