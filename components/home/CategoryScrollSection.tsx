"use client";
import { useRef, useEffect, memo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicesList, type ServicesListHandle } from "./ServicesList";

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
  onToggleFavorite: (serviceId: string) => void;
}

function CategoryScrollSectionComponent({
  title,
  categorySlug,
  services,
  prioritizeImages = false,
  favoritesById,
  onToggleFavorite,
}: CategoryScrollSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const listHandleRef = useRef<ServicesListHandle | null>(null);

  /* =======================
     SCROLL HANDLER
  ======================= */
  const scroll = (direction: "left" | "right") => {
    listHandleRef.current?.scrollByItems(direction, 3);
  };

  return (
    <section ref={sectionRef} className="py-3 md:py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
        <Link
          href={
            categorySlug
              ? `/services?category=${categorySlug}`
              : `/services?category=${encodeURIComponent(title)}`
          }
          className="flex items-center gap-2 group min-w-0 flex-1"
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold truncate text-slate-900 group-hover:text-red-500 transition">
            {title}
          </h2>
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5 transition-transform group-hover:translate-x-1" />
        </Link>

        <div className="flex gap-2 shrink-0">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => scroll("left")}
            aria-label={`Scroll ${title} left`}
            title={`Scroll ${title} left`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => scroll("right")}
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
            onToggleFavorite={onToggleFavorite}
          />
        </div>
      )}
    </section>
  );
}

export const CategoryScrollSection = memo(
  CategoryScrollSectionComponent,
  (prev, next) => {
    // Basic field comparisons
    if (
      prev.title !== next.title ||
      prev.categorySlug !== next.categorySlug ||
      prev.services.length !== next.services.length ||
      prev.prioritizeImages !== next.prioritizeImages
    ) {
      return false;
    }
    
    if (
      prev.favoritesById !== next.favoritesById ||
      prev.onToggleFavorite !== next.onToggleFavorite
    ) {
      return false;
    }

    // Deep compare service IDs and images to detect changes
    for (let i = 0; i < prev.services.length; i++) {
      if (
        prev.services[i].id !== next.services[i].id ||
        prev.services[i].image !== next.services[i].image
      ) {
        return false;
      }
    }
    
    return true;
  }
);
