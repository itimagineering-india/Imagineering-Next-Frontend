import type { Metadata } from "next";
import Pricing from "@/pages/Pricing";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/pricing` },
};

export default function Page() {
  return <Pricing />;
}

