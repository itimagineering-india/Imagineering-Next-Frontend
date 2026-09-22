"use client";

import { ServicePlaceholderCard, serviceCategories } from "./ServicePlaceholderCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

/** Categories already featured above (materials, manpower, contractors, rental, resale) are omitted. */
const DISPLAY_ORDER = [
  "tools",
  "technical-manpower",
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

  const ordered = DISPLAY_ORDER.map((slug) => serviceCategories.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => c != null
  );

  return (
    <section className="relative overflow-hidden py-10 md:py-12 lg:py-16">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(40_25%_98%)] via-background to-background" />
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-[hsl(var(--red-accent))]/[0.06] rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative home-shell">
        <div
          ref={ref}
          className={`transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide touch-pan-x pb-2 snap-x snap-mandatory">
            {ordered.map((cat, i) => {
              const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
              return (
                <div
                  key={cat.slug}
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
