"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { IMAGINEERING_CREDIT, IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";

type CreditPreview = {
  availableCredit: number;
  canPayFull: boolean;
  canPayPartial?: boolean;
  amountToUse: number;
  gatewayRemaining?: number;
  remainingCredit: number;
  repayBefore?: string;
  blockReason?: string;
};

export type CreditSplitGateway = "razorpay" | "cashfree";

interface ImagineeringCreditCheckoutPanelProps {
  orderTotal: number;
  selected: boolean;
  /** When credit only covers part of the order, user picks gateway for the remainder. */
  splitGateway?: CreditSplitGateway;
  onSplitGatewayChange?: (gateway: CreditSplitGateway) => void;
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
  splitGateway = "razorpay",
  onSplitGatewayChange,
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
      <div className="flex items-center gap-2 rounded-lg border border-indigo-200/60 bg-indigo-50/50 px-3 py-2 text-xs text-muted-foreground dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading {IMAGINEERING_CREDIT.name}…
      </div>
    );
  }

  const amountToUse = Math.round(Number(preview?.amountToUse || 0));
  const gatewayRemaining = Math.round(
    Number(preview?.gatewayRemaining ?? Math.max(0, orderTotal - amountToUse))
  );
  const isSplit = Boolean(preview && amountToUse > 0 && gatewayRemaining > 0);
  const blocked = Boolean(preview?.blockReason) || amountToUse <= 0;

  if (blocked) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
        {preview?.blockReason ||
          `Insufficient ${IMAGINEERING_CREDIT.name}. Available: ${formatInr(preview?.availableCredit ?? 0)}`}
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-blue-50 px-3 py-2.5 dark:border-indigo-900/40 dark:from-indigo-950/40 dark:to-blue-950/30">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
          <p className="truncate text-xs font-semibold text-indigo-900 dark:text-indigo-100">
            {IMAGINEERING_CREDIT.name}
            {isSplit ? " · Split" : ""}
          </p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Limit {formatInr(preview!.availableCredit)}
          {!isSplit && preview!.repayBefore
            ? ` · due ${formatDueDate(preview!.repayBefore)}`
            : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs">
        <span>
          <span className="text-muted-foreground">Credit </span>
          <span className="font-semibold text-indigo-900 dark:text-indigo-100">
            {formatInr(amountToUse)}
          </span>
        </span>
        {isSplit ? (
          <span>
            <span className="text-muted-foreground">Online </span>
            <span className="font-semibold text-indigo-900 dark:text-indigo-100">
              {formatInr(gatewayRemaining)}
            </span>
          </span>
        ) : null}
        <span className="text-muted-foreground">
          Left {formatInr(preview!.remainingCredit)}
        </span>
      </div>

      {isSplit && onSplitGatewayChange ? (
        <div className="flex items-center gap-2">
          <p className="shrink-0 text-[11px] text-muted-foreground">Pay online via</p>
          <div className="inline-flex rounded-md border border-indigo-200/80 bg-white/70 p-0.5 dark:border-indigo-900/50 dark:bg-slate-900/40">
            {(["razorpay", "cashfree"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onSplitGatewayChange(g)}
                className={cn(
                  "rounded px-2.5 py-1 text-[11px] font-semibold capitalize transition-colors",
                  splitGateway === g
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-indigo-900 dark:text-slate-300 dark:hover:text-indigo-100"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Paid via {IMAGINEERING_CREDIT.name} (not {IMAGINEERING_WALLET.name}).
        </p>
      )}
    </div>
  );
}

export function useImagineeringCreditAvailable(orderTotal: number) {
  const [canUse, setCanUse] = useState(false);
  const [canPayFull, setCanPayFull] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creditToApply, setCreditToApply] = useState(0);
  const [gatewayRemaining, setGatewayRemaining] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.imagineeringCredit.checkoutPreview({ orderTotal });
        if (cancelled || !res.success) {
          setShow(false);
          setCanUse(false);
          setCanPayFull(false);
          setCreditToApply(0);
          setGatewayRemaining(0);
          return;
        }
        const data = res.data as CreditPreview & { account?: { status?: string } | null };
        const active = data?.account?.status === "active";
        const amountToUse = Math.round(Number(data?.amountToUse || 0));
        const remaining = Math.round(
          Number(data?.gatewayRemaining ?? Math.max(0, orderTotal - amountToUse))
        );
        setShow(Boolean(active));
        setCanPayFull(Boolean(data?.canPayFull));
        // Usable when any credit can be applied (full or split).
        setCanUse(Boolean(active && amountToUse > 0 && !data?.blockReason));
        setCreditToApply(amountToUse);
        setGatewayRemaining(remaining);
      } catch {
        setShow(false);
        setCanUse(false);
        setCanPayFull(false);
        setCreditToApply(0);
        setGatewayRemaining(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderTotal]);

  return { canUse, canPayFull, show, loading, creditToApply, gatewayRemaining };
}
