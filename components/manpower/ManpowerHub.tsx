"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Search, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ManpowerHireModeTabs, MANPOWER_CANVAS, MANPOWER_TEAL } from "@/components/manpower/ManpowerHireModeTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  MANPOWER_SEARCH_PLACEHOLDERS,
  buildSpecificWorkTrades,
  type ManpowerHireMode,
  type ManpowerSpecificWorkItem,
  type ManpowerTrade,
} from "@/lib/manpower/manpowerHubCatalog";
import { fetchManpowerHubData, type ManpowerHubData } from "@/lib/manpower/manpowerHubApi";
import { getManpowerTradeArt } from "@/lib/manpower/manpowerTradeArt";
import manpowerHeroImg from "@/assets/services/manpowers.png";

const EMPTY: ManpowerHubData = {
  trades: [],
  services: [],
  providers: [],
  specificWorks: [],
};

function TradeCard({
  trade,
  priceLabel,
  href,
}: {
  trade: ManpowerTrade;
  priceLabel?: string;
  href: string;
}) {
  const art = getManpowerTradeArt(trade.id) || getManpowerTradeArt(trade.name);
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-teal-900/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-700/25 hover:shadow-md"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-50">
        {art ? (
          <Image
            src={art}
            alt={trade.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
            sizes="200px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-teal-900/40">
            {trade.mark}
          </div>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-bold text-slate-900">{trade.name}</p>
        {trade.subtitle ? (
          <p className="text-[11px] font-medium text-slate-500">{trade.subtitle}</p>
        ) : null}
        {priceLabel ? (
          <p className="text-xs font-semibold text-teal-800">{priceLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

/** Circular trade tiles — same pattern as Construction Materials “Browse by material”. */
function SpecificTradeChip({
  trade,
  metaLabel,
  href,
}: {
  trade: ManpowerTrade;
  metaLabel?: string;
  href: string;
}) {
  const art = getManpowerTradeArt(trade.id) || getManpowerTradeArt(trade.name);
  return (
    <Link
      href={href}
      data-manpower-trade-chip
      className="group flex w-[88px] shrink-0 flex-col items-center gap-2.5 sm:w-[100px]"
    >
      <span
        className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-teal-900/10 bg-white shadow-sm transition group-hover:border-teal-700/30 group-hover:shadow-md sm:h-[100px] sm:w-[100px]"
        style={{ backgroundColor: trade.tint || "#ECFDF5" }}
      >
        {art ? (
          <Image
            src={art}
            alt={trade.name}
            fill
            sizes="100px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="text-lg font-bold text-teal-900/45 sm:text-xl">{trade.mark}</span>
        )}
      </span>
      <div className="w-full text-center">
        <p className="truncate text-xs font-semibold text-slate-800 transition group-hover:text-teal-800 sm:text-[13px]">
          {trade.name}
        </p>
        {metaLabel ? (
          <p className="mt-0.5 truncate text-[10px] font-medium text-teal-700/80 sm:text-[11px]">
            {metaLabel}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function TaskCard({ item }: { item: ManpowerSpecificWorkItem }) {
  const href = item.catalogProductId
    ? `/manpower/product/${item.catalogProductId}?hireMode=specific_work&tradeName=${encodeURIComponent(item.name)}`
    : `/manpower/${encodeURIComponent(item.tradeId || "general")}`;
  return (
    <Link
      href={href}
      className="flex w-[148px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-slate-100">
        {item.imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUri}
            alt={item.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">
            Task
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-slate-900">
          {item.name}
        </p>
        {item.priceLabel ? (
          <p className="mt-auto text-[11px] font-semibold text-teal-800">{item.priceLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function ManpowerHub() {
  const { t } = useTranslation("manpower");
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ManpowerHubData>(EMPTY);
  const [hireMode, setHireMode] = useState<ManpowerHireMode>("custom_duration");
  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const tradeScrollerRef = useRef<HTMLDivElement>(null);

  const scrollTrades = useCallback((direction: "left" | "right") => {
    const el = tradeScrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-manpower-trade-chip]");
    const step = card ? card.offsetWidth + 20 : 120;
    el.scrollBy({ left: direction === "left" ? -step * 3 : step * 3, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const hub = await fetchManpowerHubData();
        if (!cancelled) setData(hub);
      } catch {
        if (!cancelled) {
          toast({
            title: t("loadErrorTitle"),
            description: t("loadErrorBody"),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t, toast]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % MANPOWER_SEARCH_PLACEHOLDERS.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  const specificWorkTrades = useMemo(
    () => buildSpecificWorkTrades(data.specificWorks, data.trades),
    [data.specificWorks, data.trades]
  );

  const filteredTrades = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = hireMode === "specific_work" ? specificWorkTrades : data.trades;
    if (!q) return list;
    return list.filter(
      (tr) =>
        tr.name.toLowerCase().includes(q) ||
        (tr.subtitle || "").toLowerCase().includes(q)
    );
  }, [data.trades, hireMode, search, specificWorkTrades]);

  const groupedTasks = useMemo(() => {
    if (hireMode !== "specific_work") return [] as { trade: ManpowerTrade; items: ManpowerSpecificWorkItem[] }[];
    return specificWorkTrades
      .map((trade) => ({
        trade,
        items: data.specificWorks.filter((w) => {
          const key =
            w.tradeId === trade.id ||
            (w.tradeLabel || "").toLowerCase() === trade.name.toLowerCase();
          return key;
        }).slice(0, 8),
      }))
      .filter((g) => g.items.length > 0);
  }, [data.specificWorks, hireMode, specificWorkTrades]);

  const submitSearch = useCallback(() => {
    const q = search.trim();
    const sp = new URLSearchParams();
    sp.set("category", "manpower");
    if (q) sp.set("q", q);
    router.push(`/services?${sp.toString()}`);
  }, [router, search]);

  const tradeHref = useCallback(
    (trade: ManpowerTrade) => {
      if (hireMode === "specific_work") {
        return `/manpower/${encodeURIComponent(trade.id)}`;
      }
      const productSegment = trade.catalogProductId || trade.id;
      return `/manpower/product/${encodeURIComponent(productSegment)}?hireMode=${hireMode}&tradeId=${encodeURIComponent(trade.id)}&tradeName=${encodeURIComponent(trade.name)}`;
    },
    [hireMode]
  );

  const priceFor = useCallback(
    (trade: ManpowerTrade) => {
      if (hireMode === "one_day") return trade.priceDailyLabel;
      if (hireMode === "custom_duration") return trade.priceHourlyLabel;
      return trade.subtitle;
    },
    [hireMode]
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: MANPOWER_CANVAS }}>
      <section
        className="relative overflow-hidden border-b border-teal-900/10"
        style={{
          background: `linear-gradient(160deg, ${MANPOWER_TEAL} 0%, #0d9488 55%, #115e59 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-emerald-300/15 blur-[90px]" />
          <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-teal-200/10 blur-[80px]" />
        </div>

        <div className="layout-shell relative z-10 pt-6 sm:pt-7">
          <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-8">
            <div className="min-w-0 pb-6 sm:pb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/90">
                Imagineering India
              </p>
              <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t("heroHeadline")}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-teal-50/90 sm:text-base">
                {t("heroSubtitle")}
              </p>
              <form
                className="mt-4 flex max-w-xl flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch();
                }}
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={MANPOWER_SEARCH_PLACEHOLDERS[placeholderIndex]}
                    aria-label={t("heroSearchAria")}
                    className="h-11 rounded-xl border-0 bg-white pl-10 text-slate-900 shadow-md"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-white px-5 font-semibold text-teal-900 hover:bg-teal-50"
                >
                  {t("heroSearchCta")}
                </Button>
              </form>
            </div>

            <div className="relative mx-auto hidden w-full max-w-[260px] justify-self-end lg:block xl:max-w-[290px]">
              <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                <Image
                  src={manpowerHeroImg}
                  alt="Verified labour and site workers"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="290px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="layout-shell space-y-10 py-8 pb-16">
        <ManpowerHireModeTabs selected={hireMode} onSelect={setHireMode} />

        <div>
          <div className="mb-1 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                className={
                  hireMode === "specific_work"
                    ? "text-xl font-bold text-slate-900 md:text-2xl"
                    : "text-lg font-bold text-slate-900 sm:text-xl"
                }
              >
                {hireMode === "one_day"
                  ? t("hireDailyTitle")
                  : hireMode === "specific_work"
                    ? t("hireSpecificTitle")
                    : t("hireHourlyTitle")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {hireMode === "one_day"
                  ? t("hireDailyHint")
                  : hireMode === "specific_work"
                    ? t("hireSpecificHint")
                    : t("hireHourlyHint")}
              </p>
            </div>
            {hireMode === "specific_work" && !loading && filteredTrades.length > 0 ? (
              <div className="hidden shrink-0 gap-2 sm:flex">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-teal-50"
                  onClick={() => scrollTrades("left")}
                  aria-label="Scroll trades left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-teal-50"
                  onClick={() => scrollTrades("right")}
                  aria-label="Scroll trades right"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("loading")}
            </div>
          ) : filteredTrades.length === 0 ? (
            <p className="py-10 text-sm text-slate-500">{t("emptyTrades")}</p>
          ) : hireMode === "specific_work" ? (
            <div
              ref={tradeScrollerRef}
              className="mt-5 flex gap-5 overflow-x-auto scrollbar-hide touch-pan-x pb-2 sm:gap-6"
            >
              {filteredTrades.map((trade) => (
                <SpecificTradeChip
                  key={trade.id}
                  trade={trade}
                  metaLabel={priceFor(trade)}
                  href={tradeHref(trade)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredTrades.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  priceLabel={priceFor(trade)}
                  href={tradeHref(trade)}
                />
              ))}
            </div>
          )}
        </div>

        {hireMode === "specific_work" && !loading && groupedTasks.length > 0 ? (
          <section className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900">{t("specificWorks")}</h2>
            {groupedTasks.map(({ trade, items }) => (
              <div key={trade.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800">{trade.name}</h3>
                  <Link
                    href={`/manpower/${encodeURIComponent(trade.id)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 hover:underline"
                  >
                    {t("seeAllTasks")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-2">
                  {items.map((item, index) => (
                    <TaskCard
                      key={item.catalogProductId || `${item.id}-${index}`}
                      item={item}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <section>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("topProviders")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("topProvidersSub")}</p>
            </div>
            <Link
              href="/services?category=manpower&view=providers"
              className="text-sm font-semibold text-teal-800 hover:underline"
            >
              {t("viewAllProviders")}
            </Link>
          </div>
          {loading ? null : data.providers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">{t("providersEmpty")}</p>
          ) : (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {data.providers.slice(0, 12).map((p) => (
                <Link
                  key={p.id}
                  href={`/provider/${p.id}`}
                  className="min-w-[200px] max-w-[220px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-700/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-teal-900"
                      style={{ backgroundColor: p.tint }}
                    >
                      {p.mark}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">{p.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{p.rating.toFixed(1)}</span>
                    <span className="text-slate-400">· {p.city}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section
          className="flex flex-col items-start justify-between gap-4 rounded-2xl px-5 py-6 sm:flex-row sm:items-center sm:px-8"
          style={{ backgroundColor: MANPOWER_TEAL }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">{t("crewCtaTitle")}</h2>
            <p className="mt-1 max-w-xl text-sm text-teal-50/90">{t("crewCtaBody")}</p>
          </div>
          <Button asChild className="h-11 shrink-0 rounded-xl bg-white font-semibold text-teal-900 hover:bg-teal-50">
            <Link href="/requirement/submit">{t("crewCtaAction")}</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
