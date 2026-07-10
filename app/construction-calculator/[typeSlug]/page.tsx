import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import ConstructionCalculatorClient from "@/components/construction/ConstructionCalculatorClient";

type Params = { typeSlug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { typeSlug } = await params;
  const label = typeSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${label} Construction Cost Calculator`,
    description: `Estimate ${label} construction cost with materials, labour, stage-wise breakdown, and BOQ PDF on Imagineering India.`,
    alternates: { canonical: `${BASE_URL}/construction-calculator/${typeSlug}` },
    openGraph: {
      title: `${label} Construction Cost Calculator | Imagineering India`,
      url: `${BASE_URL}/construction-calculator/${typeSlug}`,
    },
  };
}

export default async function ConstructionCalculatorTypePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { typeSlug } = await params;
  return <ConstructionCalculatorClient typeSlug={typeSlug} />;
}
