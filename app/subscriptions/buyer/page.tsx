import type { Metadata } from "next";
import SubscriptionBuyer from "@/pages/SubscriptionBuyer";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buyer subscriptions",
  description:
    "Imagineering India buyer plans — premium visibility, faster responses, and benefits when you hire providers.",
  alternates: { canonical: `${BASE_URL}/subscriptions/buyer` },
  openGraph: {
    title: "Buyer subscriptions | Imagineering India",
    url: `${BASE_URL}/subscriptions/buyer`,
  },
};

export default function Page() {
  return <SubscriptionBuyer />;
}
