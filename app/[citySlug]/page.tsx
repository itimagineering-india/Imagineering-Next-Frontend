import type { Metadata } from "next";
import CityServicesPage from "@/pages/CityServicesPage";
import { BASE_URL } from "@/lib/constants";

type Params = { citySlug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { citySlug } = await params;
  return {
    alternates: { canonical: `${BASE_URL}/${citySlug}` },
  };
}

export default function Page() {
  return <CityServicesPage />;
}
