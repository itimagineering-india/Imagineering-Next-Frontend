import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import ConstructionCalculatorsClient from "@/components/construction/ConstructionCalculatorsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Construction Cost Calculator",
  description:
    "Estimate material, labour, and timeline by city for house, villa, warehouse, and more on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/construction-calculator` },
  openGraph: {
    title: "Construction Cost Calculator | Imagineering India",
    description: "Quick material and labour estimates for Indian construction projects.",
    url: `${BASE_URL}/construction-calculator`,
  },
};

export default function ConstructionCalculatorHubPage() {
  return <ConstructionCalculatorsClient />;
}
