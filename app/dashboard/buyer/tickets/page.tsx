import type { Metadata } from "next";
import BuyerTickets from "@/pages/BuyerTickets";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/buyer/tickets` },
};

export default function Page() {
  return <BuyerTickets />;
}
