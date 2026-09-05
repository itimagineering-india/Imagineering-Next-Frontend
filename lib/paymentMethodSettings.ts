export type PaymentOption =
  | "razorpay"
  | "cashfree"
  | "cod"
  | "neft"
  | "sbicollect"
  | "imagineering_credit"
  | "partial";

export type PaymentMethodRule = {
  enabled: boolean;
  maxAmount: number;
  message?: string;
};

export type PaymentMethodsMap = Record<PaymentOption, PaymentMethodRule>;

export const FALLBACK_PAYMENT_METHODS: PaymentMethodsMap = {
  razorpay: { enabled: true, maxAmount: 50000, message: "" },
  cashfree: { enabled: true, maxAmount: 50000, message: "" },
  cod: { enabled: true, maxAmount: 0, message: "" },
  sbicollect: { enabled: true, maxAmount: 0, message: "" },
  neft: { enabled: true, maxAmount: 0, message: "" },
  imagineering_credit: { enabled: true, maxAmount: 0, message: "" },
  /** Available on quote / cart / machine-rental checkout — advance online, balance on delivery */
  partial: { enabled: true, maxAmount: 0, message: "" },
};

export function isPaymentMethodAvailable(
  method: PaymentOption,
  amount: number,
  rules: PaymentMethodsMap | null | undefined
): boolean {
  const rule = rules?.[method] ?? FALLBACK_PAYMENT_METHODS[method];
  if (!rule?.enabled) return false;
  if (rule.maxAmount > 0 && amount > rule.maxAmount) return false;
  return true;
}

export function pickFallbackPaymentMethod(
  amount: number,
  rules: PaymentMethodsMap | null | undefined,
  current: PaymentOption | null,
  prefer: PaymentOption[] = ["cod", "sbicollect", "neft", "razorpay", "cashfree"]
): PaymentOption {
  if (current && isPaymentMethodAvailable(current, amount, rules)) return current;
  for (const method of prefer) {
    if (isPaymentMethodAvailable(method, amount, rules)) return method;
  }
  return current || "cod";
}

export function paymentMethodLimitNote(
  method: PaymentOption,
  amount: number,
  rules: PaymentMethodsMap | null | undefined
): string | null {
  const rule = rules?.[method] ?? FALLBACK_PAYMENT_METHODS[method];
  if (!rule) return null;
  if (!rule.enabled) return rule.message?.trim() || null;
  if (rule.maxAmount > 0 && amount > rule.maxAmount) {
    return (
      rule.message?.trim() ||
      `Available up to ₹${rule.maxAmount.toLocaleString("en-IN")}`
    );
  }
  return null;
}
