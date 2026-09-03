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

const TRADERS_CATEGORY_SLUGS = new Set([
  "traders",
  "b2b-traders",
  "vendors",
  "b2b-trader",
  "b2b",
  "b2b-services",
]);

export const CONSTRUCTION_MATERIALS_CATALOG_SLUG = "construction-materials";

/** Fallback labels when the Construction Materials category is missing or only has B2B channel names. */
export const DEFAULT_CONSTRUCTION_MATERIAL_TYPES = [
  "Cement & Concrete",
  "Steel & Iron",
  "Bricks & Blocks",
  "Sand",
  "Aggregate",
  "Tiles & Flooring",
  "Paint & Finishes",
] as const;

export function isTradersCategorySlug(slug: string | undefined): boolean {
  const s = normalizeCategorySlugLikeApp(slug || "");
  return TRADERS_CATEGORY_SLUGS.has(s) || s.includes("trader");
}

export function isMaterialSupplierSubcategory(subcategory: string): boolean {
  const n = String(subcategory || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  if (!n) return false;
  return (
    n.includes("material supplier") ||
    n.includes("construction material") ||
    n === "cement & concrete"
  );
}

export function isB2bMaterialSuppliersSubcategory(subcategory: string): boolean {
  const n = String(subcategory || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  if (!n) return false;
  return n.includes("material supplier");
}

export function shouldShowConstructionMaterialFields(
  categorySlug: string | undefined,
  subcategory: string,
  itemType: string,
): boolean {
  if (isConstructionMaterialsCategorySlug(categorySlug)) {
    return Boolean(subcategory?.trim());
  }
  if (isTradersCategorySlug(categorySlug) && isMaterialSupplierSubcategory(subcategory)) {
    return Boolean(itemType?.trim());
  }
  return false;
}

export function resolveMaterialTypeKeyForServiceForm(
  categorySlug: string | undefined,
  subcategory: string,
  itemType: string,
): string {
  if (isConstructionMaterialsCategorySlug(categorySlug) && !isB2bMaterialSuppliersSubcategory(subcategory)) {
    return resolveConstructionMaterialTypeKeyFromSubcategory(subcategory);
  }
  if (isB2bMaterialSuppliersSubcategory(subcategory) || (isTradersCategorySlug(categorySlug) && isMaterialSupplierSubcategory(subcategory))) {
    return resolveConstructionMaterialTypeKeySlugOnly(itemType);
  }
  return "";
}

/**
 * B2B Material Suppliers share the Construction Materials catalog (same SKUs).
 * Do not query traders / "Material Suppliers" as if it were a product subcategory.
 */
export function usesSharedConstructionMaterialsCatalog(
  categorySlug: string | undefined,
  subcategory: string,
): boolean {
  if (isB2bMaterialSuppliersSubcategory(subcategory)) return true;
  return isTradersCategorySlug(categorySlug) && isB2bMaterialSuppliersSubcategory(subcategory);
}

export function resolveProductCatalogListParams(
  categorySlug: string | undefined,
  subcategory: string,
  itemType = "",
): { categorySlug: string; subcategory?: string; materialTypeKey?: string } {
  const slug = normalizeCategorySlugLikeApp(categorySlug || "");
  const sub = String(subcategory || "").trim();
  const item = String(itemType || "").trim();

  if (usesSharedConstructionMaterialsCatalog(slug, sub)) {
    const keySource = item && !isB2bMaterialSuppliersSubcategory(item) ? item : "";
    if (keySource) {
      return {
        categorySlug: CONSTRUCTION_MATERIALS_CATALOG_SLUG,
        materialTypeKey: resolveConstructionMaterialTypeKeyFromSubcategory(keySource),
      };
    }
    return { categorySlug: CONSTRUCTION_MATERIALS_CATALOG_SLUG };
  }

  if (isConstructionMaterialsCategorySlug(slug)) {
    return {
      categorySlug: CONSTRUCTION_MATERIALS_CATALOG_SLUG,
      materialTypeKey: resolveConstructionMaterialTypeKeyFromSubcategory(sub),
    };
  }

  const materialTypeKey = resolveMaterialTypeKeyForServiceForm(slug, sub, item);
  if (materialTypeKey) {
    return { categorySlug: slug, materialTypeKey };
  }
  return {
    categorySlug: slug,
    ...(sub ? { subcategory: sub } : {}),
  };
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
  "steelGrade",
  "steelGradeCustom",
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
  "sanitaryProductCategory",
  "sanitaryProductSubcategory",
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
  steelGrade: "steelGradeCustom",
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

export function resolveConstructionMaterialTypeKeySlugOnly(raw: string): string {
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
  if (n.includes("sanitary") || n === "sanitary_bathroom") return "sanitary";
  if (n === "other") return "other";
  if (
    ["cement", "sand", "steel", "aggregate", "bricks", "tiles_flooring", "sanitary", "other"].includes(n)
  ) {
    return n;
  }
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
    [/sanitary/i, "sanitary"],
    [/paint\s*&\s*finishes?/i, "other"],
  ];
  for (const [re, key] of displayPairs) {
    if (re.test(s)) return key;
  }
  return resolveConstructionMaterialTypeKeySlugOnly(s);
}

/** Sanitary & Bathroom — Product category → Product subcategory tree */
export const SANITARY_PRODUCT_TREE: readonly {
  value: string;
  label: string;
  subcategories: readonly { value: string; label: string }[];
}[] = [
  {
    value: "sanitaryware",
    label: "Sanitaryware",
    subcategories: [
      { value: "western_toilet_ewc", label: "Western Toilet / EWC" },
      { value: "one_piece_ewc", label: "One Piece EWC" },
      { value: "two_piece_ewc", label: "Two Piece EWC" },
      { value: "wall_hung_ewc", label: "Wall Hung EWC" },
      { value: "squatting_pan", label: "Squatting Pan" },
      { value: "urinals", label: "Urinals" },
      { value: "cisterns", label: "Cisterns" },
    ],
  },
  {
    value: "basins",
    label: "Basins",
    subcategories: [
      { value: "table_top_basin", label: "Table Top Basin" },
      { value: "wall_hung_basin", label: "Wall Hung Basin" },
      { value: "counter_basin", label: "Counter Basin" },
      { value: "under_counter_basin", label: "Under Counter Basin" },
      { value: "pedestal_basin", label: "Pedestal Basin" },
    ],
  },
  {
    value: "faucets_taps",
    label: "Faucets & Taps",
    subcategories: [
      { value: "pillar_cock", label: "Pillar Cock" },
      { value: "basin_mixer", label: "Basin Mixer" },
      { value: "wall_mixer", label: "Wall Mixer" },
      { value: "sink_mixer", label: "Sink Mixer" },
      { value: "shower_mixer", label: "Shower Mixer" },
      { value: "diverter", label: "Diverter" },
      { value: "health_faucet", label: "Health Faucet" },
    ],
  },
  {
    value: "showers",
    label: "Showers",
    subcategories: [
      { value: "hand_shower", label: "Hand Shower" },
      { value: "overhead_shower", label: "Overhead Shower" },
      { value: "rain_shower", label: "Rain Shower" },
      { value: "shower_arm", label: "Shower Arm" },
    ],
  },
  {
    value: "flushing_systems",
    label: "Flushing Systems",
    subcategories: [
      { value: "flush_valve", label: "Flush Valve" },
      { value: "flush_cock", label: "Flush Cock" },
      { value: "concealed_cistern", label: "Concealed Cistern" },
      { value: "flush_accessories", label: "Flush Accessories" },
    ],
  },
  { value: "bathroom_accessories", label: "Bathroom Accessories", subcategories: [] },
  { value: "kitchen_sinks", label: "Kitchen Sinks", subcategories: [] },
  { value: "vanity_furniture", label: "Vanity & Furniture", subcategories: [] },
  { value: "mirrors", label: "Mirrors", subcategories: [] },
  { value: "shower_enclosures", label: "Shower Enclosures", subcategories: [] },
] as const;

export function getSanitaryProductSubcategories(
  productCategory: string,
): readonly { value: string; label: string }[] {
  const found = SANITARY_PRODUCT_TREE.find((c) => c.value === productCategory);
  return found?.subcategories ?? [];
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
    if (!meta.steelType?.trim() || !meta.steelSize?.trim() || !meta.steelGrade?.trim()) {
      return "Please select steel type, size, and grade.";
    }
    const err =
      checkCustom(meta, "steelType", "steelTypeCustom", "steel type") ||
      checkCustom(meta, "steelSize", "steelCustomSize", "steel size") ||
      checkCustom(meta, "steelGrade", "steelGradeCustom", "steel grade") ||
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
  if (materialTypeKey === "sanitary") {
    if (!meta.sanitaryProductCategory?.trim()) {
      return "Please select product category.";
    }
    const subs = getSanitaryProductSubcategories(meta.sanitaryProductCategory);
    if (subs.length > 0 && !meta.sanitaryProductSubcategory?.trim()) {
      return "Please select product subcategory.";
    }
  }
  if (meta.deliveryOption === "delivery_available") {
    if (!meta.deliveryCharges?.trim() || !meta.materialDeliveryTime?.trim() || !meta.loadingUnloading?.trim()) {
      return "Please complete delivery charges, delivery time, and loading/unloading.";
    }
  }
  return null;
}
