"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  resolveMaterialsMaterialTypeKey,
  sortMaterialsProducts,
  type MaterialsProduct,
  type MaterialsProductFilters,
  type MaterialsProductSort,
} from "@/lib/materials/constructionMaterialsCatalog";
import {
  fetchCatalogProductsByCategory,
  findServiceIdForCatalogProduct,
} from "@/lib/materials/materialsHubApi";

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
  const title = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MaterialsProduct[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MaterialsProductSort>("relevance");
  const [filters, setFilters] = useState<MaterialsProductFilters>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ctaLoadingId, setCtaLoadingId] = useState<string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteService, setQuoteService] = useState<{
    id: string;
    title: string;
    priceType?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchCatalogProductsByCategory(key);
        if (!cancelled) setProducts(list);
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
  }, [key, t, toast]);

  const brands = useMemo(() => {
    const set = new Set(products.map((p) => p.brand).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const visible = useMemo(() => {
    const searched = filterMaterialsProducts(products, { query, categoryId: null });
    const filtered = applyMaterialsProductFilters(searched, filters);
    return sortMaterialsProducts(filtered, sort);
  }, [filters, products, query, sort]);

  const handleProductCta = useCallback(
    async (product: MaterialsProduct) => {
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
                    {loading ? t("loading") : t("productsCount", { count: visible.length })}
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
                  filtersOpen ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200/90"
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
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("loading")}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-14 text-center text-sm text-slate-500">
            {t("emptyProducts")}
          </div>
        ) : (
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
