import type { Metadata } from "next";
import DashboardSubscription from "@/pages/DashboardSubscription";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/subscription` },
};

export default function Page() {
  return <DashboardSubscription />;
}
