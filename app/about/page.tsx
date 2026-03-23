import type { Metadata } from "next";
import About from "@/pages/About";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/about` },
};

export default function Page() {
  return <About />;
}
