"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { useTranslation } from "react-i18next";
import { type FilterState } from "@/components/FilterPanel";
import { cn } from "@/lib/utils";
import { ChevronDown, RotateCcw } from "lucide-react";

const DEFAULT_FILTERS: FilterState = {
  category: [],
  subcategory: [],
  priceRange: [0, 5000],
  rating: 0,
  deliveryTime: [],
  verified: false,
  featured: false,
  provider: undefined,
  location: undefined,
  sortBy: "relevance",
};

const arraysEqual = (a: unknown[], b: unknown[]) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

const filtersEqual = (a: FilterState, b: FilterState) =>
  arraysEqual(a.category, b.category) &&
  arraysEqual(a.subcategory, b.subcategory) &&
  arraysEqual(a.priceRange, b.priceRange) &&
  arraysEqual(a.deliveryTime, b.deliveryTime) &&
  a.rating === b.rating &&
  a.verified === b.verified &&
  a.featured === b.featured &&
  a.provider === b.provider &&
  a.location === b.location &&
  a.sortBy === b.sortBy;

type Props = {
  onFilterChange?: (filters: FilterState) => void;
  className?: string;
  categories?: Array<{ _id: string; name: string; slug: string; subcategories?: unknown }>;
  value?: FilterState;
  /** Optional trailing slot (e.g. map/list toggle). */
  trailing?: ReactNode;
};

function FilterSelect({
  id,
  label,
  value,
  disabled,
  onChange,
  children,
  className,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-slate-200/90 bg-slate-50/80 pl-3.5 pr-9 text-xs font-medium text-slate-800 outline-none transition",
          "hover:border-slate-300 hover:bg-white",
          "focus-visible:border-[#FF385C]/40 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#FF385C]/20",
          "disabled:cursor-not-allowed disabled:opacity-45",
          "sm:text-sm"
        )}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
    </div>
  );
}

export function FilterToolbar({
  onFilterChange,
  className,
  categories = [],
  value,
  trailing,
}: Props) {
  const { t } = useTranslation("services");
  const [filters, setFilters] = useState<FilterState>(value ?? DEFAULT_FILTERS);
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  useEffect(() => {
    if (!value) return;
    setFilters((prev) => (filtersEqual(prev, value) ? prev : value));
  }, [value]);

  const activeCategorySlug = filters.category[0] || "";
  const prevCategorySlugRef = useRef(activeCategorySlug);

  useEffect(() => {
    if (prevCategorySlugRef.current === activeCategorySlug) return;
    prevCategorySlugRef.current = activeCategorySlug;
    setFilters((prev) => {
      if (!prev.provider) return prev;
      const next = { ...prev, provider: undefined };
      onFilterChangeRef.current?.(next);
      return next;
    });
  }, [activeCategorySlug]);

  const commit = (next: FilterState) => {
    setFilters(next);
    onFilterChange?.(next);
  };

  const subcategories = useMemo(() => {
    if (!activeCategorySlug) return [] as string[];
    const selected = categories.filter((cat) => filters.category.includes(cat.slug));
    const set = new Set<string>();
    selected.forEach((cat) => {
      getSubcategoryNames(cat.subcategories).forEach((name) => set.add(name));
    });
    return Array.from(set).sort();
  }, [activeCategorySlug, categories, filters.category]);

  const activeFilterCount =
    filters.category.length +
    filters.subcategory.length +
    (filters.sortBy && filters.sortBy !== "relevance" ? 1 : 0);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)] sm:p-3",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <FilterSelect
            id="filter-toolbar-category"
            label={t("filters.category")}
            className="min-w-[9.5rem] flex-1 basis-[9.5rem] sm:max-w-[14rem] sm:flex-none"
            value={filters.category[0] || ""}
            onChange={(slug) => {
              if (!slug) {
                commit({ ...filters, category: [], subcategory: [], rating: 0 });
                return;
              }
              commit({ ...filters, category: [slug], subcategory: [], rating: 0 });
            }}
          >
            <option value="">{t("filters.category")}</option>
            {categories.map((cat) => (
              <option key={cat._id || cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="filter-toolbar-subcategory"
            label={t("filters.subcategory")}
            className="min-w-[9.5rem] flex-1 basis-[9.5rem] sm:max-w-[14rem] sm:flex-none"
            disabled={!activeCategorySlug || subcategories.length === 0}
            value={filters.subcategory[0] || ""}
            onChange={(sub) => {
              commit({
                ...filters,
                subcategory: sub ? [sub] : [],
                rating: 0,
              });
            }}
          >
            <option value="">{t("filters.subcategory")}</option>
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            id="filter-toolbar-sort"
            label={t("filters.sortBy")}
            className="min-w-[9.5rem] flex-1 basis-[9.5rem] sm:max-w-[13rem] sm:flex-none"
            value={filters.sortBy || "relevance"}
            onChange={(sortBy) => commit({ ...filters, sortBy, rating: 0 })}
          >
            <option value="relevance">{t("filters.nearestFirst")}</option>
            <option value="rating">{t("filters.highestRated")}</option>
            <option value="price-low">{t("filters.priceLowHigh")}</option>
            <option value="price-high">{t("filters.priceHighLow")}</option>
          </FilterSelect>

          {activeFilterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 shrink-0 gap-1.5 rounded-xl px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => commit({ ...DEFAULT_FILTERS })}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("filters.clearAll")}
              <Badge
                variant="secondary"
                className="ml-0.5 rounded-full bg-slate-200/80 px-1.5 text-[10px] font-semibold text-slate-700"
              >
                {activeFilterCount}
              </Badge>
            </Button>
          ) : null}
        </div>

        {trailing ? (
          <div className="ml-auto flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
