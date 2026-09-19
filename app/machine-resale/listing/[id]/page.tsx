import type { Metadata } from "next";
import { Suspense } from "react";
import { MachineResaleListingDetailClient } from "@/components/machineResale/MachineResaleListingDetailClient";
import { BASE_URL } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Machine for sale | Imagineering India",
    alternates: { canonical: `${BASE_URL}/machine-resale/listing/${id}` },
  };
}

export default async function MachineResaleListingPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}>
      <MachineResaleListingDetailClient serviceId={id} />
    </Suspense>
  );
}
