"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Users, MapPin, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { GlobeAnalytics, type AnalyticsMarker } from "@/components/ui/cobe-globe-analytics";
import type { ProviderGlobeMarker } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATS = [
  {
    icon: Users,
    valueKey: "trustStats.providers.value",
    labelKey: "trustStats.providers.label",
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

const FALLBACK_MARKERS: AnalyticsMarker[] = [
  { id: "del", location: [28.6139, 77.209], visitors: 0, trend: 0, label: "Delhi" },
  { id: "mum", location: [19.076, 72.8777], visitors: 0, trend: 0, label: "Mumbai" },
  { id: "blr", location: [12.9716, 77.5946], visitors: 0, trend: 0, label: "Bengaluru" },
  { id: "hyd", location: [17.385, 78.4867], visitors: 0, trend: 0, label: "Hyderabad" },
  { id: "chn", location: [13.0827, 80.2707], visitors: 0, trend: 0, label: "Chennai" },
  { id: "kol", location: [22.5726, 88.3639], visitors: 0, trend: 0, label: "Kolkata" },
];

function toGlobeMarkers(rows: ProviderGlobeMarker[]): AnalyticsMarker[] {
  return rows.map((row) => ({
    id: row.id,
    location: [row.lat, row.lng],
    visitors: row.count,
    trend: 0,
    label: row.city || undefined,
    size: row.size ?? Math.min(0.11, 0.028 + Math.sqrt(Math.max(1, row.count)) * 0.012),
  }));
}

type ParsedStat = {
  end: number;
  decimals: number;
  suffix: string;
  padLength: number;
  useGrouping: boolean;
};

function parseStatValue(raw: string): ParsedStat | null {
  const match = raw.trim().match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return null;
  const [, numeric, suffix] = match;
  const decimals = numeric.includes(".") ? (numeric.split(".")[1]?.length ?? 0) : 0;
  const useGrouping = numeric.includes(",");
  const digitsOnly = numeric.replace(/,/g, "");
  const padLength =
    !numeric.includes(".") && numeric.replace(/,/g, "").startsWith("0")
      ? numeric.replace(/,/g, "").length
      : 0;
  const end = Number(digitsOnly);
  if (!Number.isFinite(end)) return null;
  return { end, decimals, suffix, padLength, useGrouping };
}

function formatStat(value: number, parsed: ParsedStat): string {
  if (parsed.decimals > 0) {
    return `${value.toFixed(parsed.decimals)}${parsed.suffix}`;
  }
  const rounded = Math.round(value);
  if (parsed.padLength > 0) {
    return `${String(rounded).padStart(parsed.padLength, "0")}${parsed.suffix}`;
  }
  if (parsed.useGrouping) {
    return `${rounded.toLocaleString("en-US")}${parsed.suffix}`;
  }
  return `${rounded}${parsed.suffix}`;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useFormattedCountUp(raw: string, active: boolean, delayMs: number) {
  const parsed = useMemo(() => parseStatValue(raw), [raw]);
  const [display, setDisplay] = useState(raw);

  useEffect(() => {
    if (!parsed) {
      setDisplay(raw);
      return;
    }

    if (!active) {
      setDisplay(formatStat(0, parsed));
      return;
    }

    if (prefersReducedMotion()) {
      setDisplay(raw);
      return;
    }

    let start = 0;
    let raf = 0;
    const duration = 1600;
    const timeout = window.setTimeout(() => {
      const tick = (timestamp: number) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 4;
        setDisplay(formatStat(parsed.end * eased, parsed));
        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setDisplay(raw);
        }
      };
      raf = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [active, delayMs, parsed, raw]);

  return display;
}

function StatValue({
  raw,
  active,
  delayMs,
}: {
  raw: string;
  active: boolean;
  delayMs: number;
}) {
  const display = useFormattedCountUp(raw, active, delayMs);
  return (
    <span className="tabular-nums">
      {display}
    </span>
  );
}

export function TrustStatsSection({
  globeMarkers = [],
}: {
  globeMarkers?: ProviderGlobeMarker[];
}) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const { t } = useTranslation("home");
  const markers = globeMarkers.length > 0 ? toGlobeMarkers(globeMarkers) : FALLBACK_MARKERS;

  return (
    <section className="relative pb-8 md:pb-10">
      <div className="home-shell">
        <div
          ref={ref}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-slate-200/70 bg-[linear-gradient(90deg,#f8f9fb_0%,#ffffff_45%,#fff1e8_100%)] px-5 py-4 sm:px-6 sm:py-5 md:px-8 transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent transition-transform duration-1000 ease-out",
              isVisible ? "translate-x-[350%]" : "-translate-x-full"
            )}
            aria-hidden
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6 lg:gap-8">
            <div className="grid grid-cols-3 gap-x-4 gap-y-4 sm:gap-x-6 md:flex md:flex-1 md:items-center md:justify-between md:gap-4 min-w-0">
              {STATS.map((stat, i) => {
                const Icon = stat.icon;
                const isRating = stat.icon === Star;
                return (
                  <div
                    key={stat.valueKey}
                    className={cn(
                      "flex min-w-0 items-center gap-2.5 sm:gap-3 transition-all duration-500",
                      isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                      i > 0 ? "md:border-l md:border-slate-200/80 md:pl-4" : ""
                    )}
                    style={{ transitionDelay: `${120 + i * 110}ms` }}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 shrink-0 sm:h-7 sm:w-7 transition-all duration-500",
                        isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0",
                        isRating && isVisible
                          ? "fill-amber-400 text-amber-500"
                          : "text-slate-800"
                      )}
                      strokeWidth={1.6}
                      style={{ transitionDelay: `${180 + i * 110}ms` }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-base sm:text-lg md:text-xl font-bold text-slate-900 leading-none tracking-tight">
                        <StatValue
                          raw={t(stat.valueKey)}
                          active={isVisible}
                          delayMs={140 + i * 120}
                        />
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-500 leading-tight whitespace-nowrap">
                        {t(stat.labelKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 md:shrink-0 md:pl-2 transition-all duration-700",
                isVisible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              )}
              style={{ transitionDelay: "520ms" }}
            >
              <div className="h-[200px] w-[200px] shrink-0 sm:h-[240px] sm:w-[240px] md:h-[280px] md:w-[280px]">
                {isVisible ? (
                  <GlobeAnalytics
                    className="w-full"
                    markers={markers}
                    speed={0.002}
                    showLabels={false}
                    liveUpdates={false}
                    phiStart={2.72}
                  />
                ) : null}
              </div>
              <div className="flex flex-col items-center justify-center text-center gap-2 min-w-[160px] lg:min-w-[190px]">
                <p className="text-[11px] sm:text-xs text-slate-600 leading-snug max-w-[200px]">
                  {t("trustStats.trustedBy")}
                </p>
                <div className="flex items-center justify-center -space-x-2.5">
                  {AVATARS.map((src, i) => (
                    <div
                      key={i}
                      className={cn(
                        "relative h-8 w-8 overflow-hidden rounded-full border-2 border-white bg-slate-100 ring-1 ring-slate-100 transition-all duration-500",
                        isVisible ? "translate-x-0 scale-100 opacity-100" : "translate-x-2 scale-75 opacity-0"
                      )}
                      style={{ transitionDelay: `${600 + i * 80}ms` }}
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
      </div>
    </section>
  );
}
