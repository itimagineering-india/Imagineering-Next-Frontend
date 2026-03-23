import type { Metadata } from "next";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy | Imagineering India",
  description:
    "How Imagineering India collects, uses, and protects your personal information when you use our marketplace.",
  alternates: { canonical: `${BASE_URL}/privacy` },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <PrivacyPolicy />;
}

