import type { Metadata } from "next";
import SubscriptionsLanding from "@/pages/SubscriptionsLanding";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subscription plans | Imagineering India",
  description:
    "Compare buyer and provider subscription plans on Imagineering India — unlock leads, visibility, and premium features.",
  alternates: { canonical: `${BASE_URL}/subscriptions` },
};

export default function Page() {
  return <SubscriptionsLanding />;
}
