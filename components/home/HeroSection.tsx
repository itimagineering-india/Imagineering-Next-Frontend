"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api-client";

type CmsBanner = {
  _id: string;
  title: string;
  imageUrl: string;
  link?: string;
  order: number;
};

export function HeroSection() {
  const [active, setActive] = useState(0);
  const [cmsBanners, setCmsBanners] = useState<CmsBanner[]>([]);

  // Load admin-uploaded banners for home hero (placement=home)
  useEffect(() => {
    let cancelled = false;
    const loadBanners = async () => {
      try {
        const res = await api.cms.getBanners("home");
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setCmsBanners(res.data as CmsBanner[]);
        }
      } catch {
        // non-blocking – fall back to static hero banners
      }
    };
    loadBanners();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-rotate based on CMS banners
  useEffect(() => {
    const totalSlides = cmsBanners.length;
    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % totalSlides);
    }, 2000);
    return () => clearInterval(interval);
  }, [cmsBanners.length]);

  return (
    <section className="relative px-4 sm:px-6 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 lg:pt-12 pb-6 sm:pb-8 md:pb-12 lg:pb-12">
      {/* If no CMS banners, don't render hero (no fallback) — matches Vite/React app */}
      {cmsBanners.length > 0 && (
        <div className="relative w-full aspect-[4/1] rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden mx-auto max-w-7xl">
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

          {/* Dots */}
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
