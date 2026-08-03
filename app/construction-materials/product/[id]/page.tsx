import type { Metadata } from "next";
import { MaterialsProductDetailClient } from "@/components/materials/MaterialsProductDetailClient";
import { BASE_URL } from "@/lib/constants";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Material Product | Imagineering India`,
    description: "View construction material product details, specs, and get best quotes on Imagineering India.",
    alternates: {
      canonical: `${BASE_URL}/construction-materials/product/${encodeURIComponent(id)}`,
    },
  };
}

export default async function MaterialsProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  return <MaterialsProductDetailClient productId={id} />;
}
