import type { Metadata } from "next";
import UserJobPostForm from "@/pages/UserJobPostForm";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Post a job | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/buyer/job-posts/new` },
};

export default function Page() {
  return <UserJobPostForm />;
}
