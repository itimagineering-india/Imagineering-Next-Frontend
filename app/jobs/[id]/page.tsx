import type { Metadata } from "next";
import UserJobDetails from "@/pages/UserJobDetails";
import { getPublicJobMeta } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobMeta(id);
  const url = `${BASE_URL}/jobs/${encodeURIComponent(id)}`;

  if (!job) {
    return {
      title: "Job | Imagineering India",
      alternates: { canonical: url },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${job.title} | Careers | Imagineering India`,
    description: job.description,
    alternates: { canonical: url },
    openGraph: { title: job.title, description: job.description, url, type: "website" },
    twitter: { card: "summary_large_image", title: job.title, description: job.description },
  };
}

export default function Page() {
  return <UserJobDetails />;
}
