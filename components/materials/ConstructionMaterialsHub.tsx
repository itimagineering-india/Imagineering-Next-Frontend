"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { MaterialsProductRail } from "@/components/materials/MaterialsProductRail";
import { MaterialsHowToBook } from "@/components/materials/MaterialsHowToBook";
import { MaterialsHero } from "@/components/materials/MaterialsHero";
import { MaterialsProductCard } from "@/components/materials/MaterialsProductCard";
import { GetBestQuotesModal } from "@/components/service-details/GetBestQuotesModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  MATERIALS_TRENDING_BRANDS,
  filterMaterialsProducts,
  getMaterialsCategoryProductSections,
  type MaterialsProduct,
} from "@/lib/materials/constructionMaterialsCatalog";
import {
  fetchMaterialsHubData,
  findServiceIdForCatalogProduct,
  type MaterialsHubData,
} from "@/lib/materials/materialsHubApi";
import { getMaterialsCategoryArt } from "@/lib/materials/materialsCategoryArt";
import { getMaterialsBrandArt } from "@/lib/materials/materialsBrandArt";

const EMPTY_HUB: MaterialsHubData = {
  categories: [],
  products: [],
  providers: [],
  brands: [],
  marketPrices: [],
};

export function ConstructionMaterialsHub() {
  const { t } = useTranslation("materials");
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MaterialsHubData>(EMPTY_HUB);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState<string | null>(null);
  const [ctaLoadingId, setCtaLoadingId] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteService, setQuoteService] = useState<{
    id: string;
    title: string;
    priceType?: string;
  } | null>(null);
  const categoryScrollerRef = useRef<HTMLDivElement>(null);

  const scrollCategories = useCallback((direction: "left" | "right") => {
    const el = categoryScrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-material-category-card]");
    const step = (card?.offsetWidth ?? 160) + 12;
    el.scrollBy({ left: direction === "left" ? -step * 3 : step * 3, behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const hub = await fetchMaterialsHubData();
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

  const sections = useMemo(
    () => getMaterialsCategoryProductSections(data.categories, data.products),
    [data.categories, data.products]
  );

  const recommended = useMemo(() => {
    return data.products.filter((p) => p.available).slice(0, 16);
  }, [data.products]);

  const submitSearch = useCallback(
    (opts?: { q?: string }) => {
      const q = (opts?.q ?? search).trim();

      if (!q) {
        setAppliedSearch(null);
        document.getElementById("materials-browse")?.scrollIntoView({ behavior: "smooth" });
        return;
      }

      setAppliedSearch(q);
      window.requestAnimationFrame(() => {
        document.getElementById("materials-search-results")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    },
    [search]
  );

  const searchProducts = useMemo(() => {
    if (!appliedSearch) return [];
    return filterMaterialsProducts(data.products, { query: appliedSearch });
  }, [appliedSearch, data.products]);

  const searchProviders = useMemo(() => {
    if (!appliedSearch) return [];
    const q = appliedSearch.toLowerCase();
    return data.providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
    );
  }, [appliedSearch, data.providers]);

  const isSearching = Boolean(appliedSearch);

  const handleProductCta = useCallback(
    async (product: MaterialsProduct) => {
      if (product.hasVariants) return;
      setCtaLoadingId(product.id);
      try {
        const linked = await findServiceIdForCatalogProduct(product.id, {
          excludeProviderUserId: (user as { _id?: string; id?: string } | null)?._id || (user as { id?: string } | null)?.id || null,
        });
        if (!linked?.serviceId) {
          toast({
            title: t("noListingTitle"),
            description: t("noListingBody"),
            variant: "destructive",
          });
          return;
        }
        if (product.isPriceRange) {
          if (!isAuthenticated) {
            router.push(
              `/login?redirect=${encodeURIComponent(`/construction-materials/product/${product.id}`)}`
            );
            return;
          }
          setQuoteService({
            id: linked.serviceId,
            title: linked.title || product.name,
            priceType: product.unitType,
          });
          setQuoteOpen(true);
          return;
        }
        if (!isAuthenticated) {
          router.push(`/login?redirect=${encodeURIComponent("/cart")}`);
          return;
        }
        await addToCart(linked.serviceId, 1);
        toast({ title: t("addedToCart"), description: product.name });
      } catch (err) {
        toast({
          title: t("ctaErrorTitle"),
          description: err instanceof Error ? err.message : t("ctaErrorBody"),
          variant: "destructive",
        });
      } finally {
        setCtaLoadingId(null);
      }
    },
    [addToCart, isAuthenticated, router, t, toast, user]
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8f5_0%,#ffffff_28%,#f8fafc_100%)]">
      <MaterialsHero
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={submitSearch}
      />

      <div className="home-shell space-y-12 py-8 md:space-y-16 md:py-12">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </div>
        ) : (
          <>
            {isSearching ? (
              <section id="materials-search-results" className="scroll-mt-24">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 md:text-2xl">
                      {t("hubSearchResults")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {searchProducts.length + searchProviders.length > 0
                        ? t("hubSearchResultsSub", {
                            count: searchProducts.length,
                          })
                        : t("emptyProducts")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 rounded-full"
                    onClick={() => setAppliedSearch(null)}
                  >
                    {t("hubClearSearch")}
                  </Button>
                </div>

                {searchProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {searchProducts.map((product) => (
                      <MaterialsProductCard
                        key={product.id}
                        product={product}
                        onCta={handleProductCta}
                        ctaLoading={ctaLoadingId === product.id}
                      />
                    ))}
                  </div>
                ) : searchProviders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">
                    {t("emptyProducts")}
                  </div>
                ) : null}

                {searchProviders.length > 0 ? (
                  <div className="mt-8">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">{t("topProviders")}</h3>
                    <ul className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-1">
                      {searchProviders.map((provider) => (
                        <li key={provider.id} className="w-[138px] shrink-0 sm:w-[148px]">
                          <Link
                            href={`/provider/${provider.id}`}
                            className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-3 pb-3.5 pt-4 text-center shadow-[0_6px_18px_-12px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_14px_28px_-16px_rgba(234,88,12,0.35)]"
                          >
                            <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100">
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              {provider.rating.toFixed(1)}
                            </span>
                            <span
                              className="relative z-[1] flex h-14 w-14 items-center justify-center rounded-full text-sm font-extrabold text-slate-800 shadow-sm ring-2 ring-white"
                              style={{ backgroundColor: provider.tint }}
                            >
                              {provider.mark}
                              {provider.verified ? (
                                <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] rounded-full bg-white text-emerald-500" />
                              ) : null}
                            </span>
                            <p className="relative z-[1] mt-3 w-full truncate text-[13px] font-bold text-slate-900 group-hover:text-[hsl(var(--red-accent))]">
                              {provider.name}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            ) : null}

            {!isSearching ? (
            <>
            {/* Category shop — circular tiles like major marketplaces */}
            <section id="materials-browse">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{t("browseByMaterial")}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t("browseByMaterialSub")}</p>
                </div>
                {data.categories.length > 0 ? (
                  <div className="hidden gap-2 shrink-0 sm:flex">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full"
                      onClick={() => scrollCategories("left")}
                      aria-label="Scroll categories left"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full"
                      onClick={() => scrollCategories("right")}
                      aria-label="Scroll categories right"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div
                ref={categoryScrollerRef}
                className="flex gap-5 overflow-x-auto scrollbar-hide touch-pan-x pb-2 sm:gap-6"
              >
                {data.categories.map((cat) => {
                  const img = getMaterialsCategoryArt(cat.id);
                  return (
                    <Link
                      key={cat.id}
                      data-material-category-card
                      href={`/construction-materials/${encodeURIComponent(cat.id)}`}
                      className="group flex w-[88px] shrink-0 flex-col items-center gap-2.5 sm:w-[100px]"
                    >
                      <span
                        className="relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:border-slate-300 group-hover:shadow-md sm:h-[100px] sm:w-[100px]"
                        style={{ backgroundColor: cat.tint }}
                      >
                        <Image
                          src={img}
                          alt={cat.name}
                          fill
                          sizes="100px"
                          className="object-contain p-3 transition group-hover:scale-105"
                        />
                      </span>
                      <p className="w-full truncate text-center text-xs font-semibold text-slate-800 group-hover:text-[hsl(var(--red-accent))] sm:text-[13px]">
                        {cat.name}
                      </p>
                    </Link>
                  );
                })}
              </div>
              {data.categories.length === 0 ? (
                <p className="text-sm text-slate-500">{t("emptyCategories")}</p>
              ) : null}
            </section>

            <MaterialsHowToBook />

            {recommended.length > 0 ? (
              <MaterialsProductRail
                title={t("recommended")}
                subtitle={t("recommendedSub")}
                products={recommended}
                onCta={handleProductCta}
                ctaLoadingId={ctaLoadingId}
              />
            ) : null}

            {/* Supplier directory — light list, not another dark panel */}
            {data.providers.length > 0 ? (
              <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 md:text-2xl">{t("topProviders")}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t("topProvidersSub")}</p>
                  </div>
                  <Link
                    href="/services?category=construction-materials&view=providers"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--red-accent))] hover:underline"
                  >
                    {t("topProvidersViewAll")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <ul className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x pb-1">
                  {data.providers.slice(0, 12).map((provider) => (
                    <li key={provider.id} className="w-[138px] shrink-0 sm:w-[148px]">
                      <Link
                        href={`/provider/${provider.id}`}
                        className="group relative flex h-full flex-col items-center overflow-hidden rounded-2xl border border-slate-200/90 bg-white px-3 pb-3.5 pt-4 text-center shadow-[0_6px_18px_-12px_rgba(15,23,42,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_14px_28px_-16px_rgba(234,88,12,0.35)]"
                      >
                        <span className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-50 to-transparent" />
                        <span className="absolute right-2 top-2 z-10 inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100">
                          <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                          {provider.rating.toFixed(1)}
                        </span>
                        <span
                          className="relative z-[1] flex h-14 w-14 items-center justify-center rounded-full text-sm font-extrabold text-slate-800 shadow-sm ring-2 ring-white"
                          style={{ backgroundColor: provider.tint }}
                        >
                          {provider.mark}
                          {provider.verified ? (
                            <BadgeCheck className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] rounded-full bg-white text-emerald-500" />
                          ) : null}
                        </span>
                        <p className="relative z-[1] mt-3 w-full truncate text-[13px] font-bold text-slate-900 group-hover:text-[hsl(var(--red-accent))]">
                          {provider.name}
                        </p>
                        <span className="relative z-[1] mt-1.5 inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-100">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {provider.distanceKm > 0
                            ? `${provider.distanceKm.toFixed(1)} km`
                            : t("topProvidersNearby")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {sections.map((section) => (
              <MaterialsProductRail
                key={section.category.id}
                title={section.category.name}
                subtitle={t("categoryRailSub")}
                products={section.products.slice(0, 12)}
                onCta={handleProductCta}
                ctaLoadingId={ctaLoadingId}
                headerRight={
                  <Link
                    href={`/construction-materials/${encodeURIComponent(section.category.id)}`}
                    className="mr-1 inline-flex items-center gap-1 text-sm font-semibold text-[hsl(var(--red-accent))]"
                  >
                    {t("viewMore")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                }
              />
            ))}

            {/* Utility calculator band */}
            <section className="relative overflow-hidden bg-slate-900 px-5 py-8 text-white sm:px-8 md:py-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.12]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(255,255,255,0.35) 12px, rgba(255,255,255,0.35) 13px)",
                }}
              />
              <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="max-w-lg">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
                    {t("estimateEyebrow")}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                    {t("estimateTitle")}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{t("estimateBody")}</p>
                </div>
                <Link
                  href="/construction-calculator"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 bg-white px-6 text-sm font-bold text-slate-900 transition hover:bg-orange-50"
                >
                  <Calculator className="h-4 w-4" />
                  {t("openCalculator")}
                </Link>
              </div>
            </section>

            {/* Enterprise logo wall */}
            <section className="border-t border-slate-200 pt-10">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t("brandsEyebrow")}
              </p>
              <h2 className="mt-2 text-center text-lg font-bold text-slate-900 md:text-xl">
                {t("brands")}
              </h2>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-6 sm:gap-x-12">
                {MATERIALS_TRENDING_BRANDS.map((brand) => {
                  const logo = getMaterialsBrandArt(brand.id);
                  return (
                    <div
                      key={brand.id}
                      className="group flex flex-col items-center gap-2"
                      title={brand.name}
                    >
                      <span className="relative h-12 w-24 grayscale transition group-hover:grayscale-0 sm:h-14 sm:w-28">
                        {logo ? (
                          <Image
                            src={logo}
                            alt={brand.name}
                            fill
                            className="object-contain opacity-70 transition group-hover:opacity-100"
                            sizes="112px"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs font-bold text-slate-500">
                            {brand.mark}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-600">
                        {brand.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="sticky bottom-4 z-20">
              <div className="flex flex-col gap-3 border border-slate-800 bg-slate-950 p-4 text-white shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <p className="font-bold">{t("bulkBannerTitle")}</p>
                    <p className="mt-0.5 text-sm text-slate-400">{t("bulkBannerBody")}</p>
                  </div>
                </div>
                <Link
                  href="/requirement/submit"
                  className="inline-flex h-11 shrink-0 items-center justify-center bg-[hsl(var(--red-accent))] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  {t("bulkBannerCta")}
                </Link>
              </div>
            </section>
            </>
            ) : null}
          </>
        )}
      </div>

      {quoteService ? (
        <GetBestQuotesModal
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          serviceId={quoteService.id}
          serviceTitle={quoteService.title}
          priceType={quoteService.priceType}
          noCountdown
        />
      ) : null}
    </div>
  );
}
