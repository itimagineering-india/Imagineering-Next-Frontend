"use client";

import { useCallback, useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Wallet } from "lucide-react";
import api from "@/lib/api-client";
import { IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";
import { clampWalletRedeem } from "@/lib/walletRedeem";

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
        setAppliedCredits(0);
        setDiscountInr(0);
        onCreditsChange(0, 0);
        return;
      }
      const data = res.data as {
        creditsApplied?: number;
        discountInr?: number;
        maxApplicableCredits?: number;
        maxRedeemOrderPercent?: number;
        balance?: number;
      };
      const percent = data.maxRedeemOrderPercent ?? maxPercent;
      if (data.maxRedeemOrderPercent != null) {
        setMaxPercent(data.maxRedeemOrderPercent);
      }
      const clamped = clampWalletRedeem({
        orderTotal,
        balance: data.balance ?? balance,
        creditsApplied: data.creditsApplied ?? data.maxApplicableCredits ?? 0,
        discountInr: data.discountInr ?? 0,
        maxPercent: percent,
        minRedeem,
      });
      setMaxCredits(clamped.capInr);
      setAppliedCredits(clamped.creditsApplied);
      setDiscountInr(clamped.discountInr);
      onCreditsChange(clamped.creditsApplied, clamped.discountInr);
    },
    [orderTotal, onCreditsChange, balance, maxPercent, minRedeem]
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
        const preview = previewRes.data as {
          balance?: number;
          maxApplicableCredits?: number;
          maxRedeemOrderPercent?: number;
          creditsApplied?: number;
          discountInr?: number;
        } | undefined;
        const nextBalance = wallet?.balance ?? preview?.balance ?? 0;
        const nextPercent = preview?.maxRedeemOrderPercent ?? wallet?.maxRedeemOrderPercent ?? 20;
        const capped = clampWalletRedeem({
          orderTotal,
          balance: nextBalance,
          creditsApplied: preview?.creditsApplied ?? preview?.maxApplicableCredits ?? 0,
          discountInr: preview?.discountInr ?? 0,
          maxPercent: nextPercent,
          minRedeem: wallet?.minRedeemCredits ?? 10,
        });
        setBalance(nextBalance);
        setMinRedeem(wallet?.minRedeemCredits ?? 10);
        setMaxPercent(nextPercent);
        setMaxCredits(capped.capInr);
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
        Loading {IMAGINEERING_WALLET.name}…
      </div>
    );
  }

  if (balance < minRedeem || maxCredits < minRedeem) {
    return null;
  }

  return (
    <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Wallet className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{IMAGINEERING_WALLET.name}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {balance} pts · up to {maxPercent}% (₹{maxCredits.toLocaleString("en-IN")})
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Label htmlFor="apply-credits" className="text-xs text-muted-foreground">
            Apply
          </Label>
          <Switch id="apply-credits" checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>
      {enabled && discountInr > 0 && (
        <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          −₹{discountInr.toLocaleString("en-IN")} applied ({appliedCredits} pts)
        </p>
      )}
    </div>
  );
}
