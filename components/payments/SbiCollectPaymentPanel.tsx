"use client";

import { Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SbiCollectDetails } from "@/components/payments/useSbiCollectPayment";

type Props = {
  amount: number;
  details: SbiCollectDetails | null;
  loading: boolean;
  receiptFile: File | null;
  onReceiptFileChange: (file: File | null) => void;
  onOpenLink: () => void;
  /** Optional id suffix when multiple panels could exist on a page. */
  inputId?: string;
};

export function SbiCollectPaymentPanel({
  amount,
  details,
  loading,
  receiptFile,
  onReceiptFileChange,
  onOpenLink,
  inputId = "sbicollect-receipt-upload",
}: Props) {
  return (
    <div className="space-y-3 rounded-[14px] border border-slate-200/90 bg-[#f9fafb] p-4 shadow-sm dark:border-slate-800 dark:bg-muted/40 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </span>
        <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          SBI Collect
        </Label>
      </div>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        Pay on SBI Collect in a new tab, then upload your receipt here to place the order.
      </p>
      {loading ? (
        <p className="animate-pulse text-sm text-muted-foreground">Loading SBI Collect details…</p>
      ) : details ? (
        <div className="space-y-3 text-sm">
          {details.paymentLink ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl border-slate-200 font-medium transition-all hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800/80"
              onClick={onOpenLink}
            >
              Open SBI Collect — ₹{amount.toLocaleString("en-IN")}
            </Button>
          ) : null}
          {details.instructions ? (
            <p className="whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-xs text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900/50 dark:text-slate-300 dark:ring-slate-700">
              {details.instructions}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Contact support for SBI Collect payment details.
        </p>
      )}
      <div className="space-y-2 border-t border-slate-200/90 pt-3 dark:border-slate-700">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Upload payment receipt *
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor={inputId}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm transition-colors hover:border-blue-400/60 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/80"
          >
            <Upload className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate break-all text-slate-700 dark:text-slate-200">
              {receiptFile ? receiptFile.name : "Choose file (image or PDF)"}
            </span>
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => onReceiptFileChange(e.target.files?.[0] || null)}
          />
          {receiptFile ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-slate-600"
              onClick={() => onReceiptFileChange(null)}
            >
              Remove
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          We’ll verify your receipt before confirming the booking.
        </p>
      </div>
    </div>
  );
}
