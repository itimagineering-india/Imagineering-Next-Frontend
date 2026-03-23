import type { Metadata } from "next";
import HelpCenter from "@/pages/HelpCenter";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/help` },
};

export default function Page() {
  return <HelpCenter />;
}

