"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialsProductCard } from "@/components/materials/MaterialsProductCard";
import type { MaterialsProduct } from "@/lib/materials/constructionMaterialsCatalog";

type Props = {
  products: MaterialsProduct[];
  onCta?: (product: MaterialsProduct) => void;
  ctaLoadingId?: string | null;
  headerRight?: ReactNode;
  title: string;
  subtitle?: string;
};

export function MaterialsProductRail({
  products,
  onCta,
  ctaLoadingId,
  headerRight,
  title,
  subtitle,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCards = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-material-product-card]");
    const step = (card?.offsetWidth ?? 156) + 12;
    el.scrollBy({ left: direction === "left" ? -step * 3 : step * 3, behavior: "smooth" });
  }, []);

  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight}
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={() => scrollByCards("left")}
            aria-label="Scroll products left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={() => scrollByCards("right")}
            aria-label="Scroll products right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex items-start gap-2.5 sm:gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-1 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <div
            key={product.id}
            data-material-product-card
            className="w-[140px] sm:w-[148px] md:w-[156px] shrink-0 snap-start"
          >
            <MaterialsProductCard
              product={product}
              onCta={onCta}
              ctaLoading={ctaLoadingId === product.id}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
