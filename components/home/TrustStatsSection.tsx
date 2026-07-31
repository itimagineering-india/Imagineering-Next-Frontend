"use client";

import Image from "next/image";
import { Users, ClipboardCheck, MapPin, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const STATS = [
  {
    icon: Users,
    valueKey: "trustStats.providers.value",
    labelKey: "trustStats.providers.label",
  },
  {
    icon: ClipboardCheck,
    valueKey: "trustStats.projects.value",
    labelKey: "trustStats.projects.label",
  },
  {
    icon: MapPin,
    valueKey: "trustStats.cities.value",
    labelKey: "trustStats.cities.label",
  },
  {
    icon: Star,
    valueKey: "trustStats.rating.value",
    labelKey: "trustStats.rating.label",
  },
] as const;

const AVATARS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
] as const;

export function TrustStatsSection() {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const { t } = useTranslation("home");

  return (
    <section className="relative pb-8 md:pb-10">
      <div className="home-shell">
        <div
          ref={ref}
          className={`overflow-hidden rounded-2xl border border-slate-200/70 bg-[linear-gradient(90deg,#f8f9fb_0%,#ffffff_45%,#fff1e8_100%)] px-5 py-4 sm:px-6 sm:py-5 md:px-8 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 sm:gap-x-6 md:flex md:flex-1 md:items-center md:justify-between md:gap-4 min-w-0">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.valueKey}
                    className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${
                      i > 0 ? "md:pl-4 md:border-l md:border-slate-200/80" : ""
                    }`}
                  >
                    <Icon
                      className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 text-slate-800"
                      strokeWidth={1.6}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-none tracking-tight tabular-nums">
                        {t(stat.valueKey)}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-500 leading-tight whitespace-nowrap">
                        {t(stat.labelKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center justify-center text-center gap-2 md:shrink-0 md:pl-2 md:min-w-[190px] lg:min-w-[210px]">
              <p className="text-[11px] sm:text-xs text-slate-600 leading-snug max-w-[200px]">
                {t("trustStats.trustedBy")}
              </p>
              <div className="flex items-center justify-center -space-x-2.5">
                {AVATARS.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-white ring-1 ring-slate-100 bg-slate-100"
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
