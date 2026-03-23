import { CreditCard, Banknote, Receipt } from "lucide-react";
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
  icon: React.ReactNode;
  /** Only available when amount <= PAYMENT_AMOUNT_LIMIT */
  limitedByAmount?: boolean;
}

const PAYMENT_OPTIONS: PaymentOptionConfig[] = [
  {
    value: "razorpay",
    label: "Razorpay",
    description: "Pay via UPI, Card, Net Banking",
    icon: <CreditCard className="h-5 w-5" />,
    limitedByAmount: true,
  },
  {
    value: "cashfree",
    label: "Cashfree",
    description: "Pay via UPI, Card, Wallet",
    icon: <CreditCard className="h-5 w-5" />,
    limitedByAmount: true,
  },
  {
    value: "cod",
    label: "Pay on Delivery",
    description: "Pay when service is delivered",
    icon: <Banknote className="h-5 w-5" />,
    limitedByAmount: true,
  },
  {
    value: "sbicollect",
    label: "SBI Collect",
    description: "Pay via SBI Collect & upload receipt",
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    value: "neft",
    label: "NEFT / IMPS",
    description: "Bank transfer & upload receipt",
    icon: <Receipt className="h-5 w-5" />,
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
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">Payment Method</Label>
      {aboveLimit && (
        <p className="text-xs text-muted-foreground">
          For amounts above ₹50,000, only SBI Collect and NEFT/IMPS are available.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {visibleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
              "hover:border-primary/50 hover:bg-muted/50",
              value === option.value
                ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                : "border-border bg-card"
            )}
          >
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
                value === option.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {option.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { PAYMENT_OPTIONS };
