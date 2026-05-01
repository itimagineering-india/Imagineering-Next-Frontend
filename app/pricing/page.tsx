import type { Metadata } from "next";
import Pricing from "@/pages/Pricing";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing & plans",
  description:
    "Transparent pricing for buyers and service providers on Imagineering India — subscriptions, visibility, and marketplace features.",
  alternates: { canonical: `${BASE_URL}/pricing` },
  openGraph: {
    title: "Pricing & plans | Imagineering India",
    description:
      "Compare plans for buyers and providers. Unlock leads, visibility, and premium marketplace tools.",
    url: `${BASE_URL}/pricing`,
  },
};

export default function Page() {
  return <Pricing />;
}
