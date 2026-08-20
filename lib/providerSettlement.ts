/** Same settlement math as Imagi Mitra: collect / keep / remit. */

const COMMISSION_GST_RATE = 0.18;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizePaymentMethod(method?: string | null): string {
  return String(method || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');
}

export function isOfflineCollectPaymentMethod(method?: string | null): boolean {
  const key = normalizePaymentMethod(method);
  if (!key) return false;
  return (
    key === 'cod' ||
    key === 'cashondelivery' ||
    key === 'payondelivery' ||
    key.includes('payondelivery') ||
    key.includes('cashondelivery') ||
    key === 'neft' ||
    key === 'sbicollect' ||
    key.includes('imagineeringcredit')
  );
}

export type ProviderSettlementBooking = {
  amount: number;
  totalAmount: number;
  commission: number;
  netEarnings: number;
  outstandingAmount?: number;
  paymentStatus?: string;
  requiresOfflinePaymentConfirmation?: boolean;
  paymentMethod?: string;
};

export function providerSettlement(booking: ProviderSettlementBooking): {
  collectFromCustomer: number;
  youKeep: number;
  youKeepFromCash: number;
  payToCompany: number;
  companyPaysYou: number;
  needsCollect: boolean;
} {
  const serviceAmount = Number(booking.amount) || 0;
  const commission = Math.max(0, Number(booking.commission) || 0);
  const storedNet = Number(booking.netEarnings);
  const youKeep = Number.isFinite(storedNet)
    ? roundMoney(storedNet)
    : roundMoney(
        serviceAmount - commission - roundMoney(commission * COMMISSION_GST_RATE)
      );

  const paid = String(booking.paymentStatus || '').toLowerCase() === 'paid';
  const outstanding = Number(booking.outstandingAmount);
  const needsCollect =
    booking.requiresOfflinePaymentConfirmation === true ||
    isOfflineCollectPaymentMethod(booking.paymentMethod) ||
    (!paid && Number.isFinite(outstanding) && outstanding > 0);

  const total = Number(booking.totalAmount);
  let collectFromCustomer = 0;
  if (needsCollect && Number.isFinite(outstanding) && outstanding > 0) {
    collectFromCustomer = outstanding;
  } else if (Number.isFinite(total) && total > 0) {
    collectFromCustomer = total;
  } else {
    collectFromCustomer = serviceAmount;
  }
  collectFromCustomer = roundMoney(collectFromCustomer);

  const gap = roundMoney(collectFromCustomer - youKeep);
  const payToCompany = Math.max(0, gap);
  const companyPaysYou = Math.max(0, roundMoney(-gap));
  const youKeepFromCash = roundMoney(Math.min(youKeep, collectFromCustomer));

  return {
    collectFromCustomer,
    youKeep,
    youKeepFromCash,
    payToCompany,
    companyPaysYou,
    needsCollect,
  };
}

export type QuoteDeliveryInfo = {
  status: 'included' | 'pickup' | 'free';
  charged: number;
  quoted: number;
};

/** How the provider's quoted delivery charge landed on this booking. */
export function quoteDeliveryForProvider(input: {
  source?: string;
  deliveryCharge?: number;
  quotedDeliveryCharge?: number;
  deliveryOption?: string;
  transport?: string;
}): QuoteDeliveryInfo | null {
  const charged = Number(input.deliveryCharge) || 0;
  const quoted = Number(input.quotedDeliveryCharge) || 0;
  const option = String(input.deliveryOption || '').toLowerCase();
  const transport = String(input.transport || '').toLowerCase();
  const isQuote =
    input.source === 'quote_request' ||
    option === 'free' ||
    option === 'paid' ||
    option === 'not_available' ||
    charged > 0 ||
    quoted > 0 ||
    transport === 'self_pickup';
  if (!isQuote) return null;

  if (transport === 'self_pickup') {
    return { status: 'pickup', charged: 0, quoted: quoted || charged };
  }
  if (charged > 0 || option === 'paid') {
    return { status: 'included', charged: charged || quoted, quoted: quoted || charged };
  }
  return { status: 'free', charged: 0, quoted: 0 };
}
