import type { Metadata } from "next";
import SubscriptionSupplier from "@/pages/SubscriptionSupplier";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Provider subscriptions",
  description:
    "Grow your business on Imagineering India — featured listings, lead access, and provider subscription tiers.",
  alternates: { canonical: `${BASE_URL}/subscriptions/supplier` },
  openGraph: {
    title: "Provider subscriptions | Imagineering India",
    url: `${BASE_URL}/subscriptions/supplier`,
  },
};

export default function Page() {
  return <SubscriptionSupplier />;
}
