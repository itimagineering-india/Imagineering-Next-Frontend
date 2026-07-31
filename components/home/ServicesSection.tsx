"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ServicePlaceholderCard, serviceCategories } from "./ServicePlaceholderCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

/** Matches homepage reference order. */
const DISPLAY_ORDER = [
  "construction-materials",
  "manpower",
  "technical-manpower",
  "rental-services",
  "machines",
  "contractors",
  "consultants",
  "real-estate",
  "manufacturer",
  "logistics",
  "traders",
  "finance",
  "construction-companies",
] as const;

export function ServicesSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { t } = useTranslation("home");
  const scrollerRef = useRef<HTMLDivElement>(null);

  const ordered = DISPLAY_ORDER.map((slug) => serviceCategories.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => c != null
  );

  const scrollByCards = useCallback((direction: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-category-card]");
    const step = (card?.offsetWidth ?? 160) + 16;
    el.scrollBy({ left: direction === "left" ? -step * 3 : step * 3, behavior: "smooth" });
  }, []);

  return (
    <section className="relative overflow-hidden py-10 md:py-12 lg:py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(40_25%_98%)] via-background to-background" />
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-[hsl(var(--red-accent))]/[0.06] rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative home-shell">
        <div
          ref={ref}
          className={`flex items-end justify-between gap-4 mb-8 md:mb-10 lg:mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3rem] font-bold tracking-tight mb-2 md:mb-3">
              <span className="text-foreground">{t("services.our")} </span>
              <span className="text-[hsl(var(--red-accent))]">{t("services.title")}</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
              {t("services.description")}
            </p>
          </div>

          <div className="flex gap-2 shrink-0 pb-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full md:h-10 md:w-10"
              onClick={() => scrollByCards("left")}
              aria-label="Scroll categories left"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-9 w-9 rounded-full md:h-10 md:w-10"
              onClick={() => scrollByCards("right")}
              aria-label="Scroll categories right"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>

        <div
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          <div
            ref={scrollerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide touch-pan-x pb-2 snap-x snap-mandatory"
          >
            {ordered.map((cat, i) => {
              const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
              return (
                <div
                  key={cat.slug}
                  data-category-card
                  className={`shrink-0 w-[132px] sm:w-[148px] md:w-[160px] lg:w-[172px] snap-start transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                  style={{ transitionDelay: `${150 + i * 30}ms` }}
                >
                  <ServicePlaceholderCard index={idx} size="default" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
