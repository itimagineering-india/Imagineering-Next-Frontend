/** Static checkout steps — reward amounts come from /api/wallet/rewards-program */

export const REDEEM_STEPS = [
  "Book a service or add items to your cart on Imagineering India.",
  "At checkout, turn on “Apply Imagineering Credits”.",
  "We apply the maximum allowed credits automatically (up to the order limit).",
  "Pay the remaining amount via Razorpay or Cashfree.",
] as const;
