export type QuoteRequestItemLike = {
  serviceId?: string;
  title?: string;
  quantity?: number;
};

export type QuoteOfferItemLike = {
  serviceId?: string;
  title?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
};

export function quoteRequestItems(data: { items?: QuoteRequestItemLike[] | null } | null | undefined) {
  if (!Array.isArray(data?.items)) return [];
  return data.items.filter((row) => row && String(row.title || "").trim());
}

export function quoteOfferItems(offer: { items?: QuoteOfferItemLike[] | null } | null | undefined) {
  if (!Array.isArray(offer?.items)) return [];
  return offer.items.filter((row) => row && String(row.title || "").trim());
}

export function quoteLineKey(row: { serviceId?: string; title?: string }, index = 0) {
  return String(row.serviceId || row.title || index);
}

export function quoteRequestHeadline(data: {
  items?: QuoteRequestItemLike[] | null;
  service?: { title?: string } | string | null;
  projectDetails?: { projectType?: string } | null;
} | null | undefined): string {
  if (data?.projectDetails?.projectType) return String(data.projectDetails.projectType);
  const items = quoteRequestItems(data);
  if (items.length > 1) return `${items.length} products`;
  if (items.length === 1 && items[0].title) return String(items[0].title);
  const s = data?.service;
  if (s && typeof s === "object") return s.title || "Quote request";
  return "Quote request";
}
