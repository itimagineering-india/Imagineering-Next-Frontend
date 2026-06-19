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
