"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api-client";
import { normalizeHomeService, type HomeService } from "@/lib/home-data";
import {
  SHOP_BY_BRAND_FALLBACK,
  type ShopByBrandRow,
} from "@/lib/shopByBrand";
import { cn } from "@/lib/utils";
import { ServicesList, type ServicesListHandle } from "./ServicesList";

function mapCatalogProducts(
  raw: unknown[],
  categorySlug: string,
): HomeService[] {
  return (Array.isArray(raw) ? raw : []).map((row) => {
    const p = row as Record<string, unknown>;
    const min = p.suggestedPriceMin != null ? Number(p.suggestedPriceMin) : null;
    const max = p.suggestedPriceMax != null ? Number(p.suggestedPriceMax) : null;
    const hasRange =
      min != null &&
      max != null &&
      Number.isFinite(min) &&
      Number.isFinite(max) &&
      max > 0;
    const image =
      Array.isArray(p.images) && p.images.length > 0 ? String(p.images[0]) : undefined;
    const slug =
      typeof p.categorySlug === "string" && p.categorySlug
        ? p.categorySlug
        : categorySlug;
    return normalizeHomeService(
      {
        id: String(p._id || p.id || ""),
        _id: String(p._id || p.id || ""),
        title: String(p.name || "Product"),
        name: String(p.name || "Product"),
        images: image ? [image] : [],
        image,
        priceMode: hasRange ? "range" : "exact",
        priceMin: hasRange ? min ?? undefined : undefined,
        priceMax: hasRange ? max ?? undefined : undefined,
        price: hasRange ? min || 0 : Number(min || max || 0) || 0,
        priceType:
          typeof p.suggestedPriceType === "string" ? p.suggestedPriceType : undefined,
        priceLabel: "",
        rating: 0,
        reviewCount: 0,
        source: "catalog",
        categorySlug: slug,
      },
      slug,
    );
  });
}

/** Fixed row height — banner image must not change section size. */
const BRAND_ROW_HEIGHT = "h-[248px] sm:h-[260px] md:h-[272px]";

function BrandBanner({ row }: { row: ShopByBrandRow }) {
  return (
    <Link
      href={row.href}
      className="group relative flex h-full w-[160px] shrink-0 flex-col overflow-hidden sm:w-[180px] md:w-[200px]"
      style={{ background: row.bannerBg }}
    >
      <div className="relative z-10 shrink-0 px-3 pt-3 sm:px-4 sm:pt-4">
        <p
          className="truncate text-sm font-extrabold leading-none tracking-tight sm:text-base"
          style={{ color: row.logoColor }}
        >
          {row.logoText}
        </p>
        {row.logoSub ? (
          <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-black/70">
            {row.logoSub}
          </p>
        ) : null}
        <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-black/55 sm:text-[11px]">
          {row.tagline}
        </p>
      </div>
      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- CMS brand art URLs */}
        <img
          src={row.bannerImage}
          alt=""
          width={200}
          height={160}
          className="pointer-events-none absolute inset-0 h-full w-full max-h-full max-w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
    </Link>
  );
}

function BrandRow({ row }: { row: ShopByBrandRow }) {
  const listHandleRef = useRef<ServicesListHandle | null>(null);
  const [products, setProducts] = useState<HomeService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api.productCatalog
      .list({
        categorySlug: row.categorySlug,
        search: row.search,
        limit: 12,
        page: 1,
      })
      .then((res) => {
        if (cancelled) return;
        const raw =
          (res?.data as { products?: unknown[] } | undefined)?.products ?? [];
        setProducts(mapCatalogProducts(raw, row.categorySlug));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [row.categorySlug, row.search]);

  const scrollRight = useCallback(() => {
    listHandleRef.current?.scrollByItems("right", 3);
  }, []);

  const noopFavorite = useCallback((_serviceId: string) => {}, []);

  return (
    <div
      className={cn(
        "relative flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white",
        BRAND_ROW_HEIGHT,
      )}
    >
      <BrandBanner row={row} />

      <div className="relative flex min-h-0 min-w-0 flex-1 items-center overflow-hidden py-2 pl-3 pr-3 sm:py-2.5 sm:pl-4 sm:pr-4 md:pl-5 md:pr-5">
        {loading || products.length > 0 ? (
          <div className="min-h-0 w-full overflow-hidden">
            <ServicesList
              key={`${row.id}:${loading ? "loading" : "ready"}`}
              ref={listHandleRef}
              services={products}
              isLoading={loading}
              skeletonCount={6}
              favoritesById={{}}
              favoritesVersion={0}
              onToggleFavorite={noopFavorite}
            />
          </div>
        ) : (
          <div className="flex items-center px-2 text-sm text-slate-500">
            No {row.name} products yet
          </div>
        )}

        {!loading && products.length > 0 ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={scrollRight}
            aria-label={`Scroll ${row.name} products`}
            className={cn(
              "absolute right-2 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border-slate-200 bg-white shadow-md",
              "hover:bg-slate-50 sm:right-3 sm:h-10 sm:w-10",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type ShopByBrandSectionProps = {
  initialRows?: ShopByBrandRow[];
};

export function ShopByBrandSection({ initialRows }: ShopByBrandSectionProps) {
  const rows = initialRows !== undefined ? initialRows : [...SHOP_BY_BRAND_FALLBACK];

  if (rows.length === 0) return null;

  return (
    <section className="bg-slate-100/80 py-8 md:py-12" aria-label="Shop by Brand">
      <div className="home-shell">
        <div className="mb-5 md:mb-7">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl md:text-3xl">
            Shop by Brand
          </h2>
        </div>

        <div className="space-y-4 md:space-y-5">
          {rows.map((row) => (
            <BrandRow key={row.id} row={row} />
          ))}
        </div>
      </div>
    </section>
  );
}
