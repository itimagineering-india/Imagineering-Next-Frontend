import type { Metadata } from "next";
import { Suspense } from "react";
import { ManpowerProductDetailClient } from "@/components/manpower/ManpowerProductDetailClient";
import { BASE_URL } from "@/lib/constants";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Manpower detail | Imagineering India",
    alternates: { canonical: `${BASE_URL}/manpower/product/${id}` },
  };
}

export default async function ManpowerProductPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading…</div>}>
      <ManpowerProductDetailClient productId={id} />
    </Suspense>
  );
}
