import type { Metadata } from "next";
import ProviderSettlement from "@/pages/ProviderSettlement";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settlement | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/settlement` },
};

export default function Page() {
  return <ProviderSettlement />;
}
