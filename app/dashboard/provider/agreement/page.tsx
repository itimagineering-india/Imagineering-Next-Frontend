import type { Metadata } from "next";
import ProviderAgreement from "@/pages/ProviderAgreement";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider Agreement & Consent | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/agreement` },
};

export default function Page() {
  return <ProviderAgreement />;
}
