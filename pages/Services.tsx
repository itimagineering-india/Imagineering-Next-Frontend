"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ServiceCard } from "@/components/ServiceCard";
import { FilterPanel, FilterState } from "@/components/FilterPanel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { List, SlidersHorizontal, Map as MapIcon, MapPin, Share2, Heart, Navigation, Loader2, Star, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useServices } from "@/hooks/useServices";
import { isBrowseMapAvailable } from "@/lib/publicMaps";
import { BrowseMap, type ServiceMarker, type ProviderMarker } from "@/components/map/BrowseMap";
import { countPlottableMapMarkers } from "@/utils/mapMarkerCount";

import type { CitySeoContent } from "@/constants/citySeoContent";
import { CitySeoSections } from "@/components/seo/CitySeoSections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export async function getServerSideProps() { return { props: {} }; }

export interface ServicesCityIntro {
  title: string;
  description: string;
}

interface ServicesProps {
  /** When set (e.g. from city page /bhopal), location is fixed to this city for API and display */
  fixedLocationText?: string;
  /** City center coordinates for map and provider radius filter (when on city page) */
  fixedLat?: number;
  fixedLng?: number;
  /** Optional hero block shown below header (for city landing pages) */
  cityIntro?: ServicesCityIntro;
  /** Optional city-specific SEO content (static content, FAQ, internal links, CTA) - rendered after listing */
  seoContent?: CitySeoContent | null;
}

