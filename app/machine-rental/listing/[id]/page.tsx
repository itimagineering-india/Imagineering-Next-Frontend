import type { Metadata } from "next";
import { Suspense } from "react";
import { MachineRentalListingDetailClient } from "@/components/machineRental/MachineRentalListingDetailClient";
import { BASE_URL } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Machine rental | Imagineering India",
    alternates: { canonical: `${BASE_URL}/machine-rental/listing/${id}` },
  };
}

export default async function MachineRentalListingPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}>
      <MachineRentalListingDetailClient serviceId={id} />
    </Suspense>
  );
}
