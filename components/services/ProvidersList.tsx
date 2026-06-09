"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- provider/list payloads mirror Vite app */
/* eslint-disable @next/next/no-img-element -- remote provider logos; same as Vite */

import { memo, useMemo, useRef, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Map as MapIcon, Star, Briefcase } from "lucide-react";
import { getProviderCoordinates, getProviderLocationKey, haversineKm } from "@/utils/servicesGeoHelpers";
import { useMapSidebarColumns, useBrowseGridColumns } from "@/hooks/useBrowseGridColumns";
import api from "@/lib/api-client";

const providerRatingCache = new Map<string, { averageRating: number | null; reviewCount: number | null }>();

function distanceKmForProvider(
  p: any,
  userLat: number | undefined,
  userLng: number | undefined
): number | null {
  const hasUser =
    userLat != null && userLng != null && Number.isFinite(userLat) && Number.isFinite(userLng);
  if (!hasUser) return null;
  const coords = getProviderCoordinates(p);
  if (!coords) return null;
  return haversineKm(userLat!, userLng!, coords.lat, coords.lng);
}

function toFiniteOrNull(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getProviderRatingSnapshot(provider: any): { averageRating: number | null; reviewCount: number | null } {
  const averageRating =
    toFiniteOrNull(provider?.averageRating) ??
    toFiniteOrNull(provider?.rating) ??
    toFiniteOrNull(provider?.stats?.averageRating) ??
    toFiniteOrNull(provider?.provider?.averageRating);
  const reviewCount =
    toFiniteOrNull(provider?.reviewCount) ??
    toFiniteOrNull(provider?.totalReviews) ??
    toFiniteOrNull(provider?.stats?.reviewCount) ??
    toFiniteOrNull(provider?.provider?.reviewCount);
  return { averageRating, reviewCount };
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [];
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    rows.push(arr.slice(i, i + size));
  }
  return rows;
}

