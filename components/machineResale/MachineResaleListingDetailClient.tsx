"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api-client";
import { formatServicePrice } from "@/lib/formatServicePrice";
import { formatInr } from "@/lib/priceTypeDisplay";
import { resolveMachineRentalMediaUrl } from "@/lib/machineRental/media";
import { resolveResaleCategoryKey, RESALE_TEAL } from "@/lib/machineResale/machineResaleHubCatalog";
import { CustomFields } from "@/components/service-details/CustomFields";
import { SimilarServices } from "@/components/service-details/SimilarServices";

type SpecField = {
  label: string;
  value: string | number | boolean;
  type: "text" | "number" | "boolean" | "select";
};

type ServiceDoc = {
  _id?: string;
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  priceMode?: string;
  priceMin?: number;
  priceMax?: number;
  priceType?: string;
  mrp?: number;
  images?: string[];
  image?: string;
  subcategory?: string;
  customFields?: SpecField[];
  metadata?: Record<string, unknown>;
  provider?: {
    name?: string;
    businessName?: string;
    _id?: string;
    verified?: boolean;
  } | string;
  category?: { name?: string; slug?: string };
  location?: { city?: string; address?: string };
  rating?: number;
  reviewCount?: number;
};

type SimilarRow = {
  id: string;
  slug?: string;
  title: string;
  image: string;
  category: string;
  providerName: string;
  rating: number;
  reviewCount: number;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
  priceType: string;
  location?: string;
};

type Props = { serviceId: string };

const EXCLUDED_METADATA_KEYS = new Set([
  "title",
  "description",
  "price",
  "priceType",
  "images",
  "image",
  "category",
  "subcategory",
  "location",
  "formVariant",
  "categorySlug",
  "itemType",
  "listingType",
  "availableUnits",
  "machineModel",
]);

function toReadableFieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function metadataToCustomFields(metadata: unknown): SpecField[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const out: SpecField[] = [];
  for (const [key, rawValue] of Object.entries(metadata as Record<string, unknown>)) {
    if (EXCLUDED_METADATA_KEYS.has(key)) continue;
    if (rawValue === null || rawValue === undefined) continue;
    if (typeof rawValue === "string") {
      const v = rawValue.trim();
      if (!v) continue;
      out.push({ label: toReadableFieldLabel(key), value: v, type: "text" });
      continue;
    }
    if (typeof rawValue === "number") {
      out.push({ label: toReadableFieldLabel(key), value: rawValue, type: "number" });
      continue;
    }
    if (typeof rawValue === "boolean") {
      out.push({ label: toReadableFieldLabel(key), value: rawValue, type: "boolean" });
    }
  }
  return out;
}

function providerDisplayName(provider: ServiceDoc["provider"]): string {
  if (!provider || typeof provider !== "object") return "";
  return String(provider.businessName || provider.name || "").trim();
}

