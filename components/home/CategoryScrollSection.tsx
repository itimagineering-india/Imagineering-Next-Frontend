"use client";
import { useCallback, useRef, useMemo, memo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicesList, type ServicesListHandle } from "./ServicesList";
import { catalogCategoryBrowseHref, normalizeHomeService } from "@/lib/home-data";
import {
  MATERIALS_CATEGORY_SLUG,
  MATERIALS_HOME_SUBCATEGORY_TABS,
  MATERIALS_TRENDING_BRANDS,
} from "@/lib/materials/constructionMaterialsCatalog";
import { getMaterialsBrandArt } from "@/lib/materials/materialsBrandArt";
import { TOOLS_HOME_SUBCATEGORY_TABS, TOOLS_TRENDING_BRANDS } from "@/lib/toolsService";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TOOLS_CATEGORY_SLUG = "tools";

interface Service {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
  priceType?: string;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  href?: string;
  hideFavorite?: boolean;
}

interface CategoryScrollSectionProps {
  title: string;
  categorySlug?: string;
  services: Service[];
  prioritizeImages?: boolean;
  favoritesById: Record<string, boolean>;
  favoritesVersion: number;
  onToggleFavorite: (serviceId: string) => void;
}

function CategoryScrollSectionComponent({
  title,
  categorySlug,
  services,
  prioritizeImages = false,
  favoritesById,
  favoritesVersion,
  onToggleFavorite,
}: CategoryScrollSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const listHandleRef = useRef<ServicesListHandle | null>(null);

  const categoryHeaderHref = useMemo(
    () => catalogCategoryBrowseHref(categorySlug, title),
    [categorySlug, title]
  );

  const slug = String(categorySlug || "").toLowerCase().trim();
  const isMaterialsSection =
    slug === "construction-materials" || slug === "construction-material";
  const isToolsSection = slug === "tools" || slug.startsWith("tools-");

  const topBrandsConfig = useMemo(() => {
    if (isMaterialsSection) {
      return {
        brands: MATERIALS_TRENDING_BRANDS,
        href: "/construction-materials",
        resolveLogo: getMaterialsBrandArt,
      };
    }
    if (isToolsSection) {
      return {
        brands: TOOLS_TRENDING_BRANDS,
        href: "/tools",
        resolveLogo: () => null as ReturnType<typeof getMaterialsBrandArt>,
      };
    }
    return null;
  }, [isMaterialsSection, isToolsSection]);

  const redTitleAccent =
    isMaterialsSection ||
    isToolsSection ||
    slug === "manpower" ||
    slug.startsWith("manpower-");

  const subcategoryTabs = isMaterialsSection
    ? MATERIALS_HOME_SUBCATEGORY_TABS
    : isToolsSection
      ? TOOLS_HOME_SUBCATEGORY_TABS
      : null;
  const tabCatalogSlug = isMaterialsSection
    ? MATERIALS_CATEGORY_SLUG
    : isToolsSection
      ? TOOLS_CATEGORY_SLUG
      : "";

  const [activeSubTab, setActiveSubTab] = useState("all");
  const [tabServices, setTabServices] = useState<Service[] | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const tabCacheRef = useRef<Record<string, Service[]>>({});

  useEffect(() => {
    setActiveSubTab("all");
    setTabServices(null);
    setTabLoading(false);
    tabCacheRef.current = {};
  }, [tabCatalogSlug]);

  useEffect(() => {
    if (!subcategoryTabs || !tabCatalogSlug || activeSubTab === "all") {
      setTabServices(null);
      setTabLoading(false);
      return;
    }
    const cacheKey = `${tabCatalogSlug}:${activeSubTab}`;
    const cached = tabCacheRef.current[cacheKey];
    if (cached) {
      setTabServices(cached);
      setTabLoading(false);
      return;
    }

    let cancelled = false;
    setTabLoading(true);
    void api.productCatalog
      .list({
        categorySlug: tabCatalogSlug,
        ...(isMaterialsSection
          ? { materialTypeKey: activeSubTab }
          : { subcategory: activeSubTab }),
        limit: 9,
        page: 1,
      })
      .then((res) => {
        if (cancelled) return;
        const raw =
          (res?.data as { products?: unknown[] } | undefined)?.products ?? [];
        const mapped = (Array.isArray(raw) ? raw : []).map((row) => {
          const p = row as Record<string, unknown>;
          const min = p.suggestedPriceMin != null ? Number(p.suggestedPriceMin) : null;
          const max = p.suggestedPriceMax != null ? Number(p.suggestedPriceMax) : null;
          const hasRange =
            min != null &&
            max != null &&
            Number.isFinite(min) &&
            Number.isFinite(max) &&
            max > 0;
          const image =
            Array.isArray(p.images) && p.images.length > 0
              ? String(p.images[0])
              : undefined;
          return normalizeHomeService(
            {
              id: String(p._id || p.id || ""),
              _id: String(p._id || p.id || ""),
              title: String(p.name || "Product"),
              name: String(p.name || "Product"),
              images: image ? [image] : [],
              image,
              priceMode: hasRange ? "range" : "exact",
              priceMin: hasRange ? min ?? undefined : undefined,
              priceMax: hasRange ? max ?? undefined : undefined,
              price: hasRange ? min || 0 : Number(min || max || 0) || 0,
              priceType: typeof p.suggestedPriceType === "string" ? p.suggestedPriceType : undefined,
              priceLabel: "",
              rating: 0,
              reviewCount: 0,
              source: "catalog",
              categorySlug: tabCatalogSlug,
            },
            tabCatalogSlug,
          );
        });
        tabCacheRef.current[cacheKey] = mapped;
        setTabServices(mapped);
        setTabLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setTabServices([]);
        setTabLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subcategoryTabs, tabCatalogSlug, activeSubTab, isMaterialsSection]);

  const displayServices =
    subcategoryTabs && activeSubTab !== "all" && tabServices != null
      ? tabServices
      : services;

  /* =======================
     SCROLL HANDLER
  ======================= */
  const scroll = useCallback((direction: "left" | "right") => {
    listHandleRef.current?.scrollByItems(direction, 3);
  }, []);

  const handleScrollLeft = useCallback(() => scroll("left"), [scroll]);
  const handleScrollRight = useCallback(() => scroll("right"), [scroll]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "py-3 md:py-4",
        topBrandsConfig && "rounded-2xl bg-slate-50 px-3 py-4 md:px-5 md:py-5",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 md:mb-6 gap-1.5 md:gap-2">
        <Link href={categoryHeaderHref} className="flex items-center gap-1.5 group min-w-0 flex-1">
          <h2
            className={cn(
              "text-base sm:text-lg md:text-2xl font-bold line-clamp-1 transition",
              redTitleAccent
                ? "text-red-600 group-hover:text-red-700"
                : "text-slate-900 group-hover:text-red-500",
            )}
          >
            {title}
          </h2>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 md:h-5 md:w-5 transition-transform group-hover:translate-x-1",
              redTitleAccent && "text-red-600",
            )}
          />
        </Link>

        <div className="flex gap-1.5 shrink-0">
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8 rounded-full md:h-9 md:w-9"
            onClick={handleScrollLeft}
            aria-label={`Scroll ${title} left`}
            title={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            className="h-8 w-8 rounded-full md:h-9 md:w-9"
            onClick={handleScrollRight}
            aria-label={`Scroll ${title} right`}
            title={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {topBrandsConfig ? (
        <div className="mb-3 md:mb-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Top brands
          </p>
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topBrandsConfig.brands.map((brand) => {
              const logoUrl =
                "logoUrl" in brand && typeof brand.logoUrl === "string"
                  ? brand.logoUrl.trim()
                  : "";
              const bundledLogo = logoUrl ? null : topBrandsConfig.resolveLogo(brand.id);
              return (
                <Link
                  key={brand.id}
                  href={topBrandsConfig.href}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-[4.5rem]"
                  title={brand.name}
                >
                  <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white sm:h-14 sm:w-14">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external Google/CDN URLs via logoUrl placeholder
                      <img
                        src={logoUrl}
                        alt={brand.name}
                        className="h-full w-full object-contain p-2"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : bundledLogo ? (
                      <Image
                        src={bundledLogo}
                        alt={brand.name}
                        fill
                        className="object-contain p-2"
                        sizes="56px"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-500">{brand.mark}</span>
                    )}
                  </span>
                  <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-slate-600">
                    {brand.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}

      {subcategoryTabs ? (
        <div
          className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 md:mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={`${title} subcategories`}
        >
          {subcategoryTabs.map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSubTab(tab.id)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                  active
                    ? "border-red-500 bg-red-500 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:text-red-600",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Scroll Area - horizontal only, no vertical scroll */}
      {tabLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Loading products…</div>
      ) : displayServices.length === 0 ? (
        <div className="py-6 text-sm text-muted-foreground">No products in this category yet</div>
      ) : (
        <div>
          <ServicesList
            key={subcategoryTabs ? `${tabCatalogSlug}:${activeSubTab}` : "default"}
            ref={listHandleRef}
            services={displayServices}
            prioritizeImages={prioritizeImages}
            favoritesById={favoritesById}
            favoritesVersion={favoritesVersion}
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}
    </section>
  );
}

export const CategoryScrollSection = memo(CategoryScrollSectionComponent);
