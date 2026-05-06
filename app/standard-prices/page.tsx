import type { Metadata } from "next";
import { BASE_URL } from "@/lib/constants";
import StandardPricesClient from "./standard-prices-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reference price guide",
  description:
    "See indicative service price ranges by city, category, and subcategory on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/standard-prices` },
  openGraph: {
    title: "Reference price guide | Imagineering India",
    description:
      "Check indicative price ranges for services by city and category on Imagineering India.",
    url: `${BASE_URL}/standard-prices`,
  },
};

export default function Page() {
  return <StandardPricesClient />;
}
