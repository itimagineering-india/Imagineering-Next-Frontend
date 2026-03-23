import type { Metadata } from "next";
import Careers from "@/pages/Careers";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/careers` },
};

export default function Page() {
  return <Careers />;
}
