import type { Metadata } from "next";
import SubmitRequirement from "@/pages/SubmitRequirement";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/requirement/submit` },
};

export default function Page() {
  return <SubmitRequirement />;
}
