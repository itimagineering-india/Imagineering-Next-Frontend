import type { Metadata } from "next";
import Contact from "@/pages/Contact";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Imagineering India for partnerships, support, and general inquiries about the marketplace.",
  alternates: { canonical: `${BASE_URL}/contact` },
  openGraph: {
    title: "Contact | Imagineering India",
    description: "Reach our team for help with the Imagineering India platform.",
    url: `${BASE_URL}/contact`,
  },
};

export default function Page() {
  return <Contact />;
}
