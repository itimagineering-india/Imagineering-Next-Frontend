import type { Metadata } from "next";
import { Suspense } from "react";
import { MachineRentalCheckoutClient } from "@/components/machineRental/MachineRentalCheckoutClient";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Machine rental checkout | Imagineering India",
  alternates: { canonical: `${BASE_URL}/machine-rental/checkout` },
};

export default function MachineRentalCheckoutPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}>
      <MachineRentalCheckoutClient />
    </Suspense>
  );
}
