"use client";

import { ServicePlaceholderCard, serviceCategories } from "./ServicePlaceholderCard";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

// Top 5 featured categories (order: Construction Materials, Manpower, Technical Manpower, Rental Services, Machines Resale)
const FEATURED_SLUGS = ["construction-materials", "manpower", "technical-manpower", "rental-services", "machines"];

export function ServicesSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  const featured = FEATURED_SLUGS.map((slug) => serviceCategories.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => c != null
  );
  const rest = serviceCategories.filter((c) => !FEATURED_SLUGS.includes(c.slug));

  /** Mobile: single grid so the 5th featured item flows into the same grid as the rest (no extra gap between sections). */
  const mobileOrdered = [...featured, ...rest];

  return (
    <section className="relative px-4 sm:px-6 md:px-6 lg:px-8 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-[hsl(var(--red-accent))]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section Header */}
        <div
          ref={ref}
          className={`text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12 xl:mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-4xl font-bold mb-3 sm:mb-4 md:mb-6">
            <span className="text-foreground">Our </span>
            <span className="text-[hsl(var(--red-accent))] bg-gradient-to-r from-[hsl(var(--red-accent))] to-primary bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
            Discover a wide range of professional services across multiple categories.
          </p>
        </div>

        {/* Mobile: one continuous grid — 4 columns, no orphan row + gap before the rest */}
        <div
          className={`grid grid-cols-4 gap-1.5 sm:hidden transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          {mobileOrdered.map((cat, i) => {
            const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
            const isFeatured = FEATURED_SLUGS.includes(cat.slug);
            return (
              <div
                key={cat.slug}
                className={`transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
                }`}
                style={{ transitionDelay: `${300 + i * 40}ms` }}
              >
                <ServicePlaceholderCard index={idx} size={isFeatured ? "large" : "default"} />
              </div>
            );
          })}
        </div>

        {/* sm+: two rows — 5 featured, then rest (same as before) */}
        <div className="hidden sm:block">
          <div
            className={`grid grid-cols-5 gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            {featured.map((cat, i) => {
              const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
              return (
                <div
                  key={cat.slug}
                  className={`transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
                  }`}
                  style={{ transitionDelay: `${300 + i * 50}ms` }}
                >
                  <ServicePlaceholderCard index={idx} size="large" />
                </div>
              );
            })}
          </div>

          <div
            className={`grid grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-2.5 lg:gap-3 xl:gap-4 mt-2 md:mt-2.5 lg:mt-3 xl:mt-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "350ms" }}
          >
            {rest.map((cat, i) => {
              const idx = serviceCategories.findIndex((c) => c.slug === cat.slug);
              return (
                <div
                  key={cat.slug}
                  className={`transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
                  }`}
                  style={{ transitionDelay: `${400 + i * 50}ms` }}
                >
                  <ServicePlaceholderCard index={idx} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
