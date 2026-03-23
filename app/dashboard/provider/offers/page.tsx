import type { Metadata } from "next";
import ProviderOffers from "@/pages/ProviderOffers";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/offers` },
};

export default function Page() {
  return <ProviderOffers />;
}
