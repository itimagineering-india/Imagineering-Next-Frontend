"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { CategoryScrollSection } from "./CategoryScrollSection";
import api from "@/lib/api-client";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { parseAddressContext } from "@/hooks/useGoogleGeocoder";
import { useFavorites } from "@/hooks/useFavorites";
import { CardSkeleton } from "./CardSkeleton";

interface CategorySection {
  title: string;
  categorySlug: string;
  services: any[];
}

// SPEED TEST: 1x1 gray pixel (data URL) - zero network, instant load for comparison
const DUMMY_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'%3E%3Crect fill='%23e2e8f0' width='240' height='180'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'%3EService%3C/text%3E%3C/svg%3E";

// Normalize service from API (id/_id, name/title, location string/object)
function normalizeService(s: any): {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
} {
  const id = s?.id ?? s?._id ?? "";
  const name = s?.name ?? s?.title ?? "Service";
  const image =
    (Array.isArray(s?.images) && s.images.length > 0 ? s.images[0] : null) ||
    s?.image ||
    DUMMY_IMAGE;
  let location = s?.location;
  if (typeof location === "object" && location !== null) {
    location = location?.city ?? location?.address ?? "Location not available";
  }
  location = typeof location === "string" ? location : "Location not available";
  return {
    id: String(id),
    name: String(name),
    image: String(image),
    location,
    price: Number(s?.price) || 0,
    mrp: s?.mrp != null ? Number(s.mrp) : undefined,
    priceLabel: s?.priceLabel ?? "/ project",
    rating: Number(s?.rating) ?? 0,
    reviewCount: Number(s?.reviewCount) ?? 0,
  };
}

export function CategorySections() {
  const { userLocation, radiusKm } = useUserLocation();
  const [sections, setSections] = useState<CategorySection[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const viewTriggeredRef = useRef(false);

  const allServiceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of sections) {
      for (const item of s.services) {
        if (item?.id) ids.add(item.id);
      }
    }
    return Array.from(ids);
  }, [sections]);

  const { favorites, toggleFavorite } = useFavorites({
    serviceIds: allServiceIds,
    enabled: allServiceIds.length > 0,
  });

  const favoritesByIdRef = useRef<Record<string, boolean>>({});
  const prevFavoritesRef = useRef<Set<string>>(new Set());
  const [favoritesVersion, setFavoritesVersion] = useState(0);

  useEffect(() => {
    const prev = prevFavoritesRef.current;
    const next = favorites;

    let changed = false;

    next.forEach((id) => {
      if (!prev.has(id)) {
        favoritesByIdRef.current[id] = true;
        changed = true;
      }
    });

    prev.forEach((id) => {
      if (!next.has(id)) {
        delete favoritesByIdRef.current[id];
        changed = true;
      }
    });

    if (changed) {
      prevFavoritesRef.current = next;
      setFavoritesVersion((v) => v + 1);
    }
  }, [favorites]);

  const onToggleFavorite = useCallback((serviceId: string) => {
    void toggleFavorite(serviceId);
  }, [toggleFavorite]);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const params: {
        limit: number;
        location?: string;
        lat?: number;
        lng?: number;
        radiusKm?: number;
      } = { limit: 6 };
      const cityFromProfile =
        typeof userLocation?.city === "string" && userLocation.city.trim()
          ? userLocation.city.trim()
          : "";
      const cityFromAddress =
        !cityFromProfile && userLocation?.address
          ? parseAddressContext({
              place_name: userLocation.address,
              center: [0, 0],
              id: "",
            }).city.trim()
          : "";
      const cityLabel = cityFromProfile || cityFromAddress;
      if (cityLabel) {
        params.location = cityLabel;
      } else if (
        userLocation?.lat != null &&
        userLocation?.lng != null &&
        Number.isFinite(userLocation.lat) &&
        Number.isFinite(userLocation.lng)
      ) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radiusKm = radiusKm;
      }
      const res = await api.services.getByCategories(params);
      if (!res?.success) {
        const msg =
          (res as any)?.error?.message ||
          "Failed to load categories. Please try again.";
        setLoadError(msg);
        setInitialLoad(false);
        return;
      }

      const rawCategories = (res.data as any)?.categories ?? [];
      const categories: CategorySection[] = rawCategories.map((cat: any) => ({
        title: cat.category?.name ?? "Unknown",
        categorySlug: cat.category?.slug ?? "",
        services: (cat.services ?? []).map(normalizeService),
      }));

      setSections(categories);
      setLoadError(null);
      setInitialLoad(false);
    } catch (error: any) {
      console.error("[CategorySections] Failed to load:", error);
      setLoadError(
        error?.message ||
          "Cannot load categories. Check if the backend server is running."
      );
      setInitialLoad(false);
    }
  }, [userLocation?.city, userLocation?.address, userLocation?.lat, userLocation?.lng, radiusKm]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !viewTriggeredRef.current) {
          viewTriggeredRef.current = true;
          setHasEnteredView(true);
        }
      },
      { rootMargin: "100px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEnteredView) return;
    void loadData();
  }, [hasEnteredView, loadData]);

  if (!hasEnteredView) {
    return (
      <section ref={sectionRef} className="py-8 md:py-10 bg-white" aria-label="Categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="min-h-[240px] flex items-center justify-center text-slate-500 text-sm" aria-hidden="true">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl mx-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-100 border border-dashed border-slate-300" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (initialLoad && sections.length === 0 && !loadError) {
    return (
      <section ref={sectionRef} className="py-8 md:py-10 bg-white" aria-busy="true" aria-label="Loading categories">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 space-y-6">
          <div className="py-3 md:py-4">
            <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
              <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
              <div className="flex gap-2">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 10 }).map((_, idx) => (
                <CardSkeleton key={idx} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section ref={sectionRef} className="py-8 md:py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-slate-600 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setInitialLoad(true);
              loadData();
            }}
            className="text-red-500 font-medium hover:underline"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!initialLoad && sections.length === 0) {
    return (
      <section ref={sectionRef} className="py-8 md:py-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-600">
          No categories available
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-8 md:py-10 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 space-y-6">
        {sections.map((section, sectionIndex) => (
          <CategoryScrollSection
            key={section.categorySlug}
            title={section.title}
            categorySlug={section.categorySlug}
            services={section.services}
            prioritizeImages={sectionIndex === 0}
            favoritesById={favoritesByIdRef.current}
            favoritesVersion={favoritesVersion}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
