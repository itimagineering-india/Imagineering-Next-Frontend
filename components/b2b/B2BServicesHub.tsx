"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Package, Search, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GetBestQuotesModal, type QuoteModalLine } from "@/components/service-details/GetBestQuotesModal";
import { MaterialsProductCard } from "@/components/materials/MaterialsProductCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api-client";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import {
  filterB2bCategories,
  isConstructionMaterialsB2bSlug,
  type B2bCategoryLike,
} from "@/lib/b2b/b2bCategories";
import {
  fetchCatalogProductPriceType,
  fetchMaterialsHubData,
  findServiceIdForCatalogProduct,
  listAllCatalogProducts,
  mapCatalogProduct,
} from "@/lib/materials/materialsHubApi";
import {
  slugifyMaterialsId,
  type MaterialsProduct,
} from "@/lib/materials/constructionMaterialsCatalog";
import {
  B2B_QUOTE_CART_MAX,
  clearB2bQuoteCart,
  getB2bQuoteCartItemType,
  loadB2bQuoteCart,
  normalizeB2bQuoteItemType,
  saveB2bQuoteCart,
  upsertB2bQuoteCartLine,
  type B2bQuoteCartLine,
} from "@/lib/b2b/b2bQuoteCart";

type B2bCategory = {
  _id?: string;
  name: string;
  slug: string;
  subcategories: string[];
};

type ListingCard = {
  id: string;
  title: string;
  image?: string;
  price?: number;
  priceType?: string;
  subcategory?: string;
};

const POPULAR_B2B_SEARCHES = ["Cement", "TMT", "Cables", "Plywood", "Furniture", "Hardware"] as const;

function listingImage(row: Record<string, unknown>): string | undefined {
  const image = typeof row.image === "string" ? row.image : "";
  if (image.trim()) return image;
  const images = row.images;
  if (Array.isArray(images) && typeof images[0] === "string") return images[0];
  return undefined;
}

function productMatchesQuery(product: MaterialsProduct, q: string): boolean {
  const n = q.toLowerCase();
  return [product.name, product.brand, product.grade, product.shortDescription, product.categoryId].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(n)
  );
}

function listingMatchesQuery(item: ListingCard, q: string): boolean {
  const n = q.toLowerCase();
  return [item.title, item.subcategory].some((v) =>
    String(v || "")
      .toLowerCase()
      .includes(n)
  );
}

function filterCatalogBySubcategory(
  products: MaterialsProduct[],
  activeSub: string | null,
  hubCategories: { id: string; name: string }[]
): MaterialsProduct[] {
  if (!activeSub) return products;
  const key = activeSub.toLowerCase();
  const slug = slugifyMaterialsId(activeSub);
  const matchingCatIds = new Set(
    hubCategories
      .filter((c) => c.name.toLowerCase() === key || c.id.toLowerCase() === key)
      .map((c) => c.id)
  );
  return products.filter(
    (p) =>
      matchingCatIds.has(p.categoryId) ||
      p.categoryId.toLowerCase() === key ||
      p.categoryId === slug ||
      p.name.toLowerCase().includes(key)
  );
}

function mapServiceRowsToListings(rows: unknown[]): ListingCard[] {
  return rows
    .map((row): ListingCard | null => {
      const r = row as Record<string, unknown>;
      const id = String(r._id || r.id || "").trim();
      if (!id) return null;
      const card: ListingCard = {
        id,
        title: String(r.title || "Listing").trim() || "Listing",
      };
      const image = listingImage(r);
      if (image) card.image = image;
      const price = Number(r.price);
      if (Number.isFinite(price) && price > 0) card.price = price;
      const priceType = String(r.priceType || "").trim();
      if (priceType) card.priceType = priceType;
      const subcategory = String(r.subcategory || "").trim();
      if (subcategory) card.subcategory = subcategory;
      return card;
    })
    .filter((x): x is ListingCard => x !== null);
}

