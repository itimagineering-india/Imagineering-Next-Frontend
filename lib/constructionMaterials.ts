/**
 * Construction materials listing metadata — aligned with imagi-mitra + admin-frontend
 * `constructionMaterialsAdmin.tsx` (option values and validation).
 */

export type ConstructionMetadata = Record<string, string>;

export function normalizeCategorySlugLikeApp(slug: string): string {
  return String(slug || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-");
}

export function isConstructionMaterialsCategorySlug(slug: string | undefined): boolean {
  return normalizeCategorySlugLikeApp(slug || "") === "construction-materials";
}

/** Keys stored in provider form `dynamicData` and sent inside `metadata` on submit */
export const CONSTRUCTION_MATERIAL_FORM_KEYS: readonly string[] = [
  "brand",
  "brandCustom",
  "cementType",
  "cementTypeCustom",
  "bagSize",
  "bagSizeCustom",
  "brickBlockType",
  "brickBlockTypeCustom",
  "brickBlockSize",
  "brickBlockCustomSize",
  "sandType",
  "sandTypeCustom",
  "sandTruckSize",
  "sandTruckSizeCustom",
  "steelType",
  "steelTypeCustom",
  "steelSize",
  "steelCustomSize",
  "steelBrand",
  "steelBrandCustom",
  "aggregateType",
  "aggregateTypeCustom",
  "aggregateSize",
  "aggregateSizeCustom",
  "aggregateTruckSize",
  "aggregateTruckSizeCustom",
  "tileFloorCategoryType",
  "tileFlooringType",
  "tileFlooringTypeCustom",
  "tileSize",
  "tileCustomSize",
  "tileBrand",
  "tileBrandCustom",
  "tileFinish",
  "tileFinishCustom",
  "tileDesignPattern",
  "tileDesignPatternCustom",
  "quantityAvailable",
  "deliveryOption",
  "materialAvailability",
  "deliveryCharges",
  "materialDeliveryTime",
  "loadingUnloading",
];

/**
 * Map of select-field key → custom-text-field key.
 * When the select value is "custom", the corresponding text field is required
 * (unless the parent select itself is optional).
 */
export const CONSTRUCTION_SELECT_TO_CUSTOM: Record<string, string> = {
  brand: "brandCustom",
  cementType: "cementTypeCustom",
  bagSize: "bagSizeCustom",
  sandType: "sandTypeCustom",
  sandTruckSize: "sandTruckSizeCustom",
  steelType: "steelTypeCustom",
  steelSize: "steelCustomSize",
  steelBrand: "steelBrandCustom",
  aggregateType: "aggregateTypeCustom",
  aggregateSize: "aggregateSizeCustom",
  aggregateTruckSize: "aggregateTruckSizeCustom",
  tileFlooringType: "tileFlooringTypeCustom",
  tileSize: "tileCustomSize",
  tileBrand: "tileBrandCustom",
  tileFinish: "tileFinishCustom",
  tileDesignPattern: "tileDesignPatternCustom",
  brickBlockType: "brickBlockTypeCustom",
  brickBlockSize: "brickBlockCustomSize",
};

function resolveConstructionMaterialTypeKeySlugOnly(raw: string): string {
  const n = String(raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");

  if (n === "cement") return "cement";
  if (n === "sand") return "sand";
  if (n === "steel") return "steel";
  if (n.includes("aggreg")) return "aggregate";
  if (n.includes("brick") || n.includes("block")) return "bricks";
  if (n.includes("tile") || n.includes("flooring") || n === "tiles_flooring") return "tiles_flooring";
  if (n === "other") return "other";
  if (["cement", "sand", "steel", "aggregate", "bricks", "tiles_flooring", "other"].includes(n)) return n;
  return n;
}

/** Marketplace subcategory label → mitra `materialType` bucket */
export function resolveConstructionMaterialTypeKeyFromSubcategory(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "other";
  const displayPairs: [RegExp, string][] = [
    [/cement\s*&\s*concrete/i, "cement"],
    [/steel\s*&\s*iron/i, "steel"],
    [/bricks?\s*&\s*blocks?/i, "bricks"],
    [/tiles?\s*&\s*flooring/i, "tiles_flooring"],
    [/paint\s*&\s*finishes?/i, "other"],
  ];
  for (const [re, key] of displayPairs) {
    if (re.test(s)) return key;
  }
  return resolveConstructionMaterialTypeKeySlugOnly(s);
}

export function buildConstructionMetadataPayload(
  materialTypeKey: string,
  meta: ConstructionMetadata,
): Record<string, string> {
  const out: Record<string, string> = {
    formVariant: "construction_materials",
    materialType: materialTypeKey,
    ...meta,
  };
  if (out.deliveryOption !== "delivery_available") {
    delete out.deliveryCharges;
    delete out.materialDeliveryTime;
    delete out.loadingUnloading;
  }
  return out;
}

export function extractConstructionStrings(
  dynamicData: Record<string, unknown> | undefined,
): ConstructionMetadata {
  const dd = dynamicData || {};
  const meta: ConstructionMetadata = {};
  for (const k of CONSTRUCTION_MATERIAL_FORM_KEYS) {
    const v = dd[k];
    if (typeof v === "string" && v.trim()) meta[k] = v.trim();
    else if (typeof v === "number" || typeof v === "boolean") meta[k] = String(v);
  }
  return meta;
}

/** Read string fields from saved `metadata` (no category guard — caller decides). */
export function pickConstructionMetadataFields(meta: unknown): ConstructionMetadata {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  const m = meta as Record<string, unknown>;
  const out: ConstructionMetadata = {};
  for (const k of CONSTRUCTION_MATERIAL_FORM_KEYS) {
    const v = m[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  return out;
}

/** If `meta[selectKey]` is "custom", require `meta[customKey]` to be non-empty. */
function checkCustom(
  meta: ConstructionMetadata,
  selectKey: string,
  customKey: string,
  label: string,
): string | null {
  if (meta[selectKey] === "custom" && !meta[customKey]?.trim()) {
    return `Please enter custom ${label}.`;
  }
  return null;
}

export function validateConstructionMaterials(
  materialTypeKey: string,
  meta: ConstructionMetadata,
): string | null {
  if (!meta.deliveryOption?.trim()) return "Please select delivery option.";
  if (!meta.materialAvailability?.trim()) return "Please select availability.";
  if (materialTypeKey === "cement") {
    if (!meta.brand?.trim() || !meta.cementType?.trim() || !meta.bagSize?.trim()) {
      return "Please fill brand, cement type, and bag size.";
    }
    const err =
      checkCustom(meta, "brand", "brandCustom", "brand") ||
      checkCustom(meta, "cementType", "cementTypeCustom", "cement type") ||
      checkCustom(meta, "bagSize", "bagSizeCustom", "bag size");
    if (err) return err;
  }
  if (materialTypeKey === "sand") {
    if (!meta.sandType?.trim() || !meta.sandTruckSize?.trim()) return "Please select sand type and truck size.";
    const err =
      checkCustom(meta, "sandType", "sandTypeCustom", "sand type") ||
      checkCustom(meta, "sandTruckSize", "sandTruckSizeCustom", "truck size");
    if (err) return err;
  }
  if (materialTypeKey === "steel") {
    if (!meta.steelType?.trim() || !meta.steelSize?.trim()) return "Please select steel type and size.";
    const err =
      checkCustom(meta, "steelType", "steelTypeCustom", "steel type") ||
      checkCustom(meta, "steelSize", "steelCustomSize", "steel size") ||
      checkCustom(meta, "steelBrand", "steelBrandCustom", "steel brand");
    if (err) return err;
  }
  if (materialTypeKey === "aggregate") {
    if (!meta.aggregateType?.trim() || !meta.aggregateSize?.trim() || !meta.aggregateTruckSize?.trim()) {
      return "Please select aggregate type, size, and truck size.";
    }
    const err =
      checkCustom(meta, "aggregateType", "aggregateTypeCustom", "aggregate type") ||
      checkCustom(meta, "aggregateSize", "aggregateSizeCustom", "aggregate size") ||
      checkCustom(meta, "aggregateTruckSize", "aggregateTruckSizeCustom", "truck size");
    if (err) return err;
  }
  if (materialTypeKey === "bricks") {
    if (!meta.brickBlockType?.trim() || !meta.brickBlockSize?.trim()) return "Please select brick/block type and size.";
    const err =
      checkCustom(meta, "brickBlockType", "brickBlockTypeCustom", "type") ||
      checkCustom(meta, "brickBlockSize", "brickBlockCustomSize", "size");
    if (err) return err;
  }
  if (materialTypeKey === "tiles_flooring") {
    if (!meta.tileFloorCategoryType?.trim() || !meta.tileFlooringType?.trim() || !meta.tileSize?.trim()) {
      return "Please select category type, flooring type, and size.";
    }
    const err =
      checkCustom(meta, "tileFlooringType", "tileFlooringTypeCustom", "tile / flooring type") ||
      checkCustom(meta, "tileSize", "tileCustomSize", "size") ||
      checkCustom(meta, "tileBrand", "tileBrandCustom", "brand") ||
      checkCustom(meta, "tileFinish", "tileFinishCustom", "finish") ||
      checkCustom(meta, "tileDesignPattern", "tileDesignPatternCustom", "design / pattern");
    if (err) return err;
  }
  if (meta.deliveryOption === "delivery_available") {
    if (!meta.deliveryCharges?.trim() || !meta.materialDeliveryTime?.trim() || !meta.loadingUnloading?.trim()) {
      return "Please complete delivery charges, delivery time, and loading/unloading.";
    }
  }
  return null;
}
