import { IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";

export type WalletStatementTxn = {
  id: string;
  entryType: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  sourceType: string;
  sourceId?: string;
  description?: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
};

export type WalletStatementSummary = {
  currentBalance: number;
  totalCredited: number;
  totalDebited: number;
  creditCount: number;
  debitCount: number;
  transactionCount: number;
};

type TxnCategory = {
  title: string;
  detail: string;
};

const TXN_CATEGORIES: Record<string, TxnCategory> = {
  referral: {
    title: "Refer & Earn reward",
    detail: "Credits for a successful referral (first booking completed)",
  },
  admin: {
    title: "Bonus credit",
    detail: "Credit added by Imagineering India",
  },
  daily_goal: {
    title: "Daily goal reward",
    detail: "Provider daily goal completed on Trust & Growth",
  },
  achievement: {
    title: "Achievement reward",
    detail: "Milestone achievement unlocked",
  },
  booking_redeem: {
    title: "Used at checkout",
    detail: "Wallet points applied as order discount",
  },
  booking_refund: {
    title: "Credits returned",
    detail: "Redeemed points restored after booking cancel/refund",
  },
  adjustment: {
    title: "Balance adjustment",
    detail: "Manual correction to your wallet balance",
  },
  opening_balance: {
    title: "Opening balance",
    detail: "Points already in your wallet before statement history began",
  },
};

function shortRef(id: string): string {
  const s = String(id || "").trim();
  if (s.length <= 8) return s;
  return `${s.slice(0, 8)}…`;
}

export function resolveBookingId(tx: WalletStatementTxn): string | undefined {
  const meta = tx.metadata ?? {};
  const fromMeta = meta.bookingId ?? meta.booking;
  if (fromMeta != null && String(fromMeta).trim()) return String(fromMeta).trim();
  if (
    (tx.sourceType === "booking_redeem" || tx.sourceType === "booking_refund") &&
    tx.sourceId
  ) {
    return tx.sourceId;
  }
  return undefined;
}

export function formatWalletTxnTitle(tx: WalletStatementTxn): string {
  if (tx.metadata?.type === 'opening_balance') {
    return 'Opening balance (before wallet statement history)';
  }
  if (tx.description?.trim()) return tx.description.trim();
  return TXN_CATEGORIES[tx.sourceType]?.title ?? tx.sourceType.replace(/_/g, " ");
}

export function formatWalletTxnDetail(tx: WalletStatementTxn): string {
  if (tx.metadata?.type === 'opening_balance') {
    return TXN_CATEGORIES.opening_balance.detail;
  }
  return TXN_CATEGORIES[tx.sourceType]?.detail ?? "Wallet transaction";
}

export function formatWalletTxnReference(tx: WalletStatementTxn): string | null {
  const bookingId = resolveBookingId(tx);
  if (bookingId) return `Booking ${shortRef(bookingId)}`;

  const meta = tx.metadata ?? {};
  if (meta.paymentId) return `Payment ${shortRef(String(meta.paymentId))}`;
  if (meta.goalId) return `Goal ${shortRef(String(meta.goalId))}`;
  if (meta.slug) return String(meta.slug).replace(/_/g, " ");
  if (tx.sourceId) return shortRef(tx.sourceId);

  return null;
}

export function formatWalletStatementDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

export function formatInrFromPoints(points: number, creditInrValue: number): string {
  const inr = Math.round(points * creditInrValue);
  return `₹${inr.toLocaleString("en-IN")}`;
}

export function buildWalletStatementCsv(
  transactions: WalletStatementTxn[],
  summary: WalletStatementSummary,
  creditInrValue: number
): string {
  const lines: string[] = [];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  lines.push(`${IMAGINEERING_WALLET.name} Statement`);
  lines.push(`Generated,${new Date().toLocaleString("en-IN")}`);
  lines.push(`Current balance,${summary.currentBalance} points (${formatInrFromPoints(summary.currentBalance, creditInrValue)})`);
  lines.push(`Total earned,${summary.totalCredited} points`);
  lines.push(`Total redeemed,${summary.totalDebited} points`);
  lines.push("");
  lines.push(
    [
      "Date",
      "Time",
      "Type",
      "Particulars",
      "Category",
      "Reference",
      "Credit (pts)",
      "Debit (pts)",
      "Balance (pts)",
      "Value (INR)",
    ].map(esc).join(",")
  );

  for (const tx of transactions) {
    const { date, time } = formatWalletStatementDate(tx.occurredAt);
    const credit = tx.entryType === "credit" ? tx.amount : "";
    const debit = tx.entryType === "debit" ? tx.amount : "";
    const inr =
      tx.entryType === "credit"
        ? tx.amount * creditInrValue
        : -(tx.amount * creditInrValue);

    lines.push(
      [
        date,
        time,
        tx.entryType === "credit" ? "Credit" : "Debit",
        formatWalletTxnTitle(tx),
        TXN_CATEGORIES[tx.sourceType]?.title ?? tx.sourceType,
        formatWalletTxnReference(tx) ?? "",
        credit,
        debit,
        tx.balanceAfter,
        inr,
      ].map(esc).join(",")
    );
  }

  return lines.join("\n");
}

export function downloadWalletStatementCsv(csv: string, filename?: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ??
    `imagineering-wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
