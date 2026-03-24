"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LabourAddressFilterInput } from "@/components/provider/LabourAddressFilterInput";

/** Values sent to API (after debounce where applicable). */
export type LabourBrowseFilters = {
  sort: string;
  addressQ: string;
  city: string;
  state: string;
  minRating: string;
  minExperience: string;
  maxPrice: string;
  /** Comma-separated category slugs, e.g. manpower,technical-manpower */
  categorySlugs: string;
  subManpower: string;
  subTechnical: string;
};

export const LABOUR_BROWSE_DEFAULT_FILTERS: LabourBrowseFilters = {
  sort: "name_asc",
  addressQ: "",
  city: "",
  state: "",
  minRating: "",
  minExperience: "",
  maxPrice: "",
  categorySlugs: "manpower,technical-manpower",
  subManpower: "",
  subTechnical: "",
};

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "rating_desc", label: "Highest rating" },
  { value: "rating_asc", label: "Lowest rating" },
  { value: "reviews_desc", label: "Most reviews" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "experience_desc", label: "Most experience" },
  { value: "experience_asc", label: "Least experience" },
];

/** Upper bound (₹) for browse filter — API uses maxPrice <= value */
const MAX_PRICE_TIERS = [500, 1000, 2500, 5000, 10000, 15000, 25000, 50000, 100000] as const;

const MAX_PRICE_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "any", label: "Any price" },
  ...MAX_PRICE_TIERS.map((n) => ({
    value: String(n),
    label: `Up to ₹${n.toLocaleString("en-IN")}`,
  })),
];

function normalizeMaxPriceToTier(value: string): string {
  const t = value.trim();
  if (!t) return "";
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < 0) return "";
  if (n === 0) return "";
  const asStr = String(Math.trunc(n));
  if (MAX_PRICE_TIERS.some((x) => String(x) === asStr)) return asStr;
  const up = MAX_PRICE_TIERS.find((x) => x >= n);
  return up != null ? String(up) : String(MAX_PRICE_TIERS[MAX_PRICE_TIERS.length - 1]);
}

export function countActiveLabourFilters(filters: LabourBrowseFilters): number {
  let n = 0;
  if (filters.sort !== LABOUR_BROWSE_DEFAULT_FILTERS.sort) n += 1;
  if (filters.addressQ.trim()) n += 1;
  if (filters.city.trim()) n += 1;
  if (filters.state.trim()) n += 1;
  if (filters.minRating) n += 1;
  if (filters.minExperience.trim()) n += 1;
  if (filters.maxPrice.trim()) n += 1;
  if (filters.categorySlugs.trim() !== LABOUR_BROWSE_DEFAULT_FILTERS.categorySlugs) n += 1;
  if (filters.subManpower.trim()) n += 1;
  if (filters.subTechnical.trim()) n += 1;
  return n;
}

type Props = {
  filters: LabourBrowseFilters;
  onChange: (next: LabourBrowseFilters) => void;
  onClear: () => void;
  idPrefix?: string;
  /** Subcategory labels from GET /api/categories/subcategories/:slug */
  subManpowerOptions?: string[];
  subTechnicalOptions?: string[];
};

