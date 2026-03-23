import type { Metadata } from "next";
import ResetPassword from "@/pages/ResetPassword";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/reset-password` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ResetPassword />;
}

