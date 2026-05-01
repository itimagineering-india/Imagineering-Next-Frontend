import type { Metadata } from "next";
import About from "@/pages/About";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Imagineering India connects businesses with verified contractors, suppliers, and service providers across India.",
  alternates: { canonical: `${BASE_URL}/about` },
  openGraph: {
    title: "About us | Imagineering India",
    description:
      "Learn about our mission to make hiring construction and industrial services simple and transparent.",
    url: `${BASE_URL}/about`,
  },
};

export default function Page() {
  return <About />;
}
