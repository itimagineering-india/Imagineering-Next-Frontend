export type ParsedRequirementLine = { label: string; qty: number };

/** Matches lines like "• Skilled labour: 10" from structured requirement descriptions. */
export function parseRequirementLineItems(description: string): ParsedRequirementLine[] {
  if (!description || typeof description !== "string") return [];
  const lines = description.split(/\r?\n/);
  const out: ParsedRequirementLine[] = [];
  for (const line of lines) {
    const m = line.match(/^\s*[•\-\*‣▪]\s*(.+?):\s*(\d+)\s*$/);
    if (!m) continue;
    const label = m[1].trim();
    const qty = parseInt(m[2], 10);
    if (!label || !Number.isFinite(qty) || qty < 1) continue;
    out.push({ label, qty });
  }
  return out;
}

/** Keys stored in quote.breakdown that are not buyer line-item labels. */
export const QUOTE_META_BREAKDOWN_KEYS = [
  "subtotal",
  "platformFee",
  "gstOnPlatformFee",
  "contractor",
  "material",
  "manpower",
  "other",
] as const;

export function isMetaBreakdownKey(key: string): boolean {
  return (QUOTE_META_BREAKDOWN_KEYS as readonly string[]).includes(key);
}

/** @deprecated use isMetaBreakdownKey */
export const isPresetBreakdownKey = isMetaBreakdownKey;

export function metaBreakdownLabel(key: string): string {
  const map: Record<string, string> = {
    subtotal: "Subtotal",
    platformFee: "Platform fee",
    gstOnPlatformFee: "GST on platform fee",
    contractor: "Contractor",
    material: "Material",
    manpower: "Manpower",
    other: "Other",
  };
  return map[key] || key;
}

/** @deprecated use metaBreakdownLabel */
export const presetBreakdownLabel = metaBreakdownLabel;
