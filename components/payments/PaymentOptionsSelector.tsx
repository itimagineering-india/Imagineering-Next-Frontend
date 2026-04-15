import { Banknote, CheckCircle2, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Amount limit in ₹ - above this only SBI Collect & NEFT/IMPS available */
export const PAYMENT_AMOUNT_LIMIT = 50000;

export type PaymentOption =
  | "razorpay"
  | "cashfree"
  | "cod"
  | "neft"
  | "sbicollect";

export interface PaymentOptionConfig {
  value: PaymentOption;
  label: string;
  description: string;
  icon: ReactNode;
  /** Only available when amount <= PAYMENT_AMOUNT_LIMIT */
  limitedByAmount?: boolean;
  recommended?: boolean;
}

function RazorpayLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#072654] text-white shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="currentColor" d="M7.4 4h10.2L13.7 11h3.1L6.4 20h4.1l9.9-9h-3.4L20.9 4H9.8z" />
      </svg>
    </div>
  );
}

function CashfreeLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F766E] text-white shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="currentColor" d="M19 6H9.5A4.5 4.5 0 0 0 5 10.5v3A4.5 4.5 0 0 0 9.5 18H19v-2H9.5A2.5 2.5 0 0 1 7 13.5v-3A2.5 2.5 0 0 1 9.5 8H19z" />
        <path fill="currentColor" d="M14 10h7v2h-7z" />
      </svg>
    </div>
  );
}

function SbiCollectLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1D4ED8] text-white shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="8" r="1.7" fill="currentColor" />
      </svg>
    </div>
  );
}

function NeftLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="currentColor" d="M4 7h16v10H4z" opacity=".2" />
        <path fill="currentColor" d="M4 6h16v2H4zm0 10h16v2H4zM6 9h2v6H6zm10 0h2v6h-2zm-6 0h4v2h-4zm0 4h4v2h-4z" />
      </svg>
    </div>
  );
}

const PAYMENT_OPTIONS: PaymentOptionConfig[] = [
  {
    value: "cashfree",
    label: "Cashfree",
    description: "Pay via UPI, Card, Wallet",
    icon: <CashfreeLogo />,
    limitedByAmount: true,
  },
  {
    value: "razorpay",
    label: "Razorpay",
    description: "Pay via UPI, Card, Net Banking",
    icon: <RazorpayLogo />,
    limitedByAmount: true,
  },
  {
    value: "cod",
    label: "Pay on Delivery",
    description: "Pay when service is delivered",
    icon: (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
        <Banknote className="h-5 w-5" />
      </div>
    ),
    limitedByAmount: true,
  },
  {
    value: "sbicollect",
    label: "SBI Collect",
    description: "Pay via SBI Collect & upload receipt",
    icon: <SbiCollectLogo />,
  },
];

type PaymentOptionsSelectorProps = {
  value: PaymentOption;
  onChange: (value: PaymentOption) => void;
  amount?: number;
  className?: string;
};

export function PaymentOptionsSelector({
  value,
  onChange,
  amount,
  className,
}: PaymentOptionsSelectorProps) {
  const amountNum = typeof amount === "number" && isFinite(amount) ? amount : 0;
  const aboveLimit = amountNum > PAYMENT_AMOUNT_LIMIT;
  const visibleOptions = PAYMENT_OPTIONS.filter(
    (opt) => !opt.limitedByAmount || !aboveLimit
  );

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">Choose payment method</Label>
      {aboveLimit && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
          For amounts above ₹50,000, only SBI Collect is available.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visibleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
              "hover:-translate-y-0.5 hover:border-blue-300 hover:bg-slate-50/80 hover:shadow-sm dark:hover:border-blue-700/60 dark:hover:bg-slate-900/70",
              value === option.value
                ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/30"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40"
            )}
          >
            <div className="mt-0.5 shrink-0">{option.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 pr-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{option.label}</p>
                {option.recommended && !aboveLimit && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                    <Sparkles className="h-3 w-3" />
                    Recommended
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                {option.description}
              </p>
            </div>
            {value === option.value ? (
              <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}

export { PAYMENT_OPTIONS };
