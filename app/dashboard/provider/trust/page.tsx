import type { Metadata } from "next";
import ProviderTrustHub from "@/pages/ProviderTrustHub";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trust & Growth | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/trust` },
};

export default function Page() {
  return <ProviderTrustHub />;
}
