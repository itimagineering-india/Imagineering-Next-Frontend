"use client";
import { useCallback, useRef, useMemo, memo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicesList, type ServicesListHandle } from "./ServicesList";
import { buildServicesBrowseQuery } from "@/lib/buildServicesBrowseUrl";

interface Service {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
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

  const categoryHeaderHref = useMemo(() => {
    const q = buildServicesBrowseQuery(categorySlug ? categorySlug : title);
    return `/services?${q}`;
  }, [categorySlug, title]);

  /* =======================
     SCROLL HANDLER
  ======================= */
  const scroll = useCallback((direction: "left" | "right") => {
    listHandleRef.current?.scrollByItems(direction, 3);
  }, []);

  const handleScrollLeft = useCallback(() => scroll("left"), [scroll]);
  const handleScrollRight = useCallback(() => scroll("right"), [scroll]);

  return (
    <section ref={sectionRef} className="py-3 md:py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <Link href={categoryHeaderHref} className="flex items-center gap-2 group min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate text-slate-900 group-hover:text-red-500 transition">
            {title}
          </h2>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="flex gap-2 shrink-0">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleScrollLeft}
            aria-label={`Scroll ${title} left`}
            title={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={handleScrollRight}
            aria-label={`Scroll ${title} right`}
            title={`Scroll ${title} right`}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scroll Area - horizontal only, no vertical scroll */}
      {services.length === 0 ? (
        <div className="py-8 text-muted-foreground">No services available</div>
      ) : (
        <div className="px-3 md:px-4">
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
