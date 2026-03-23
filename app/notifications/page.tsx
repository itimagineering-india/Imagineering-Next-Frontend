import type { Metadata } from "next";
import Notifications from "@/pages/Notifications";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/notifications` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <Notifications />;
}

