import type { Metadata } from "next";
import ProviderKyc from "@/pages/ProviderKyc";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/kyc` },
};

export default function Page() {
  return <ProviderKyc />;
}
