"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUserLocation } from "@/contexts/UserLocationContext";
import {
  RENTAL_SEARCH_PLACEHOLDERS,
  groupRentalMachinesByCategory,
  rentalMachineHref,
  type RentalMachine,
  type RentalMachineCategory,
} from "@/lib/machineRental/machineRentalHubCatalog";
import { fetchRentalHubData, type RentalHubData } from "@/lib/machineRental/machineRentalHubApi";
import { getMachineRentalCategoryArt } from "@/lib/machineRental/machineRentalCategoryArt";
import machineRentalHeroImg from "@/assets/services/machine-rental.png";

export const RENTAL_AMBER = "#C2410C";
const RENTAL_CANVAS = "#FFF7ED";

const EMPTY: RentalHubData = { categories: [], machines: [], providers: [] };

function CategoryCard({ category }: { category: RentalMachineCategory }) {
  const art = getMachineRentalCategoryArt(category.id) || getMachineRentalCategoryArt(category.name);
  return (
    <Link
      href={`/machine-rental/${encodeURIComponent(category.id)}`}
      data-rental-category-card
      className="group flex w-[132px] shrink-0 flex-col items-center gap-2 rounded-2xl border border-orange-200/80 bg-white p-3 shadow-sm transition hover:border-orange-400/50 hover:shadow-md sm:w-[148px]"
    >
      <span
        className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-white shadow-sm transition group-hover:scale-105 sm:h-[72px] sm:w-[72px]"
      >
        <Image
          src={art}
          alt={category.name}
          fill
          sizes="72px"
          className="object-contain p-2"
        />
      </span>
      <p className="line-clamp-2 min-h-[2.5rem] text-center text-xs font-semibold leading-snug text-slate-800">
        {category.name}
      </p>
    </Link>
  );
}

