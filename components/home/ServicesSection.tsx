"use client";

import Link from "next/link";
import { ServicePlaceholderCard, serviceCategories } from "./ServicePlaceholderCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

/** Matches homepage reference: top row = materials → resale, then contractors → logistics, then remaining. */
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

  const ordered = DISPLAY_ORDER.map((slug) => serviceCategories.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => c != null
  );
  const firstFive = ordered.slice(0, 5);
  const rest = ordered.slice(5);

  return (
    <section className="relative px-4 sm:px-6 md:px-6 lg:px-8 overflow-hidden py-10 sm:py-12 lg:py-14">
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(40_25%_98%)] via-background to-background" />
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-[hsl(var(--red-accent))]/[0.06] rounded-full blur-3xl -translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/[0.04] rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div
          ref={ref}
          className={`text-center mb-10 sm:mb-12 lg:mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem] font-bold tracking-tight mb-3 sm:mb-4">
            <span className="text-foreground">Our </span>
            <span className="text-[hsl(var(--red-accent))]">Services</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Discover a wide range of professional services across multiple categories.
          </p>
        </div>

        {/* Mobile / tablet: single grid */}
        <div
          className={`lg:hidden grid grid-cols-3 gap-2 sm:gap-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          {ordered.map((cat, i) => {
            const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
            return (
              <div
                key={cat.slug}
                className={`min-w-0 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
                }`}
                style={{ transitionDelay: `${180 + i * 35}ms` }}
              >
                <ServicePlaceholderCard index={idx} size="default" />
              </div>
            );
          })}
        </div>

        {/* Desktop (lg+): first row 5 cards, second row remaining 8 in one line */}
        <div
          className={`hidden lg:flex flex-col gap-3 xl:gap-4 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "120ms" }}
        >
          <div className="grid grid-cols-5 gap-3 xl:gap-4">
            {firstFive.map((cat, i) => {
              const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
              return (
                <div
                  key={cat.slug}
                  className={`min-w-0 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
                  }`}
                  style={{ transitionDelay: `${180 + i * 35}ms` }}
                >
                  <ServicePlaceholderCard index={idx} size="default" />
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-8 gap-2 xl:gap-3">
            {rest.map((cat, i) => {
              const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
              const gi = 5 + i;
              return (
                <div
                  key={cat.slug}
                  className={`min-w-0 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-[0.98]"
                  }`}
                  style={{ transitionDelay: `${180 + gi * 35}ms` }}
                >
                  <ServicePlaceholderCard index={idx} size="default" />
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`mt-10 sm:mt-12 flex justify-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <Link
            href="/services"
            className="inline-flex items-center justify-center rounded-xl bg-[hsl(var(--red-accent))] px-10 py-3.5 text-sm sm:text-base font-semibold text-[hsl(var(--red-accent-foreground))] shadow-lg shadow-[hsl(var(--red-accent))]/20 transition hover:brightness-110 hover:shadow-xl hover:shadow-[hsl(var(--red-accent))]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--red-accent))] focus-visible:ring-offset-2"
          >
            View All Services
          </Link>
        </div>
      </div>
    </section>
  );
}
