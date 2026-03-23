import type { Metadata } from "next";
import Contact from "@/pages/Contact";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/contact` },
};

export default function Page() {
  return <Contact />;
}

