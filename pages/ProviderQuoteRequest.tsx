"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Legacy / deep-link entry: send providers to Requests (leads) with the quote preselected.
 */
export default function ProviderQuoteRequestWebPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  useEffect(() => {
    const q = id ? `?quoteRequestId=${encodeURIComponent(id)}` : "";
    router.replace(`/dashboard/provider/leads${q}`);
  }, [id, router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </main>
  );
}
