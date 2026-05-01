import type { Metadata } from "next";
import Services from "@/pages/Services";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse services & verified providers",
  description:
    "Search construction materials, manpower, machinery, logistics, and more. Filter by location, compare providers, and book on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/services` },
  openGraph: {
    title: "Browse services & verified providers | Imagineering India",
    description:
      "Search construction materials, manpower, machinery, logistics, and more. Filter by location and book trusted providers.",
    url: `${BASE_URL}/services`,
  },
};

export default function Page() {
  return <Services />;
}
