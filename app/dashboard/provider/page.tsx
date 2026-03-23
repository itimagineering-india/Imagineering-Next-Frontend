import type { Metadata } from "next";
import ProviderDashboard from "@/pages/ProviderDashboard";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider` },
};

export default function Page() {
  return <ProviderDashboard />;
}
