import type { Metadata } from "next";
import QuoteRequestPage from "@/pages/QuoteRequestDetail";

type Params = { id: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Quote request | Imagineering India`,
    description: "Compare quotes from listed suppliers and pay to place your order.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/quote-requests/${id}` },
  };
}

export default function Page() {
  return <QuoteRequestPage />;
}
