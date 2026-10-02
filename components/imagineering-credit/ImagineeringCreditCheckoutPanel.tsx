"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { IMAGINEERING_CREDIT, formatCreditInterestPercent } from "@/lib/imagineering-product-labels";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CreditKycDocumentUpload } from "@/components/imagineering-credit/CreditKycDocumentUpload";

type TenureOption = {
  tenureMonths: number;
  interestPercent: number;
  interestInr: number;
  amountDueInr: number;
  principalInr: number;
  dueDate: string;
};

type CreditPreview = {
  availableCredit: number;
  canPayFull: boolean;
  canPayPartial?: boolean;
  amountToUse: number;
  gatewayRemaining?: number;
  remainingCredit: number;
  repayBefore?: string;
  blockReason?: string;
  tenureOptions?: TenureOption[];
  processingFeeInr?: number;
};

export type CreditSplitGateway = "razorpay" | "cashfree";

interface ImagineeringCreditCheckoutPanelProps {
  orderTotal: number;
  selected: boolean;
  splitGateway?: CreditSplitGateway;
  onSplitGatewayChange?: (gateway: CreditSplitGateway) => void;
  creditTenureMonths?: number;
  onCreditTenureChange?: (months: number) => void;
  /** Session cheque for this order (not reused from prior purchases). */
  creditChequeUrl?: string | null;
  onCreditChequeUrlChange?: (url: string | null) => void;
  termsAccepted?: boolean;
  onTermsAcceptedChange?: (accepted: boolean) => void;
}

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDueDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function optInterest(opt: TenureOption) {
  return `${formatCreditInterestPercent(opt.interestPercent)}% · ${formatInr(opt.interestInr)}`;
}

