"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MATERIALS_SEARCH_PLACEHOLDERS } from "@/lib/materials/constructionMaterialsCatalog";
import cementBag from "@/assets/services/constructionMaterial/cementBag.png";
import steel from "@/assets/services/constructionMaterial/steel.png";
import bricks from "@/assets/services/constructionMaterial/bricks.png";
import sand from "@/assets/services/constructionMaterial/sand.png";
import { cn } from "@/lib/utils";

const POPULAR_SEARCHES = [
  "UltraTech",
  "ACC",
  "TMT",
  "Bricks",
  "Sand",
  "Plywood",
  "Aggregate",
] as const;

type SearchSubmitOpts = {
  q?: string;
};

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (opts?: SearchSubmitOpts) => void;
};

export function MaterialsHero({ search, onSearchChange, onSearchSubmit }: Props) {
  const { t } = useTranslation("materials");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % MATERIALS_SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      onSearchSubmit({ q: search.trim() });
    },
    [onSearchSubmit, search]
  );

  const runPopular = useCallback(
    (term: string) => {
      onSearchChange(term);
      onSearchSubmit({ q: term });
    },
    [onSearchChange, onSearchSubmit]
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-slate-800/70 text-white",
        "bg-[linear-gradient(135deg,#0b1220_0%,#111827_48%,#1a1524_100%)]",
        "min-h-[480px] md:min-h-[500px] md:max-h-[600px]"
      )}
      aria-labelledby="materials-hero-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-orange-500/15 blur-[90px]" />
        <div className="absolute right-0 bottom-0 h-56 w-56 rounded-full bg-[hsl(var(--red-accent))]/15 blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative home-shell flex h-full min-h-[480px] items-center py-8 md:min-h-[500px] md:max-h-[600px] md:py-10">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-10">
          {/* Left */}
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-100/90">
                {t("eyebrow")}
              </span>
            </div>

            <h1
              id="materials-hero-heading"
              className="mt-4 max-w-xl text-[1.85rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-[2.35rem] md:text-[2.65rem]"
            >
              {t("heroHeadlineLine1")}{" "}
              <span className="whitespace-nowrap text-orange-300">{t("heroHeadlineLine2")}</span>
            </h1>

            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              {t("heroSubtitle")}
            </p>

            {/* Primary: Search */}
            <form
              onSubmit={handleSubmit}
              className="mt-6 rounded-2xl border border-white/10 bg-white p-1.5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.7)] transition hover:shadow-[0_24px_56px_-20px_rgba(234,88,12,0.35)] sm:p-2"
              role="search"
              aria-label={t("heroSearchAria")}
            >
              <div className="flex items-center gap-1.5">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden
                  />
                  <Input
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={MATERIALS_SEARCH_PLACEHOLDERS[placeholderIndex]}
                    className="h-11 border-0 bg-transparent pl-10 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 sm:h-12 sm:text-[15px]"
                    aria-label={t("heroSearchAria")}
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 shrink-0 rounded-xl bg-[hsl(var(--red-accent))] px-4 text-sm font-semibold text-white shadow-md shadow-red-900/25 transition hover:brightness-110 sm:h-12 sm:px-5"
                >
                  <Search className="mr-1.5 h-4 w-4 sm:mr-2" aria-hidden />
                  {t("heroSearchCta")}
                </Button>
              </div>
            </form>

            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400">
                {t("heroPopularSearches")}:
              </span>
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => runPopular(term)}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-slate-200 transition hover:border-orange-300/40 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Right — integrated visual (not floating cards) */}
          <div className="relative mx-auto hidden w-full max-w-md lg:mx-0 lg:block lg:max-w-none">
            <div className="relative aspect-[5/4] max-h-[420px] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[linear-gradient(160deg,#1e293b_0%,#0f172a_60%,#1c1418_100%)] shadow-2xl shadow-black/40">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(249,115,22,0.28),transparent_55%)]" />
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Composed material collage — single visual plane */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2.5 p-4">
                <div className="relative overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                  <Image
                    src={cementBag}
                    alt="Cement"
                    fill
                    className="object-contain p-4"
                    sizes="200px"
                    priority
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                  <Image
                    src={steel}
                    alt="Steel TMT"
                    fill
                    className="object-contain p-4"
                    sizes="200px"
                    priority
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                  <Image
                    src={bricks}
                    alt="Bricks"
                    fill
                    className="object-contain p-4"
                    sizes="200px"
                  />
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-white/95 shadow-lg">
                  <Image
                    src={sand}
                    alt="Sand"
                    fill
                    className="object-contain p-4"
                    sizes="200px"
                  />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-transparent px-4 pb-3.5 pt-12">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-200/90">
                  {t("heroVisualEyebrow")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-white">{t("heroVisualTitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
