import type { Metadata } from "next";
import ProviderLeads from "@/pages/ProviderLeads";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/leads` },
};

export default function Page() {
  return <ProviderLeads />;
}
