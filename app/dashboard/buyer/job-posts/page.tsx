import type { Metadata } from "next";
import UserJobPostsDashboard from "@/pages/UserJobPostsDashboard";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My job posts | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/buyer/job-posts` },
};

export default function Page() {
  return <UserJobPostsDashboard />;
}
