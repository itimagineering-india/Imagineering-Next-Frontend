import { Banknote, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Amount limit in ₹ — above this Razorpay & Cashfree are disabled (Pay on Delivery and bank methods stay available). */
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
  tags?: string[];
  /** When true, hidden if amount > PAYMENT_AMOUNT_LIMIT (online card gateways only). */
  limitedByAmount?: boolean;
  recommended?: boolean;
}

function RazorpayLogo() {
  return (
    <div className="flex h-9 min-w-[76px] items-center justify-center rounded-md border border-slate-200 bg-white px-2.5">
      <span className="text-[11px] font-bold tracking-tight text-[#072654]">razorpay</span>
    </div>
  );
}

function CashfreeLogo() {
  return (
    <div className="flex h-9 min-w-[76px] items-center justify-center rounded-md border border-slate-200 bg-white px-2.5">
      <span className="text-[11px] font-bold tracking-tight text-[#0F766E]">cashfree</span>
    </div>
  );
}

function SbiCollectLogo() {
  return (
    <div className="flex h-9 min-w-[76px] items-center justify-center rounded-md border border-slate-200 bg-white px-2.5">
      <span className="text-[11px] font-bold tracking-tight text-[#1D4ED8]">SBI</span>
    </div>
  );
}

function CodLogo() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600">
      <Banknote className="h-4 w-4" strokeWidth={1.75} />
    </div>
  );
}

const PAYMENT_OPTIONS: PaymentOptionConfig[] = [
  {
    value: "razorpay",
    label: "Razorpay",
    description: "UPI, credit / debit cards, net banking",
    tags: ["UPI", "Cards", "Net Banking"],
    icon: <RazorpayLogo />,
    limitedByAmount: true,
    recommended: true,
  },
  {
    value: "cashfree",
    label: "Cashfree Payments",
    description: "UPI, cards, wallets & EMI",
    tags: ["UPI", "Cards", "Wallets"],
    icon: <CashfreeLogo />,
    limitedByAmount: true,
  },
  {
    value: "cod",
    label: "Pay on Delivery",
    description: "Pay in cash or UPI when your order is delivered",
    tags: ["Cash", "UPI on delivery"],
    icon: <CodLogo />,
  },
  {
    value: "sbicollect",
    label: "SBI Collect",
    description: "Pay via SBI Collect and upload your receipt",
    tags: ["Bank transfer"],
    icon: <SbiCollectLogo />,
  },
];

type PaymentOptionsSelectorProps = {
  value: PaymentOption;
  onChange: (value: PaymentOption) => void;
  amount?: number;
  className?: string;
};

function RadioIndicator({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        selected ? "border-[#072654] bg-[#072654]" : "border-slate-300 bg-white"
      )}
      aria-hidden
    >
      {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
    </span>
  );
}

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
      {aboveLimit ? (
        <p className="rounded-md border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900">
          Orders above ₹50,000 cannot use Razorpay or Cashfree. Please choose Pay on Delivery, SBI Collect, or NEFT/IMPS.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {visibleOptions.map((option, index) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                index > 0 && "border-t border-slate-100",
                selected ? "bg-slate-50/90" : "bg-white hover:bg-slate-50/60"
              )}
            >
              <RadioIndicator selected={selected} />
              <div className="shrink-0">{option.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{option.label}</p>
                  {option.recommended && !aboveLimit ? (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                      Popular
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{option.description}</p>
                {option.tags?.length ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {option.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-slate-200 bg-white px-1.5 py-px text-[10px] font-medium text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <Lock className="h-3 w-3 shrink-0" strokeWidth={2} />
        <span>Secured with 256-bit SSL encryption</span>
      </div>
    </div>
  );
}

export { PAYMENT_OPTIONS };