export default function Services(props: ServicesProps = {}) {
  const { fixedLocationText, fixedLat, fixedLng, cityIntro, seoContent } = props;
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { toast, dismiss: dismissToast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("map");
  const [browseMode, setBrowseMode] = useState<"providers" | "services">(() => {
    const view = searchParams?.get("view");
    if (view === "services" || view === "providers") return view;
    try {
      const saved = localStorage.getItem("servicesBrowseMode");
      return saved === "services" ? "services" : "providers";
    } catch {
      return "providers";
    }
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    category: [],
    subcategory: [],
    priceRange: [0, 5000],
    rating: 0,
    deliveryTime: [],
    verified: false,
    featured: false,
    location: undefined,
    sortBy: "relevance",
  });
  
  // Use sortBy from filters, fallback to "relevance"
  const sortBy = filters.sortBy || "relevance";
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const BROWSE_PAGE_SIZE = 20;
  /** Grid/list first page. */
  const itemsPerPage = BROWSE_PAGE_SIZE;
  /** Nearby radius for services + providers (matches backend SERVICES_GEO_MAX_RADIUS_KM). */
  const mapRadiusKm = 50;
  // We do client-side pagination on `filteredServices`, so fetch enough services from the API.
  // Server-side pagination is used for the services API

  // Map — fly-to from “Center on My Location” / marker interactions
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapOnlyUserLocation, setMapOnlyUserLocation] = useState<{ lat: number; lng: number } | null>(null); // For marker only – does not trigger search refetch
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null); // Ref to avoid stale closures
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [mapFlyRevision, setMapFlyRevision] = useState(0);

  const [locationNudgeOpen, setLocationNudgeOpen] = useState(false);
  const [locationNudgeKind, setLocationNudgeKind] = useState<"gps_failed" | "no_api">("gps_failed");
  const [locationRetryLoading, setLocationRetryLoading] = useState(false);

  // Providers state (for Providers browse mode)
  const [providers, setProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [providersPagination, setProvidersPagination] = useState<any>(null);

  const queryParam = searchParams?.get("q") || "";
  const categoryParam = searchParams?.get("category") || "";
  const subcategoryParam = searchParams?.get("subcategory") || "";
  const locationParam = searchParams?.get("location") || "";
  const locationTextParam = searchParams?.get("locationText") || "";
  const effectiveLocationText = fixedLocationText || locationTextParam;
  const providerParam = searchParams?.get("provider") || "";
  const latParam = searchParams?.get("lat");
  const lngParam = searchParams?.get("lng");

  /** Block services fetch until URL/city coords known or browser geolocation finishes — stops duplicate cache keys (no-lat vs lat). */
  const [locationGateReady, setLocationGateReady] = useState(() => {
    if (typeof window === "undefined") return false;
    const hasUrl =
      latParam &&
      lngParam &&
      Number.isFinite(parseFloat(latParam)) &&
      Number.isFinite(parseFloat(lngParam));
    const hasFixed =
      fixedLat != null &&
      fixedLng != null &&
      Number.isFinite(fixedLat) &&
      Number.isFinite(fixedLng);
    if (hasUrl || hasFixed) return true;
    if (typeof navigator === "undefined" || !navigator.geolocation) return true;
    return false;
  });

  const maxPriceParam = searchParams?.get("maxPrice");
  const sortParam = searchParams?.get("sort") || "";

  // Keep browseMode in sync with URL + localStorage
  useEffect(() => {
    const view = searchParams?.get("view");
    if (view === "services" || view === "providers") {
      setBrowseMode(view);
      try {
        localStorage.setItem("servicesBrowseMode", view);
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  const setBrowseModeAndPersist = (mode: "providers" | "services") => {
    setBrowseMode(mode);
    try {
      localStorage.setItem("servicesBrowseMode", mode);
    } catch {
      // ignore
    }
    const next = new URLSearchParams(searchParams?.toString() ?? "");
    next.set("view", mode);
    router.replace(`${pathname}?${next.toString()}`);
  };
  
  // Sync URL params to filter state on mount (only once when categories are loaded)
  // Use a ref to track if we've already synced to prevent re-syncing when filters change
  const hasSyncedUrlParams = useRef(false);
  
  useEffect(() => {
    if (categories.length === 0 || hasSyncedUrlParams.current) return;
    
    // Only sync if URL has category/subcategory params and filters are empty
    // This ensures URL params are respected on initial load, but user can override with filters
    if (categoryParam && filters.category.length === 0) {
      setFilters(prev => ({
        ...prev,
        category: [categoryParam],
      }));
      hasSyncedUrlParams.current = true;
    }
    
    if (subcategoryParam && filters.subcategory.length === 0) {
      setFilters(prev => ({
        ...prev,
        subcategory: [subcategoryParam],
      }));
      hasSyncedUrlParams.current = true;
    }
    
    // Mark as synced even if no params to prevent re-running
    if (!categoryParam && !subcategoryParam) {
      hasSyncedUrlParams.current = true;
    }
  }, [categories.length, categoryParam, subcategoryParam, filters.category.length, filters.subcategory.length]);

  // Fetch categories from API (with caching and retry) - load immediately
  useEffect(() => {
    let isCancelled = false;
    const cacheKey = 'categories_cache_with_subcategories';
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Check cache first and set immediately
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        const hasSubcategories = Array.isArray(data)
          && data.length > 0
          && data.some((cat: any) => Array.isArray(cat?.subcategories));
        if (Date.now() - timestamp < cacheExpiry && hasSubcategories) {
          setCategories(data);
          // Still fetch fresh data in background
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    const fetchCategories = async (attempt: number = 0) => {
      if (isCancelled) return;
      
      try {
        const response = await api.categories.getAll(false, { includeSubcategories: true });
        if (isCancelled) return;
        
        if (response.success && response.data) {
          const categoriesData = (response.data as any).categories || [];
          setCategories(categoriesData);
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({
            data: categoriesData,
            timestamp: Date.now(),
          }));
        } else if (response.error?.message?.includes('Too many requests')) {
          // Use cached data if available, don't show error if we have cache
          if (!cached && attempt === 0) {
            // Retry once for rate limit
            setTimeout(() => fetchCategories(1), 2000);
            return;
          }
          if (!cached) {
            toast({
              title: "Rate Limit Exceeded",
              description: response.error.message,
              variant: "destructive",
            });
          }
        } else if (attempt < 1) {
          // Retry once on other errors
          setTimeout(() => fetchCategories(attempt + 1), 1000);
          return;
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Retry once on network errors
        if (attempt < 1 && (error as any)?.message?.includes('fetch')) {
          setTimeout(() => fetchCategories(attempt + 1), 1000);
          return;
        }
        // Keep cached data as fallback
      }
    };
    
    // Fetch immediately, no debounce
    fetchCategories(0);
    
    return () => {
      isCancelled = true;
    };
  }, []);

  // Find category object if we have categories
  const categoryObj = useMemo(() => {
    if (categories.length > 0 && categoryParam) {
      return categories.find((c) => c.slug === categoryParam) || null;
    }
    return null;
  }, [categories, categoryParam]);

  // Update userLocationRef when userLocation changes
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Build query params - only include valid values (no undefined)
  // When in map view, fetch more services so all markers show (like Google Maps did)
  const tileLatForMap = fixedLat ?? userLocation?.lat ?? (latParam ? parseFloat(latParam) : null);
  const tileLngForMap = fixedLng ?? userLocation?.lng ?? (lngParam ? parseFloat(lngParam) : null);
  const hasCoordsForTileForMap =
    typeof tileLatForMap === "number" &&
    typeof tileLngForMap === "number" &&
    Number.isFinite(tileLatForMap) &&
    Number.isFinite(tileLngForMap);

  const servicesParams = useMemo(() => {
    const usePreciseGeo = hasCoordsForTileForMap;
    const params: any = {
      page: viewMode === "map" ? 1 : currentPage,
      ...(viewMode !== "map" ? { limit: BROWSE_PAGE_SIZE } : {}),
    };
    
    // Priority: filters.category > URL categoryParam
    // If user has manually set filters, use those instead of URL params
    if (filters.category.length > 0) {
      // Use the first selected category from filters
      const filterCategorySlug = filters.category[0];
      const filterCategoryObj = categories.find((c) => c.slug === filterCategorySlug);
      if (filterCategoryObj?._id) {
        params.category = filterCategoryObj._id;
      }
    } else if (categoryObj?._id) {
      // Fallback to URL param if no filter is set
      params.category = categoryObj._id;
    } else if (categoryParam && categories.length === 0) {
      // If we have categoryParam but categories haven't loaded yet, return empty params
      // This will prevent API call until categories are loaded
      return null;
    }

    if (!locationGateReady) {
      return null;
    }
    
    // Priority: filters.subcategory > URL subcategoryParam
    if (filters.subcategory.length > 0) {
      // Use the first selected subcategory from filters
      params.subcategory = filters.subcategory[0];
    } else if (subcategoryParam) {
      // Fallback to URL param if no filter is set
      params.subcategory = subcategoryParam;
    }
    
    // Add provider filter if selected
    if (filters.provider) {
      params.provider = filters.provider;
    } else if (providerParam) {
      params.provider = providerParam;
    }

    // Push filters to backend to reduce payload
    if (filters.featured) {
      params.featured = true;
    }
    if (filters.rating > 0) {
      params.minRating = filters.rating;
    }
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000) {
      params.minPrice = filters.priceRange[0];
      params.maxPrice = filters.priceRange[1];
    } else if (maxPriceParam) {
      const mp = Number(maxPriceParam);
      if (Number.isFinite(mp)) params.maxPrice = mp;
    }

    // Sort mapping for backend
    if (sortBy === "price-low") params.sort = "price";
    if (sortBy === "price-high") params.sort = "-price";
    if (sortBy === "rating") params.sort = "-rating";
    if (sortBy === "relevance") {
      if (sortParam === "best") params.sort = "-rating";
      if (sortParam === "price_low") params.sort = "price";
      if (sortParam === "price_high") params.sort = "-price";
      if (sortParam === "rating") params.sort = "-rating";
    }

    // Precise lat/lng + precise=1 → $geoNear, distance-sorted (nearest first).
    // Do NOT send `tile` here: tile bucket uses createdAt order, not distance.
    if (usePreciseGeo) {
      params.lat = tileLatForMap!;
      params.lng = tileLngForMap!;
      params.radiusKm = mapRadiusKm;
      params.precise = 1;
    }

    if (viewMode === "map") {
      params.compact = 1;
    }

    // City label for non-geo queries only — omit when precise=1 so cache keys match geo intent.
    if (effectiveLocationText && !locationParam && !usePreciseGeo) {
      params.location = effectiveLocationText;
    }
    
    // Add search query if available
    if (queryParam) {
      params.q = queryParam;
    }
    
    return params;
  }, [
    currentPage,
    viewMode,
    categoryObj,
    categoryParam,
    subcategoryParam,
    latParam,
    lngParam,
    queryParam,
    providerParam,
    userLocation,
    filters.category,
    filters.subcategory,
    filters.provider,
    filters.featured,
    filters.rating,
    filters.priceRange,
    sortBy,
    categories,
    locationParam,
    locationTextParam,
    effectiveLocationText,
    fixedLocationText,
    fixedLat,
    fixedLng,
    hasCoordsForTileForMap,
    tileLatForMap,
    tileLngForMap,
    maxPriceParam,
    sortParam,
    locationGateReady,
    mapRadiusKm,
  ]);

  // Reset UI pagination when the query context changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    queryParam,
    categoryParam,
    subcategoryParam,
    latParam,
    lngParam,
    filters.category,
    filters.subcategory,
    filters.provider,
    filters.featured,
    filters.rating,
    filters.priceRange,
    sortBy,
  ]);


  // Use services hook - with debounce for map movements (600ms)
  // Don't wait for map initialization - fetch immediately
  const { 
    services, 
    isLoading, 
    error: servicesError,
    pagination: servicesPagination 
  } = useServices(servicesParams, {
    debounceMs: 0, // No debounce for initial load - fetch immediately
    immediate: true, // Fetch immediately, don't wait for map
  });

  const servicesLoading = !locationGateReady || isLoading;

  // Fetch providers when in Providers browse mode
  useEffect(() => {
    let isCancelled = false;
    const fetchProviders = async () => {
      if (browseMode !== "providers") return;
      setProvidersLoading(true);
      setProvidersError(null);
      try {
        const categorySlug =
          (filters.category && filters.category.length > 0 ? filters.category[0] : "") ||
          categoryParam ||
          undefined;

        const locationLat = fixedLat ?? userLocation?.lat ?? (latParam ? parseFloat(latParam) : NaN);
        const locationLng = fixedLng ?? userLocation?.lng ?? (lngParam ? parseFloat(lngParam) : NaN);
        const hasLocation = Number.isFinite(locationLat) && Number.isFinite(locationLng);

        const resp = await api.providers.getAll({
          categorySlug,
          subcategory:
            (filters.subcategory && filters.subcategory.length > 0 ? filters.subcategory[0] : "") ||
            subcategoryParam ||
            undefined,
          q: queryParam || undefined,
          ...(hasLocation ? { lat: locationLat, lng: locationLng, radiusKm: mapRadiusKm } : {}),
        });

        if (isCancelled) return;
        if (resp.success && resp.data) {
          const list = (resp.data as any).providers || [];
          setProviders(list);
          setProvidersPagination((resp as any).pagination || (resp as any).data?.pagination || null);
        } else {
          setProviders([]);
          setProvidersPagination(null);
          setProvidersError((resp as any)?.error?.message || "Failed to load providers");
        }
      } catch (e: any) {
        if (isCancelled) return;
        setProviders([]);
        setProvidersPagination(null);
        setProvidersError(e?.message || "Failed to load providers");
      } finally {
        if (!isCancelled) setProvidersLoading(false);
      }
    };

    fetchProviders();
    return () => {
      isCancelled = true;
    };
  }, [
    browseMode,
    filters.category,
    filters.subcategory,
    categoryParam,
    subcategoryParam,
    queryParam,
    userLocation,
    latParam,
    lngParam,
    fixedLat,
    fixedLng,
    mapRadiusKm,
  ]);
  
  // Debug log
  useEffect(() => {
    console.log('[Services] useServices hook state:', {
      servicesCount: services.length,
      isLoading,
      servicesLoading,
      locationGateReady,
      error: servicesError,
      params: servicesParams,
      userLocation,
      latParam,
      lngParam,
    });
  }, [services.length, isLoading, servicesLoading, servicesError, servicesParams, locationGateReady, userLocation, latParam, lngParam]);

  // Show error toast if services fetch fails
  useEffect(() => {
    if (servicesError) {
      toast({
        title: "Error",
        description: servicesError,
        variant: "destructive",
      });
    }
  }, [servicesError, toast]);

  // Track previous filter state to detect changes
  const prevFiltersRef = useRef<FilterState>(filters);
  const filterChangeToastRef = useRef<string | number | null>(null);
  const mapMarkersLoadingToastRef = useRef<string | number | null>(null);
  const paginationToastRef = useRef<string | number | null>(null);
  const prevPageRef = useRef(currentPage);

  // Map view: loading toast until services or provider markers finish loading
  useEffect(() => {
    if (viewMode !== "map") {
      if (mapMarkersLoadingToastRef.current !== null) {
        dismissToast(String(mapMarkersLoadingToastRef.current));
        mapMarkersLoadingToastRef.current = null;
      }
      return;
    }

    const loading =
      browseMode === "services" ? servicesLoading : providersLoading;

    if (!loading) {
      if (mapMarkersLoadingToastRef.current !== null) {
        dismissToast(String(mapMarkersLoadingToastRef.current));
        mapMarkersLoadingToastRef.current = null;
      }
      return;
    }

    if (mapMarkersLoadingToastRef.current !== null) {
      dismissToast(String(mapMarkersLoadingToastRef.current));
      mapMarkersLoadingToastRef.current = null;
    }
    const headline =
      browseMode === "services"
        ? "Loading services…"
        : "Loading providers…";
    const t = toast({
      title: (
        <span className="flex w-full flex-col items-center gap-4 py-1 text-center">
          <Loader2
            className="h-12 w-12 shrink-0 animate-spin text-primary"
            aria-hidden
          />
          <span className="text-base font-semibold leading-tight">{headline}</span>
        </span>
      ),
      description: (
        <span className="block text-center text-sm text-muted-foreground">
          Plotting markers on the map
        </span>
      ),
      duration: 0,
      className:
        "fixed left-1/2 top-1/2 z-[200] w-[min(90vw,22rem)] -translate-x-1/2 -translate-y-1/2 border border-border/80 bg-background/95 p-6 shadow-2xl backdrop-blur-md " +
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 " +
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 " +
        "sm:bottom-auto sm:right-auto [&>button]:hidden",
    });
    mapMarkersLoadingToastRef.current = t.id;
  }, [viewMode, browseMode, servicesLoading, providersLoading, toast, dismissToast]);

  // Show loading toast when filters change (but not on initial mount)
  useEffect(() => {
    // Skip on initial mount - only show toast on actual filter changes
    if (prevFiltersRef.current.category.length === 0 && 
        prevFiltersRef.current.subcategory.length === 0 &&
        filters.category.length === 0 && 
        filters.subcategory.length === 0) {
      prevFiltersRef.current = filters;
      return;
    }

    // Check if filters actually changed
    const categoryChanged = JSON.stringify(prevFiltersRef.current.category) !== JSON.stringify(filters.category);
    const subcategoryChanged = JSON.stringify(prevFiltersRef.current.subcategory) !== JSON.stringify(filters.subcategory);
    const priceChanged = JSON.stringify(prevFiltersRef.current.priceRange) !== JSON.stringify(filters.priceRange);
    const ratingChanged = prevFiltersRef.current.rating !== filters.rating;
    const deliveryTimeChanged = JSON.stringify(prevFiltersRef.current.deliveryTime) !== JSON.stringify(filters.deliveryTime);
    const verifiedChanged = prevFiltersRef.current.verified !== filters.verified;
    const featuredChanged = prevFiltersRef.current.featured !== filters.featured;
    const locationChanged = prevFiltersRef.current.location !== filters.location;
    const sortByChanged = prevFiltersRef.current.sortBy !== filters.sortBy;

    if (categoryChanged || subcategoryChanged || priceChanged || ratingChanged || 
        deliveryTimeChanged || verifiedChanged || featuredChanged || locationChanged || sortByChanged) {
      
      // Dismiss previous toast if any
      if (filterChangeToastRef.current !== null) {
        dismissToast(String(filterChangeToastRef.current));
      }

      // Show loading toast
      const toastResult = toast({
        title: "Applying filters...",
        description: "Loading services with your selected filters",
        duration: 0, // Don't auto-dismiss - we'll dismiss it manually
      });

      filterChangeToastRef.current = toastResult.id;
    }

    // Update previous filters
    prevFiltersRef.current = filters;
  }, [filters, toast]);

  // Show loading toast when pagination changes (skip initial)
  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
    prevPageRef.current = currentPage;

    if (paginationToastRef.current !== null) {
      dismissToast(String(paginationToastRef.current));
    }

    const toastResult = toast({
      title: "Loading next page...",
      description: "Fetching more services",
      duration: 0,
    });

    paginationToastRef.current = toastResult.id;
  }, [currentPage, toast, dismissToast]);

  // Dismiss loading toast when services finish loading
  // (This will be defined after filteredServices - see below)

  // Calculate distance between two coordinates (Haversine formula)
  // Memoized to avoid recalculating for the same coordinates
  const calculateDistance = useCallback((
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }, []);

  // Memoize user location to avoid recalculations (city page → fixed coords; else URL or GPS)
  const currentUserLocation = useMemo(() => {
    if (
      typeof fixedLat === "number" &&
      typeof fixedLng === "number" &&
      Number.isFinite(fixedLat) &&
      Number.isFinite(fixedLng)
    ) {
      return { lat: fixedLat, lng: fixedLng };
    }
    if (userLocation) return userLocation;
    if (
      latParam &&
      lngParam &&
      Number.isFinite(parseFloat(latParam)) &&
      Number.isFinite(parseFloat(lngParam))
    ) {
      return { lat: parseFloat(latParam), lng: parseFloat(lngParam) };
    }
    return null;
  }, [userLocation, latParam, lngParam, fixedLat, fixedLng]);

  // Used for distance + map (must be above hooks that depend on it)
  const getServiceCoordinates = useCallback((service: any): { lat: number; lng: number } | null => {
    const coords = service?.location?.coordinates;
    if (coords && coords.lat !== undefined && coords.lng !== undefined) {
      const lat = Number(coords.lat);
      const lng = Number(coords.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        return { lat, lng };
      }
    }
    const lat = service?.location?.lat ?? service?.location?.latitude;
    const lng = service?.location?.lng ?? service?.location?.longitude;
    if (lat !== undefined && lng !== undefined) {
      const parsedLat = Number(lat);
      const parsedLng = Number(lng);
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }
    const providerAddr = service?.provider?.businessAddress;
    const provCoords = providerAddr?.coordinates;
    if (provCoords && provCoords.lat !== undefined && provCoords.lng !== undefined) {
      const pl = Number(provCoords.lat);
      const pn = Number(provCoords.lng);
      if (!Number.isNaN(pl) && !Number.isNaN(pn)) return { lat: pl, lng: pn };
    }
    return null;
  }, []);

  const getProviderCoordinates = useCallback((provider: any): { lat: number; lng: number } | null => {
    const coords =
      provider?.businessAddress?.coordinates ||
      provider?.user?.location?.coordinates ||
      provider?.location?.coordinates;
    if (!coords) return null;
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  }, []);

  // Memoize distance calculations - only calculate when needed for sorting
  const servicesWithDistances = useMemo(() => {
    const shouldComputeDistances = Boolean(
      currentUserLocation && currentUserLocation.lat != null && currentUserLocation.lng != null
    );

    if (!shouldComputeDistances || !currentUserLocation) {
      return services.map((s) => ({ ...s, _distance: Infinity as number }));
    }

    const loc = currentUserLocation;
    return services.map((s: any) => {
      if (typeof s.distanceKm === "number" && Number.isFinite(s.distanceKm)) {
        return { ...s, _distance: s.distanceKm };
      }
      const pt = getServiceCoordinates(s);
      if (!pt) return { ...s, _distance: Infinity as number };
      const distance = calculateDistance(loc.lat, loc.lng, pt.lat, pt.lng);
      return { ...s, _distance: distance };
    });
  }, [services, currentUserLocation, calculateDistance, getServiceCoordinates]);

  // Optimized filtering: Apply cheapest filters first, early returns
  const filteredServices = useMemo(() => {
    // Early return if no services
    if (services.length === 0) {
      return [];
    }

    let result = servicesWithDistances;

    // Filter by delivery time (client-only)
    if (filters.deliveryTime.length > 0) {
      const deliveryTimeMap: Record<string, string[]> = {
        '1day': ['1 day', '1', 'same day', 'today'],
        '3days': ['3 days', '3', '1-3 days'],
        '7days': ['7 days', '1 week', '7', '1-7 days'],
        '14days': ['14 days', '2 weeks', '14', '1-2 weeks'],
        '30days': ['30 days', '1 month', '30', 'month'],
      };
      
      result = result.filter((s) => {
        const deliveryTime = s.deliveryTime || '';
        return filters.deliveryTime.some((filterValue) => {
          const possibleValues = deliveryTimeMap[filterValue] || [];
          return possibleValues.some((value) => 
            deliveryTime.toLowerCase().includes(value.toLowerCase())
          );
        });
      });
      if (result.length === 0) return [];
    }

    // Radius filter (50km) for grid/list — map uses tile-scoped API; 50km here would drop edge-of-tile services.
    if (
      viewMode !== "map" &&
      currentUserLocation &&
      currentUserLocation.lat &&
      currentUserLocation.lng
    ) {
      result = result.filter((s) => {
        const distance = (s as any)._distance;
        // Keep items without coordinates so map can geocode them later
        if (distance === Infinity) return true;
        return typeof distance === "number" && distance <= mapRadiusKm;
      });
      // Do not return [] here — map may use tile/city scope (wide area) while this filter
      // tightens to ~50km; if everything is outside that ring, fall through to the safety
      // check below so grid/list still shows the same rows the map had.
    }

    // Safety check: If all services were filtered out, show original services
    if (result.length === 0 && services.length > 0) {
      return servicesWithDistances;
    }

    // Nearest first when "Relevance" and we have a reference point (matches API $geoNear order + ties)
    if (
      sortBy === "relevance" &&
      currentUserLocation?.lat != null &&
      currentUserLocation?.lng != null
    ) {
      result = [...result].sort((a: any, b: any) => {
        const da = a._distance ?? Infinity;
        const db = b._distance ?? Infinity;
        if (da === db) return 0;
        return da - db;
      });
    }

    return result;
  }, [
    servicesWithDistances,
    filters.deliveryTime,
    currentUserLocation,
    viewMode,
    sortBy,
    services.length,
  ]);

  const getServiceLocationKey = (service: any): string => {
    const location = service?.location || {};
    let parts = [location.address, location.city, location.state]
      .filter(Boolean)
      .map((value: any) => String(value).trim())
      .filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    // Fallback: use provider's businessAddress
    const providerAddr = service?.provider?.businessAddress;
    if (providerAddr) {
      parts = [providerAddr.address, providerAddr.city, providerAddr.state]
        .filter(Boolean)
        .map((v: any) => String(v).trim())
        .filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return "";
  };

  // Map view services with coordinates or geocodable location
  const mapViewServicesAll = useMemo(() => {
    if (viewMode !== "map") return filteredServices;
    return filteredServices.filter((service) => {
      if (getServiceCoordinates(service)) return true;
      return Boolean(getServiceLocationKey(service));
    });
  }, [filteredServices, viewMode, getServiceCoordinates]);

  // Providers filtering (client-side search)
  const filteredProviders = useMemo(() => {
    const q = (queryParam || "").trim().toLowerCase();
    if (!q) return providers;
    return (providers || []).filter((p: any) => {
      const businessName = (p?.businessName || "").toString().toLowerCase();
      const userName = (p?.user?.name || "").toString().toLowerCase();
      const categoryName = (p?.primaryCategory?.name || "").toString().toLowerCase();
      const addr = p?.businessAddress || p?.user?.location || p?.location || {};
      const locationKey = [addr.address, addr.city, addr.state]
        .filter(Boolean)
        .map((v: any) => String(v).trim())
        .filter(Boolean)
        .join(", ")
        .toLowerCase();
      return (
        businessName.includes(q) ||
        userName.includes(q) ||
        categoryName.includes(q) ||
        locationKey.includes(q)
      );
    });
  }, [providers, queryParam]);

  /** Providers browse: nearest first when we have a reference point */
  const providersOrdered = useMemo(() => {
    if (
      !currentUserLocation?.lat ||
      !currentUserLocation?.lng ||
      filteredProviders.length === 0
    ) {
      return filteredProviders;
    }
    const { lat: ulat, lng: ulng } = currentUserLocation;
    return [...filteredProviders].sort((a: any, b: any) => {
      const ca = getProviderCoordinates(a);
      const cb = getProviderCoordinates(b);
      const da = ca ? calculateDistance(ulat, ulng, ca.lat, ca.lng) : Infinity;
      const db = cb ? calculateDistance(ulat, ulng, cb.lat, cb.lng) : Infinity;
      if (da === db) return 0;
      return da - db;
    });
  }, [filteredProviders, currentUserLocation, calculateDistance, getProviderCoordinates]);

  const getProviderLocationKey = (provider: any): string => {
    const addr = provider?.businessAddress || provider?.user?.location || provider?.location || {};
    const parts = [addr.address, addr.city, addr.state]
      .filter(Boolean)
      .map((v: any) => String(v).trim())
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "";
  };

  const mapViewProvidersAll = useMemo(() => {
    if (viewMode !== "map") return providersOrdered;
    return (providersOrdered || []).filter((p: any) => {
      if (getProviderCoordinates(p)) return true;
      return Boolean(getProviderLocationKey(p));
    });
  }, [providersOrdered, viewMode]);

  const mapReady = isBrowseMapAvailable();

  // Map center for Mappls (same priority as search: city/URL/GPS, then map-only GPS, then Delhi)
  const mapCenter = useMemo(() => {
    if (mapOnlyUserLocation) return mapOnlyUserLocation;
    if (currentUserLocation) return currentUserLocation;
    return { lat: 28.6139, lng: 77.209 };
  }, [currentUserLocation, mapOnlyUserLocation]);

  // Map service markers (Mappls)
  const mapServiceMarkers = useMemo((): ServiceMarker[] => {
    return mapViewServicesAll.map((s: any) => {
      const coords = getServiceCoordinates(s);
      const locKey = getServiceLocationKey(s);
      const cat = s.category;
      const categoryName = typeof cat === "object" ? cat?.name : categories.find((c: any) => c._id === cat)?.name || "";
      const categoryIcons: Record<string, string> = {
        contractors: "#3b82f6", machines: "#ef4444", "construction-companies": "#8b5cf6",
        logistics: "#10b981", vendors: "#f59e0b", "rental-services": "#ec4899", land: "#14b8a6",
        homes: "#06b6d4", space: "#6366f1", manufacturer: "#f97316", "construction-materials": "#84cc16",
        manpower: "#22c55e", "technical-manpower": "#06b6d4", finance: "#10b981",
      };
      const slug = (s.category?.slug || s.categorySlug || "").toLowerCase();
      const color = s.featured ? "#fbbf24" : (categoryIcons[slug] || "#dc2626");
      return {
        id: s.id || s._id || "",
        lat: coords?.lat,
        lng: coords?.lng,
        address: locKey || undefined,
        title: s.title || "Service",
        categoryName,
        description: (s.description || "").substring(0, 100),
        price: s.price,
        priceType: s.priceType,
        featured: s.featured,
        color,
      };
    });
  }, [mapViewServicesAll, categories]);

  // Map provider markers (Mappls)
  const mapProviderMarkers = useMemo((): ProviderMarker[] => {
    return mapViewProvidersAll.map((p: any) => {
      const coords = getProviderCoordinates(p);
      const locKey = getProviderLocationKey(p);
      const id = p._id || p.id || "";
      const profileHref = p?.isFallbackProfile
        ? `/services?provider=${encodeURIComponent(p?.user?._id || id)}&view=services`
        : `/provider/${p?.slug || id}`;
      const categoryIcons: Record<string, string> = {
        contractors: "#3b82f6", machines: "#ef4444", "construction-companies": "#8b5cf6",
        logistics: "#10b981", vendors: "#f59e0b", "rental-services": "#ec4899", land: "#14b8a6",
        homes: "#06b6d4", space: "#6366f1", manufacturer: "#f97316", "construction-materials": "#84cc16",
        manpower: "#22c55e", "technical-manpower": "#06b6d4", finance: "#10b981",
      };
      const slug = (p?.primaryCategory?.slug || p?.primaryCategorySlug || "").toLowerCase();
      const addr = p?.businessAddress || p?.user?.location || {};
      const fullLocation = [addr.address, addr.city, addr.state].filter(Boolean).map((v: any) => String(v).trim()).filter(Boolean).join(", ");
      return {
        id,
        lat: coords?.lat,
        lng: coords?.lng,
        address: locKey || undefined,
        title: p?.businessName || p?.user?.name || "Provider",
        addressDisplay: fullLocation || undefined,
        profileHref,
        color: categoryIcons[slug] || "#dc2626",
      };
    });
  }, [mapViewProvidersAll]);

  const mapPlottedMarkerCount = useMemo(
    () => countPlottableMapMarkers(browseMode, mapServiceMarkers, mapProviderMarkers),
    [browseMode, mapServiceMarkers, mapProviderMarkers],
  );

  // Dismiss loading toast when services finish loading
  useEffect(() => {
    if (!servicesLoading && filterChangeToastRef.current !== null) {
      dismissToast(String(filterChangeToastRef.current));
      
      // Show success toast briefly
      const filteredCount = filteredServices.length;
      toast({
        title: "Filters applied",
        description: `Found ${filteredCount} service${filteredCount !== 1 ? 's' : ''}`,
        duration: 2000,
      });

      filterChangeToastRef.current = null;
    }

    if (!servicesLoading && paginationToastRef.current !== null) {
      dismissToast(String(paginationToastRef.current));
      paginationToastRef.current = null;
    }
  }, [servicesLoading, filteredServices.length, toast, dismissToast]);

  const currentCategory = categories.find((c) => c.slug === categoryParam);

  // Get location for map centering only - does NOT update userLocation/search (prevents services disappearing)
  const getLocationForMapCenter = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      setIsLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocationLoading(false);
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setIsLocationLoading(false);
          let errorMessage = "Unable to get your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out. Please try again.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
              break;
          }
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          reject(new Error(errorMessage));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Get user's current location (updates userLocation state - affects search/filter)
  const getUserLocation = useCallback(
    (opts?: { silent?: boolean }): Promise<{ lat: number; lng: number }> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by this browser."));
          return;
        }

        setIsLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(location);
            setIsLocationLoading(false);
            resolve(location);
          },
          (error) => {
            setIsLocationLoading(false);
            let errorMessage = "Unable to get your location. ";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += "Please allow location access in your browser settings.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += "Location information is unavailable.";
                break;
              case error.TIMEOUT:
                errorMessage += "Location request timed out. Please try again.";
                break;
              default:
                errorMessage += "An unknown error occurred.";
                break;
            }
            if (!opts?.silent) {
              toast({
                title: "Location Error",
                description: errorMessage,
                variant: "destructive",
              });
            }
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    },
    [toast]
  );

  const handleRetryLocationFromDialog = useCallback(async () => {
    setLocationRetryLoading(true);
    try {
      await getUserLocation();
      setLocationNudgeOpen(false);
    } catch {
      // Toast already shown by getUserLocation
    } finally {
      setLocationRetryLoading(false);
    }
  }, [getUserLocation]);

  useEffect(() => {
    const hasUrl =
      latParam &&
      lngParam &&
      Number.isFinite(parseFloat(latParam)) &&
      Number.isFinite(parseFloat(lngParam));
    const hasFixed =
      fixedLat != null &&
      fixedLng != null &&
      Number.isFinite(fixedLat) &&
      Number.isFinite(fixedLng);

    if (hasUrl || hasFixed) {
      setLocationGateReady(true);
      setLocationNudgeOpen(false);
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationNudgeKind("no_api");
      setLocationNudgeOpen(true);
      setLocationGateReady(true);
      return;
    }

    let cancelled = false;
    getUserLocation({ silent: true })
      .catch(() => {
        if (!cancelled) {
          setLocationNudgeKind("gps_failed");
          setLocationNudgeOpen(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLocationGateReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [latParam, lngParam, fixedLat, fixedLng, getUserLocation]);



  return (
    <div className="min-h-screen flex flex-col">

      <Dialog open={locationNudgeOpen} onOpenChange={setLocationNudgeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              {locationNudgeKind === "no_api"
                ? "Location not available in this browser"
                : "Turn on location for better results"}
            </DialogTitle>
            <DialogDescription className="text-left space-y-2 pt-1">
              {locationNudgeKind === "no_api" ? (
                <>
                  Imagineering India uses your area to show nearby services and providers. This browser does not
                  support GPS, or access is blocked. Use the <strong>location search in the header</strong> to set
                  your city or area, then results will match that place.
                </>
              ) : (
                <>
                  We could not read your current location (permission denied, timeout, or unavailable). For{" "}
                  <strong>nearest-first</strong> listings and distance on cards, allow location when prompted, or
                  choose a place from the <strong>header search</strong>. You can continue browsing without it—results
                  may be less local.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocationNudgeOpen(false)}
              disabled={locationRetryLoading}
            >
              {locationNudgeKind === "no_api" ? "Got it" : "Continue without location"}
            </Button>
            {locationNudgeKind === "gps_failed" && (
              <Button type="button" onClick={() => void handleRetryLocationFromDialog()} disabled={locationRetryLoading}>
                {locationRetryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Getting location…
                  </>
                ) : (
                  "Try again"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {cityIntro && (
        <section className="border-b bg-muted/30">
          <div className="container px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{cityIntro.title}</h1>
            <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-full leading-relaxed">{cityIntro.description}</p>
          </div>
        </section>
      )}

      <main className="flex-1">
        {/* Main Content */}
        <div className="container px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 lg:gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
              <FilterPanel 
                showVerifiedOnlyFilter={false}
                onFilterChange={(newFilters) => {
                  // Clear subcategories if categories are cleared
                  if (newFilters.category.length === 0 && filters.category.length > 0) {
                    setFilters({ ...newFilters, subcategory: [] });
                  } else {
                    setFilters(newFilters);
                  }
                }} 
                categories={categories} 
              />
            </aside>

            {/* Services Grid */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 md:mb-6 gap-2 md:gap-4 flex-wrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden shrink-0">
                        <SlidersHorizontal className="h-4 w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden xs:inline">Filters</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0 flex flex-col">
                      <SheetHeader className="px-4 py-3 border-b space-y-0 text-left">
                        <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
                      </SheetHeader>
                      <div className="flex-1 overflow-y-auto px-4 py-3">
                        <FilterPanel 
                          showVerifiedOnlyFilter={false}
                          onFilterChange={(newFilters) => {
                            // Clear subcategories if categories are cleared
                            if (newFilters.category.length === 0 && filters.category.length > 0) {
                              setFilters({ ...newFilters, subcategory: [] });
                            } else {
                              setFilters(newFilters);
                            }
                          }} 
                          categories={categories} 
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Active Filters */}
                  {filters.category.length > 0 && (
                    <div className="hidden md:flex gap-2">
                      {filters.category.map((slug) => {
                        const cat = categories.find((c) => c.slug === slug);
                        return (
                          <Badge key={slug} variant="secondary">
                            {cat?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Providers / Services — in toolbar for list/grid; above map when map view */}
                  {viewMode !== "map" && (
                    <div className="flex border rounded-lg overflow-hidden w-full sm:w-auto">
                      <Button
                        variant={browseMode === "providers" ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-none flex-1 sm:flex-initial"
                        onClick={() => {
                          setBrowseModeAndPersist("providers");
                          setCurrentPage(1);
                        }}
                      >
                        Providers
                      </Button>
                      <Button
                        variant={browseMode === "services" ? "secondary" : "ghost"}
                        size="sm"
                        className="rounded-none border-l flex-1 sm:flex-initial"
                        onClick={() => {
                          setBrowseModeAndPersist("services");
                          setCurrentPage(1);
                        }}
                      >
                        Services
                      </Button>
                    </div>
                  )}

                  {/* View Toggle */}
                  <div className="hidden sm:flex border rounded-lg">
                    <Button
                      variant={viewMode === "map" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-r-none"
                      onClick={() => setViewMode("map")}
                      title="Map View"
                      aria-label="Switch to map view"
                    >
                      <MapIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-l-none"
                      onClick={() => setViewMode("list")}
                      title="List View"
                      aria-label="Switch to list view"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Services */}
              {viewMode === "map" ? (
                /* Map View - Always show map regardless of services count */
                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isLocationLoading && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                        <span className="hidden sm:inline">Getting your location...</span>
                        <span className="sm:hidden">Getting location...</span>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          let location: { lat: number; lng: number };
                          if (userLocation) {
                            location = userLocation;
                          } else {
                            location = await getLocationForMapCenter();
                          }
                          setMapOnlyUserLocation(location);
                          setMapFlyTo({ lat: location.lat, lng: location.lng, zoom: 14 });
                          setMapFlyRevision((n) => n + 1);
                        } catch {
                          // Error already handled in getLocationForMapCenter
                        }
                      }}
                      disabled={isLocationLoading}
                      className="text-xs sm:text-sm"
                    >
                      <Navigation className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">Center on My Location</span>
                      <span className="sm:hidden">My Location</span>
                    </Button>
                  </div>
                  
                  <div className="relative h-[min(58vh,560px)] sm:h-[min(65vh,680px)] md:h-[min(72vh,820px)] lg:h-[min(78vh,900px)] rounded-lg border overflow-hidden bg-muted">
                    {viewMode === "map" && (
                      <div className="pointer-events-none absolute top-3 left-3 z-30 max-w-[min(100%,calc(100%-1.5rem))]">
                        <div className="pointer-events-auto flex overflow-hidden rounded-md border bg-background/95 shadow-md backdrop-blur-sm">
                          <Button
                            type="button"
                            variant={browseMode === "providers" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 rounded-none px-3 text-[11px] font-semibold sm:text-xs"
                            onClick={() => {
                              setBrowseModeAndPersist("providers");
                              setCurrentPage(1);
                              setViewMode("map");
                            }}
                          >
                            Providers
                          </Button>
                          <Button
                            type="button"
                            variant={browseMode === "services" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 rounded-none border-l border-border px-3 text-[11px] font-semibold sm:text-xs"
                            onClick={() => {
                              setBrowseModeAndPersist("services");
                              setCurrentPage(1);
                            }}
                          >
                            Services
                          </Button>
                        </div>
                      </div>
                    )}
                    {mapReady ? (
                      <div
                        className="relative w-full h-full min-h-0 bg-muted"
                        style={{
                          display: viewMode === "map" ? "block" : "none",
                          zIndex: viewMode === "map" ? 1 : -1,
                        }}
                      >
                        <BrowseMap
                          center={mapCenter}
                          zoom={12}
                          serviceMarkers={mapServiceMarkers}
                          providerMarkers={mapProviderMarkers}
                          userLocation={mapOnlyUserLocation ?? userLocation}
                          browseMode={browseMode}
                          className="rounded-lg"
                          flyToTarget={mapFlyTo}
                          flyToRevision={mapFlyRevision}
                        />
                        {viewMode === "map" && (
                          <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[min(100%,calc(100%-1.5rem))]">
                            <Badge
                              variant="secondary"
                              className="border bg-background/95 px-2.5 py-1.5 text-[11px] font-semibold shadow-md backdrop-blur-sm tabular-nums sm:text-xs"
                            >
                              {mapPlottedMarkerCount}{" "}
                              {browseMode === "services"
                                ? mapPlottedMarkerCount === 1
                                  ? "service"
                                  : "services"
                                : mapPlottedMarkerCount === 1
                                  ? "provider"
                                  : "providers"}{" "}
                              on map
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-0 bg-muted flex items-center justify-center" />
                    )}
                    {!mapReady && viewMode === "map" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-20 p-4">
                        <Card className="p-4 md:p-6 max-w-md w-full">
                          <CardContent className="text-center space-y-3 md:space-y-4">
                            <MapIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground" />
                            <div>
                              <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Map access required</h3>
                              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                                Add a <strong>Mapbox</strong> public token (recommended for the public site) from{" "}
                                <a
                                  href="https://account.mapbox.com/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  Mapbox
                                </a>
                                , or a <strong>Google Maps</strong> key from{" "}
                                <a
                                  href="https://console.cloud.google.com/google/maps-apis"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  Google Cloud Console
                                </a>
                                . For Google-only setup, enable <strong>Maps JavaScript API</strong> and{" "}
                                <strong>Places API</strong>.
                              </p>
                              <div className="text-left bg-muted p-2.5 md:p-3 rounded-lg space-y-1.5 md:space-y-2">
                                <p className="text-[11px] md:text-xs font-medium">Environment (e.g. .env.local):</p>
                                <ul className="text-[10px] md:text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                  <li>
                                    <code className="px-1 py-0.5 bg-background rounded break-all">
                                      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=...
                                    </code>
                                  </li>
                                  <li>
                                    or{" "}
                                    <code className="px-1 py-0.5 bg-background rounded break-all">
                                      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
                                    </code>
                                  </li>
                                </ul>
                                <p className="text-[10px] md:text-xs text-muted-foreground">Restart the dev server after changes.</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => setViewMode("grid")} className="mt-4">
                                Switch to Grid View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                </div>
              ) : browseMode === "providers" ? (
                providersLoading ? (
                  /* Loading providers skeleton */
                  <div className="space-y-3 md:space-y-4">
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                          : "space-y-3 md:space-y-4"
                      }
                    >
                      {Array.from({ length: 6 }).map((_, index) => (
                        <Card key={`provider-skel-${index}`} className="overflow-hidden">
                          {viewMode === "grid" ? (
                            <>
                              <Skeleton className="w-full h-48" />
                              <CardContent className="p-4 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                              </CardContent>
                            </>
                          ) : (
                            <div className="flex gap-4 p-4">
                              <Skeleton className="w-32 h-32 flex-shrink-0" />
                              <div className="flex-1 space-y-3">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : providersOrdered.length > 0 ? (
                  <>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                          : "space-y-3 md:space-y-4"
                      }
                    >
                      {providersOrdered.map((p: any, index: number) => {
                        const name = p?.businessName || p?.user?.name || "Provider";
                        const addr = p?.businessAddress || p?.user?.location || {};
                        const coords = getProviderCoordinates(p);
                        const fullLocation = [addr.address, addr.city, addr.state]
                          .filter(Boolean)
                          .map((v: any) => String(v).trim())
                          .filter(Boolean)
                          .join(", ");
                        const distanceKm =
                          currentUserLocation && coords
                            ? calculateDistance(currentUserLocation.lat, currentUserLocation.lng, coords.lat, coords.lng)
                            : null;
                        return (
                          <Card
                            key={p._id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <Link
                              href={
                                p?.isFallbackProfile
                                  ? `/services?provider=${encodeURIComponent(
                                      p?.user?._id || p?._id
                                    )}&view=services`
                                  : `/provider/${p?.slug || p._id}`
                              }
                              className={
                                viewMode === "list"
                                  ? "flex items-center gap-3 sm:gap-4 p-3 sm:p-4"
                                  : "block"
                              }
                            >
                              <div
                                className={
                                  viewMode === "list"
                                    ? "w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0"
                                    : "w-full aspect-[4/3] bg-muted flex items-center justify-center"
                                }
                              >
                                {p?.businessLogo ? (
                                  <img
                                    src={p.businessLogo}
                                    alt={name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="text-xs text-muted-foreground">Business</div>
                                )}
                              </div>
                              <CardContent
                                className={
                                  viewMode === "list"
                                    ? "space-y-1 px-0 py-0 flex-1 min-w-0"
                                    : "p-3 space-y-1"
                                }
                              >
                                <div className="text-sm font-semibold line-clamp-2">{name}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {fullLocation || "Location"}
                                </div>
                                {distanceKm !== null && Number.isFinite(distanceKm) && (
                                  <div className="text-[11px] text-muted-foreground">
                                    {distanceKm.toFixed(1)} km away
                                  </div>
                                )}
                                {typeof p?.serviceCount === "number" && (
                                  <div className="text-[11px] text-muted-foreground">
                                    {p.serviceCount} services
                                  </div>
                                )}
                                
                                {/* Rating and Experience */}
                                <div className="flex items-center gap-2 mt-1.5">
                                  {/* Rating */}
                                  <div className="flex items-center gap-0.5">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-[11px] font-medium">
                                      {p?.averageRating ? p.averageRating.toFixed(1) : '4.5'}
                                    </span>
                                  </div>
                                  
                                  {/* Experience */}
                                  {p?.yearsOfExperience && (
                                    <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                                      <Briefcase className="h-3 w-3" />
                                      <span>{p.yearsOfExperience}+ yrs</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Link>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <h3 className="text-lg font-semibold mb-2">No Providers Found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Try changing filters or switch to Services view.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setBrowseMode("services")}>
                        View Services
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setFilters({
                            category: [],
                            subcategory: [],
                            priceRange: [0, 5000],
                            rating: 0,
                            deliveryTime: [],
                            verified: false,
                            featured: false,
                            location: undefined,
                            sortBy: "relevance",
                          })
                        }
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )
              ) : servicesLoading ? (
                /* Loading State with Skeleton for Grid/List View */
                <div className="space-y-3 md:space-y-4">
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                        : "space-y-3 md:space-y-4"
                    }
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className="overflow-hidden">
                        {viewMode === "grid" ? (
                          <>
                            <Skeleton className="w-full h-48" />
                            <CardContent className="p-4 space-y-3">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                              <div className="flex items-center justify-between pt-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </CardContent>
                          </>
                        ) : (
                          <div className="flex gap-4 p-4">
                            <Skeleton className="w-32 h-32 flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                              <Skeleton className="h-6 w-3/4" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                              <div className="flex items-center justify-between pt-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ) : filteredServices.length > 0 ? (
                    /* Grid/List View */
                    (() => {
                      const totalCount = servicesPagination?.total ?? filteredServices.length;
                      const totalPages = Math.ceil(totalCount / itemsPerPage);
                      const startIndex = (currentPage - 1) * itemsPerPage + 1;
                      const endIndexRaw = startIndex + filteredServices.length - 1;
                      const endIndex = totalPages > 1 ? Math.min(endIndexRaw, totalCount) : endIndexRaw;

                      // If backend doesn't compute `total`, we still allow Next/Prev using "hasMore".
                      const hasMore = filteredServices.length === itemsPerPage;
                      const hasAccurateTotal = typeof servicesPagination?.total === "number";
                      
                      return (
                        <>
                          <div
                            className={
                              viewMode === "grid"
                                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                                : "space-y-3 md:space-y-4"
                            }
                          >
                            {filteredServices.map((service, index) => (
                              <div
                                key={service.id || service._id}
                                className="animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <ServiceCard 
                                  {...service}
                                  id={service.id || service._id}
                                  slug={service.slug}
                                  viewMode={viewMode}
                                  location={service.location}
                                  distanceKm={
                                    typeof (service as any).distanceKm === "number" &&
                                    Number.isFinite((service as any).distanceKm)
                                      ? (service as any).distanceKm
                                      : (service as any)._distance != null &&
                                          (service as any)._distance !== Infinity
                                        ? Math.round((service as any)._distance * 10) / 10
                                        : undefined
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Pagination Info and Controls */}
                          {(totalPages > 1 || hasMore || currentPage > 1) && (
                            <div className="mt-6 md:mt-8 lg:mt-10 px-4 space-y-4">
                              {/* Pagination Info */}
                              <div className="text-center text-sm text-muted-foreground">
                                Showing {startIndex}-{endIndex}
                                {hasAccurateTotal ? ` of ${totalCount} services` : ""}
                                {totalPages > 1 ? ` (Page ${currentPage} of ${totalPages})` : ""}
                              </div>
                              
                              {/* Pagination Controls */}
                              <div className="flex justify-center">
                                <div className="flex gap-1.5 md:gap-2 flex-wrap justify-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs md:text-sm"
                                  disabled={currentPage === 1}
                                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                >
                                  <span className="hidden sm:inline">Previous</span>
                                  <span className="sm:hidden">Prev</span>
                                </Button>
                                
                                {totalPages > 1 && (() => {
                                  const pages: (number | string)[] = [];
                                  const maxVisible = 5;
                                  
                                  if (totalPages <= maxVisible) {
                                    for (let i = 1; i <= totalPages; i++) {
                                      pages.push(i);
                                    }
                                  } else {
                                    pages.push(1);
                                    
                                    if (currentPage > 3) {
                                      pages.push('...');
                                    }
                                    
                                    const start = Math.max(2, currentPage - 1);
                                    const end = Math.min(totalPages - 1, currentPage + 1);
                                    
                                    for (let i = start; i <= end; i++) {
                                      pages.push(i);
                                    }
                                    
                                    if (currentPage < totalPages - 2) {
                                      pages.push('...');
                                    }
                                    
                                    if (totalPages > 1) {
                                      pages.push(totalPages);
                                    }
                                  }
                                  
                                  return pages.map((page, idx) => {
                                    if (page === '...') {
                                      return (
                                        <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs md:text-sm text-muted-foreground">
                                          ...
                                        </span>
                                      );
                                    }
                                    
                                    const pageNum = page as number;
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? "secondary" : "outline"}
                                        size="sm"
                                        className="text-xs md:text-sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                      >
                                        {pageNum}
                                      </Button>
                                    );
                                  });
                                })()}
                                
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs md:text-sm"
                                  disabled={!hasMore}
                                  onClick={() => setCurrentPage((prev) => prev + 1)}
                                >
                                  <span className="hidden sm:inline">Next</span>
                                  <span className="sm:hidden">Next</span>
                                </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()
                  ) : (
                <div className="text-center py-12 md:py-16 px-4">
                  <p className="text-sm md:text-base lg:text-lg text-muted-foreground mb-3 md:mb-4">
                    No services found matching your criteria.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 md:mt-4 text-xs md:text-sm"
                    onClick={() =>
                      setFilters({
                        category: [],
                        subcategory: [],
                        priceRange: [0, 5000],
                        rating: 0,
                        deliveryTime: [],
                        verified: false,
                        featured: false,
                        location: undefined,
                        sortBy: "relevance",
                      })
                    }
                  >
                    Clear all filters
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {seoContent && <CitySeoSections content={seoContent} />}

    </div>
  );
}