export function LabourDirectoryFiltersForm({
  filters,
  onChange,
  onClear,
  idPrefix = "labour",
  subManpowerOptions = [],
  subTechnicalOptions = [],
}: Props) {
  const patch = (partial: Partial<LabourBrowseFilters>) => onChange({ ...filters, ...partial });

  const slugSet = useMemo(
    () => new Set(filters.categorySlugs.split(",").map((s) => s.trim()).filter(Boolean)),
    [filters.categorySlugs]
  );
  const manpowerOn = slugSet.has("manpower");
  const technicalOn = slugSet.has("technical-manpower");

  const setCategoryEnabled = (slug: "manpower" | "technical-manpower", enabled: boolean) => {
    const next = new Set(slugSet);
    if (enabled) next.add(slug);
    else next.delete(slug);
    if (next.size === 0) return;
    const slugs = Array.from(next).sort();
    patch({
      categorySlugs: slugs.join(","),
      ...(slug === "manpower" && !enabled ? { subManpower: "" } : {}),
      ...(slug === "technical-manpower" && !enabled ? { subTechnical: "" } : {}),
    });
  };

  const hasActive = countActiveLabourFilters(filters) > 0;

  const maxPriceSelectValue = useMemo(() => {
    const t = filters.maxPrice.trim();
    if (!t) return "any";
    const allowed = new Set(MAX_PRICE_TIERS.map(String));
    if (allowed.has(t)) return t;
    const key = normalizeMaxPriceToTier(t);
    return key ? key : "any";
  }, [filters.maxPrice]);

  useEffect(() => {
    const t = filters.maxPrice.trim();
    if (!t) return;
    const key = normalizeMaxPriceToTier(t);
    if (key !== t) patch({ maxPrice: key });
  }, [filters.maxPrice]);

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden">
      {hasActive ? (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onClear}>
            Clear all
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border bg-muted/30 p-2 sm:p-3 space-y-3 min-w-0">
        <p className="text-sm font-medium">Categories</p>
        <p className="text-xs text-muted-foreground">
          Choose Manpower, Technical manpower, or both. Subcategory narrows to workers who listed that subcategory
          for that category.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-cat-mp`}
                checked={manpowerOn}
                onCheckedChange={(v) => setCategoryEnabled("manpower", v === true)}
              />
              <Label htmlFor={`${idPrefix}-cat-mp`} className="font-medium cursor-pointer">
                Manpower
              </Label>
            </div>
            <div className="space-y-1.5 pl-2 sm:pl-6 min-w-0">
              <Label className="text-xs text-muted-foreground">Subcategory</Label>
              <Select
                value={filters.subManpower || "any"}
                onValueChange={(v) => patch({ subManpower: v === "any" ? "" : v })}
                disabled={!manpowerOn}
              >
                <SelectTrigger className="h-9 w-full min-w-0">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {subManpowerOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-cat-tm`}
                checked={technicalOn}
                onCheckedChange={(v) => setCategoryEnabled("technical-manpower", v === true)}
              />
              <Label htmlFor={`${idPrefix}-cat-tm`} className="font-medium cursor-pointer">
                Technical manpower
              </Label>
            </div>
            <div className="space-y-1.5 pl-2 sm:pl-6 min-w-0">
              <Label className="text-xs text-muted-foreground">Subcategory</Label>
              <Select
                value={filters.subTechnical || "any"}
                onValueChange={(v) => patch({ subTechnical: v === "any" ? "" : v })}
                disabled={!technicalOn}
              >
                <SelectTrigger className="h-9 w-full min-w-0">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  {subTechnicalOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-sort`} className="text-xs">
            Sort by
          </Label>
          <Select value={filters.sort} onValueChange={(sort) => patch({ sort })}>
            <SelectTrigger id={`${idPrefix}-sort`} className="h-9 w-full min-w-0">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-addr`} className="text-xs">
            Address / area
          </Label>
          <LabourAddressFilterInput
            id={`${idPrefix}-addr`}
            value={filters.addressQ}
            onPatch={(p) => patch(p)}
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-city`} className="text-xs">
            City
          </Label>
          <Input
            id={`${idPrefix}-city`}
            className="h-9 w-full min-w-0"
            placeholder="Filter by city"
            value={filters.city}
            onChange={(e) => patch({ city: e.target.value })}
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-state`} className="text-xs">
            State
          </Label>
          <Input
            id={`${idPrefix}-state`}
            className="h-9 w-full min-w-0"
            placeholder="Filter by state"
            value={filters.state}
            onChange={(e) => patch({ state: e.target.value })}
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-minr`} className="text-xs">
            Minimum rating
          </Label>
          <Select
            value={filters.minRating || "any"}
            onValueChange={(v) => patch({ minRating: v === "any" ? "" : v })}
          >
            <SelectTrigger id={`${idPrefix}-minr`} className="h-9 w-full min-w-0">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any rating</SelectItem>
              <SelectItem value="3">3+ stars</SelectItem>
              <SelectItem value="4">4+ stars</SelectItem>
              <SelectItem value="4.5">4.5+ stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-minexp`} className="text-xs">
            Min. experience (years)
          </Label>
          <Input
            id={`${idPrefix}-minexp`}
            className="h-9 w-full min-w-0"
            type="number"
            min={0}
            step={1}
            placeholder="e.g. 2"
            value={filters.minExperience}
            onChange={(e) => patch({ minExperience: e.target.value })}
          />
        </div>

        <div className="space-y-1.5 min-w-0">
          <Label htmlFor={`${idPrefix}-maxp`} className="text-xs">
            Price range (max.)
          </Label>
          <Select
            value={maxPriceSelectValue}
            onValueChange={(v) => patch({ maxPrice: v === "any" ? "" : v })}
          >
            <SelectTrigger id={`${idPrefix}-maxp`} className="h-9 w-full min-w-0">
              <SelectValue placeholder="Any price" />
            </SelectTrigger>
            <SelectContent>
              {MAX_PRICE_RANGE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Address / area: pick a suggestion for the full line, or type freely. It matches street, city, state, or PIN. The
        search bar still filters by name and location. Sort and rating apply after filters.
      </p>
    </div>
  );
}
