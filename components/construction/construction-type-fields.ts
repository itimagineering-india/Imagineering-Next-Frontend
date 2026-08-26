/**
 * Which estimate-wizard fields apply for each construction type.
 * Engine still accepts unused room counts as 0 — UI simply hides them.
 */

export type RoomFieldId =
  | "bedrooms"
  | "bathrooms"
  | "kitchens"
  | "livingRooms"
  | "balconies";

export interface ConstructionTypeFieldProfile {
  /** Built-up / surface area input label */
  areaLabel: string;
  areaHint?: string;
  areaPresets: number[];
  showFloors: boolean;
  /** Chip labels; value is floor count (1 = G+0) */
  floorOptions: number[];
  floorsLabel: string;
  roomFields: RoomFieldId[];
  layoutHint: string;
  showFoundation: boolean;
  showStructure: boolean;
  showSoil: boolean;
}

const RESIDENTIAL_ROOMS: RoomFieldId[] = [
  "bedrooms",
  "bathrooms",
  "kitchens",
  "livingRooms",
  "balconies",
];

const BUILDING_AREA = [800, 1200, 1500, 1800, 2400, 5000];
const LARGE_AREA = [2000, 5000, 10000, 20000, 50000];
const LINEAR_AREA = [200, 500, 1000, 2000, 5000];

const RESIDENTIAL: ConstructionTypeFieldProfile = {
  areaLabel: "Built-up area (sqft)",
  areaPresets: BUILDING_AREA,
  showFloors: true,
  floorOptions: [1, 2, 3, 4],
  floorsLabel: "Floors",
  roomFields: RESIDENTIAL_ROOMS,
  layoutHint: "Room counts improve plumbing, flooring, and electrical estimates.",
  showFoundation: true,
  showStructure: true,
  showSoil: true,
};

const COMMERCIAL: ConstructionTypeFieldProfile = {
  areaLabel: "Built-up area (sqft)",
  areaPresets: BUILDING_AREA,
  showFloors: true,
  floorOptions: [1, 2, 3, 4, 5],
  floorsLabel: "Floors",
  roomFields: ["bathrooms", "kitchens"],
  layoutHint: "Washrooms and pantry counts help MEP quantities.",
  showFoundation: true,
  showStructure: true,
  showSoil: true,
};

const INDUSTRIAL_SHELL: ConstructionTypeFieldProfile = {
  areaLabel: "Floor area (sqft)",
  areaPresets: LARGE_AREA,
  showFloors: true,
  floorOptions: [1, 2],
  floorsLabel: "Levels",
  roomFields: [],
  layoutHint: "No room layout needed for this project type.",
  showFoundation: true,
  showStructure: true,
  showSoil: true,
};

const SHOP: ConstructionTypeFieldProfile = {
  areaLabel: "Built-up area (sqft)",
  areaPresets: [400, 600, 800, 1200, 2000],
  showFloors: true,
  floorOptions: [1, 2],
  floorsLabel: "Floors",
  roomFields: ["bathrooms", "livingRooms"],
  layoutHint: "Toilet and hall counts help finishing estimates.",
  showFoundation: true,
  showStructure: true,
  showSoil: true,
};

const BOUNDARY_WALL: ConstructionTypeFieldProfile = {
  areaLabel: "Wall area (sqft)",
  areaHint: "Approx. length × height in sqft.",
  areaPresets: LINEAR_AREA,
  showFloors: false,
  floorOptions: [1],
  floorsLabel: "Floors",
  roomFields: [],
  layoutHint: "",
  showFoundation: true,
  showStructure: false,
  showSoil: true,
};

const ROAD: ConstructionTypeFieldProfile = {
  areaLabel: "Road area (sqft)",
  areaHint: "Approx. length × width in sqft.",
  areaPresets: LINEAR_AREA,
  showFloors: false,
  floorOptions: [1],
  floorsLabel: "Floors",
  roomFields: [],
  layoutHint: "",
  showFoundation: false,
  showStructure: false,
  showSoil: true,
};

const PROFILE_BY_SLUG: Record<string, ConstructionTypeFieldProfile> = {
  house: RESIDENTIAL,
  villa: RESIDENTIAL,
  apartment: RESIDENTIAL,
  "commercial-building": COMMERCIAL,
  warehouse: INDUSTRIAL_SHELL,
  shed: INDUSTRIAL_SHELL,
  shop: SHOP,
  "boundary-wall": BOUNDARY_WALL,
  road: ROAD,
};

const DEFAULT_PROFILE: ConstructionTypeFieldProfile = RESIDENTIAL;

export const ROOM_FIELD_LABELS: Record<RoomFieldId, string> = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  kitchens: "Kitchens",
  livingRooms: "Living rooms",
  balconies: "Balconies",
};

export function toTypeSlug(nameOrSlug: string): string {
  return nameOrSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getTypeFieldProfile(
  slugOrName: string | undefined | null
): ConstructionTypeFieldProfile {
  if (!slugOrName?.trim()) return DEFAULT_PROFILE;
  const slug = toTypeSlug(slugOrName);
  return PROFILE_BY_SLUG[slug] ?? DEFAULT_PROFILE;
}

export function typeHasLayoutStep(profile: ConstructionTypeFieldProfile): boolean {
  return profile.showFloors || profile.roomFields.length > 0;
}

export type WizardStepDef = {
  id: "project" | "location" | "layout" | "finish" | "review";
  title: string;
  hint: string;
};

export function getWizardStepsForType(slugOrName: string | undefined | null): WizardStepDef[] {
  const profile = getTypeFieldProfile(slugOrName);
  const steps: WizardStepDef[] = [
    { id: "project", title: "Project", hint: "Select building type or template" },
    { id: "location", title: "Location", hint: "City and project area" },
  ];
  if (typeHasLayoutStep(profile)) {
    steps.push({
      id: "layout",
      title: "Layout",
      hint: profile.roomFields.length > 0 ? "Floors and layout" : "Levels",
    });
  }
  steps.push(
    { id: "finish", title: "Standard", hint: "Finish quality and site details" },
    { id: "review", title: "Review", hint: "Check details before calculating" }
  );
  return steps;
}

/** Zero out fields that do not apply to the selected type. */
export function sanitizeFormForType<T extends {
  floors: string;
  bedrooms: string;
  bathrooms: string;
  kitchens: string;
  balconies: string;
  livingRooms: string;
  structureType: string;
  soilType: string;
  foundationType: string;
}>(form: T, slugOrName: string): T {
  const profile = getTypeFieldProfile(slugOrName);
  const next = { ...form };

  if (!profile.showFloors) {
    next.floors = "1";
  }

  (["bedrooms", "bathrooms", "kitchens", "balconies", "livingRooms"] as const).forEach((key) => {
    if (!profile.roomFields.includes(key)) {
      next[key] = "0";
    }
  });

  if (!profile.showStructure) next.structureType = "";
  if (!profile.showSoil) next.soilType = "";
  if (!profile.showFoundation) next.foundationType = "";

  return next;
}
