import type { Metadata } from "next";
import { Suspense } from "react";
import { MachineResaleCheckoutClient } from "@/components/machineResale/MachineResaleCheckoutClient";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Buy machine | Imagineering India",
  alternates: { canonical: `${BASE_URL}/machine-resale/checkout` },
};

export default function MachineResaleCheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}>
      <MachineResaleCheckoutClient />
    </Suspense>
  );
}
