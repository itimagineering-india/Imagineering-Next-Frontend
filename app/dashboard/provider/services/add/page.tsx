import type { Metadata } from "next";
import ProviderAddCatalogProducts from "@/pages/ProviderAddCatalogProducts";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Add products | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/services/add` },
};

export default function Page() {
  return <ProviderAddCatalogProducts />;
}
