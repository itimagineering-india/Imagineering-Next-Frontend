/** User-facing labels — Imagineering Credit (BNPL) vs Imagineering Wallet (rewards). */

export const IMAGINEERING_CREDIT = {
  name: "Imagineering Credit",
  formalName: "Imagineering Credit",
  tagline: "Build Now. Pay Later.",
  oneLiner: "Pay for the full order now, repay Imagineering India later.",
  href: "/imagineering-credit",
} as const;

export const IMAGINEERING_WALLET = {
  name: "Imagineering Wallet",
  /** Shown in FAQ when explaining wallet balance vs credit line */
  alsoKnownAs: "wallet points",
  applyToggleLabel: "Apply from Imagineering Wallet",
  oneLiner: "Earn from referrals & activity — use as a partial discount at checkout.",
  href: "/profile/wallet",
} as const;

/** @deprecated use IMAGINEERING_CREDIT */
export const PAY_LATER_CREDIT = IMAGINEERING_CREDIT;

/** @deprecated use IMAGINEERING_WALLET */
export const REWARD_POINTS = IMAGINEERING_WALLET;

export const PRODUCT_COMPARE = [
  {
    key: "pay-later",
    name: IMAGINEERING_CREDIT.name,
    tagline: IMAGINEERING_CREDIT.tagline,
    pays: "Full order amount",
    repay: "Yes — within due date",
    earn: "Unlocked after orders + KYC",
    checkout: "Select as payment method",
  },
  {
    key: "rewards",
    name: IMAGINEERING_WALLET.name,
    tagline: "Rewards balance — not a credit line",
    pays: "Part of order (discount only)",
    repay: "No — wallet balance, not a loan",
    earn: "Referrals, goals, achievements",
    checkout: `Toggle "${IMAGINEERING_WALLET.applyToggleLabel}"`,
  },
] as const;
