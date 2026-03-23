import type { Metadata } from "next";
import UserJobList from "@/pages/UserJobList";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse jobs | Imagineering India",
  description: "Open jobs posted by buyers. Apply as a verified provider on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/jobs` },
};

export default function Page() {
  return <UserJobList />;
}
