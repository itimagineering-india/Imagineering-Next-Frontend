import type { Metadata } from "next";
import { ManpowerHub } from "@/components/manpower/ManpowerHub";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Manpower | Imagineering India",
  description:
    "Hire hourly, daily or task-based labour from verified providers. Book nearby workers on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/manpower` },
  openGraph: {
    title: "Manpower | Imagineering India",
    description: "Hire verified labour — hourly, daily, or specific jobs.",
    url: `${BASE_URL}/manpower`,
  },
};

export default function ManpowerPage() {
  return <ManpowerHub />;
}
