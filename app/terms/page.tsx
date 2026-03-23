import type { Metadata } from "next";
import Terms from "@/pages/Terms";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service | Imagineering India",
  description:
    "Terms and conditions for using the Imagineering India platform, bookings, and provider services.",
  alternates: { canonical: `${BASE_URL}/terms` },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <Terms />;
}
