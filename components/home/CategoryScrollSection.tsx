"use client";
import { useCallback, useRef, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicesList, type ServicesListHandle } from "./ServicesList";
import { catalogCategoryBrowseHref } from "@/lib/home-data";
import { MATERIALS_TRENDING_BRANDS } from "@/lib/materials/constructionMaterialsCatalog";
import { getMaterialsBrandArt } from "@/lib/materials/materialsBrandArt";
import { TOOLS_TRENDING_BRANDS } from "@/lib/toolsService";
import { cn } from "@/lib/utils";

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

  const topBrandsConfig = useMemo(() => {
    const slug = String(categorySlug || "").toLowerCase().trim();
    if (slug === "construction-materials" || slug === "construction-material") {
      return {
        brands: MATERIALS_TRENDING_BRANDS,
        href: "/construction-materials",
        resolveLogo: getMaterialsBrandArt,
      };
    }
    if (slug === "tools" || slug.startsWith("tools-")) {
      return {
        brands: TOOLS_TRENDING_BRANDS,
        href: "/tools",
        resolveLogo: () => null as ReturnType<typeof getMaterialsBrandArt>,
      };
    }
    return null;
  }, [categorySlug]);

  const redTitleAccent = useMemo(() => {
    const slug = String(categorySlug || "").toLowerCase().trim();
    return (
      slug === "construction-materials" ||
      slug === "construction-material" ||
      slug === "tools" ||
      slug.startsWith("tools-") ||
      slug === "manpower" ||
      slug.startsWith("manpower-")
    );
  }, [categorySlug]);

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

      {/* Scroll Area - horizontal only, no vertical scroll */}
      {services.length === 0 ? (
        <div className="py-8 text-muted-foreground">No services available</div>
      ) : (
        <div>
          <ServicesList
            ref={listHandleRef}
            services={services}
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
