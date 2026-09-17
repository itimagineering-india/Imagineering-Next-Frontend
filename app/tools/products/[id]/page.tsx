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
    title: `Tools Product | Imagineering India`,
    description:
      "View tool product details and request quotes from listed suppliers on Imagineering India.",
    alternates: {
      canonical: `${BASE_URL}/tools/products/${encodeURIComponent(id)}`,
    },
  };
}

export default async function ToolsProductPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  return <MaterialsProductDetailClient productId={id} surface="tools" />;
}
