"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api-client";
import {
  FALLBACK_PAYMENT_METHODS,
  type PaymentMethodsMap,
} from "@/lib/paymentMethodSettings";
import {
  computePartialBreakdown,
  resolveAllowedPartialAdvanceMethods,
  type PartialAdvanceMethod,
} from "@/lib/partialPayment";

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

type PartialPaymentPanelProps = {
  orderTotal: number;
  amountInput: string;
  onAmountInputChange: (value: string) => void;
  advanceMethod: PartialAdvanceMethod;
  onAdvanceMethodChange: (method: PartialAdvanceMethod) => void;
  className?: string;
  children?: ReactNode;
};

export function PartialPaymentPanel({
  orderTotal,
  amountInput,
  onAmountInputChange,
  advanceMethod,
  onAdvanceMethodChange,
  className,
  children,
}: PartialPaymentPanelProps) {
  const [rules, setRules] = useState<PaymentMethodsMap>(FALLBACK_PAYMENT_METHODS);

  useEffect(() => {
    let cancelled = false;
    api.settings
      .getPaymentMethods()
      .then((res) => {
        if (cancelled || !res.success || !res.data?.methods) return;
        const next = { ...FALLBACK_PAYMENT_METHODS };
        for (const key of Object.keys(next) as (keyof PaymentMethodsMap)[]) {
          if (key === "partial") continue;
          const raw = (res.data.methods as Record<string, { enabled?: boolean; maxAmount?: number }>)[
            key
          ];
          if (!raw) continue;
          next[key] = {
            enabled: raw.enabled !== false,
            maxAmount: Number(raw.maxAmount) >= 0 ? Number(raw.maxAmount) : next[key].maxAmount,
            message: "",
          };
        }
        setRules(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const breakdown = useMemo(
    () => computePartialBreakdown(orderTotal, amountInput),
    [orderTotal, amountInput]
  );

  const allowedMethods = useMemo(
    () => resolveAllowedPartialAdvanceMethods(breakdown.partialAmount, rules),
    [breakdown.partialAmount, rules]
  );

  useEffect(() => {
    if (allowedMethods.length === 0) return;
    if (!allowedMethods.includes(advanceMethod)) {
      onAdvanceMethodChange(allowedMethods[0]);
    }
  }, [advanceMethod, allowedMethods, onAdvanceMethodChange]);

  return (
    <div className={className ?? "space-y-3 rounded-xl border bg-muted/30 p-4"}>
      <Label className="text-sm font-semibold">
        Pay now (min {breakdown.minPercent}%)
      </Label>
      <p className="text-xs text-muted-foreground">
        Pay at least {formatINR(breakdown.minPartialAmount)} online to place the order. Remaining{" "}
        {formatINR(breakdown.balanceDue)} is due on delivery.
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">₹</span>
        <Input
          type="number"
          min={breakdown.minPartialAmount || undefined}
          max={breakdown.orderTotal || undefined}
          step="1"
          value={amountInput}
          onChange={(e) => onAmountInputChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Pay now</span>
          <span className="tabular-nums font-medium">{formatINR(breakdown.partialAmount)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Balance on delivery</span>
          <span className="tabular-nums">{formatINR(breakdown.balanceDue)}</span>
        </div>
      </div>
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs font-medium">Pay advance with</Label>
        <div className="grid gap-2 sm:grid-cols-3">
          {(allowedMethods.length > 0
            ? allowedMethods
            : (["razorpay", "cashfree", "sbicollect"] as PartialAdvanceMethod[])
          ).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => onAdvanceMethodChange(method)}
              className={`rounded-lg border px-3 py-2 text-left text-sm ${
                advanceMethod === method
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-border"
              }`}
            >
              {method === "razorpay"
                ? "Razorpay"
                : method === "cashfree"
                  ? "Cashfree"
                  : "SBI Collect"}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}

export type { PartialAdvanceMethod };
