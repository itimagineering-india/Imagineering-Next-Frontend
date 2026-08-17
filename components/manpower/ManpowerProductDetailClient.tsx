"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, ChevronRight, Clock3, Loader2, ShieldCheck, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ManpowerTermsSection } from "@/components/manpower/ManpowerTermsSection";
import { MANPOWER_TEAL } from "@/components/manpower/ManpowerHireModeTabs";
import {
  calculateManpowerHourlyTotal,
  formatManpowerCatalogPriceLabel,
  indicativeRatesForTrade,
  isManpowerVisitingCharge,
  manpowerMarkFromName,
  resolveManpowerTradeKey,
  type ManpowerHireMode,
} from "@/lib/manpower/manpowerHubCatalog";
import {
  fetchManpowerCatalogByHireMode,
  fetchManpowerCatalogProductById,
} from "@/lib/manpower/manpowerHubApi";
import { getManpowerTradeArt } from "@/lib/manpower/manpowerTradeArt";
import { resolveManpowerMediaUrl } from "@/lib/manpower/media";
import { useUserLocation } from "@/contexts/UserLocationContext";

type CatalogProduct = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  subcategory?: string;
  materialTypeKey?: string;
  images?: string[];
  suggestedPriceType?: string;
  suggestedPriceMin?: number;
  suggestedPriceMax?: number;
  suggestedPriceHourly?: number;
  suggestedPriceHourlyExtra?: number;
  suggestedPriceDaily?: number;
  metadata?: Record<string, string>;
  customFields?: Array<{ label?: string; value?: string }>;
};

type Props = {
  productId: string;
};

function parseHireMode(raw: string | null): ManpowerHireMode {
  if (raw === "one_day" || raw === "specific_work" || raw === "custom_duration") return raw;
  return "custom_duration";
}

function hireModeLabelKey(mode: ManpowerHireMode): string {
  if (mode === "one_day") return "hireDailyTitle";
  if (mode === "specific_work") return "hireSpecificTitle";
  return "hireHourlyTitle";
}

