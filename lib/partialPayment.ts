import {
  isPaymentMethodAvailable,
  type PaymentMethodsMap,
} from "@/lib/paymentMethodSettings";

/** Minimum advance share (same as B2B quote partial). */
export const PARTIAL_MIN_RATIO = 0.05;

export type PartialAdvanceMethod = "razorpay" | "cashfree" | "sbicollect";

export type PartialBreakdown = {
  orderTotal: number;
  minPercent: number;
  minPartialAmount: number;
  partialAmount: number;
  balanceDue: number;
};

export function partialMinimum(orderTotal: number): number {
  const total = Math.max(0, Math.round(Number(orderTotal || 0) * 100) / 100);
  return Math.round(total * PARTIAL_MIN_RATIO * 100) / 100;
}

export function computePartialBreakdown(
  orderTotal: number,
  requestedPartial?: number | string | null
): PartialBreakdown {
  const total = Math.max(0, Math.round(Number(orderTotal || 0) * 100) / 100);
  const minPartialAmount = partialMinimum(total);
  const raw = Number(requestedPartial);
  let partialAmount = minPartialAmount;
  if (Number.isFinite(raw) && raw > 0) {
    partialAmount = Math.round(raw * 100) / 100;
  }
  if (partialAmount + 0.001 < minPartialAmount) partialAmount = minPartialAmount;
  if (partialAmount - 0.001 > total) partialAmount = total;
  const balanceDue = Math.round((total - partialAmount) * 100) / 100;
  return {
    orderTotal: total,
    minPercent: Math.round(PARTIAL_MIN_RATIO * 100),
    minPartialAmount,
    partialAmount,
    balanceDue,
  };
}

export function resolveAllowedPartialAdvanceMethods(
  partialAmount: number,
  rules: PaymentMethodsMap | null | undefined
): PartialAdvanceMethod[] {
  const amount = Number(partialAmount) || 0;
  const allowed: PartialAdvanceMethod[] = [];
  if (isPaymentMethodAvailable("razorpay", amount, rules)) allowed.push("razorpay");
  if (isPaymentMethodAvailable("cashfree", amount, rules)) allowed.push("cashfree");
  // SBI Collect stays available for any partial advance (matches backend).
  if (rules?.sbicollect?.enabled !== false) allowed.push("sbicollect");
  return allowed;
}

export function normalizePartialAdvanceMethod(raw: unknown): PartialAdvanceMethod {
  const key = String(raw || "razorpay")
    .trim()
    .toLowerCase()
    .replace(/[\s-]/g, "_");
  if (key === "cashfree") return "cashfree";
  if (key === "sbicollect" || key === "sbi_collect" || key === "sbi") return "sbicollect";
  return "razorpay";
}
