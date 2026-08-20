/** Cap Imagineering Wallet redeem at max % of wallet balance (never the full balance). */
export function clampWalletRedeem(params: {
  orderTotal: number;
  balance: number;
  creditsApplied: number;
  discountInr: number;
  maxPercent: number;
  minRedeem?: number;
}): { creditsApplied: number; discountInr: number; capInr: number } {
  const orderTotal = Math.max(0, Number(params.orderTotal) || 0);
  const balance = Math.max(0, Math.round(Number(params.balance) || 0));
  const maxPercent = Math.min(100, Math.max(0, Number(params.maxPercent) || 20));
  const minRedeem = Math.max(0, Math.round(Number(params.minRedeem) || 10));
  if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
    return { creditsApplied: 0, discountInr: 0, capInr: 0 };
  }
  const capInr = Math.min(orderTotal, Math.floor((balance * maxPercent) / 100));
  let creditsApplied = Math.min(
    Math.max(0, Math.round(Number(params.creditsApplied) || 0)),
    balance,
    capInr
  );
  if (creditsApplied < minRedeem) {
    return { creditsApplied: 0, discountInr: 0, capInr };
  }
  const discountInr = Math.min(
    Math.max(0, Math.round(Number(params.discountInr) || creditsApplied)),
    creditsApplied,
    capInr
  );
  return { creditsApplied, discountInr, capInr };
}