async function listAllCategoryServices(category: string, subcategory: string | null): Promise<ListingCard[]> {
  const pageSize = 200;
  const collected: ListingCard[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 20; page++) {
    const res = await api.services.getAll({
      category,
      subcategory: subcategory || undefined,
      limit: pageSize,
      page,
    });
    const rows = (res.data as { services?: unknown[] } | undefined)?.services;
    const mapped = Array.isArray(rows) ? mapServiceRowsToListings(rows) : [];
    for (const item of mapped) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      collected.push(item);
    }
    const pag =
      (res as { pagination?: { pages?: number } }).pagination ||
      (res.data as { pagination?: { pages?: number } } | undefined)?.pagination;
    const pages = Number(pag?.pages) || 1;
    if (page >= pages || mapped.length < pageSize) break;
  }
  return collected;
}

export function B2BServicesHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const urlCategory = searchParams?.get("category") || "";
  const urlSubcategory = searchParams?.get("subcategory") || "";

  const [categories, setCategories] = useState<B2bCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [materialsProducts, setMaterialsProducts] = useState<MaterialsProduct[]>([]);
  const [listings, setListings] = useState<ListingCard[]>([]);
  const [ctaLoadingId, setCtaLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quoteCart, setQuoteCart] = useState<B2bQuoteCartLine[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteService, setQuoteService] = useState<{
    id: string;
    title: string;
    priceType?: string | null;
    items?: QuoteModalLine[];
  } | null>(null);

  useEffect(() => {
    setQuoteCart(loadB2bQuoteCart());
  }, []);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeSlug) || categories[0] || null,
    [categories, activeSlug]
  );
  const isMaterials = isConstructionMaterialsB2bSlug(activeSlug);

  useEffect(() => {
    let cancelled = false;
    api.categories
      .getAll(false, { includeSubcategories: true, admin: true })
      .then((res) => {
        if (cancelled) return;
        const cats = (res.data as { categories?: B2bCategoryLike[] } | undefined)?.categories || [];
        const filtered = filterB2bCategories(Array.isArray(cats) ? cats : []).map((c) => ({
          _id: String((c as { _id?: string })._id || ""),
          name: String(c.name || ""),
          slug: String(c.slug || ""),
          subcategories: getSubcategoryNames(c.subcategories),
        }));
        setCategories(filtered);
        const fromUrl = filtered.find((c) => c.slug === urlCategory);
        const first = fromUrl || filtered[0];
        setActiveSlug(first?.slug || "");
        if (fromUrl && urlSubcategory && fromUrl.subcategories.includes(urlSubcategory)) {
          setActiveSub(urlSubcategory);
        } else {
          setActiveSub(null);
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingCats(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlCategory, urlSubcategory]);

  const replaceQuery = useCallback(
    (slug: string, sub: string | null) => {
      const params = new URLSearchParams();
      if (slug) params.set("category", slug);
      if (sub) params.set("subcategory", sub);
      const qs = params.toString();
      router.replace(qs ? `/b2b-services?${qs}` : "/b2b-services", { scroll: false });
    },
    [router]
  );

  const selectCategory = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      setActiveSub(null);
      replaceQuery(slug, null);
    },
    [replaceQuery]
  );

  const selectSub = useCallback(
    (sub: string | null) => {
      setActiveSub(sub);
      replaceQuery(activeSlug, sub);
    },
    [activeSlug, replaceQuery]
  );

  useEffect(() => {
    if (!activeSlug) return;
    let cancelled = false;
    setLoadingItems(true);
    setListings([]);
    setMaterialsProducts([]);

    (async () => {
      try {
        if (isConstructionMaterialsB2bSlug(activeSlug)) {
          const hub = await fetchMaterialsHubData();
          if (cancelled) return;
          const products = filterCatalogBySubcategory(
            hub.products.filter((p) => p.available),
            activeSub,
            hub.categories
          );
          setMaterialsProducts(products);
          return;
        }

        const rawCatalog = await listAllCatalogProducts({ categorySlug: activeSlug });
        if (cancelled) return;
        const mappedCatalog = rawCatalog
          .map((row) => mapCatalogProduct(row, slugifyMaterialsId(activeSlug) || "general"))
          .filter(Boolean) as MaterialsProduct[];
        const catalogProducts = filterCatalogBySubcategory(
          mappedCatalog.filter((p) => p.available),
          activeSub,
          []
        );
        if (catalogProducts.length > 0) {
          setMaterialsProducts(catalogProducts);
          return;
        }

        const listings = await listAllCategoryServices(activeSlug, activeSub);
        if (cancelled) return;
        setListings(listings);
      } catch {
        if (!cancelled) {
          toast({
            title: "Could not load products",
            description: "Please try again in a moment.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingItems(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeSlug, activeSub, toast]);

  const addToQuote = useCallback(
    (line: Omit<B2bQuoteCartLine, "quantity"> & { quantity?: number }) => {
      const result = upsertB2bQuoteCartLine(quoteCart, line);
      if (result.error === "full") {
        toast({
          title: "Quote list is full",
          description: `You can add up to ${B2B_QUOTE_CART_MAX} products in one request.`,
          variant: "destructive",
        });
        return;
      }
      if (result.error === "mixed_item_type") {
        const current = getB2bQuoteCartItemType(quoteCart);
        toast({
          title: "Different item type",
          description: current
            ? `This quote list is for ${current.replace(/-/g, " ")} only. Clear the list to add a different item type.`
            : "Add products of only one item type (e.g. sand or steel) in a single quote request.",
          variant: "destructive",
        });
        return;
      }
      setQuoteCart(result.lines);
      toast({
        title: result.added ? "Added to quote list" : "Quantity updated",
        description: result.added
          ? `${line.title} is in your quote list. Add more products or get a combined quote.`
          : `${line.title} quantity increased.`,
      });
    },
    [quoteCart, toast]
  );

  const openQuoteFromCart = useCallback(async () => {
    if (!quoteCart.length) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/b2b-services")}`);
      return;
    }
    setCtaLoadingId("quote-cart");
    try {
      const buyerId =
        (user as { _id?: string; id?: string } | null)?._id ||
        (user as { id?: string } | null)?.id ||
        null;
      const resolved: QuoteModalLine[] = [];
      const missing: { key: string; title: string }[] = [];
      for (const line of quoteCart) {
        let serviceId = line.serviceId || "";
        // Prefer admin catalog unit; never use provider listing unit for RFQ qty label.
        let priceType = line.priceType;
        if (line.catalogProductId) {
          const catalogUnit = await fetchCatalogProductPriceType(line.catalogProductId);
          if (catalogUnit) priceType = catalogUnit;
        }
        // Keep catalog/cart title so the quote form matches what the buyer added.
        const title = line.title;
        if (!serviceId && line.catalogProductId) {
          const linked = await findServiceIdForCatalogProduct(line.catalogProductId, {
            excludeProviderUserId: buyerId,
          });
          if (!linked?.serviceId) {
            missing.push({ key: line.key, title: line.title });
            continue;
          }
          serviceId = linked.serviceId;
        }
        if (!serviceId) {
          missing.push({ key: line.key, title: line.title });
          continue;
        }
        resolved.push({
          serviceId,
          title,
          quantity: line.quantity,
          priceType,
          catalogProductId: line.catalogProductId,
        });
      }
      if (!resolved.length) {
        toast({
          title: "No suppliers yet",
          description: "None of these products currently have listed suppliers.",
          variant: "destructive",
        });
        return;
      }
      if (missing.length) {
        const missingKeys = new Set(missing.map((m) => m.key));
        const kept = quoteCart.filter((l) => !missingKeys.has(l.key));
        setQuoteCart(saveB2bQuoteCart(kept));
        toast({
          title: `${missing.length} product${missing.length === 1 ? "" : "s"} not included`,
          description: `No listed suppliers for: ${missing
            .map((m) => m.title)
            .slice(0, 3)
            .join(", ")}${missing.length > 3 ? "…" : ""}. Quote opened with ${resolved.length} product${
            resolved.length === 1 ? "" : "s"
          }.`,
          variant: "destructive",
        });
      }
      setQuoteService({
        id: resolved[0].serviceId,
        title:
          resolved.length > 1 ? `${resolved.length} products` : resolved[0].title,
        priceType: resolved[0].priceType ?? undefined,
        items: resolved,
      });
      setQuoteOpen(true);
    } finally {
      setCtaLoadingId(null);
    }
  }, [isAuthenticated, quoteCart, router, toast, user]);

  const handleAddMaterials = useCallback(
    (product: MaterialsProduct) => {
      addToQuote({
        key: `catalog:${product.id}`,
        catalogProductId: product.id,
        title: product.name,
        priceType: product.unitType,
        itemType: normalizeB2bQuoteItemType(product.categoryId),
      });
    },
    [addToQuote]
  );

  const handleAddListing = useCallback(
    (item: ListingCard) => {
      addToQuote({
        key: `service:${item.id}`,
        serviceId: item.id,
        title: item.title,
        priceType: item.priceType,
        itemType: normalizeB2bQuoteItemType(item.subcategory || activeSub),
      });
    },
    [activeSub, addToQuote]
  );

  const query = search.trim();
  const visibleMaterials = useMemo(() => {
    if (!query) return materialsProducts;
    return materialsProducts.filter((p) => productMatchesQuery(p, query));
  }, [materialsProducts, query]);
  const visibleListings = useMemo(() => {
    if (!query) return listings;
    return listings.filter((item) => listingMatchesQuery(item, query));
  }, [listings, query]);

  const showingCatalog = isMaterials || materialsProducts.length > 0;
  const catalogEmpty =
    !loadingItems && (showingCatalog ? materialsProducts.length === 0 : listings.length === 0);
  const filteredEmpty =
    !loadingItems &&
    !catalogEmpty &&
    (showingCatalog ? visibleMaterials.length === 0 : visibleListings.length === 0);
  const resultCount = showingCatalog ? visibleMaterials.length : visibleListings.length;
  const quoteCartItemType = getB2bQuoteCartItemType(quoteCart);

  return (
    <div className={`min-h-screen bg-[linear-gradient(180deg,#fff8f5_0%,#ffffff_28%,#f8fafc_100%)] ${quoteCart.length ? "pb-24" : ""}`}>
      <section className="relative overflow-hidden border-b border-slate-800/70 bg-[linear-gradient(135deg,#0b1220_0%,#111827_52%,#1a1524_100%)] text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-orange-500/15 blur-[90px]" />
          <div className="absolute right-0 bottom-0 h-48 w-48 rounded-full bg-[hsl(var(--red-accent))]/15 blur-[80px]" />
        </div>
        <div className="relative home-shell py-8 md:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-100/90">
              Wholesale & trade
            </span>
          </div>
          <h1 className="mt-4 max-w-[18ch] text-[1.85rem] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[2.35rem]">
            Source products <span className="text-orange-300">nationwide</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
            Construction materials, electrical, furniture and hardware. Add products of the same
            item type to your quote list, then get one combined quote from listed suppliers.
          </p>

          <form
            role="search"
            aria-label="Search B2B products"
            className="mt-6 max-w-2xl rounded-2xl border border-white/10 bg-white p-1.5 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.7)] sm:p-2"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(search.trim());
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search cement, cables, plywood, furniture…"
                  className="h-11 border-0 bg-transparent pl-10 pr-10 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 sm:h-12"
                  aria-label="Search products on this page"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <Button type="submit" className="h-11 shrink-0 px-5 sm:h-12">
                Search
              </Button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Popular</span>
            {POPULAR_B2B_SEARCHES.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setSearch(term)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  search.trim().toLowerCase() === term.toLowerCase()
                    ? "border-orange-300 bg-orange-300/20 text-orange-100"
                    : "border-white/15 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="home-shell space-y-8 py-8 md:py-10">
        {loadingCats ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading categories…
          </div>
        ) : categories.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-500">
            B2B categories are not configured yet. Add them in Admin → Categories.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const on = cat.slug === activeSlug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => selectCategory(cat.slug)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      on
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {activeCategory && activeCategory.subcategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selectSub(null)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    !activeSub ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  All
                </button>
                {activeCategory.subcategories.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => selectSub(sub)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                      activeSub === sub ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            ) : null}

            {loadingItems ? (
              <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading products…
              </div>
            ) : catalogEmpty ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Package className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900">No products listed yet</p>
                <p className="mt-1 text-sm text-slate-500">
                  Suppliers in this category have not listed items. Check another category or try later.
                </p>
              </div>
            ) : filteredEmpty ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900">
                  No products matching “{query}”
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Try another keyword, pick a popular search, or switch category.
                </p>
                <Button type="button" variant="outline" className="mt-4" onClick={() => setSearch("")}>
                  Clear search
                </Button>
              </div>
            ) : showingCatalog ? (
              <>
                {query ? (
                  <p className="text-sm text-slate-500">
                    {resultCount} result{resultCount === 1 ? "" : "s"} for “{query}”
                  </p>
                ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {visibleMaterials.map((product) => (
                  <MaterialsProductCard
                    key={product.id}
                    product={product}
                    hidePrice
                    detailHref={`/b2b-services/products/${product.id}`}
                    inQuoteList={quoteCart.some((l) => l.key === `catalog:${product.id}`)}
                    onAddToQuote={handleAddMaterials}
                  />
                ))}
              </div>
              </>
            ) : (
              <>
                {query ? (
                  <p className="text-sm text-slate-500">
                    {resultCount} result{resultCount === 1 ? "" : "s"} for “{query}”
                  </p>
                ) : null}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {visibleListings.map((item) => (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <Link href={`/service/${item.id}`} className="block">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.title}
                          className="aspect-square w-full bg-slate-50 object-cover"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-slate-50 text-slate-300">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                      <div className="space-y-1 p-2">
                        <p className="line-clamp-2 text-xs font-bold leading-snug text-slate-900">
                          {item.title}
                        </p>
                      </div>
                    </Link>
                    <div className="px-2 pb-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={quoteCart.some((l) => l.key === `service:${item.id}`) ? "secondary" : "outline"}
                        className="w-full"
                        onClick={() => handleAddListing(item)}
                      >
                        {quoteCart.some((l) => l.key === `service:${item.id}`)
                          ? "Added to quote"
                          : "Add to quote"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
              </>
            )}

            {isMaterials ? (
              <p className="text-center text-sm text-slate-500">
                Looking for the full materials hub?{" "}
                <Link href="/construction-materials" className="font-medium text-[hsl(var(--red-accent))] underline">
                  Open Construction Materials
                </Link>
              </p>
            ) : null}
          </>
        )}
      </div>

      {quoteCart.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="home-shell flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-slate-700">
              <ShoppingCart className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="font-semibold">
                {quoteCart.length} product{quoteCart.length === 1 ? "" : "s"} in quote list
                {quoteCartItemType ? ` · ${quoteCartItemType.replace(/-/g, " ")}` : ""}
              </span>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline"
              onClick={() => setQuoteCart(clearB2bQuoteCart())}
            >
              Clear
            </button>
            <Button
              type="button"
              disabled={ctaLoadingId === "quote-cart"}
              onClick={() => void openQuoteFromCart()}
            >
              {ctaLoadingId === "quote-cart" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Get best quote"
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {quoteService ? (
        <GetBestQuotesModal
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          serviceId={quoteService.id}
          serviceTitle={quoteService.title}
          priceType={quoteService.priceType}
          items={quoteService.items}
          onSubmitted={() => setQuoteCart(clearB2bQuoteCart())}
          noCountdown
        />
      ) : null}
    </div>
  );
}
