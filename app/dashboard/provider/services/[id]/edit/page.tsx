import type { Metadata } from "next";
import ProviderEditCatalogProduct from "@/pages/ProviderEditCatalogProduct";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit product | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/services` },
};

export default function Page() {
  return <ProviderEditCatalogProduct />;
}
