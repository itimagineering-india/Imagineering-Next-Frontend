import type { Metadata } from "next";
import ProviderProfileSettings from "@/pages/ProviderProfileSettings";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/settings` },
};

export default function Page() {
  return <ProviderProfileSettings />;
}
