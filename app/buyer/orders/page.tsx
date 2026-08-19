import type { Metadata } from "next";
import BuyerBookings from "@/pages/BuyerBookings";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Bookings | Imagineering India",
  alternates: { canonical: `${BASE_URL}/buyer/orders` },
};

export default function Page() {
  return <BuyerBookings />;
}
