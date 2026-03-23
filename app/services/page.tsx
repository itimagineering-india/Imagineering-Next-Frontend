import type { Metadata } from "next";
import Services from "@/pages/Services";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/services` },
};

export default function Page() {
  return <Services />;
}
