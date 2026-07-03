"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { CategoryScrollSection } from "./CategoryScrollSection";
import api from "@/lib/api-client";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { useFavorites } from "@/hooks/useFavorites";
import { CategorySectionsSkeleton } from "./CategoryScrollSkeleton";
import {
  normalizeHomeCategorySections,
  normalizeHomeService,
  type HomeCategorySection,
  type HomeService,
} from "@/lib/home-data";

type CategorySection = HomeCategorySection;
type NormalizedService = HomeService;

type CategorySectionsProps = {
  /** Pre-fetched on the server for View Source / SEO. */
  initialSections?: HomeCategorySection[];
};

export function CategorySections({ initialSections }: CategorySectionsProps) {
  const hasServerData = initialSections !== undefined;
  const { userLocation } = useUserLocation();
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;
  const [sections, setSections] = useState<CategorySection[]>(initialSections ?? []);
  const [initialLoad, setInitialLoad] = useState(!hasServerData);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(hasServerData);
  const sectionRef = useRef<HTMLElement>(null);
  const viewTriggeredRef = useRef(hasServerData);

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

  const favoritesById = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    favorites.forEach((id) => {
      map[id] = true;
    });
    return map;
  }, [favorites]);

  const onToggleFavorite = useCallback((serviceId: string) => {
    void toggleFavorite(serviceId);
  }, [toggleFavorite]);

  const loadData = useCallback(async () => {
    try {
      const params: {
        limit: number;
        location?: string;
        tile?: string;
        lat?: number;
        lng?: number;
        radiusKm?: number;
      } = { limit: 9 };
      const hasCoords =
        userLat != null &&
        userLng != null &&
        Number.isFinite(userLat) &&
        Number.isFinite(userLng);
      if (hasCoords) {
        params.tile = `${Math.floor(userLat)}_${Math.floor(userLng)}`;
      }
      const res = await api.services.getByCategories(params);
      if (!res?.success) {
        const msg =
          (res as { error?: { message?: string } })?.error?.message ||
          "Failed to load categories. Please try again.";
        setLoadError(msg);
        setInitialLoad(false);
        return;
      }

      const rawCategories =
        ((res.data as { categories?: Parameters<typeof normalizeHomeCategorySections>[0] } | undefined)
          ?.categories) ?? [];
      setSections(normalizeHomeCategorySections(rawCategories));
      setLoadError(null);
      setInitialLoad(false);
    } catch (error: unknown) {
      setLoadError(
        (error instanceof Error ? error.message : "") ||
          "Cannot load categories. Check if the backend server is running.",
      );
      setInitialLoad(false);
    }
  }, [userLat, userLng]);

  useEffect(() => {
    if (hasServerData) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !viewTriggeredRef.current) {
          viewTriggeredRef.current = true;
          setHasEnteredView(true);
          void loadData();
        }
      },
      { rootMargin: "100px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasServerData, loadData]);

  if (!hasEnteredView) {
    return (
      <section ref={sectionRef} className="py-8 md:py-12 bg-white" aria-label="Categories">
        <div className="home-shell">
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
      <section ref={sectionRef} className="py-8 md:py-12 bg-white" aria-busy="true" aria-label="Loading categories">
        <div className="home-shell space-y-6">
          <CategorySectionsSkeleton rows={2} />
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section ref={sectionRef} className="py-8 md:py-12 bg-white">
        <div className="home-shell text-center">
          <p className="text-slate-600 mb-4">{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setInitialLoad(true);
              void loadData();
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
      <section ref={sectionRef} className="py-8 md:py-12 bg-white">
        <div className="home-shell text-center text-slate-600">
          No categories available
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-8 md:py-12 bg-white">
      <div className="home-shell space-y-6">
        {sections.map((section, sectionIndex) => (
          <CategoryScrollSection
            key={section.categorySlug}
            title={section.title}
            categorySlug={section.categorySlug}
            services={section.services as NormalizedService[]}
            prioritizeImages={sectionIndex === 0}
            favoritesById={favoritesById}
            favoritesVersion={favorites.size}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
