import type { Metadata } from "next";
import ProviderSupport from "@/pages/ProviderSupport";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/support` },
};

export default function Page() {
  return <ProviderSupport />;
}
