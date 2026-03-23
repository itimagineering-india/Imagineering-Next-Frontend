import type { Metadata } from "next";
import UserJobPostDetail from "@/pages/UserJobPostDetail";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Job post | Imagineering India",
    alternates: { canonical: `${BASE_URL}/dashboard/buyer/job-posts/${id}` },
  };
}

export default function Page() {
  return <UserJobPostDetail />;
}
