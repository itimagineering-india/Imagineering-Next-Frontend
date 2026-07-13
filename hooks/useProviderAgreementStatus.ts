"use client";

import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api-client";
import { PROVIDER_AGREEMENT_VERSION } from "@/lib/providerAgreementConfig";

export interface ProviderAgreementStatus {
  isAccepted: boolean;
  needsReacceptance: boolean;
  currentVersion: string;
  acceptedVersion: string | null;
  acceptedAt: string | null;
}

const defaultStatus: ProviderAgreementStatus = {
  isAccepted: false,
  needsReacceptance: true,
  currentVersion: PROVIDER_AGREEMENT_VERSION,
  acceptedVersion: null,
  acceptedAt: null,
};

export function useProviderAgreementStatus(enabled = true) {
  const [status, setStatus] = useState<ProviderAgreementStatus>(defaultStatus);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.providers.getAgreementStatus();
      if (res.success && res.data) {
        const d = res.data as ProviderAgreementStatus;
        setStatus({
          isAccepted: !!d.isAccepted,
          needsReacceptance: !!d.needsReacceptance,
          currentVersion: d.currentVersion || PROVIDER_AGREEMENT_VERSION,
          acceptedVersion: d.acceptedVersion ?? null,
          acceptedAt: d.acceptedAt ? String(d.acceptedAt) : null,
        });
      } else {
        setError(res.error?.message || "Could not load agreement status");
      }
    } catch {
      setError("Could not load agreement status");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, error, refresh };
}
