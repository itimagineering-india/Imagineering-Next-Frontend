import type { Metadata } from "next";
import Community from "@/pages/Community";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Discuss projects, tips, and marketplace updates with buyers and providers on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/community` },
  openGraph: {
    title: "Community | Imagineering India",
    description: "Join conversations with buyers and verified service providers across India.",
    url: `${BASE_URL}/community`,
  },
};

export default function Page() {
  return <Community />;
}
