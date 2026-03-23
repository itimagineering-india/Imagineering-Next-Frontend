import type { Metadata } from "next";
import ProviderBookings from "@/pages/ProviderBookings";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/provider/bookings` },
};

export default function Page() {
  return <ProviderBookings />;
}
