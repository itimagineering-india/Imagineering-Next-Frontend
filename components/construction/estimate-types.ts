export interface EstimateResult {
  materials: Array<{
    materialName: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    stageName: string;
    lowestMarketPrice?: number | null;
    averageCityPrice?: number | null;
  }>;
  labour: Array<{
    tradeName: string;
    personDays: number;
    dailyRate: number;
    totalCost: number;
    stageName: string;
  }>;
  stageWiseCost: Array<{
    stageName: string;
    sequence: number;
    materialCost: number;
    labourCost: number;
    totalCost: number;
    estimatedDays: number;
  }>;
  materialCost: number;
  labourCost: number;
  estimatedProjectCost: number;
  estimatedTimelineDays: number;
  confidence?: {
    level: "low" | "medium" | "high";
    score: number;
    factors: {
      priceCoveragePercent: number;
      ruleCoveragePercent: number;
      optionalInputsScore: number;
      marketplaceDataScore: number;
      templateUsed: boolean;
    };
  };
  marketplace?: {
    materials: Array<{
      materialId: string;
      lowestPrice: number | null;
      averageCityPrice: number | null;
      suppliers: Array<{ supplierName: string; rate: number; unit: string; phone?: string }>;
    }>;
    contractors: Array<{
      contractorName: string;
      specialty?: string;
      rating?: number;
      phone?: string;
    }>;
  };
  meta?: {
    cityName?: string;
    constructionTypeName?: string;
    standardName?: string;
    builtUpArea?: number;
    floors?: number;
    foundationType?: string | null;
    buildingConfiguration?: {
      bedrooms?: number;
      bathrooms?: number;
      kitchens?: number;
      balconies?: number;
      livingRooms?: number;
    };
    boqTemplateName?: string | null;
  };
}

export interface BoqTemplateOption {
  _id: string;
  name: string;
  slug: string;
  defaultFloors: number;
  defaultBuiltUpArea?: number;
  defaultStandardSlug?: string;
  foundationType?: string;
  buildingConfiguration?: {
    bedrooms?: number;
    bathrooms?: number;
    kitchens?: number;
    balconies?: number;
    livingRooms?: number;
  };
  constructionTypeId?: { name: string; slug: string };
}

export const FOUNDATION_LABELS: Record<string, string> = {
  isolated_footing: "Isolated Footing",
  combined_footing: "Combined Footing",
  raft_foundation: "Raft Foundation",
  pile_foundation: "Pile Foundation",
};

export const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

export const AREA_PRESETS = [800, 1200, 1500, 1800, 2400, 5000];

export const WIZARD_STEPS = [
  { id: "project", title: "Project", hint: "Select building type or BOQ template" },
  { id: "location", title: "City & area", hint: "Site location and built-up area" },
  { id: "rooms", title: "Layout", hint: "Floors and room configuration" },
  { id: "finish", title: "Standard", hint: "Finish quality and site conditions" },
  { id: "review", title: "Review", hint: "Check details before calculating" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export interface EstimateFormState {
  city: string;
  constructionType: string;
  standard: string;
  boqTemplate: string;
  builtUpArea: string;
  floors: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  balconies: string;
  livingRooms: string;
  structureType: string;
  soilType: string;
  foundationType: string;
  brandId: string;
}
