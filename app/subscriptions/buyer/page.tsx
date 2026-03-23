import type { Metadata } from "next";
import SubscriptionBuyer from "@/pages/SubscriptionBuyer";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/subscriptions/buyer` },
};

export default function Page() {
  return <SubscriptionBuyer />;
}
