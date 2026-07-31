import type { Metadata } from "next";
import { ConstructionMaterialsHub } from "@/components/materials/ConstructionMaterialsHub";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Construction Materials | Imagineering India",
  description:
    "Browse cement, steel, bricks, sand and more. Compare catalog prices, find verified suppliers, and get best quotes on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/construction-materials` },
  openGraph: {
    title: "Construction Materials | Imagineering India",
    description:
      "Browse cement, steel, bricks, sand and more. Compare catalog prices and get best quotes.",
    url: `${BASE_URL}/construction-materials`,
  },
};

export default function ConstructionMaterialsPage() {
  return <ConstructionMaterialsHub />;
}
