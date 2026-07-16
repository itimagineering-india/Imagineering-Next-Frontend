import type { Metadata } from "next";
import ProviderQuoteRequestWebPage from "@/pages/ProviderQuoteRequest";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submit quote | Imagineering India",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ProviderQuoteRequestWebPage />;
}