export function MachineResaleListingDetailClient({ serviceId }: Props) {
  const { t } = useTranslation("machineResale");
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<ServiceDoc | null>(null);
  const [similar, setSimilar] = useState<SimilarRow[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.services.getById(serviceId);
        if (cancelled) return;
        if (!res.success || !res.data) {
          setService(null);
          setSimilar([]);
          return;
        }
        const payload = res.data as {
          service?: ServiceDoc;
          similarServices?: SimilarRow[];
          title?: string;
          _id?: string;
        };
        const doc =
          payload.service ||
          (payload.title || payload._id ? (payload as ServiceDoc) : null);
        setService(doc);
        setSimilar(Array.isArray(payload.similarServices) ? payload.similarServices : []);
        setActiveImage(0);
      } catch {
        if (!cancelled) {
          setService(null);
          setSimilar([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const listingId = String(service?._id || service?.id || serviceId).trim();
  const title =
    String(service?.title || service?.name || "").trim() || t("listingUntitled");

  const unitPrice = useMemo(() => {
    if (!service) return 0;
    if (String(service.priceMode || "").toLowerCase() === "range") {
      const min = Number(service.priceMin);
      if (Number.isFinite(min) && min > 0) return min;
    }
    const p = Number(service.price);
    if (Number.isFinite(p) && p > 0) return p;
    const mrp = Number(service.mrp);
    return Number.isFinite(mrp) && mrp > 0 ? mrp : 0;
  }, [service]);

  const priceLabel = useMemo(() => {
    if (!service) return "";
    return formatServicePrice({
      price: service.price,
      priceMode: service.priceMode,
      priceMin: service.priceMin,
      priceMax: service.priceMax,
      priceType: service.priceType || "fixed",
    });
  }, [service]);

  const gallery = useMemo(() => {
    const raw = [
      ...(Array.isArray(service?.images) ? service!.images! : []),
      service?.image,
    ]
      .map((u) => resolveMachineRentalMediaUrl(String(u || "").trim()))
      .filter(Boolean) as string[];
    return Array.from(new Set(raw));
  }, [service]);

  const mainImage = gallery[Math.min(activeImage, Math.max(0, gallery.length - 1))] || "";
  const providerName = providerDisplayName(service?.provider);
  const categoryName = String(
    service?.subcategory ||
      (typeof service?.category === "object" ? service.category?.name : "") ||
      ""
  ).trim();
  const categoryKey =
    resolveResaleCategoryKey(categoryName) ||
    categoryName.toLowerCase().replace(/\s+/g, "-");
  const description = String(service?.description || service?.shortDescription || "").trim();

  const specFields = useMemo(() => {
    if (!service) return [];
    if (Array.isArray(service.customFields) && service.customFields.length > 0) {
      return service.customFields;
    }
    return metadataToCustomFields(service.metadata);
  }, [service]);

  const detailRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [];
    if (categoryName) rows.push({ label: t("detailCategory"), value: categoryName });
    if (priceLabel && priceLabel !== "Contact for pricing") {
      rows.push({ label: t("detailPrice"), value: priceLabel });
    }
    const year = String(service?.metadata?.yearOfManufacture || "").trim();
    if (year) rows.push({ label: t("detailYear"), value: year });
    const model = String(service?.metadata?.machineModel || "").trim();
    if (model) rows.push({ label: t("detailModel"), value: model });
    if (service?.location?.city) {
      rows.push({ label: t("detailCity"), value: String(service.location.city) });
    }
    if (providerName) rows.push({ label: t("detailProvider"), value: providerName });
    return rows;
  }, [categoryName, priceLabel, providerName, service, t]);

  const similarMapped = useMemo(
    () =>
      similar.map((s) => ({
        ...s,
        priceType: (s.priceType || "fixed") as SimilarRow["priceType"],
        image: resolveMachineRentalMediaUrl(s.image) || s.image,
      })),
    [similar]
  );

  const goCheckout = useCallback(() => {
    if (!listingId) return;
    if (unitPrice <= 0) {
      toast({
        title: t("noPriceTitle"),
        description: t("noPriceHint"),
        variant: "destructive",
      });
      return;
    }
    const qs = new URLSearchParams();
    qs.set("serviceId", listingId);
    qs.set("name", title);
    const href = `/machine-resale/checkout?${qs.toString()}`;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(href)}`);
      return;
    }
    router.push(href);
  }, [isAuthenticated, listingId, router, t, title, toast, unitPrice]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("loading")}
      </div>
    );
  }

  if (!service) {
    return (
      <div className="layout-shell py-16 text-center">
        <p className="text-lg font-semibold text-slate-800">{t("listingNotFound")}</p>
        <Button asChild className="mt-4 rounded-xl text-white" style={{ backgroundColor: RESALE_TEAL }}>
          <Link href="/machine-resale">{t("backToHub")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDFA]">
      <div className="layout-shell py-6 pb-28 xl:pb-16">
        <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/machine-resale" className="font-medium text-teal-800 hover:underline">
            {t("title")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          {categoryKey ? (
            <>
              <Link
                href={`/machine-resale/${encodeURIComponent(categoryKey)}`}
                className="font-medium text-teal-800 hover:underline"
              >
                {categoryName || categoryKey}
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </>
          ) : null}
          <span className="line-clamp-1 font-medium text-slate-700">{title}</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
          <div className="mx-auto w-full max-w-md space-y-3 lg:mx-0 lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-teal-200/80 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-teal-50">
                {mainImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mainImage}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-teal-800/50">
                    {title.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            {gallery.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActiveImage(i)}
                    className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border-2 sm:h-16 sm:w-20 ${
                      i === activeImage ? "border-teal-700" : "border-transparent opacity-80"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div>
              {categoryName ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                  {categoryName}
                </p>
              ) : null}
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
              {providerName ? (
                <p className="mt-1.5 text-sm text-slate-500">
                  {t("listedBy", { name: providerName })}
                  {typeof service.provider === "object" && service.provider?.verified ? (
                    <span className="ml-2 inline-flex items-center gap-1 text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {t("verifiedBadge")}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {priceLabel && priceLabel !== "Contact for pricing" ? (
                <p className="mt-3 text-xl font-semibold text-teal-800">{priceLabel}</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("sellingPrice")}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {unitPrice > 0 ? `₹${formatInr(unitPrice)}` : "—"}
              </p>
              <Button
                type="button"
                className="mt-5 hidden h-11 w-full rounded-xl font-semibold text-white lg:inline-flex"
                style={{ backgroundColor: RESALE_TEAL }}
                disabled={unitPrice <= 0}
                onClick={goCheckout}
              >
                {t("buyNow")}
              </Button>
              <ul className="mt-5 hidden space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600 lg:block">
                <li className="flex gap-2">
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  {t("trustVerified")}
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                  {t("trustPay")}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {description ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">{t("aboutTitle")}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {description}
              </p>
            </section>
          ) : null}

          {detailRows.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">{t("detailsTitle")}</h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {detailRows.map((row) => (
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
          ) : null}

          {specFields.length > 0 ? (
            <section>
              <h2 className="mb-3 px-1 text-lg font-bold text-slate-900">{t("specsTitle")}</h2>
              <CustomFields fields={specFields} className="rounded-2xl border-slate-200 shadow-sm" />
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-slate-900">{t("specsTitle")}</h2>
              <p className="mt-2 text-sm text-slate-500">{t("specsEmpty")}</p>
            </section>
          )}

          {similarMapped.length > 0 ? (
            <section className="pt-2">
              <SimilarServices
                services={similarMapped as any}
                title={t("similarTitle")}
                hrefBase="/machine-resale/listing"
                viewAllHref={
                  categoryKey
                    ? `/machine-resale/${encodeURIComponent(categoryKey)}`
                    : "/machine-resale"
                }
              />
            </section>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-3 shadow-lg lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500">{t("sellingPrice")}</p>
            <p className="truncate text-lg font-bold text-slate-900">
              {unitPrice > 0 ? `₹${formatInr(unitPrice)}` : "—"}
            </p>
          </div>
          <Button
            type="button"
            className="h-11 shrink-0 rounded-xl px-5 font-semibold text-white"
            style={{ backgroundColor: RESALE_TEAL }}
            disabled={unitPrice <= 0}
            onClick={goCheckout}
          >
            {t("buyNow")}
          </Button>
        </div>
      </div>
    </div>
  );
}