const ProviderMapCard = memo(function ProviderMapCard({
  p,
  distanceKm,
  onFlyTo,
}: {
  p: any;
  distanceKm: number | null;
  onFlyTo: (lat: number, lng: number, zoom?: number) => void;
}) {
  const coords = getProviderCoordinates(p);
  const name = p?.businessName || p?.user?.name || "Provider";
  const addr = p?.businessAddress || p?.user?.location || {};
  const fullLocation = [addr.address, addr.city, addr.state]
    .filter(Boolean)
    .map((v: any) => String(v).trim())
    .filter(Boolean)
    .join(", ");

  const profileHref = p?.isFallbackProfile
    ? `/services?provider=${encodeURIComponent(p?.user?._id || p?._id)}&view=services`
    : `/provider/${p?.slug || p._id}`;

  return (
    <Card className="border hover:shadow-md transition-shadow overflow-hidden h-full">
      <Link href={profileHref}>
        <div className="relative flex h-20 w-full items-center justify-center overflow-hidden bg-muted">
          {p?.businessLogo ? (
            <img src={p.businessLogo} alt={name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="px-1 text-center text-xs text-muted-foreground">No Image</span>
          )}
        </div>
        <CardContent className="p-2 cursor-pointer">
          <div className="text-xs font-semibold line-clamp-2">{name}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{fullLocation || "Location"}</div>
          {distanceKm !== null && Number.isFinite(distanceKm) && (
            <div className="text-xs text-muted-foreground">{distanceKm.toFixed(1)} km away</div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">
                {p?.averageRating ? p.averageRating.toFixed(1) : "4.5"}
              </span>
            </div>
            {p?.yearsOfExperience && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                <span>{p.yearsOfExperience}+ yrs</span>
              </div>
            )}
          </div>
        </CardContent>
      </Link>
      {coords && (
        <div className="px-2 pb-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                onFlyTo(coords.lat, coords.lng, 14);
              }}
            >
              <MapIcon className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" className="flex-1 text-xs">
              <Link href={profileHref} onClick={(e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}>
                View Services
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
});

export interface ProvidersMapSidebarListProps {
  providers: any[];
  userLat: number | undefined;
  userLng: number | undefined;
  onFlyTo: (lat: number, lng: number, zoom?: number) => void;
}

export function ProvidersMapSidebarList({
  providers,
  userLat,
  userLng,
  onFlyTo,
}: ProvidersMapSidebarListProps) {
  const cols = useMapSidebarColumns();

  const itemsWithDistance = useMemo(() => {
    const hasUser = userLat != null && userLng != null && Number.isFinite(userLat) && Number.isFinite(userLng);
    return providers.map((p) => {
      const coords = getProviderCoordinates(p);
      let distanceKm: number | null = null;
      if (hasUser && coords) {
        distanceKm = haversineKm(userLat!, userLng!, coords.lat, coords.lng);
      }
      return { p, distanceKm };
    });
  }, [providers, userLat, userLng]);

  const rows = useMemo(() => chunk(itemsWithDistance, cols), [itemsWithDistance, cols]);

  if (providers.length === 0) return null;

  return (
    <div className="max-h-[65vh] w-full min-h-0 overflow-y-auto overflow-x-hidden md:max-h-[72vh]">
      <div className="flex flex-col gap-2 sm:gap-3">
        {rows.map((row, ri) => (
          <div
            key={`map-row-${ri}`}
            className="grid gap-2 sm:gap-3 last:pb-0 pb-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, ci) => {
              const cell = row[ci];
              if (!cell) return <div key={`pad-${ri}-${ci}`} />;
              return (
                <ProviderMapCard
                  key={`${String(cell.p._id)}-${ci}`}
                  p={cell.p}
                  distanceKm={cell.distanceKm}
                  onFlyTo={onFlyTo}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const ProviderBrowseCard = memo(function ProviderBrowseCard({
  p,
  viewMode,
  distanceKm,
}: {
  p: any;
  viewMode: "grid" | "list";
  distanceKm: number | null;
}) {
  const name = p?.businessName || p?.user?.name || "Provider";
  const addressLine = getProviderLocationKey(p);
  const providerId = String(p?._id ?? "");
  const userIdForServices = String(p?.user?._id ?? p?.user ?? "").trim() || providerId;
  const profileHref = `/provider/${p?.slug || p._id}`;
  const servicesHref = `/services?provider=${encodeURIComponent(userIdForServices)}&view=services`;
  const initialMetrics = useMemo(() => {
    const fromProvider = getProviderRatingSnapshot(p);
    if (providerId && (fromProvider.averageRating == null || fromProvider.reviewCount == null)) {
      const fromCache = providerRatingCache.get(providerId);
      if (fromCache) {
        return {
          averageRating: fromProvider.averageRating ?? fromCache.averageRating,
          reviewCount: fromProvider.reviewCount ?? fromCache.reviewCount,
        };
      }
    }
    return fromProvider;
  }, [p, providerId]);
  const [metrics, setMetrics] = useState(initialMetrics);

  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  useEffect(() => {
    let active = true;
    if (!providerId) return;
    if (metrics.averageRating != null && metrics.reviewCount != null) return;

    const cached = providerRatingCache.get(providerId);
    if (cached) {
      setMetrics((prev) => ({
        averageRating: prev.averageRating ?? cached.averageRating,
        reviewCount: prev.reviewCount ?? cached.reviewCount,
      }));
      if (cached.averageRating != null && cached.reviewCount != null) return;
    }

    api.providers
      .getById(providerId)
      .then((res) => {
        if (!active || !res.success || !res.data) return;
        const payload = res.data as any;
        const provider = payload.provider || payload;
        const fetched = getProviderRatingSnapshot(provider);
        providerRatingCache.set(providerId, fetched);
        setMetrics((prev) => ({
          averageRating: prev.averageRating ?? fetched.averageRating,
          reviewCount: prev.reviewCount ?? fetched.reviewCount,
        }));
      })
      .catch(() => {
        // Ignore fetch errors; keep existing UI fallback.
      });

    return () => {
      active = false;
    };
  }, [providerId, metrics.averageRating, metrics.reviewCount]);

  const logoBlock = (
    <>
      {p?.businessLogo ? (
        <img src={p.businessLogo} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center text-xs leading-tight text-muted-foreground break-words">
          No Image
        </div>
      )}
    </>
  );

  const actions = (
    <div
      className={
        viewMode === "list"
          ? "grid w-full shrink-0 grid-cols-2 gap-2 sm:flex sm:w-[124px] sm:flex-col sm:justify-start"
          : "flex flex-wrap gap-2 mt-auto pt-1"
      }
    >
      <Button
        variant="default"
        size="sm"
        className={viewMode === "list" ? "h-8 text-xs w-full" : "h-8 text-xs flex-1 min-w-[112px]"}
        asChild
      >
        <Link href={profileHref}>View Profile</Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={viewMode === "list" ? "h-8 text-xs w-full" : "h-8 text-xs flex-1 min-w-[112px]"}
        asChild
      >
        <Link href={servicesHref}>View Services</Link>
      </Button>
    </div>
  );

  const body = (
    <>
      <div
        className={
          viewMode === "list" ? "min-w-0 space-y-1 sm:min-w-0 sm:flex-1" : "space-y-1 min-w-0 flex-1"
        }
      >
        <Link href={profileHref} className="block group">
          <div className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </div>
        </Link>
        {addressLine ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug" title={addressLine}>
            {addressLine}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">Address not added</p>
        )}
        {distanceKm !== null && Number.isFinite(distanceKm) && (
          <p className="text-xs font-medium text-foreground">
            {distanceKm < 1
              ? `${Math.round(distanceKm * 1000)} m away`
              : `${distanceKm.toFixed(1)} km away`}
          </p>
        )}
        {typeof p?.serviceCount === "number" && (
          <p className="text-xs text-muted-foreground">{p.serviceCount} services</p>
        )}

        {p?.yearsOfExperience ? (
          <div className="mt-1 flex items-center gap-0.5 text-xs text-muted-foreground">
            <Briefcase className="h-3 w-3" />
            <span>{p.yearsOfExperience}+ yrs</span>
          </div>
        ) : null}
      </div>
      {actions}
    </>
  );

  return (
    <Card
      className={
        viewMode === "list"
          ? "w-full shrink-0 overflow-hidden shadow-sm transition-shadow hover:shadow-md"
          : "flex h-full flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md"
      }
    >
      {viewMode === "list" ? (
        <div className="flex min-h-0 min-w-0 flex-row items-start gap-3 p-3 sm:gap-4 sm:p-4">
          <Link
            href={profileHref}
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-20 sm:w-20"
          >
            <div className="absolute left-1 top-1 z-10 inline-flex items-center gap-0.5 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-xs leading-none text-white sm:left-1.5 sm:top-1.5 sm:gap-0.5">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              <span>
                {metrics.averageRating != null ? Number(metrics.averageRating).toFixed(1) : "—"}
              </span>
              {metrics.reviewCount != null && (
                <span className="text-white/75">({Math.max(0, Math.trunc(metrics.reviewCount))})</span>
              )}
            </div>
            {logoBlock}
          </Link>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            {body}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <Link
            href={profileHref}
            className="relative block aspect-[4/3] w-full overflow-hidden bg-muted"
          >
            <div className="absolute left-1 top-1 z-10 inline-flex items-center gap-0.5 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-xs leading-none text-white sm:left-1.5 sm:top-1.5">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              <span>
                {metrics.averageRating != null ? Number(metrics.averageRating).toFixed(1) : "—"}
              </span>
              {metrics.reviewCount != null && (
                <span className="text-white/75">({Math.max(0, Math.trunc(metrics.reviewCount))})</span>
              )}
            </div>
            {logoBlock}
          </Link>
          <CardContent className="flex flex-1 flex-col gap-2 p-3">{body}</CardContent>
        </div>
      )}
    </Card>
  );
});

export interface ProvidersBrowseListProps {
  providers: any[];
  viewMode: "grid" | "list";
  userLat?: number;
  userLng?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export function ProvidersBrowseList({
  providers,
  viewMode,
  userLat,
  userLng,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
}: ProvidersBrowseListProps) {
  const cols = useBrowseGridColumns();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreCooldownRef = useRef(false);

  const rows = useMemo(() => {
    if (viewMode === "list") {
      return providers.map((p) => [p]);
    }
    return chunk(providers, cols);
  }, [providers, viewMode, cols]);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const root = scrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isLoadingMore) return;
        if (loadMoreCooldownRef.current) return;
        loadMoreCooldownRef.current = true;
        onLoadMore();
        window.setTimeout(() => {
          loadMoreCooldownRef.current = false;
        }, 450);
      },
      { root, rootMargin: "160px", threshold: 0 }
    );
    io.observe(target);
    return () => io.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore, providers.length, rows.length, viewMode, cols]);

  if (providers.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="max-h-[70vh] min-h-0 w-full overflow-y-auto overflow-x-hidden sm:max-h-[75vh] lg:max-h-[78vh] [&>*+*]:mt-2 sm:[&>*+*]:mt-3 md:[&>*+*]:mt-4"
    >
      {viewMode === "list" ? (
        providers.map((p, i) => (
          <ProviderBrowseCard
            key={String(p._id ?? p.user?._id ?? `provider-${i}`)}
            p={p}
            viewMode="list"
            distanceKm={distanceKmForProvider(p, userLat, userLng)}
          />
        ))
      ) : (
        rows.map((row, ri) => (
          <div
            key={`grid-row-${ri}-${String(row[0]?._id ?? ri)}`}
            className="grid gap-3 sm:gap-4 md:gap-5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {row.map((p, ci) => (
              <div key={`${String(p._id)}-${ci}`} className="min-w-0">
                <ProviderBrowseCard
                  p={p}
                  viewMode="grid"
                  distanceKm={distanceKmForProvider(p, userLat, userLng)}
                />
              </div>
            ))}
          </div>
        ))
      )}
      {onLoadMore && hasMore ? (
        <div ref={sentinelRef} className="h-3 w-full shrink-0 pointer-events-none" aria-hidden />
      ) : null}
      {isLoadingMore && (
        <div className="flex shrink-0 justify-center py-3" aria-busy>
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      )}
    </div>
  );
}
