"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { subscribeToUserQuoteUpdates } from "@/lib/quoteRealtime";
import { ToastAction } from "@/components/ui/toast";

/**
 * When a supplier/contractor submits a quote offer, show an in-app toast
 * so the buyer knows immediately (in addition to push + /notifications).
 */
export function BuyerQuoteOfferToastListener() {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    return subscribeToUserQuoteUpdates((payload) => {
      if (payload.reason !== "offer") return;

      const quoteId = String(payload.quoteRequestId || "");
      if (!quoteId) return;

      const path = pathnameRef.current || "";
      // Detail page already shows a live banner for new offers.
      if (path === `/quote-requests/${quoteId}` || path.startsWith(`/quote-requests/${quoteId}/`)) {
        return;
      }

      const offerCount = Array.isArray(payload.data?.offers)
        ? payload.data.offers.length
        : Number(payload.data?.offersReceived) || 0;

      toast({
        title: "Quote offer received",
        description:
          offerCount > 1
            ? `You now have ${offerCount} offers on your quote request. Open to compare.`
            : "A supplier sent you a price quote. Open it to review and order.",
        action: (
          <ToastAction altText="View quote" onClick={() => router.push(`/quote-requests/${quoteId}`)}>
            View
          </ToastAction>
        ),
      });
    });
  }, [isAuthenticated, user, toast, router]);

  return null;
}
