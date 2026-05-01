import type { Metadata } from "next";
import SubmitRequirement from "@/pages/SubmitRequirement";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit a requirement",
  description:
    "Post what you need — materials, labour, or services — and get matched with verified providers on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/requirement/submit` },
  openGraph: {
    title: "Submit a requirement | Imagineering India",
    description: "Tell providers what you need and receive relevant quotes and responses.",
    url: `${BASE_URL}/requirement/submit`,
  },
};

export default function Page() {
  return <SubmitRequirement />;
}
