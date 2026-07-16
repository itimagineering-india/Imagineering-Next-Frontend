import {
  CONSTRUCTION_MATERIAL_FORM_KEYS,
  buildConstructionMetadataPayload,
  extractConstructionStrings,
  pickConstructionMetadataFields,
  resolveMaterialTypeKeyForServiceForm,
} from "@/lib/constructionMaterials";
import { fitListingShortDescription } from "@/lib/serviceListingAiContext";

export interface CatalogProductItem {
  _id: string;
  name: string;
  slug: string;
  categorySlug: string;
  subcategory: string;
  materialTypeKey: string;
  description?: string;
  metadata?: Record<string, string>;
  brand?: string;
  images?: string[];
  customFields?: Array<{ label: string; value: string; type?: string }>;
  suggestedPriceType?: string;
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
}

export type CatalogListingFormPatch = {
  title: string;
  brandName: string;
  shortDescription: string;
  detailedDescription: string;
  images: string[];
  uploadedImages: File[];
  dynamicData: Record<string, unknown>;
  priceMode: "exact" | "range";
  pricingType: string;
  startingPrice: string;
  priceMin: string;
  priceMax: string;
  catalogCustomFields: Array<{ label: string; value: string; type: "text" }>;
};

export function mapCatalogProductToListingForm(
  product: CatalogProductItem,
  categorySlug: string,
  subcategory: string,
  itemType: string,
): CatalogListingFormPatch {
  const description = String(product.description || product.name || "").trim();
  const constructionMeta = pickConstructionMetadataFields(product.metadata);
  const min = product.suggestedPriceMin;
  const max = product.suggestedPriceMax;
  const hasRange =
    min != null && max != null && min > 0 && max > 0 && max > min;

  const materialTypeKey = resolveMaterialTypeKeyForServiceForm(
    categorySlug,
    subcategory,
    itemType,
  );

  const dynamicData: Record<string, unknown> = { ...constructionMeta };
  if (product.brand?.trim() && !dynamicData.brand) {
    dynamicData.brand = product.brand.trim();
  }
  if (materialTypeKey) {
    dynamicData.materialType = materialTypeKey;
  }

  const catalogCustomFields = Array.isArray(product.customFields)
    ? product.customFields
        .filter((f) => f?.label?.trim() && f?.value?.trim())
        .map((f) => ({
          label: f.label.trim(),
          value: f.value.trim(),
          type: "text" as const,
        }))
    : [];

  return {
    title: product.name,
    brandName: product.brand?.trim() || "",
    shortDescription: fitListingShortDescription(description),
    detailedDescription: description,
    images: [...(product.images || [])],
    uploadedImages: [],
    dynamicData,
    priceMode: hasRange ? "range" : "exact",
    pricingType: product.suggestedPriceType || "fixed",
    startingPrice: min != null && min > 0 ? String(min) : "",
    priceMin: min != null && min > 0 ? String(min) : "",
    priceMax: max != null && max > 0 ? String(max) : "",
    catalogCustomFields,
  };
}

export type CatalogServiceLocation = {
  address?: string;
  city?: string;
  state?: string;
  coordinates?: { lat: number; lng: number };
};

/** Build a complete service create/update payload from a catalog product */
export function buildServicePayloadFromCatalogProduct(
  product: CatalogProductItem,
  opts: {
    categoryId: string;
    categorySlug: string;
    subcategory: string;
    itemType?: string;
    location?: CatalogServiceLocation | null;
  },
): Record<string, unknown> {
  const patch = mapCatalogProductToListingForm(
    product,
    opts.categorySlug,
    opts.subcategory,
    opts.itemType || "",
  );

  const description = patch.shortDescription
    ? `${patch.shortDescription}\n\n${patch.detailedDescription}`.trim()
    : patch.detailedDescription;

  const min = parseFloat(patch.startingPrice);
  const priceMin = parseFloat(patch.priceMin);
  const priceMax = parseFloat(patch.priceMax);
  const isRange = patch.priceMode === "range" && priceMin > 0 && priceMax > 0;
  const exactPrice = Number.isFinite(min) && min > 0 ? min : 1;

  const mt = resolveMaterialTypeKeyForServiceForm(
    opts.categorySlug,
    opts.subcategory,
    opts.itemType || "",
  );
  const meta = buildConstructionMetadataPayload(
    mt,
    extractConstructionStrings(patch.dynamicData),
  );

  const payload: Record<string, unknown> = {
    title: patch.title,
    description,
    category: opts.categoryId,
    subcategory: product.subcategory || opts.subcategory,
    priceMode: isRange ? "range" : "exact",
    price: isRange ? priceMin : exactPrice,
    ...(isRange ? { priceMin, priceMax } : {}),
    priceType: patch.pricingType || "negotiable",
    deliveryTime: "1-2 days",
    featured: false,
    catalogProductId: product._id,
    contactMode: "platform",
    visibility: "normal",
    metadata: meta,
  };

  if (patch.images.length > 0) {
    payload.image = patch.images[0];
    payload.images = patch.images;
  }
  if (patch.brandName) payload.brandName = patch.brandName;
  if (patch.catalogCustomFields.length > 0) {
    payload.customFields = patch.catalogCustomFields;
  }

  const loc = opts.location;
  if (loc && (loc.address || loc.city)) {
    payload.location = {
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      ...(loc.coordinates ? { coordinates: loc.coordinates } : {}),
    };
  }

  return payload;
}

/** Strip construction keys from dynamicData when clearing catalog selection */
export function clearConstructionDynamicData(
  dynamicData: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...dynamicData };
  for (const key of CONSTRUCTION_MATERIAL_FORM_KEYS) {
    delete next[key];
  }
  delete next.materialType;
  return next;
}
