import type { Metadata } from "next";
import BuyerTickets from "@/pages/BuyerTickets";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Tickets | Imagineering India",
  alternates: { canonical: `${BASE_URL}/buyer/tickets` },
};

export default function Page() {
  return <BuyerTickets />;
}
