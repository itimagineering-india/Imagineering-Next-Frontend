import type { Metadata } from "next";
import Profile from "@/pages/Profile";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/profile` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <Profile />;
}

