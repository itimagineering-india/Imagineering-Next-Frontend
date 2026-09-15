/** Paint / primer shades — order attributes, not catalog SKU variants. */

export type PaintShade = {
  code: string;
  name: string;
  hex?: string;
};

export function isPaintMaterialType(raw?: string | null): boolean {
  const n = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[\s_-]+/g, " ");
  if (!n) return false;
  return n.includes("paint") || n.includes("primer");
}

function normalizeHex(raw: unknown): string | undefined {
  const s = String(raw || "")
    .trim()
    .replace(/^#/, "");
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s)) return undefined;
  return `#${s.length === 3 ? s.split("").map((c) => c + c).join("") : s}`;
}

export function normalizePaintShade(raw: unknown): PaintShade | null {
  if (!raw || typeof raw !== "object") {
    if (typeof raw === "string") {
      const name = raw.trim();
      return name ? { code: name.toUpperCase().replace(/\s+/g, "-").slice(0, 40), name } : null;
    }
    return null;
  }
  const row = raw as Record<string, unknown>;
  const code = String(row.code ?? row.shadeCode ?? "").trim().slice(0, 40);
  const name = String(row.name ?? row.shadeName ?? "").trim().slice(0, 120);
  if (!code && !name) return null;
  const hex = normalizeHex(row.hex ?? row.color);
  const shade: PaintShade = {
    code: code || name.toUpperCase().replace(/\s+/g, "-").slice(0, 40),
    name: name || code,
  };
  if (hex) shade.hex = hex;
  return shade;
}

/** Read shade palette from catalog product (top-level or metadata). */
export function readPaintShadePalette(product: Record<string, unknown> | null | undefined): PaintShade[] {
  if (!product) return [];
  const meta =
    product.metadata && typeof product.metadata === "object"
      ? (product.metadata as Record<string, unknown>)
      : {};
  const raw = product.shadePalette ?? meta.shadePalette;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PaintShade[] = [];
  for (const item of raw) {
    const shade = normalizePaintShade(item);
    if (!shade) continue;
    const key = shade.code.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(shade);
    if (out.length >= 500) break;
  }
  return out;
}

export function formatPaintShadeLabel(shade: PaintShade | null | undefined): string {
  if (!shade) return "";
  const code = String(shade.code || "").trim();
  const name = String(shade.name || "").trim();
  if (code && name && code.toLowerCase() !== name.toLowerCase()) {
    return `${code} — ${name}`;
  }
  return code || name;
}

export function paintQuoteCartKey(params: {
  catalogProductId: string;
  catalogVariantId?: string;
  shadeCode?: string;
  shadeName?: string;
}): string {
  const base = params.catalogVariantId
    ? `catalog:${params.catalogProductId}:${params.catalogVariantId}`
    : `catalog:${params.catalogProductId}`;
  const shade = String(params.shadeCode || params.shadeName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");
  return shade ? `${base}:shade:${shade}` : base;
}

/** Shade code is the primary identifier for paint RFQs. */
export function isShadeSelectionComplete(shade: PaintShade | null | undefined): boolean {
  if (!shade) return false;
  return Boolean(String(shade.code || "").trim());
}

export function emptyPaintShade(): PaintShade {
  return { code: "", name: "" };
}

/** True when product detail should show the shade picker. */
export function productHasShadePicker(product: Record<string, unknown> | null | undefined): boolean {
  if (!product) return false;
  if (product.shadePickerEnabled === true) return true;
  // Legacy: curated palette products still show picker
  return readPaintShadePalette(product).length > 0;
}

