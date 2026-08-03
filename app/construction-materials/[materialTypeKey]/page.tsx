import type { Metadata } from "next";
import { MaterialsCategoryProductsClient } from "@/components/materials/MaterialsCategoryProductsClient";
import { BASE_URL } from "@/lib/constants";
import { resolveMaterialsMaterialTypeKey } from "@/lib/materials/constructionMaterialsCatalog";

type Params = { materialTypeKey: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { materialTypeKey } = await params;
  const key = resolveMaterialsMaterialTypeKey(materialTypeKey) || materialTypeKey;
  const title = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} | Construction Materials | Imagineering India`,
    description: `Browse ${title} products, compare prices, and get quotes on Imagineering India.`,
    alternates: {
      canonical: `${BASE_URL}/construction-materials/${encodeURIComponent(key)}`,
    },
  };
}

export default async function MaterialsCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { materialTypeKey } = await params;
  return <MaterialsCategoryProductsClient materialTypeKey={materialTypeKey} />;
}
