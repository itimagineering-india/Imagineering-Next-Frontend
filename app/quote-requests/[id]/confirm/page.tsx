import type { Metadata } from "next";
import QuoteRequestConfirmPage from "@/pages/QuoteRequestConfirm";

type Params = { id: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order Confirmation | Imagineering India`,
    description: "Confirm GST, payment method, and transport for your quote order.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/quote-requests/${id}/confirm` },
  };
}

export default function Page() {
  return <QuoteRequestConfirmPage />;
}
