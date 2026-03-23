import type { Metadata } from "next";
import BuyerBookings from "@/pages/BuyerBookings";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/buyer/orders` },
};

export default function Page() {
  return <BuyerBookings />;
}
