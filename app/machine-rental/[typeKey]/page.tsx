import type { Metadata } from "next";
import { MachineRentalCategoryClient } from "@/components/machineRental/MachineRentalCategoryClient";
import { BASE_URL } from "@/lib/constants";
import { resolveRentalCategoryKey } from "@/lib/machineRental/machineRentalHubCatalog";

type Params = { typeKey: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { typeKey } = await params;
  const key = resolveRentalCategoryKey(typeKey) || typeKey;
  const title = key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${title} Rental | Imagineering India`,
    description: `Browse ${title} rentals, compare rates, and book from verified providers on Imagineering India.`,
    alternates: {
      canonical: `${BASE_URL}/machine-rental/${encodeURIComponent(key)}`,
    },
  };
}

export default async function MachineRentalCategoryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { typeKey } = await params;
  return <MachineRentalCategoryClient typeKey={typeKey} />;
}
