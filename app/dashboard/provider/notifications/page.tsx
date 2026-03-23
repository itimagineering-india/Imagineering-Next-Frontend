import type { Metadata } from "next";
import ProviderNotifications from "@/pages/ProviderNotifications";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/notifications` },
};

export default function Page() {
  return <ProviderNotifications />;
}
