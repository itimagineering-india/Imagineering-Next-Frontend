"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Filter, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { MaterialsProductCard } from "@/components/materials/MaterialsProductCard";
import { GetBestQuotesModal } from "@/components/service-details/GetBestQuotesModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  applyMaterialsProductFilters,
  filterMaterialsProducts,
  MATERIALS_CATEGORY_SLUG,
  resolveMaterialsMaterialTypeKey,
  sortMaterialsProducts,
  type MaterialsProduct,
  type MaterialsProductFilters,
  type MaterialsProductSort,
} from "@/lib/materials/constructionMaterialsCatalog";
import {
  CATALOG_CATEGORY_PAGE_SIZE,
  fetchCatalogProductsPage,
  findServiceIdForCatalogProduct,
} from "@/lib/materials/materialsHubApi";
import api from "@/lib/api-client";

function formatCatalogTypeLabel(value: string): string {
  const v = String(value || "").trim();
  if (!v) return v;
  if (/[\s/&-]/.test(v) || /[A-Z]/.test(v)) return v;
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  materialTypeKey: string;
};

export function MaterialsCategoryProductsClient({ materialTypeKey }: Props) {
  const { t } = useTranslation("materials");
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const key = resolveMaterialsMaterialTypeKey(materialTypeKey) || materialTypeKey;
  const [title, setTitle] = useState(() =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<MaterialsProduct[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<MaterialsProductSort>("relevance");
  const [filters, setFilters] = useState<MaterialsProductFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryItemTypes, setCategoryItemTypes] = useState<string[]>([]);
  const [facetItemTypes, setFacetItemTypes] = useState<string[]>([]);
  const [facetProductTypes, setFacetProductTypes] = useState<string[]>([]);
  const [ctaLoadingId, setCtaLoadingId] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteService, setQuoteService] = useState<{
    id: string;
    title: string;
    priceType?: string;
  } | null>(null);
  const requestSeqRef = useRef(0);
  const loadMoreLockRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  const load = useCallback(
    async (opts?: { page?: number; append?: boolean }) => {
      const nextPage = Math.max(1, opts?.page ?? 1);
      const append = Boolean(opts?.append) && nextPage > 1;
      if (append) setLoadingMore(true);
      else setLoading(true);
      const seq = ++requestSeqRef.current;
      try {
        const result = await fetchCatalogProductsPage({
          categoryId: key,
          page: nextPage,
          limit: CATALOG_CATEGORY_PAGE_SIZE,
          search: debouncedQuery,
          ...(filters.itemType ? { itemType: filters.itemType } : {}),
          ...(filters.productType ? { productType: filters.productType } : {}),
        });
        if (seq !== requestSeqRef.current) return;
        setPage(result.page);
        setTotal(result.total);
        setHasMore(result.page < result.pages && result.products.length > 0);
        setProducts((prev) => {
          if (!append) return result.products;
          const seen = new Set(prev.map((p) => p.id));
          const extra = result.products.filter((p) => p.id && !seen.has(p.id));
          return extra.length ? [...prev, ...extra] : prev;
        });
      } catch {
        if (seq !== requestSeqRef.current) return;
        if (!append) {
          setProducts([]);
          setTotal(0);
          setHasMore(false);
          toast({
            title: t("loadErrorTitle"),
            description: t("loadErrorBody"),
            variant: "destructive",
          });
        }
      } finally {
        if (seq === requestSeqRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedQuery, filters.itemType, filters.productType, key, t, toast]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setFilters({});
    setFiltersOpen(false);
    setCategoryItemTypes([]);
    setFacetItemTypes([]);
    setFacetProductTypes([]);
    setTitle(key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()));
  }, [key]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [subRes, facetPage] = await Promise.all([
          api.categories.getSubcategories(MATERIALS_CATEGORY_SLUG),
          fetchCatalogProductsPage({
            categoryId: key,
            page: 1,
            limit: 100,
          }),
        ]);
        if (cancelled) return;

        const payload = (subRes as { data?: unknown })?.data;
        const detailsRaw =
          payload && typeof payload === "object" && "subcategoryDetails" in payload
            ? (payload as { subcategoryDetails?: unknown }).subcategoryDetails
            : undefined;
        const details = Array.isArray(detailsRaw) ? detailsRaw : [];
        const matched = details.find((row) => {
          if (!row || typeof row !== "object") return false;
          const name = String((row as { name?: unknown }).name || "").trim();
          if (!name) return false;
          return resolveMaterialsMaterialTypeKey(name) === key;
        }) as { name?: string; itemTypes?: unknown } | undefined;
        if (matched?.name) setTitle(String(matched.name).trim());
        const configured = Array.isArray(matched?.itemTypes)
          ? matched.itemTypes.map(String).filter(Boolean)
          : [];
        setCategoryItemTypes(configured);

        const itemSet = new Set<string>();
        const productSet = new Set<string>();
        for (const p of facetPage.products) {
          const it = String(p.itemType || "").trim();
          const pt = String(p.productType || "").trim();
          if (it) itemSet.add(it);
          if (pt) productSet.add(pt);
        }
        setFacetItemTypes(Array.from(itemSet));
        setFacetProductTypes(Array.from(productSet));
      } catch {
        if (!cancelled) {
          setCategoryItemTypes([]);
          setFacetItemTypes([]);
          setFacetProductTypes([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    void load({ page: 1 });
  }, [load]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const itemTypeOptions = useMemo(() => {
    const set = new Set<string>([...categoryItemTypes, ...facetItemTypes]);
    products.forEach((p) => {
      const v = String(p.itemType || "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categoryItemTypes, facetItemTypes, products]);

  const productTypeOptions = useMemo(() => {
    const set = new Set<string>(facetProductTypes);
    products.forEach((p) => {
      const v = String(p.productType || "").trim();
      if (v) set.add(v);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [facetProductTypes, products]);

  const visible = useMemo(() => {
    const searched = filterMaterialsProducts(products, { query, categoryId: null });
    const filtered = applyMaterialsProductFilters(searched, filters);
    return sortMaterialsProducts(filtered, sort);
  }, [filters, products, query, sort]);

  const filterActive = Boolean(
    (filters.brands?.length ?? 0) > 0 ||
      filters.minRating != null ||
      filters.priceMode != null ||
      Boolean(filters.itemType) ||
      Boolean(filters.productType)
  );
  const displayedCount =
    filterActive && !filters.itemType && !filters.productType
      ? visible.length
      : total > 0
        ? total
        : visible.length;

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    if (query.trim() !== debouncedQuery) return;
    if (loadMoreLockRef.current) return;
    loadMoreLockRef.current = true;
    void load({ page: page + 1, append: true }).finally(() => {
      window.setTimeout(() => {
        loadMoreLockRef.current = false;
      }, 300);
    });
  }, [debouncedQuery, hasMore, load, loading, loadingMore, page, query]);

  loadMoreRef.current = loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        loadMoreRef.current();
      },
      { rootMargin: "240px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visible.length]);

  const handleProductCta = useCallback(
    async (product: MaterialsProduct) => {
      if (product.hasVariants) {
        router.push(`/construction-materials/product/${product.id}`);
        return;
      }
      setCtaLoadingId(product.id);
      try {
        const exclude =
          (user as { _id?: string; id?: string } | null)?._id ||
          (user as { id?: string } | null)?.id ||
          null;
        const linked = await findServiceIdForCatalogProduct(product.id, {
          excludeProviderUserId: exclude,
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
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200/90 bg-white">
        <div className="home-shell py-3 md:py-3.5">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Link
                href="/construction-materials"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                aria-label={t("backToHub")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
                    {title}
                  </h1>
                  <span className="text-xs font-medium text-slate-400">
                    {loading && products.length === 0
                      ? t("loading")
                      : t("productsCount", { count: displayedCount })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[340px]">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchProducts")}
                  className="h-8 rounded-full border-slate-200/90 bg-slate-50 pl-8 pr-3 text-xs shadow-none placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-slate-200 md:text-sm"
                />
              </div>
              <Select value={sort} onValueChange={(v) => setSort(v as MaterialsProductSort)}>
                <SelectTrigger className="h-8 w-auto min-w-[7rem] shrink-0 rounded-full border-slate-200/90 px-2.5 text-xs sm:min-w-[8.5rem]">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <SelectValue placeholder={t("sort")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">{t("sortRelevance")}</SelectItem>
                  <SelectItem value="price_asc">{t("sortPriceAsc")}</SelectItem>
                  <SelectItem value="price_desc">{t("sortPriceDesc")}</SelectItem>
                  <SelectItem value="rating">{t("sortRating")}</SelectItem>
                  <SelectItem value="delivery">{t("sortDelivery")}</SelectItem>
                  <SelectItem value="name">{t("sortName")}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`h-8 shrink-0 rounded-full px-2.5 sm:px-3 ${
                  filtersOpen || filterActive
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-slate-200/90"
                }`}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <Filter className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline text-xs">{t("filters")}</span>
              </Button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="mt-3 grid gap-2.5 rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:grid-cols-2 lg:grid-cols-4">
              {itemTypeOptions.length > 0 ? (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {t("filterItemType")}
                  </p>
                  <Select
                    value={filters.itemType || "__all__"}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        itemType: v === "__all__" ? null : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{t("allItemTypes")}</SelectItem>
                      {itemTypeOptions.map((itemType) => (
                        <SelectItem key={itemType} value={itemType}>
                          {formatCatalogTypeLabel(itemType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              {productTypeOptions.length > 0 ? (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {t("filterProductType")}
                  </p>
                  <Select
                    value={filters.productType || "__all__"}
                    onValueChange={(v) =>
                      setFilters((prev) => ({
                        ...prev,
                        productType: v === "__all__" ? null : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-9 rounded-lg bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">{t("allProductTypes")}</SelectItem>
                      {productTypeOptions.map((productType) => (
                        <SelectItem key={productType} value={productType}>
                          {formatCatalogTypeLabel(productType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("filterBrand")}
                </p>
                <Select
                  value={filters.brands?.[0] || "__all__"}
                  onValueChange={(v) =>
                    setFilters((prev) => ({
                      ...prev,
                      brands: v === "__all__" ? [] : [v],
                    }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("allBrands")}</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("filterPriceMode")}
                </p>
                <Select
                  value={filters.priceMode || "__all__"}
                  onValueChange={(v) =>
                    setFilters((prev) => ({
                      ...prev,
                      priceMode: v === "__all__" ? null : (v as "fixed" | "quote"),
                    }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("allModes")}</SelectItem>
                    <SelectItem value="fixed">{t("fixedPrice")}</SelectItem>
                    <SelectItem value="quote">{t("quotePrice")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {t("filterMinRating")}
                </p>
                <Select
                  value={filters.minRating != null ? String(filters.minRating) : "__all__"}
                  onValueChange={(v) =>
                    setFilters((prev) => ({
                      ...prev,
                      minRating: v === "__all__" ? null : Number(v),
                    }))
                  }
                >
                  <SelectTrigger className="h-9 rounded-lg bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">{t("anyRating")}</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="4.5">4.5+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-full rounded-lg"
                  onClick={() => setFilters({})}
                >
                  {t("clearFilters")}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="home-shell py-4 md:py-6">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">
            {t("emptyProducts")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {visible.map((product) => (
                <MaterialsProductCard
                  key={product.id}
                  product={product}
                  onCta={handleProductCta}
                  ctaLoading={ctaLoadingId === product.id}
                />
              ))}
            </div>
            <div ref={sentinelRef} className="h-8" />
            {loadingMore ? (
              <div className="flex items-center justify-center gap-2 py-6 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
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

export default MaterialsCategoryProductsClient;
