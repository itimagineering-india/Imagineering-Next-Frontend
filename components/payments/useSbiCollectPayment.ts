"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export type SbiCollectDetails = {
  paymentLink?: string;
  instructions?: string;
};

type Options = {
  /** When false, skip fetching details (e.g. another payment method selected). */
  enabled?: boolean;
};

export function useSbiCollectPayment(options: Options = {}) {
  const enabled = options.enabled !== false;
  const { toast } = useToast();
  const [details, setDetails] = useState<SbiCollectDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);
    api.settings
      .getSbiCollectDetails()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setDetails(res.data as SbiCollectDetails);
        } else {
          setDetails({
            instructions: "Contact support for SBI Collect payment details.",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetails({
            instructions: "Contact support for SBI Collect payment details.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const clearReceipt = useCallback(() => setReceiptFile(null), []);

  const openLink = useCallback(() => {
    if (details?.paymentLink) {
      window.open(details.paymentLink, "_blank", "noopener,noreferrer");
      toast({
        title: "Opened SBI Collect",
        description: "Complete payment there, then come back and upload your receipt.",
      });
      return true;
    }
    toast({
      title: "Link not available",
      description: "SBI Collect payment link is not configured. Contact support.",
      variant: "destructive",
    });
    return false;
  }, [details?.paymentLink, toast]);

  /** Upload receipt file; returns URL or throws. */
  const uploadReceipt = useCallback(async (): Promise<string> => {
    if (!receiptFile) {
      throw new Error("Please pay via SBI Collect first, then upload your payment receipt.");
    }
    const uploadRes = await api.bookings.uploadNeftReceipt(receiptFile);
    if (!uploadRes.success || !(uploadRes as { data?: { receiptUrl?: string } }).data?.receiptUrl) {
      throw new Error(
        (uploadRes as { error?: { message?: string } }).error?.message || "Failed to upload receipt"
      );
    }
    return String((uploadRes as { data: { receiptUrl: string } }).data.receiptUrl);
  }, [receiptFile]);

  return {
    details,
    loading,
    receiptFile,
    setReceiptFile,
    clearReceipt,
    openLink,
    uploadReceipt,
    hasReceipt: Boolean(receiptFile),
  };
}
