import type { Metadata } from "next";
import BuyerConsumptionPage from "@/pages/BuyerConsumption";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Consumption Insights | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/buyer/consumption` },
};

export default function Page() {
  return <BuyerConsumptionPage />;
}
