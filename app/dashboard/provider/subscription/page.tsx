import type { Metadata } from "next";
import ProviderSubscription from "@/pages/ProviderSubscription";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/subscription` },
};

export default function Page() {
  return <ProviderSubscription />;
}