export function ImagineeringCreditCheckoutPanel({
  orderTotal,
  selected,
  splitGateway = "razorpay",
  onSplitGatewayChange,
  creditTenureMonths,
  onCreditTenureChange,
  creditChequeUrl,
  onCreditChequeUrlChange,
  termsAccepted = false,
  onTermsAcceptedChange,
}: ImagineeringCreditCheckoutPanelProps) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CreditPreview | null>(null);
  const [chequeFilename, setChequeFilename] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.imagineeringCredit.checkoutPreview({ orderTotal });
        if (cancelled || !res.success) return;
        const data = res.data as CreditPreview;
        setPreview(data);
        const options = data.tenureOptions || [];
        if (options.length > 0 && onCreditTenureChange) {
          const current = creditTenureMonths;
          const valid = options.some((o) => o.tenureMonths === current);
          if (!valid) onCreditTenureChange(options[0].tenureMonths);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderTotal]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const tenureOptions = preview?.tenureOptions || [];
  const selectedTenure =
    tenureOptions.find((o) => o.tenureMonths === creditTenureMonths) || tenureOptions[0];
  const hasCheque = Boolean(creditChequeUrl);

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

      <div className="rounded-md border border-indigo-200/70 bg-white/60 p-2 dark:border-indigo-900/40 dark:bg-slate-900/30">
        <CreditKycDocumentUpload
          label="Cheque for this order"
          required
          documentType="cheque"
          url={creditChequeUrl || null}
          filename={chequeFilename || (hasCheque ? "Cheque uploaded" : null)}
          allowReplace
          onUploaded={async (url, filename) => {
            try {
              await api.imagineeringCredit.saveCheckoutCheque({ url });
              setChequeFilename(filename);
              onCreditChequeUrlChange?.(url);
            } catch (err) {
              setChequeFilename(null);
              onCreditChequeUrlChange?.(null);
              throw err;
            }
          }}
          onClear={() => {
            setChequeFilename(null);
            onCreditChequeUrlChange?.(null);
          }}
        />
        {!hasCheque ? (
          <p className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-200">
            Upload a fresh cheque for this purchase. Each credit order needs its own cheque.
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            This cheque is for this order only. A new upload is required for every credit purchase.
          </p>
        )}
      </div>

      {tenureOptions.length > 0 && onCreditTenureChange ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-indigo-900/80 dark:text-indigo-100/80">
            Repay in one payment after
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {tenureOptions.map((opt) => (
              <button
                key={opt.tenureMonths}
                type="button"
                onClick={() => onCreditTenureChange(opt.tenureMonths)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-left transition-colors",
                  selectedTenure?.tenureMonths === opt.tenureMonths
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-indigo-200/80 bg-white/70 text-slate-700 hover:border-indigo-400 dark:border-indigo-900/50 dark:bg-slate-900/40 dark:text-slate-200"
                )}
              >
                <p className="text-[11px] font-semibold">
                  {opt.tenureMonths} mo · {formatCreditInterestPercent(opt.interestPercent)}%
                </p>
                <p className="text-[10px] opacity-90">
                  Due {formatDueDate(opt.dueDate)} · {formatInr(opt.amountDueInr)}
                </p>
              </button>
            ))}
          </div>
          {selectedTenure ? (
            <p className="text-[11px] text-muted-foreground">
              One-time repay {formatInr(selectedTenure.amountDueInr)} by{" "}
              {formatDueDate(selectedTenure.dueDate)} (includes {optInterest(selectedTenure)} interest).
            </p>
          ) : null}
        </div>
      ) : null}

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
                  "rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                  splitGateway === g
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-start gap-2 rounded-md border border-indigo-200/70 bg-white/60 px-2 py-2 dark:border-indigo-900/40 dark:bg-slate-900/30">
        <Checkbox
          id="imagineering-credit-terms"
          checked={termsAccepted}
          onCheckedChange={(v) => onTermsAcceptedChange?.(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="imagineering-credit-terms"
          className="cursor-pointer text-[11px] font-normal leading-snug text-slate-700 dark:text-slate-200"
        >
          I agree to the{" "}
          <a
            href={IMAGINEERING_CREDIT.termsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
            onClick={(e) => e.stopPropagation()}
          >
            {IMAGINEERING_CREDIT.name} Terms &amp; Conditions
          </a>
        </Label>
      </div>
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
  const [creditTenureMonths, setCreditTenureMonths] = useState(1);
  const [tenureOptions, setTenureOptions] = useState<TenureOption[]>([]);
  const [creditChequeUrl, setCreditChequeUrl] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = () => setRefreshTick((t) => t + 1);

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
          setTenureOptions([]);
          return;
        }
        const data = res.data as CreditPreview & { account?: { status?: string } | null };
        const active = data?.account?.status === "active";
        const amountToUse = Math.round(Number(data?.amountToUse || 0));
        const remaining = Math.round(
          Number(data?.gatewayRemaining ?? Math.max(0, orderTotal - amountToUse))
        );
        const options = Array.isArray(data?.tenureOptions) ? data.tenureOptions : [];
        setShow(Boolean(active));
        setCanPayFull(Boolean(data?.canPayFull));
        setCanUse(Boolean(active && amountToUse > 0 && !data?.blockReason));
        setCreditToApply(amountToUse);
        setGatewayRemaining(remaining);
        setTenureOptions(options);
        if (options.length > 0) {
          setCreditTenureMonths((prev) =>
            options.some((o) => o.tenureMonths === prev) ? prev : options[0].tenureMonths
          );
        }
      } catch {
        setShow(false);
        setCanUse(false);
        setCanPayFull(false);
        setCreditToApply(0);
        setGatewayRemaining(0);
        setTenureOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderTotal, refreshTick]);

  return {
    canUse,
    canPayFull,
    show,
    loading,
    creditToApply,
    gatewayRemaining,
    creditTenureMonths,
    setCreditTenureMonths,
    tenureOptions,
    /** Session cheque for this checkout — required before pay. */
    creditChequeUrl,
    setCreditChequeUrl,
    /** @deprecated use creditChequeUrl — kept for gradual call-site updates */
    chequeOnFile: Boolean(creditChequeUrl),
    termsAccepted,
    setTermsAccepted,
    refresh,
  };
}