function MachineCard({ machine }: { machine: RentalMachine }) {
  const href = rentalMachineHref(machine);
  return (
    <Link
      href={href}
      className="flex w-[148px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-700/30 hover:shadow-md"
    >
      <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-orange-50">
        {machine.imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={machine.imageUri}
            alt={machine.name}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-orange-700/70">
            {machine.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-snug text-slate-900">
          {machine.name}
        </p>
        {machine.priceLabel ? (
          <p className="mt-auto text-[11px] font-semibold text-orange-800">{machine.priceLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function MachineRentalHub() {
  const { t } = useTranslation("machineRental");
  const router = useRouter();
  const { toast } = useToast();
  const { userLocation, radiusKm } = useUserLocation();
  const pricingCity = userLocation?.city?.trim() || "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RentalHubData>(EMPTY);
  const [search, setSearch] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const categoryScrollerRef = useRef<HTMLDivElement>(null);

  const scrollCategories = useCallback((direction: "left" | "right") => {
    const el = categoryScrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-rental-category-card]");
    const step = card ? card.offsetWidth + 12 : 140;
    el.scrollBy({ left: direction === "left" ? -step * 3 : step * 3, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const hub = await fetchRentalHubData({
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radiusKm,
        });
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
  }, [radiusKm, t, toast, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % RENTAL_SEARCH_PLACEHOLDERS.length);
    }, 2600);
    return () => window.clearInterval(id);
  }, []);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.categories;
    return data.categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [data.categories, search]);

  const groupedMachines = useMemo(
    () => groupRentalMachinesByCategory(data.categories, data.machines),
    [data.categories, data.machines]
  );

  const featuredMachines = useMemo(
    () => data.machines.filter((m) => m.available !== false).slice(0, 16),
    [data.machines]
  );

  const submitSearch = useCallback(() => {
    const q = search.trim();
    const sp = new URLSearchParams();
    sp.set("category", "machine-rental");
    if (q) sp.set("q", q);
    router.push(`/services?${sp.toString()}`);
  }, [router, search]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: RENTAL_CANVAS }}>
      <section
        className="relative overflow-hidden border-b border-orange-900/10"
        style={{
          background: `linear-gradient(160deg, ${RENTAL_AMBER} 0%, #ea580c 55%, #9a3412 100%)`,
        }}
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-orange-300/15 blur-[90px]" />
          <div className="absolute bottom-0 right-10 h-56 w-56 rounded-full bg-amber-200/10 blur-[80px]" />
        </div>

        <div className="layout-shell relative z-10 pt-6 sm:pt-7">
          <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:gap-8">
            <div className="min-w-0 pb-6 sm:pb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-100/90">
                Imagineering India
              </p>
              <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t("heroHeadline")}
              </h1>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-orange-50/90 sm:text-base">
                {t("heroSubtitle")}
              </p>
              {pricingCity ? (
                <p className="mt-1.5 text-xs font-medium text-orange-100/90">
                  {t("pricesForCity", { city: pricingCity })}
                </p>
              ) : null}
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
                    placeholder={RENTAL_SEARCH_PLACEHOLDERS[placeholderIndex]}
                    aria-label={t("heroSearchAria")}
                    className="h-11 rounded-xl border-0 bg-white pl-10 text-slate-900 shadow-md"
                  />
                </div>
                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-white px-5 font-semibold text-orange-900 hover:bg-orange-50"
                >
                  {t("heroSearchCta")}
                </Button>
              </form>
            </div>

            <div className="relative mx-auto hidden w-full max-w-[260px] justify-self-end lg:block xl:max-w-[290px]">
              <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-orange-100/20">
                <Image
                  src={machineRentalHeroImg}
                  alt="Construction machines for rent"
                  fill
                  priority
                  className="object-contain object-center p-4"
                  sizes="290px"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="layout-shell space-y-10 py-8 pb-16">
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{t("browseByType")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("browseByTypeSub")}</p>
            </div>
            {!loading && filteredCategories.length > 0 ? (
              <div className="hidden shrink-0 gap-2 sm:flex">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-orange-50"
                  onClick={() => scrollCategories("left")}
                  aria-label="Scroll categories left"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-orange-50"
                  onClick={() => scrollCategories("right")}
                  aria-label="Scroll categories right"
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
          ) : filteredCategories.length === 0 ? (
            <p className="py-10 text-sm text-slate-500">{t("emptyCategories")}</p>
          ) : (
            <div
              ref={categoryScrollerRef}
              className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-2"
            >
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>

        {!loading && featuredMachines.length > 0 ? (
          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{t("featuredListings")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("featuredListingsSub")}</p>
              </div>
              <Link
                href="/services?category=machine-rental"
                className="inline-flex items-center gap-1 text-sm font-semibold text-orange-800 hover:underline"
              >
                {t("viewAllListings")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-2">
              {featuredMachines.map((machine) => (
                <MachineCard key={machine.serviceId || machine.id} machine={machine} />
              ))}
            </div>
          </section>
        ) : null}

        {!loading && groupedMachines.length > 0 ? (
          <section className="space-y-8">
            {groupedMachines.map(({ category, items }) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800">{category.name}</h3>
                  <Link
                    href={`/machine-rental/${encodeURIComponent(category.id)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-800 hover:underline"
                  >
                    {t("seeAll")}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-2">
                  {items.map((machine) => (
                    <MachineCard key={machine.serviceId || machine.id} machine={machine} />
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
              <p className="mt-1 text-sm text-slate-500">
                {pricingCity ? t("topProvidersSubCity", { city: pricingCity }) : t("topProvidersSub")}
              </p>
            </div>
            {!loading && data.providers.length > 0 ? (
              <Link
                href="/services?category=machine-rental&view=providers"
                className="text-sm font-semibold text-orange-800 hover:underline"
              >
                {t("viewAllProviders")}
              </Link>
            ) : null}
          </div>
          {loading ? null : data.providers.length > 0 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {data.providers.slice(0, 12).map((p) => (
                <Link
                  key={p.id}
                  href={`/provider/${p.id}`}
                  className="min-w-[200px] max-w-[220px] shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-orange-700/30 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-orange-900"
                      style={{ backgroundColor: p.tint }}
                    >
                      {p.mark}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="truncate text-xs text-slate-500">{p.specialty}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{p.rating.toFixed(1)}</span>
                    <span className="text-slate-400">· {p.city}</span>
                    {p.verified ? (
                      <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" aria-label="Verified" />
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative mt-4 overflow-hidden rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50 via-white to-amber-50 px-5 py-8 sm:px-10 sm:py-10">
              <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-200/30 blur-2xl" />
              <div className="relative mx-auto flex max-w-lg flex-col items-center text-center">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ backgroundColor: RENTAL_AMBER }}
                >
                  <MapPin className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {pricingCity
                    ? t("comingSoonTitle", { city: pricingCity })
                    : t("comingSoonTitleGeneric")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {pricingCity ? t("comingSoonBody", { city: pricingCity }) : t("comingSoonBodyGeneric")}
                </p>
                <Button
                  asChild
                  className="mt-5 h-10 rounded-xl px-5 font-semibold text-white hover:opacity-95"
                  style={{ backgroundColor: RENTAL_AMBER }}
                >
                  <Link href="/requirement/submit">{t("comingSoonCta")}</Link>
                </Button>
              </div>
            </div>
          )}
        </section>

        <section
          className="flex flex-col items-start justify-between gap-4 rounded-2xl px-5 py-6 sm:flex-row sm:items-center sm:px-8"
          style={{ backgroundColor: RENTAL_AMBER }}
        >
          <div>
            <h2 className="text-lg font-bold text-white">{t("bulkCtaTitle")}</h2>
            <p className="mt-1 max-w-xl text-sm text-orange-50/90">{t("bulkCtaBody")}</p>
          </div>
          <Button asChild className="h-11 shrink-0 rounded-xl bg-white font-semibold text-orange-900 hover:bg-orange-50">
            <Link href="/requirement/submit">{t("bulkCtaAction")}</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
