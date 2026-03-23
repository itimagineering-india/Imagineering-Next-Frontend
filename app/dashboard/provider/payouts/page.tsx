import type { Metadata } from "next";
import ProviderPayouts from "@/pages/ProviderPayouts";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/payouts` },
};

export default function Page() {
  return <ProviderPayouts />;
}
