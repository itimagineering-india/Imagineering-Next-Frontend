"use client";

import { useEffect, useState } from "react";
import type { CmsBanner } from "@/lib/home-data";

type HeroSectionProps = {
  /** Pre-fetched on the server for View Source / SEO. */
  initialBanners?: CmsBanner[];
};

export function HeroSection({ initialBanners = [] }: HeroSectionProps) {
  const [active, setActive] = useState(0);
  const cmsBanners = initialBanners;

  useEffect(() => {
    const totalSlides = cmsBanners.length;
    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % totalSlides);
    }, 2000);
    return () => clearInterval(interval);
  }, [cmsBanners.length]);

  return (
    <section className="relative pt-6 sm:pt-8 md:pt-12 lg:pt-12 pb-6 sm:pb-8 md:pb-12 lg:pb-12">
      {cmsBanners.length > 0 && (
        <div className="home-shell relative w-full aspect-[4/1] rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden">
          {cmsBanners.map((banner, index) => (
            <div
              key={banner._id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                index === active ? "opacity-100" : "opacity-0"
              }`}
            >
              {banner.link ? (
                <a
                  href={banner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}

          <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-2">
            {cmsBanners.map((_, index) => (
              <button
                key={index}
                aria-label={`Go to slide ${index + 1}`}
                onClick={() => setActive(index)}
                className={`h-2 w-2 md:h-2.5 md:w-2.5 rounded-full transition-all ${
                  active === index ? "bg-white w-5 md:w-6" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
