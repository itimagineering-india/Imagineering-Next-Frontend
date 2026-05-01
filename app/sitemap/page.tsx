import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import Sitemap from "@/pages/Sitemap";

export const metadata: Metadata = {
  title: "Site Map",
  description: "Navigate all public pages on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/sitemap` },
};

export default function SitemapPage() {
  return <Sitemap />;
}
