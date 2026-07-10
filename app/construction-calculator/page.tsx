import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import ConstructionCalculatorsClient from "@/components/construction/ConstructionCalculatorsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Construction Cost Calculators",
  description:
    "Free construction cost calculators for house, villa, warehouse, boundary wall and more. Get material, labour, and timeline estimates by city on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/construction-calculator` },
  openGraph: {
    title: "Construction Cost Calculators | Imagineering India",
    description:
      "Rule-driven material, labour, and BOQ estimates for residential and commercial projects.",
    url: `${BASE_URL}/construction-calculator`,
  },
};

export default function ConstructionCalculatorHubPage() {
  return <ConstructionCalculatorsClient />;
}
