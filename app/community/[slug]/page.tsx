import type { Metadata } from "next";
import CommunityPostDetail from "@/pages/CommunityPostDetail";
import { BASE_URL } from "@/lib/constants";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  return {
    alternates: { canonical: `${BASE_URL}/community/${slug}` },
  };
}

export default function Page() {
  return <CommunityPostDetail />;
}
