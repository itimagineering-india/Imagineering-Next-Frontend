import type { Metadata } from "next";
import ProviderBusinessProfile from "@/pages/ProviderBusinessProfile";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/business-profile` },
};

export default function Page() {
  return <ProviderBusinessProfile />;
}
