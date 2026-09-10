import type { Metadata } from "next";
import { MachineResaleCategoryClient } from "@/components/machineResale/MachineResaleCategoryClient";
import { BASE_URL } from "@/lib/constants";
import { resolveResaleCategoryKey } from "@/lib/machineResale/machineResaleHubCatalog";

type Params = { typeKey: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { typeKey } = await params;
  const key = resolveResaleCategoryKey(typeKey) || typeKey;
  const title = key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} for Sale | Imagineering India`,
    description: `Browse used ${title} for sale from verified sellers on Imagineering India.`,
    alternates: {
      canonical: `${BASE_URL}/machine-resale/${encodeURIComponent(key)}`,
    },
  };
}

export default async function MachineResaleCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { typeKey } = await params;
  return <MachineResaleCategoryClient typeKey={typeKey} />;
}
