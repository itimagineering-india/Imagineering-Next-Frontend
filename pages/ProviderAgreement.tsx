"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import {
  getClientAgreementMetadata,
  PROVIDER_AGREEMENT_VERSION,
  type ProviderAgreementSectionId,
} from "@/lib/providerAgreementConfig";
import { ProviderAgreementForm } from "@/components/provider/ProviderAgreementForm";
import { useProviderAgreementStatus } from "@/hooks/useProviderAgreementStatus";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export async function getServerSideProps() {
  return { props: {} };
}

export default function ProviderAgreement() {
  const router = useRouter();
  const { toast } = useToast();
  const { status, loading, refresh } = useProviderAgreementStatus(true);
  const [submitting, setSubmitting] = useState(false);

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
          description: "Thank you. You can now use all provider features.",
        });
        await refresh();
        router.push("/dashboard/provider");
      } else {
        toast({
          title: "Could not save",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 max-w-4xl">
      {status.isAccepted && status.acceptedAt && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          You accepted Provider Agreement{" "}
          <Badge variant="outline" className="mx-1 font-mono">
            {status.acceptedVersion || PROVIDER_AGREEMENT_VERSION}
          </Badge>
          on {format(new Date(status.acceptedAt), "d MMMM yyyy, h:mm a")}.
          {status.needsReacceptance && (
            <span className="block mt-1 font-medium">
              A newer version is available — please review and accept again below.
            </span>
          )}
        </div>
      )}

      <ProviderAgreementForm
        mode="page"
        submitting={submitting}
        onSubmit={handleAccept}
        onCancel={() => router.push("/dashboard/provider")}
      />
    </div>
  );
}
