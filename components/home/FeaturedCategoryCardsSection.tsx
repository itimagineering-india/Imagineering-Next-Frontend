"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import manpowerImg from "@/assets/services/manpower.png";
import materialsImg from "@/assets/services/materials.png";
import contractorsImg from "@/assets/services/contractors.png";
import machineRentalImg from "@/assets/services/machine-rental.png";

const FEATURED_CARDS = [
  {
    slug: "manpower",
    href: "/manpower",
    titleKey: "featuredCategories.manpower.title",
    descKey: "featuredCategories.manpower.description",
    image: manpowerImg,
  },
  {
    slug: "construction-materials",
    href: "/construction-materials",
    titleKey: "featuredCategories.materials.title",
    descKey: "featuredCategories.materials.description",
    image: materialsImg,
  },
  {
    slug: "contractors",
    href: "/services?category=contractors",
    titleKey: "featuredCategories.contractors.title",
    descKey: "featuredCategories.contractors.description",
    image: contractorsImg,
  },
  {
    slug: "machine-rental",
    href: "/machine-rental",
    titleKey: "featuredCategories.machines.title",
    descKey: "featuredCategories.machines.description",
    image: machineRentalImg,
  },
] as const;

export function FeaturedCategoryCardsSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { t } = useTranslation("home");

  return (
    <section className="relative py-8 sm:py-10 lg:py-12 pb-4 sm:pb-5 lg:pb-6">
      <div className="home-shell">
        <div
          ref={ref}
          className={`grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {FEATURED_CARDS.map((card, i) => (
            <Link
              key={card.slug}
              href={card.href}
              className={`group flex aspect-[4/5] sm:aspect-[3/4] w-full max-w-[280px] mx-auto flex-col items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 lg:p-6 shadow-sm transition-all duration-300 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--red-accent))] focus-visible:ring-offset-2 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${100 + i * 60}ms` }}
            >
              <div className="relative w-full flex-1 min-h-0">
                <Image
                  src={card.image}
                  alt={t(card.titleKey)}
                  fill
                  sizes="(max-width: 1023px) 45vw, 280px"
                  className="object-contain"
                />
              </div>

              <div className="w-full flex flex-col items-start gap-2 sm:gap-2.5 shrink-0">
                <div className="min-w-0 w-full">
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-foreground leading-snug">
                    {t(card.titleKey)}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">
                    {t(card.descKey)}
                  </p>
                </div>
                <span
                  className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[hsl(var(--red-accent))] text-[hsl(var(--red-accent-foreground))] shadow-sm transition group-hover:brightness-110 group-hover:translate-x-0.5"
                  aria-hidden
                >
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
