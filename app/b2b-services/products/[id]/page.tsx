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
    title: `B2B Product | Imagineering India`,
    description:
      "View B2B product details and request quotes from listed suppliers on Imagineering India.",
    alternates: {
      canonical: `${BASE_URL}/b2b-services/products/${encodeURIComponent(id)}`,
    },
  };
}

export default async function B2BProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  return <MaterialsProductDetailClient productId={id} surface="b2b" />;
}