export function ManpowerProductDetailClient({ productId }: Props) {
  const { t } = useTranslation("manpower");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { userLocation } = useUserLocation();
  const pricingCity = userLocation?.city?.trim() || "";

  const sp = searchParams ?? new URLSearchParams();
  const hireMode = parseHireMode(sp.get("hireMode"));
  const tradeId = sp.get("tradeId") || "";
  const tradeName = sp.get("tradeName") || "";

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let found = await fetchManpowerCatalogProductById(productId, pricingCity || undefined);
        if (!found) {
          const hireQuery = hireMode === "specific_work" ? "specific_work" : "rate_card";
          const list = await fetchManpowerCatalogByHireMode(hireQuery, pricingCity || undefined);
          const tradeKey =
            resolveManpowerTradeKey(tradeId) || resolveManpowerTradeKey(tradeName);
          found =
            list.find((p) => {
              const id = String(p._id || p.id || "").trim();
              if (id === productId) return true;
              if (hireMode === "specific_work") {
                const taskId = String(p.metadata?.taskId || "").trim();
                return (
                  taskId === tradeId ||
                  id === tradeId ||
                  String(p.name || "").trim() === tradeName
                );
              }
              const sub = String(p.subcategory || "").trim();
              const key =
                resolveManpowerTradeKey(sub) ||
                resolveManpowerTradeKey(p.materialTypeKey || "");
              return key === tradeKey || sub.toLowerCase() === tradeName.toLowerCase();
            }) || null;
        }
        if (!cancelled) setProduct(found);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hireMode, pricingCity, productId, tradeId, tradeName]);

  const catalogId = String(product?._id || product?.id || "").trim();
  const title = String(product?.name || tradeName || "").trim() || t("title");
  const tradeKey =
    resolveManpowerTradeKey(tradeId) ||
    resolveManpowerTradeKey(product?.subcategory || "") ||
    resolveManpowerTradeKey(tradeName) ||
    tradeId;
  const art = getManpowerTradeArt(tradeKey) || getManpowerTradeArt(title);
  const imageUri = resolveManpowerMediaUrl(
    Array.isArray(product?.images) ? product?.images?.[0] : undefined
  );
  const visiting = product ? isManpowerVisitingCharge(product) : false;
  const rates = indicativeRatesForTrade(tradeKey);

  const priceHourly =
    product?.suggestedPriceHourly != null && product.suggestedPriceHourly > 0
      ? product.suggestedPriceHourly
      : rates.hourly;
  const priceHourlyExtra =
    product?.suggestedPriceHourlyExtra != null && product.suggestedPriceHourlyExtra > 0
      ? product.suggestedPriceHourlyExtra
      : undefined;
  const priceDaily =
    product?.suggestedPriceDaily != null && product.suggestedPriceDaily > 0
      ? product.suggestedPriceDaily
      : rates.daily;
  const specificPrice =
    product?.suggestedPriceMin != null && product.suggestedPriceMin > 0
      ? product.suggestedPriceMin
      : product?.suggestedPriceMax != null && product.suggestedPriceMax > 0
        ? product.suggestedPriceMax
        : undefined;

  const totalPrice = useMemo(() => {
    if (hireMode === "one_day") return priceDaily;
    if (hireMode === "specific_work") return specificPrice ?? 0;
    return calculateManpowerHourlyTotal(priceHourly, 1, priceHourlyExtra);
  }, [hireMode, priceDaily, priceHourly, priceHourlyExtra, specificPrice]);

  const priceSummary = useMemo(() => {
    if (hireMode === "one_day") {
      return formatManpowerCatalogPriceLabel(priceDaily, null, "day") || `₹${priceDaily}`;
    }
    if (hireMode === "specific_work") {
      if (visiting) {
        return (
          formatManpowerCatalogPriceLabel(specificPrice, null, "visiting") || t("getQuotes")
        );
      }
      return formatManpowerCatalogPriceLabel(specificPrice, null, "fixed") || t("getQuotes");
    }
    return formatManpowerCatalogPriceLabel(priceHourly, null, "hour", priceHourlyExtra);
  }, [hireMode, priceDaily, priceHourly, priceHourlyExtra, specificPrice, t, visiting]);

  const description = String(product?.description || "").trim();

  const details = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [
      { label: t("detailHireType"), value: t(hireModeLabelKey(hireMode)) },
      {
        label: t("detailTrade"),
        value: String(product?.subcategory || tradeName).trim() || "—",
      },
    ];
    if (hireMode === "custom_duration") {
      rows.push({
        label: t("detailFirstHour"),
        value: `₹${priceHourly.toLocaleString("en-IN")}`,
      });
      rows.push({
        label: t("detailExtraHour"),
        value: `₹${(priceHourlyExtra ?? priceHourly).toLocaleString("en-IN")}`,
      });
    } else if (hireMode === "one_day") {
      rows.push({
        label: t("detailDailyRate"),
        value: `₹${priceDaily.toLocaleString("en-IN")}`,
      });
    } else if (visiting) {
      rows.push({
        label: t("detailVisiting"),
        value:
          specificPrice != null
            ? `₹${specificPrice.toLocaleString("en-IN")}`
            : t("getQuotes"),
      });
      rows.push({
        label: t("detailFinalPrice"),
        value: t("detailAfterVisit"),
      });
    } else if (specificPrice != null) {
      rows.push({
        label: t("detailTaskPrice"),
        value: `₹${specificPrice.toLocaleString("en-IN")}`,
      });
    }
    const custom = Array.isArray(product?.customFields) ? product.customFields : [];
    custom.slice(0, 6).forEach((row) => {
      const label = String(row.label || "").trim();
      const value = String(row.value || "").trim();
      if (label && value) rows.push({ label, value });
    });
    return rows;
  }, [
    hireMode,
    priceDaily,
    priceHourly,
    priceHourlyExtra,
    product,
    specificPrice,
    t,
    tradeName,
    visiting,
  ]);

  const ctaPriceLabel = useMemo(() => {
    if (visiting && !specificPrice) return t("getQuotes");
    if (hireMode === "custom_duration") {
      return t("detailFromPrice", {
        price: `₹${totalPrice.toLocaleString("en-IN")}`,
      });
    }
    return `₹${totalPrice.toLocaleString("en-IN")}`;
  }, [hireMode, specificPrice, t, totalPrice, visiting]);

  const handleBook = useCallback(() => {
    if (!catalogId) {
      toast({
        title: t("bookNow"),
        description: t("noCatalogBody"),
        variant: "destructive",
      });
      return;
    }
    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `/manpower/checkout?catalogProductId=${catalogId}&hireMode=${hireMode}&tradeName=${encodeURIComponent(title)}`
        )}`
      );
      return;
    }
    const qs = new URLSearchParams();
    qs.set("catalogProductId", catalogId);
    qs.set("hireMode", hireMode);
    qs.set("tradeName", title);
    if (tradeKey) qs.set("tradeId", tradeKey);
    router.push(`/manpower/checkout?${qs.toString()}`);
  }, [catalogId, hireMode, isAuthenticated, router, t, title, toast, tradeKey]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 bg-slate-50 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!product && !tradeName) {
    return (
      <div className="layout-shell py-16 text-center">
        <p className="text-slate-600">{t("productNotFound")}</p>
        <Link href="/manpower" className="mt-4 inline-block font-semibold text-teal-800">
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  const showTotalLine =
    hireMode === "one_day" || (hireMode === "specific_work" && !visiting && totalPrice > 0);
  const tradeLabel = String(product?.subcategory || tradeName || tradeKey).trim();
  const remoteImage = Boolean(imageUri);
  const gallerySrc = imageUri || art;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#f8fafc_40%)] pb-20 xl:pb-0">
      <div className="layout-shell overflow-x-clip py-6 sm:py-8 md:py-10">
        <nav className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link href="/manpower" className="hover:text-foreground">
            {t("title")}
          </Link>
          {tradeLabel ? (
            <>
              <ChevronRight className="h-4 w-4 shrink-0" />
              <Link
                href={`/manpower/${encodeURIComponent(tradeKey || tradeLabel)}`}
                className="hover:text-foreground"
              >
                {tradeLabel}
              </Link>
            </>
          ) : null}
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="truncate font-medium text-foreground">{title}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-6">
            <div className="grid grid-cols-1 gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:grid-cols-[minmax(0,420px)_1fr]">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                {gallerySrc ? (
                  remoteImage && typeof gallerySrc === "string" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gallerySrc} alt={title} className="h-full w-full object-cover" />
                  ) : (
                    <Image src={gallerySrc} alt={title} fill className="object-cover" sizes="420px" />
                  )
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl font-bold text-slate-300">
                    {manpowerMarkFromName(title)}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col gap-4">
                <div>
                  <Badge
                    variant="outline"
                    className="rounded-full border-teal-200 bg-teal-50 text-teal-800"
                  >
                    {t(hireModeLabelKey(hireMode))}
                  </Badge>
                  <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-foreground xl:text-3xl">
                    {title}
                  </h1>
                  {pricingCity ? (
                    <p className="mt-1.5 text-xs font-medium text-teal-800">
                      {t("pricesForCity", { city: pricingCity })}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      0.0
                    </span>
                    <span>(0 reviews)</span>
                    {tradeLabel ? (
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                        {tradeLabel}
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-800/80">
                    Indicative price
                  </p>
                  <p className="mt-1 text-2xl font-bold text-teal-900">{priceSummary}</p>
                  {showTotalLine ? (
                    <p className="mt-1 text-sm font-medium text-teal-800/80">
                      {t("detailTotal", { total: `₹${totalPrice.toLocaleString("en-IN")}` })}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs leading-relaxed text-teal-900/70">
                    {t("detailNearbyNote")}
                  </p>
                </div>

                <div className="hidden gap-3 lg:flex">
                  <Button
                    type="button"
                    className="h-11 flex-1 rounded-xl font-semibold text-white"
                    style={{ backgroundColor: MANPOWER_TEAL }}
                    onClick={handleBook}
                  >
                    {t("bookNow")}
                  </Button>
                </div>
              </div>
            </div>

            {description ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-foreground">{t("detailAbout")}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {description}
                </p>
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-foreground">{t("detailDetails")}</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {details.map((row) => (
                  <div
                    key={`${row.label}-${row.value}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {row.label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">{t("detailReviews")}</h2>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  0.0
                </span>
              </div>
              <p className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-500">
                {t("detailReviewsEmpty")}
              </p>
            </section>

            <Accordion type="single" collapsible defaultValue="terms" className="rounded-2xl border border-slate-200 bg-white px-5 shadow-sm sm:px-6">
              <AccordionItem value="terms" className="border-0">
                <AccordionTrigger className="text-lg font-bold text-foreground hover:no-underline">
                  {t("termsTitle")}
                </AccordionTrigger>
                <AccordionContent>
                  <ManpowerTermsSection hireMode={hireMode} embedded />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <aside className="xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("detailYouPay")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{ctaPriceLabel}</p>
              <p className="mt-1 text-sm text-slate-500">{priceSummary}</p>

              <Button
                type="button"
                className="mt-5 h-11 w-full rounded-xl font-semibold text-white"
                style={{ backgroundColor: MANPOWER_TEAL }}
                onClick={handleBook}
              >
                {t("bookNow")}
              </Button>

              <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
                <li className="flex gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  Verified nearby workers
                </li>
                <li className="flex gap-2">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  Assigned within ~10 minutes
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  Secure payment options
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom CTA only */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-lg xl:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            type="button"
            className="h-11 flex-1 rounded-xl font-semibold text-white"
            style={{ backgroundColor: MANPOWER_TEAL }}
            onClick={handleBook}
          >
            {t("bookNow")} · {ctaPriceLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
