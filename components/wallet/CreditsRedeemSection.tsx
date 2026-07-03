"use client";

import { useCallback, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet } from "lucide-react";
import api from "@/lib/api-client";

interface CreditsRedeemSectionProps {
  orderTotal: number;
  onCreditsChange: (credits: number, discountInr: number) => void;
}

export function CreditsRedeemSection({ orderTotal, onCreditsChange }: CreditsRedeemSectionProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [maxCredits, setMaxCredits] = useState(0);
  const [appliedCredits, setAppliedCredits] = useState(0);
  const [discountInr, setDiscountInr] = useState(0);
  const [minRedeem, setMinRedeem] = useState(10);
  const [maxPercent, setMaxPercent] = useState(20);

  const refreshPreview = useCallback(
    async (apply: boolean) => {
      if (!apply || orderTotal <= 0) {
        setAppliedCredits(0);
        setDiscountInr(0);
        onCreditsChange(0, 0);
        return;
      }
      const res = await api.wallet.redeemPreview({ orderTotal });
      if (!res.success || !res.data) {
        onCreditsChange(0, 0);
        return;
      }
      const data = res.data as {
        creditsApplied: number;
        discountInr: number;
        maxApplicableCredits: number;
      };
      setAppliedCredits(data.creditsApplied ?? 0);
      setDiscountInr(data.discountInr ?? 0);
      onCreditsChange(data.creditsApplied ?? 0, data.discountInr ?? 0);
    },
    [orderTotal, onCreditsChange]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [walletRes, previewRes] = await Promise.all([
          api.wallet.getMe(),
          api.wallet.redeemPreview({ orderTotal }),
        ]);
        if (cancelled) return;
        const wallet = (walletRes.data as { wallet?: { balance?: number; minRedeemCredits?: number; maxRedeemOrderPercent?: number } })?.wallet;
        const preview = previewRes.data as { balance?: number; maxApplicableCredits?: number } | undefined;
        setBalance(wallet?.balance ?? preview?.balance ?? 0);
        setMinRedeem(wallet?.minRedeemCredits ?? 10);
        setMaxPercent(wallet?.maxRedeemOrderPercent ?? 20);
        setMaxCredits(preview?.maxApplicableCredits ?? 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderTotal]);

  useEffect(() => {
    void refreshPreview(enabled);
  }, [enabled, refreshPreview]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading wallet credits…
      </div>
    );
  }

  if (balance < minRedeem || maxCredits <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Wallet className="mt-0.5 h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-sm font-medium">Imagineering Credits</p>
            <p className="text-xs text-muted-foreground">
              Balance: {balance} credits (₹{balance}) · up to {maxPercent}% per order
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="apply-credits" className="text-xs text-muted-foreground">
            Apply
          </Label>
          <Switch id="apply-credits" checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>
      {enabled && discountInr > 0 && (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
          −₹{discountInr.toLocaleString("en-IN")} ({appliedCredits} credits) applied
        </p>
      )}
    </div>
  );
}
