"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ConstructionMaterialProductLayout } from "@/components/service-details/ConstructionMaterialProductLayout";
import { GetBestQuotesModal } from "@/components/service-details/GetBestQuotesModal";
import { ServiceDetailSkeleton } from "@/components/service-details/ServiceDetailSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatMaterialsPriceRange,
  isMaterialsCatalogPriceRange,
  MATERIALS_CATEGORY_SLUG,
  resolveMaterialsMaterialTypeKey,
  type MaterialsProduct,
} from "@/lib/materials/constructionMaterialsCatalog";
import {
  fetchCatalogProductById,
  fetchCatalogProductsByCategory,
  findServiceIdForCatalogProduct,
  mapCatalogProduct,
} from "@/lib/materials/materialsHubApi";
import { resolveMaterialsMediaUrl } from "@/lib/materials/media";
import {
  B2B_QUOTE_CART_MAX,
  loadB2bQuoteCart,
  normalizeB2bQuoteItemType,
  upsertB2bQuoteCartLine,
} from "@/lib/b2b/b2bQuoteCart";

type Props = {
  productId: string;
  /** materials = /construction-materials/… ; b2b = /b2b-services/products/… */
  surface?: "materials" | "b2b";
};

function toReadableText(raw: unknown): string {
  if (raw == null) return "—";
  const text = String(raw).trim();
  if (!text) return "—";
  if (text.includes("-") || text.includes("_")) {
    return text
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text;
}

function similarToServiceCard(product: MaterialsProduct) {
  const min = product.priceMin ?? 0;
  const max = product.priceMax ?? min;
  const isRange = product.isPriceRange;
  return {
    id: product.id,
    slug: product.id,
    title: product.name,
    image: product.imageUri || "/placeholder.svg",
    category: product.brand || "Materials",
    providerName: product.brand || "Supplier",
    rating: product.rating ?? 4.5,
    reviewCount: product.reviewCount ?? 0,
    price: min,
    priceMode: isRange ? ("range" as const) : ("exact" as const),
    priceMin: min,
    priceMax: max,
    priceType: "fixed" as const,
    _id: product.id,
  };
}

export function MaterialsProductDetailClient({ productId, surface = "materials" }: Props) {
  const { t } = useTranslation("materials");
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isB2b = surface === "b2b";
  const productPath = isB2b
    ? `/b2b-services/products/${productId}`
    : `/construction-materials/product/${productId}`;
  const hubHref = isB2b ? "/b2b-services" : "/construction-materials";
  const hubLabel = isB2b ? "B2B Services" : "Construction Materials";
  const productHrefBase = isB2b ? "/b2b-services/products" : "/construction-materials/product";

  const [loading, setLoading] = useState(true);
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null);
  const [similar, setSimilar] = useState<MaterialsProduct[]>([]);
  const [linkedServiceId, setLinkedServiceId] = useState<string | null>(null);
  const [linkedServiceTitle, setLinkedServiceTitle] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [inQuoteList, setInQuoteList] = useState(false);

  useEffect(() => {
    if (!isB2b) return;
    setInQuoteList(loadB2bQuoteCart().some((l) => l.key === `catalog:${productId}`));
  }, [isB2b, productId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const product = await fetchCatalogProductById(productId);
        if (cancelled || !product) return;
        setRaw(product);

        const mappedProduct = mapCatalogProduct(product, "general");
        if (!mappedProduct) {
          if (!cancelled) setRaw(null);
          return;
        }
        const exclude =
          (user as { _id?: string; id?: string } | null)?._id ||
          (user as { id?: string } | null)?.id ||
          null;
        const linked = await findServiceIdForCatalogProduct(mappedProduct.id, {
          excludeProviderUserId: exclude,
        });
        if (!cancelled) {
          setLinkedServiceId(linked?.serviceId || null);
          setLinkedServiceTitle(linked?.title || mappedProduct.name);
        }

        const typeKey = resolveMaterialsMaterialTypeKey(
          String(product?.materialTypeKey || product?.subcategory || "")
        );
        if (typeKey) {
          const list = await fetchCatalogProductsByCategory(typeKey);
          if (!cancelled) {
            setSimilar(list.filter((p) => p.id !== productId).slice(0, 10));
          }
        }
      } catch {
        if (!cancelled) {
          toast({
            title: t("loadErrorTitle"),
            description: t("loadErrorBody"),
            variant: "destructive",
          });
          setRaw(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, t, toast, user]);

  const mapped = useMemo(() => {
    if (!raw) return null;
    return mapCatalogProduct(raw, "general");
  }, [raw]);

  const images = useMemo(() => {
    const list = Array.isArray(raw?.images) ? (raw!.images as string[]) : [];
    const resolved = list.map((u) => resolveMaterialsMediaUrl(u)).filter(Boolean) as string[];
    if (resolved.length > 0) return resolved;
    if (mapped?.imageUri) return [mapped.imageUri];
    return [];
  }, [mapped, raw]);

  const specs = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    if (mapped?.brand) rows.push({ label: "Brand", value: mapped.brand });
    if (mapped?.grade) rows.push({ label: "Grade / Spec", value: mapped.grade });
    if (mapped?.avgDeliveryDays) {
      rows.push({ label: "Avg delivery", value: `${mapped.avgDeliveryDays} days` });
    }
    const meta =
      raw?.metadata && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : {};
    Object.entries(meta).forEach(([k, v]) => {
      if (v == null || v === "") return;
      rows.push({ label: toReadableText(k), value: toReadableText(v) });
    });
    const custom = Array.isArray(raw?.customFields)
      ? (raw!.customFields as Array<{ label?: string; value?: string }>)
      : [];
    custom.forEach((field) => {
      if (!field?.label && !field?.value) return;
      rows.push({
        label: String(field.label || "Spec").trim(),
        value: String(field.value || "—").trim(),
      });
    });
    return rows;
  }, [mapped, raw]);

  const priceLabel = useMemo(() => {
    if (!raw) return "Get quotes";
    return formatMaterialsPriceRange(
      raw.suggestedPriceMin as number,
      raw.suggestedPriceMax as number,
      raw.suggestedPriceType as string
    );
  }, [raw]);

  const isRange = useMemo(() => {
    if (!raw) return true;
    return isMaterialsCatalogPriceRange(
      raw.suggestedPriceMin as number,
      raw.suggestedPriceMax as number
    );
  }, [raw]);

  const typeKey = resolveMaterialsMaterialTypeKey(
    String(raw?.materialTypeKey || raw?.subcategory || "")
  );
  const subcategoryLabel = typeKey
    ? typeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : undefined;

  const handleGetQuotes = useCallback(() => {
    if (!linkedServiceId) {
      toast({
        title: t("noListingTitle"),
        description: t("noListingBody"),
        variant: "destructive",
      });
      return;
    }
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(productPath)}`);
      return;
    }
    setQuoteOpen(true);
  }, [isAuthenticated, linkedServiceId, productPath, router, t, toast]);

  const handleAddToQuote = useCallback(() => {
    if (!mapped) return;
    const result = upsertB2bQuoteCartLine(loadB2bQuoteCart(), {
      key: `catalog:${mapped.id}`,
      catalogProductId: mapped.id,
      title: mapped.name,
      priceType: mapped.unitType || String(raw?.suggestedPriceType || "").trim() || undefined,
      itemType: normalizeB2bQuoteItemType(mapped.categoryId),
    });
    if (result.error === "full") {
      toast({
        title: "Quote list is full",
        description: `You can add up to ${B2B_QUOTE_CART_MAX} products in one request.`,
        variant: "destructive",
      });
      return;
    }
    if (result.error === "mixed_item_type") {
      toast({
        title: "Different item type",
        description:
          "This quote list is for one item type only. Clear the list on B2B Services to add a different type.",
        variant: "destructive",
      });
      return;
    }
    setInQuoteList(true);
    toast({
      title: result.added ? "Added to quote list" : "Quantity updated",
      description: mapped.name,
    });
  }, [mapped, raw?.suggestedPriceType, toast]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = mapped?.name || (isB2b ? "B2B product" : "Construction material");
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: title });
    } catch {
      /* user cancelled share */
    }
  }, [isB2b, mapped?.name, toast]);

  const handleFavorite = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(productPath)}`);
      return;
    }
    setIsSaved((v) => !v);
    toast({
      title: isSaved ? "Removed from saved" : "Saved",
      description: mapped?.name,
    });
  }, [isAuthenticated, isSaved, mapped?.name, productPath, router, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,56,92,0.08),transparent_34%),linear-gradient(180deg,#fff,rgba(248,250,252,0.9))]">
        <div className="layout-shell py-8">
          <ServiceDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!raw || !mapped) {
    return (
      <div className="home-shell py-16 text-center">
        <p className="text-slate-600">{t("productNotFound")}</p>
        <Link
          href={hubHref}
          className="mt-4 inline-block font-semibold text-[hsl(var(--red-accent))]"
        >
          {isB2b ? "Back to B2B Services" : t("backToHub")}
        </Link>
      </div>
    );
  }

  const priceMin = Number(raw.suggestedPriceMin) || 0;
  const priceMax = Number(raw.suggestedPriceMax) || priceMin;
  const b2bCategoryHref = typeKey
    ? `/b2b-services?category=${encodeURIComponent(MATERIALS_CATEGORY_SLUG)}&subcategory=${encodeURIComponent(typeKey)}`
    : hubHref;

  return (
    <div className="min-h-screen max-w-full overflow-x-clip bg-[radial-gradient(circle_at_top_left,rgba(255,56,92,0.08),transparent_34%),linear-gradient(180deg,#fff,rgba(248,250,252,0.9))]">
      <div className="layout-shell overflow-x-clip pb-28 pt-4 sm:pt-6 md:pt-8">
        <ConstructionMaterialProductLayout
          responsive
          forceQuoteCtas={isB2b}
          similarHrefBase={productHrefBase}
          viewAllHref={hubHref}
          categoryHref={
            isB2b
              ? b2bCategoryHref
              : typeKey
                ? `/construction-materials/${encodeURIComponent(typeKey)}`
                : hubHref
          }
          service={{
            id: linkedServiceId || "",
            title: mapped.name,
            description:
              mapped.shortDescription ||
              String(raw.description || raw.longDescription || "") ||
              `${mapped.name} from verified suppliers on Imagineering India.`,
            images,
            price: priceMin,
            priceMin,
            priceMax,
            priceMode: isRange ? "range" : "exact",
            rating: mapped.rating ?? 4.5,
            reviewCount: mapped.reviewCount ?? 0,
            subcategory: subcategoryLabel,
            provider: { name: mapped.brand, businessName: mapped.brand },
          }}
          categoryName={hubLabel}
          categorySlug={isB2b ? "b2b-services" : "construction-materials"}
          formattedPrice={priceLabel}
          isRangePrice={isB2b ? true : isRange}
          showPricing
          specFields={specs}
          similarServices={similar.map(similarToServiceCard)}
          cityLabel="your city"
          onGetQuotes={handleGetQuotes}
          onAddToQuote={isB2b ? handleAddToQuote : undefined}
          inQuoteList={inQuoteList}
          onShare={handleShare}
          onFavorite={handleFavorite}
          isSaved={isSaved}
        />
      </div>

      {linkedServiceId ? (
        <GetBestQuotesModal
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          serviceId={linkedServiceId}
          serviceTitle={linkedServiceTitle || mapped.name}
          priceType={(raw?.suggestedPriceType as string) || mapped.unitType}
          noCountdown
        />
      ) : null}
    </div>
  );
}
