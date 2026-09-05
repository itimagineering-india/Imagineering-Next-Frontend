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
import {
  catalogAxisOptionValues,
  catalogVariantLabel,
  defaultVariantSelection,
  findCatalogVariant,
  readCatalogVariants,
  selectionAfterAxisChange,
} from "@/lib/catalogVariants";
import { resolveMaterialsMediaUrl } from "@/lib/materials/media";
import {
  B2B_QUOTE_CART_MAX,
  loadB2bQuoteCart,
  normalizeB2bQuoteItemType,
  saveB2bQuoteCart,
  upsertB2bQuoteCartLine,
} from "@/lib/b2b/b2bQuoteCart";
import type { QuoteModalLine } from "@/components/service-details/GetBestQuotesModal";

type Props = {
  productId: string;
  /** materials = /construction-materials/… ; b2b = /b2b-services/products/… */
  surface?: "materials" | "b2b";
};

function toReadableText(raw: unknown): string {
  if (raw == null) return "—";
  const text = String(raw).trim();
  if (!text) return "—";
  return text
    // camelCase → "camel Case"
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    // underscores/hyphens → space
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
    priceType: product.unitType || "fixed",
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
  const [quoteModalItems, setQuoteModalItems] = useState<QuoteModalLine[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [inQuoteList, setInQuoteList] = useState(false);
  const [variantSel, setVariantSel] = useState<Record<string, string>>({});

  const catalogVariants = useMemo(() => readCatalogVariants(raw || undefined), [raw]);
  const selectedVariant = useMemo(() => {
    if (!catalogVariants.hasVariants) return undefined;
    return findCatalogVariant(
      catalogVariants.variants,
      variantSel,
      catalogVariants.variantAxes,
    );
  }, [catalogVariants, variantSel]);

  useEffect(() => {
    if (!raw) return;
    const parsed = readCatalogVariants(raw);
    if (parsed.hasVariants) {
      setVariantSel(defaultVariantSelection(parsed.variantAxes, parsed.variants));
    } else {
      setVariantSel({});
    }
  }, [raw]);

  useEffect(() => {
    if (!isB2b) return;
    const variantId = selectedVariant?.id;
    setInQuoteList(
      loadB2bQuoteCart().some(
        (l) =>
          l.key === (variantId ? `catalog:${productId}:${variantId}` : `catalog:${productId}`)
      )
    );
  }, [isB2b, productId, selectedVariant?.id]);

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
    const variantList = Array.isArray(selectedVariant?.images) ? selectedVariant.images : [];
    const list = variantList.length
      ? variantList
      : Array.isArray(raw?.images)
        ? (raw!.images as string[])
        : [];
    const resolved = list.map((u) => resolveMaterialsMediaUrl(u)).filter(Boolean) as string[];
    if (resolved.length > 0) return resolved;
    if (mapped?.imageUri) return [mapped.imageUri];
    return [];
  }, [mapped, raw, selectedVariant]);

  const specs = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    if (mapped?.brand) rows.push({ label: "Brand", value: mapped.brand });
    if (mapped?.grade && !catalogVariants.hasVariants) {
      rows.push({ label: "Grade / Spec", value: mapped.grade });
    }
    if (mapped?.avgDeliveryDays) {
      rows.push({ label: "Avg delivery", value: `${mapped.avgDeliveryDays} days` });
    }
    if (selectedVariant) {
      catalogVariants.variantAxes.forEach((axis) => {
        const val = selectedVariant.attributes?.[axis.key];
        if (val) rows.push({ label: axis.label, value: val });
      });
    }
    const meta =
      raw?.metadata && typeof raw.metadata === "object"
        ? (raw.metadata as Record<string, unknown>)
        : {};
    const skipMeta = new Set([
      "formVariant",
      ...(catalogVariants.hasVariants
        ? ["steelGrade", "steelSize", "steelCustomSize", "steelGradeCustom"]
        : []),
    ]);
    Object.entries(meta).forEach(([k, v]) => {
      if (v == null || v === "") return;
      if (skipMeta.has(k)) return;
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
  }, [catalogVariants, mapped, raw, selectedVariant]);

  const priceLabel = useMemo(() => {
    if (!raw) return "Get quotes";
    const min =
      selectedVariant?.suggestedPriceMin ?? (raw.suggestedPriceMin as number);
    const max =
      selectedVariant?.suggestedPriceMax ?? (raw.suggestedPriceMax as number);
    return formatMaterialsPriceRange(
      min,
      max,
      (selectedVariant?.suggestedPriceType || raw.suggestedPriceType) as string
    );
  }, [raw, selectedVariant]);

  const isRange = useMemo(() => {
    if (!raw) return true;
    const min =
      selectedVariant?.suggestedPriceMin ?? (raw.suggestedPriceMin as number);
    const max =
      selectedVariant?.suggestedPriceMax ?? (raw.suggestedPriceMax as number);
    return isMaterialsCatalogPriceRange(min, max);
  }, [raw, selectedVariant]);

  const typeKey = resolveMaterialsMaterialTypeKey(
    String(raw?.materialTypeKey || raw?.subcategory || "")
  );
  const subcategoryLabel = typeKey
    ? typeKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : undefined;

  const handleGetQuotes = useCallback(() => {
    if (!linkedServiceId || !mapped) {
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

    const variantId = selectedVariant?.id;
    const variantLabel = selectedVariant
      ? catalogVariantLabel(selectedVariant, catalogVariants.variantAxes)
      : undefined;
    const priceType =
      selectedVariant?.suggestedPriceType ||
      (raw?.suggestedPriceType as string) ||
      mapped.unitType ||
      undefined;
    const itemType = normalizeB2bQuoteItemType(mapped.categoryId);

    // Keep current size in the quote list so switching sizes accumulates lines.
    if (isB2b) {
      const key = variantId ? `catalog:${mapped.id}:${variantId}` : `catalog:${mapped.id}`;
      const cart = loadB2bQuoteCart();
      if (!cart.some((l) => l.key === key)) {
        const result = upsertB2bQuoteCartLine(cart, {
          key,
          catalogProductId: mapped.id,
          catalogVariantId: variantId,
          variantLabel,
          title: mapped.name,
          priceType,
          itemType: itemType || undefined,
          serviceId: linkedServiceId,
          quantity: 1,
        });
        if (!result.error) {
          setInQuoteList(true);
        }
      } else {
        setInQuoteList(true);
      }
    }

    const cartLines = loadB2bQuoteCart().filter(
      (l) =>
        l.catalogProductId === mapped.id ||
        l.key === `catalog:${mapped.id}` ||
        l.key.startsWith(`catalog:${mapped.id}:`)
    );

    const lines: QuoteModalLine[] =
      cartLines.length > 0
        ? cartLines.map((l) => ({
            serviceId: l.serviceId || linkedServiceId,
            title: l.variantLabel ? `${mapped.name} · ${l.variantLabel}` : mapped.name,
            quantity: l.quantity,
            catalogProductId: mapped.id,
            catalogVariantId: l.catalogVariantId,
            variantLabel: l.variantLabel,
            priceType: l.priceType || priceType,
          }))
        : [
            {
              serviceId: linkedServiceId,
              title: variantLabel ? `${mapped.name} · ${variantLabel}` : mapped.name,
              catalogProductId: mapped.id,
              catalogVariantId: variantId,
              variantLabel,
              priceType,
            },
          ];

    // Prefer distinct variants; if somehow empty, fall back to current.
    const seen = new Set<string>();
    const deduped = lines.filter((line) => {
      const key = line.catalogVariantId || line.serviceId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setQuoteModalItems(deduped.length ? deduped : lines);
    setQuoteOpen(true);
  }, [
    catalogVariants.variantAxes,
    isAuthenticated,
    isB2b,
    linkedServiceId,
    mapped,
    productPath,
    raw?.suggestedPriceType,
    router,
    selectedVariant,
    t,
    toast,
  ]);

  const handleAddToQuote = useCallback(() => {
    if (!mapped) return;
    const variantId = selectedVariant?.id;
    const variantLabel = selectedVariant
      ? catalogVariantLabel(selectedVariant, catalogVariants.variantAxes)
      : undefined;
    const result = upsertB2bQuoteCartLine(loadB2bQuoteCart(), {
      key: variantId ? `catalog:${mapped.id}:${variantId}` : `catalog:${mapped.id}`,
      catalogProductId: mapped.id,
      catalogVariantId: variantId,
      variantLabel,
      title: mapped.name,
      priceType:
        selectedVariant?.suggestedPriceType ||
        mapped.unitType ||
        String(raw?.suggestedPriceType || "").trim() ||
        undefined,
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
      description: variantLabel ? `${mapped.name} · ${variantLabel}` : mapped.name,
    });
  }, [catalogVariants.variantAxes, mapped, raw?.suggestedPriceType, selectedVariant, toast]);

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

  const priceMin =
    Number(selectedVariant?.suggestedPriceMin ?? raw.suggestedPriceMin) || 0;
  const priceMax =
    Number(selectedVariant?.suggestedPriceMax ?? raw.suggestedPriceMax) || priceMin;
  const b2bCategoryHref = typeKey
    ? `/b2b-services?category=${encodeURIComponent(MATERIALS_CATEGORY_SLUG)}&subcategory=${encodeURIComponent(typeKey)}`
    : hubHref;
  const variantLabel = selectedVariant
    ? catalogVariantLabel(selectedVariant, catalogVariants.variantAxes)
    : "";
  const displayTitle = variantLabel ? `${mapped.name} | ${variantLabel}` : mapped.name;

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
            title: displayTitle,
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
          variantPicker={
            catalogVariants.hasVariants ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {catalogVariants.variantAxes.map((axis) => {
                    const values = catalogAxisOptionValues(axis, catalogVariants.variants);
                    return (
                      <label key={axis.key} className="space-y-1 text-sm">
                        <span className="font-medium text-foreground">{axis.label}</span>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={variantSel[axis.key] || ""}
                          onChange={(e) =>
                            setVariantSel((prev) =>
                              selectionAfterAxisChange(
                                catalogVariants.variantAxes,
                                catalogVariants.variants,
                                prev,
                                axis.key,
                                e.target.value,
                              ),
                            )
                          }
                        >
                          {values.map((val) => (
                            <option key={val} value={val}>
                              {val}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
                </div>
                {isB2b ? (
                  <p className="text-xs text-muted-foreground">
                    Need more than one size (e.g. 100 and 150)? Select each, tap{" "}
                    <span className="font-medium text-foreground">Add to quote</span>, then{" "}
                    <span className="font-medium text-foreground">Get Best Quotes</span> — each size
                    gets its own quantity.
                  </p>
                ) : null}
              </div>
            ) : null
          }
        />
      </div>

      {linkedServiceId ? (
        <GetBestQuotesModal
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          serviceId={linkedServiceId}
          serviceTitle={
            quoteModalItems.length > 1
              ? `${quoteModalItems.length} variants · ${mapped.name}`
              : quoteModalItems[0]?.title || displayTitle || linkedServiceTitle || mapped.name
          }
          priceType={
            quoteModalItems[0]?.priceType ||
            selectedVariant?.suggestedPriceType ||
            (raw?.suggestedPriceType as string) ||
            mapped.unitType
          }
          items={quoteModalItems.length > 0 ? quoteModalItems : undefined}
          onSubmitted={() => {
            const kept = loadB2bQuoteCart().filter(
              (l) =>
                l.catalogProductId !== mapped.id &&
                l.key !== `catalog:${mapped.id}` &&
                !l.key.startsWith(`catalog:${mapped.id}:`)
            );
            saveB2bQuoteCart(kept);
            setInQuoteList(false);
            setQuoteModalItems([]);
          }}
          noCountdown
        />
      ) : null}
    </div>
  );
}
