export type TechnicalDetailRow = {
  id: string;
  label: string;
  value: string;
};

export type ToolsServiceFieldsValue = {
  brandName: string;
  modelNumber: string;
  technicalDetails: TechnicalDetailRow[];
};

export const EMPTY_TOOLS_FIELDS: ToolsServiceFieldsValue = {
  brandName: "",
  modelNumber: "",
  technicalDetails: [],
};

/** Home Tools row — subcategory tabs under brands (matches catalog fallback types). */
export const TOOLS_HOME_SUBCATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "Hand Tools", label: "Hand Tools" },
  { id: "Power Tools", label: "Power Tools" },
  { id: "Cutting Tools", label: "Cutting Tools" },
  { id: "Measuring Tools", label: "Measuring Tools" },
  { id: "Welding Tools", label: "Welding Tools" },
  { id: "Safety Equipment", label: "Safety" },
  { id: "Garden Tools", label: "Garden" },
  { id: "Fasteners & Hardware", label: "Fasteners" },
] as const;

/** Home Tools row — set `logoUrl` to a direct image URL (Google/CDN) to show logo. */
export const TOOLS_TRENDING_BRANDS = [
  { id: "bosch", name: "Bosch", mark: "BO", logoUrl: "https://logos-world.net/wp-content/uploads/2020/08/Bosch-Emblem.png" },
  { id: "dewalt", name: "DeWalt", mark: "DW", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAOspKlby35t3rTMmL5aTl_Ll1Tqz2KaT4NGCMzsDDTQ&s=10" },
  { id: "stanley", name: "Stanley", mark: "ST", logoUrl: "https://crystalpng.com/wp-content/uploads/2024/08/stanley-logo-png.png" },
  { id: "panasonic", name: "Panasonic", mark: "PA", logoUrl: "https://yt3.googleusercontent.com/Scdyo8xTWjhdwPZPPlpF1JzJYKg480Udf5gVAZkkeoyfkxk3dHydkbpVY2Z6sTc3wnEubQ6ZnQ=s900-c-k-c0x00ffffff-no-rj" },
  { id: "makita", name: "Makita", mark: "MK", logoUrl: "https://cdn.shopify.com/s/files/1/0700/0090/2449/t/2/assets/makita_logo_png6-1672746767923_1200x.png?v=1672746769" },
  { id: "hilti", name: "Hilti", mark: "HI", logoUrl: "" },
  { id: "hillgrove", name: "Hillgrove", mark: "HG", logoUrl: "" },
  { id: "godrej", name: "Godrej", mark: "GO", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTSmmoU-H9C5kyU3LMiNzRS0INSCZTG3jbR1NbRbUbUp_yvY1Yzux0iwNzR&s=10" },
  { id: "black-decker", name: "Black+Decker", mark: "BD", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFcztbR-yEsCkKMi-tHbVATSglX6skaM-Nc5dK_CNbdg&s=10" },
  { id: "total", name: "Total", mark: "TO", logoUrl: "https://assets.simon.com/tenantlogos/38749.png" },
  { id: "ingco", name: "Ingco", mark: "IN", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTS7Pnl1pYE_7LFkLjzUDv-snIzVUy_1QokAFpxnOugMYOFy6YDPUhga7o&s=10" },
  { id: "metabo", name: "Metabo", mark: "ME", logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS3zmEKzbHU2axhKPnyyCnHLeNFqi0BX12lOKili_1QkjcKq8h521gO30&s=10" },
] as const;

export function isToolsCategory(category: { slug?: string; name?: string } | null | undefined): boolean {
  const slug = String(category?.slug || "").toLowerCase().trim();
  const name = String(category?.name || "").toLowerCase().trim();
  return (
    slug === "tools" ||
    slug.startsWith("tools-") ||
    name === "tools" ||
    name.startsWith("tools ")
  );
}

export function createTechnicalDetailRow(): TechnicalDetailRow {
  return {
    id: `td-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    value: "",
  };
}

export function parseToolsFieldsFromService(service: {
  brandName?: unknown;
  metadata?: unknown;
  customFields?: unknown;
}): ToolsServiceFieldsValue {
  const meta =
    service.metadata && typeof service.metadata === "object" && !Array.isArray(service.metadata)
      ? (service.metadata as Record<string, unknown>)
      : {};

  const technicalDetails = Array.isArray(service.customFields)
    ? service.customFields
        .map((field, index) => {
          if (!field || typeof field !== "object") return null;
          const row = field as { label?: unknown; value?: unknown };
          const label = typeof row.label === "string" ? row.label : "";
          const value =
            row.value == null
              ? ""
              : typeof row.value === "string"
                ? row.value
                : String(row.value);
          if (!label.trim() && !value.trim()) return null;
          return {
            id: `loaded-${index}`,
            label,
            value,
          };
        })
        .filter((row): row is TechnicalDetailRow => row !== null)
    : [];

  return {
    brandName: typeof service.brandName === "string" ? service.brandName : "",
    modelNumber: typeof meta.modelNumber === "string" ? meta.modelNumber : "",
    technicalDetails,
  };
}

export function buildToolsServicePayload(value: ToolsServiceFieldsValue) {
  const customFields = value.technicalDetails
    .filter((row) => row.label.trim() && row.value.trim())
    .map((row) => ({
      label: row.label.trim(),
      value: row.value.trim(),
      type: "text" as const,
    }));

  const payload: {
    brandName?: string;
    metadata?: { modelNumber?: string };
    customFields?: Array<{ label: string; value: string; type: "text" }>;
  } = {};

  if (value.brandName.trim()) {
    payload.brandName = value.brandName.trim();
  }

  if (value.modelNumber.trim()) {
    payload.metadata = { modelNumber: value.modelNumber.trim() };
  }

  if (customFields.length > 0) {
    payload.customFields = customFields;
  }

  return payload;
}
