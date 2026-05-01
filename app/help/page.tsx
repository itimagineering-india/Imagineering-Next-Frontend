import type { Metadata } from "next";
import HelpCenter from "@/pages/HelpCenter";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "How Imagineering India works: bookings, providers, payments, safety, and account help.",
  alternates: { canonical: `${BASE_URL}/help` },
  openGraph: {
    title: "Help Center | Imagineering India",
    description: "Answers to common questions about using the Imagineering India marketplace.",
    url: `${BASE_URL}/help`,
  },
};

export default function Page() {
  return <HelpCenter />;
}
