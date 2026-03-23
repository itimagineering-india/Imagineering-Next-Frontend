import type { Metadata } from "next";
import CreateCommunityPost from "@/pages/CreateCommunityPost";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/community/new` },
};

export default function Page() {
  return <CreateCommunityPost />;
}
