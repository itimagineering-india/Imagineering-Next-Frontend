"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderAgreementStatus } from "@/hooks/useProviderAgreementStatus";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import {
  getClientAgreementMetadata,
  PROVIDER_AGREEMENT_VERSION,
  type ProviderAgreementSectionId,
} from "@/lib/providerAgreementConfig";
import { ProviderAgreementForm } from "./ProviderAgreementForm";

const ALLOWED_WITHOUT_AGREEMENT = ["/dashboard/provider/agreement"];

export function ProviderAgreementGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const isProvider = user?.role === "provider";
  const onAllowedRoute = ALLOWED_WITHOUT_AGREEMENT.some((p) => pathname.startsWith(p));
  const { status, loading, refresh } = useProviderAgreementStatus(isProvider);
  const [submitting, setSubmitting] = useState(false);

  const showGate =
    isProvider &&
    !loading &&
    status.needsReacceptance &&
    !onAllowedRoute;

  const handleAccept = async (sectionsAccepted: ProviderAgreementSectionId[]) => {
    setSubmitting(true);
    try {
      const meta = getClientAgreementMetadata();
      const res = await api.providers.acceptAgreement({
        agreementVersion: PROVIDER_AGREEMENT_VERSION,
        sectionsAccepted,
        ...meta,
      });
      if (res.success) {
        toast({
          title: "Agreement accepted",
          description: `Provider Agreement ${PROVIDER_AGREEMENT_VERSION} recorded.`,
        });
        await refresh();
      } else {
        toast({
          title: "Could not save",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not record your acceptance.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {children}
      <Dialog open={showGate} onOpenChange={() => {}}>
        <DialogContent
          className="max-w-2xl !flex h-[min(92dvh,880px)] max-h-[92dvh] flex-col gap-0 overflow-hidden p-0"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0 px-6 pt-6 pb-3 border-b">
            <DialogTitle>Accept Provider Agreement</DialogTitle>
            <DialogDescription>
              One-time consent required before you can use the provider dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-6 py-4">
            <ProviderAgreementForm
              mode="gate"
              submitting={submitting}
              onSubmit={handleAccept}
              onCancel={() => logout()}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
