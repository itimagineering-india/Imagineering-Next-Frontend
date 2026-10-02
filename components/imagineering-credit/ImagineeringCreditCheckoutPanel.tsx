"use client";

import { useEffect, useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { IMAGINEERING_CREDIT, formatCreditInterestPercent } from "@/lib/imagineering-product-labels";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";
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
  chequeOnFile?: boolean;
};

export type CreditSplitGateway = "razorpay" | "cashfree";

interface ImagineeringCreditCheckoutPanelProps {
  orderTotal: number;
  selected: boolean;
  splitGateway?: CreditSplitGateway;
  onSplitGatewayChange?: (gateway: CreditSplitGateway) => void;
  creditTenureMonths?: number;
  onCreditTenureChange?: (months: number) => void;
  /** Called after cheque is saved so checkout can re-enable pay. */
  onChequeSaved?: () => void;
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
  onChequeSaved,
}: ImagineeringCreditCheckoutPanelProps) {
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<CreditPreview | null>(null);
  const [chequeUrl, setChequeUrl] = useState<string | null>(null);
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
        if (data.chequeOnFile) {
          setChequeUrl((prev) => prev || "on-file");
        }
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
  const chequeOnFile = Boolean(preview?.chequeOnFile || (chequeUrl && chequeUrl !== "on-file") || chequeUrl === "on-file");

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
          label="Cheque"
          required
          documentType="cheque"
          url={chequeOnFile ? chequeUrl || "on-file" : null}
          filename={chequeFilename || (chequeOnFile ? "Cheque on file" : null)}
          onUploaded={async (url, filename) => {
            try {
              await api.imagineeringCredit.saveCheckoutCheque({ url });
            } catch {
              /* KYC upload endpoint already persists cheque when account exists */
            }
            setChequeUrl(url);
            setChequeFilename(filename);
            setPreview((prev) => (prev ? { ...prev, chequeOnFile: true } : prev));
            onChequeSaved?.();
          }}
          onClear={() => {
            /* Cheque stays on account once saved; clear only local re-upload UX before save */
            if (preview?.chequeOnFile) return;
            setChequeUrl(null);
            setChequeFilename(null);
          }}
          disabled={Boolean(preview?.chequeOnFile)}
        />
        {!chequeOnFile ? (
          <p className="mt-1.5 text-[11px] text-amber-800 dark:text-amber-200">
            Upload a cheque to pay with {IMAGINEERING_CREDIT.name}.
          </p>
        ) : null}
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
  const [chequeOnFile, setChequeOnFile] = useState(false);
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
          setChequeOnFile(false);
          return;
        }
        const data = res.data as CreditPreview & { account?: { status?: string } | null };
        const active = data?.account?.status === "active";
        const amountToUse = Math.round(Number(data?.amountToUse || 0));
        const remaining = Math.round(
          Number(data?.gatewayRemaining ?? Math.max(0, orderTotal - amountToUse))
        );
        const options = Array.isArray(data?.tenureOptions) ? data.tenureOptions : [];
        const hasCheque = Boolean(data?.chequeOnFile);
        setShow(Boolean(active));
        setCanPayFull(Boolean(data?.canPayFull));
        setChequeOnFile(hasCheque);
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
        setChequeOnFile(false);
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
    chequeOnFile,
    refresh,
  };
}
