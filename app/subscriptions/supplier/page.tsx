import type { Metadata } from "next";
import SubscriptionSupplier from "@/pages/SubscriptionSupplier";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/subscriptions/supplier` },
};

export default function Page() {
  return <SubscriptionSupplier />;
}
