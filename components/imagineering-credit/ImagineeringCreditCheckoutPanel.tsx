"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { IMAGINEERING_CREDIT, IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";
import api from "@/lib/api-client";

type CreditPreview = {
  availableCredit: number;
  canPayFull: boolean;
  amountToUse: number;
  remainingCredit: number;
  repayBefore?: string;
  blockReason?: string;
};

interface ImagineeringCreditCheckoutPanelProps {
  orderTotal: number;
  selected: boolean;
}

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDueDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ImagineeringCreditCheckoutPanel({
  orderTotal,
  selected,
}: ImagineeringCreditCheckoutPanelProps) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CreditPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.imagineeringCredit.checkoutPreview({ orderTotal });
        if (cancelled || !res.success) return;
        setPreview(res.data as CreditPreview);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderTotal]);

  if (!selected) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[14px] border border-indigo-200/60 bg-indigo-50/50 p-4 text-sm text-muted-foreground dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading {IMAGINEERING_CREDIT.name}…
      </div>
    );
  }

  if (!preview?.canPayFull) {
    return (
      <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        {preview?.blockReason ||
          `Insufficient ${IMAGINEERING_CREDIT.name} for this order. Available: ${formatInr(preview?.availableCredit ?? 0)}`}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-[14px] border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-blue-50 p-4 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-blue-950/30 sm:p-5">
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">{IMAGINEERING_CREDIT.name}</p>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/50">
          <p className="text-xs text-muted-foreground">Available limit</p>
          <p className="font-semibold">{formatInr(preview.availableCredit)}</p>
        </div>
        <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/50">
          <p className="text-xs text-muted-foreground">Amount to use</p>
          <p className="font-semibold">{formatInr(preview.amountToUse)}</p>
        </div>
        <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/50">
          <p className="text-xs text-muted-foreground">Remaining credit</p>
          <p className="font-semibold">{formatInr(preview.remainingCredit)}</p>
        </div>
        {preview.repayBefore && (
          <div className="rounded-lg bg-white/70 p-3 dark:bg-slate-900/50">
            <p className="text-xs text-muted-foreground">Repay before</p>
            <p className="font-semibold">{formatDueDate(preview.repayBefore)}</p>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Your order will be paid using {IMAGINEERING_CREDIT.name}. Repay on time to unlock higher limits. (Separate from {IMAGINEERING_WALLET.name}.)
      </p>
    </div>
  );
}

export function useImagineeringCreditAvailable(orderTotal: number) {
  const [canUse, setCanUse] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.imagineeringCredit.checkoutPreview({ orderTotal });
        if (cancelled || !res.success) {
          setCanUse(false);
          return;
        }
        setCanUse(Boolean((res.data as CreditPreview)?.canPayFull));
      } catch {
        setCanUse(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderTotal]);

  return { canUse, loading };
}
