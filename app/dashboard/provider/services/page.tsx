import type { Metadata } from "next";
import ProviderServices from "@/pages/ProviderServices";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/services` },
};

export default function Page() {
  return <ProviderServices />;
}
