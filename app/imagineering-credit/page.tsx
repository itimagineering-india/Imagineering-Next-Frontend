import type { Metadata } from "next";
import ImagineeringCreditPage from "@/pages/ImagineeringCredit";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imagineering Credit | Imagineering India",
  description: "Build Now. Pay Later — learn how Imagineering Credit works, credit tiers, and how to apply on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/imagineering-credit` },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ImagineeringCreditPage />;
}
