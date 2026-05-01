import type { Metadata } from "next";
import Careers from "@/pages/Careers";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Explore roles and opportunities at Imagineering India — build the future of verified service marketplaces.",
  alternates: { canonical: `${BASE_URL}/careers` },
  openGraph: {
    title: "Careers | Imagineering India",
    description: "Open positions and culture at Imagineering India.",
    url: `${BASE_URL}/careers`,
  },
};

export default function Page() {
  return <Careers />;
}
