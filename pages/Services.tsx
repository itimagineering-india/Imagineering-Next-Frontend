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
import { isMapboxConfigured } from "@/lib/mapConfig";
import { MapboxMap, type ServiceMarker, type ProviderMarker } from "@/components/map/MapboxMap";

import type { CitySeoContent } from "@/constants/citySeoContent";
import { CitySeoSections } from "@/components/seo/CitySeoSections";

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
  const itemsPerPage = 20; // Show 50 services per page
  const mapRadiusKm = 50; // Map radius filter when user location is available
  // We do client-side pagination on `filteredServices`, so fetch enough services from the API.
  // Server-side pagination is used for the services API
  
  // Map view pagination (sidebar list) mirrors server-side pagination
  const mapViewCurrentPage = currentPage;
  const mapViewItemsPerPage = itemsPerPage;
  
  // Map (Mappls) — fly-to from sidebar / cards
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapOnlyUserLocation, setMapOnlyUserLocation] = useState<{ lat: number; lng: number } | null>(null); // For marker only – does not trigger search refetch
  const userLocationRef = useRef<{ lat: number; lng: number } | null>(null); // Ref to avoid stale closures
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [mapFlyTo, setMapFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [mapFlyRevision, setMapFlyRevision] = useState(0);

  // Providers state (for Providers browse mode)
  const [providers, setProviders] = useState<any[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [providersPagination, setProvidersPagination] = useState<any>(null);
  const [providersMapPage, setProvidersMapPage] = useState(1);
  const PROVIDERS_MAP_PER_PAGE = 25;

  const queryParam = searchParams?.get("q") || "";
  const categoryParam = searchParams?.get("category") || "";
  const subcategoryParam = searchParams?.get("subcategory") || "";
  const locationParam = searchParams?.get("location") || "";
  const locationTextParam = searchParams?.get("locationText") || "";
  const effectiveLocationText = fixedLocationText || locationTextParam;
  const providerParam = searchParams?.get("provider") || "";
  const latParam = searchParams?.get("lat");
  const lngParam = searchParams?.get("lng");
  const radiusKmParam = searchParams?.get("radiusKm");
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

  // Auto-detect user location on page load if not in URL params
  // Always try to get location to show nearby services
  useEffect(() => {
    // Get location if:
    // 1. Not already set
    // 2. Not in URL params
    // 3. Geolocation is available
    if (!userLocation && !latParam && !lngParam && navigator.geolocation) {
      getUserLocation().catch((error) => {
        // If location access denied, don't set default location
        // This allows all services to show when we can't get user location
        console.log('Could not get user location:', error);
      });
    }
  }, []); // Run once on mount

  // Update userLocationRef when userLocation changes
  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Build query params - only include valid values (no undefined)
  // When in map view, fetch more services so all markers show (like Google Maps did)
  const servicesParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: viewMode === "map" ? 100 : itemsPerPage,
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
    
    // Include location for backend radius filtering when available (city page uses fixedLat/fixedLng)
    const locationLat = fixedLat ?? userLocation?.lat ?? (latParam ? parseFloat(latParam) : null);
    const locationLng = fixedLng ?? userLocation?.lng ?? (lngParam ? parseFloat(lngParam) : null);
    if (typeof locationLat === "number" && typeof locationLng === "number") {
      params.lat = locationLat;
      params.lng = locationLng;
    }

    // If user came from header location search or city page (fixedLocationText), pass location to backend
    if (effectiveLocationText && !locationParam) {
      params.location = effectiveLocationText;
    }
    
    // Add search query if available
    if (queryParam) {
      params.q = queryParam;
    }
    
    return params;
  }, [
    currentPage,
    itemsPerPage,
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
    maxPriceParam,
    sortParam,
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
        const radiusKm =
          radiusKmParam && Number.isFinite(Number(radiusKmParam))
            ? Number(radiusKmParam)
            : 50;

        const resp = await api.providers.getAll({
          categorySlug,
          subcategory:
            (filters.subcategory && filters.subcategory.length > 0 ? filters.subcategory[0] : "") ||
            subcategoryParam ||
            undefined,
          verified: filters.verified ? true : undefined,
          q: queryParam || undefined,
          // Show ALL providers within 50km radius (no limit/pagination); use city center when on city page
          ...(hasLocation ? { lat: locationLat, lng: locationLng, radiusKm } : {}),
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
    categoryParam,
    filters.verified,
    userLocation,
    latParam,
    lngParam,
    fixedLat,
    fixedLng,
  ]);
  
  // Debug log
  useEffect(() => {
    console.log('[Services] useServices hook state:', {
      servicesCount: services.length,
      isLoading,
      error: servicesError,
      params: servicesParams,
      userLocation,
      latParam,
      lngParam,
    });
  }, [services.length, isLoading, servicesError, servicesParams, userLocation, latParam, lngParam]);

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
  const paginationToastRef = useRef<string | number | null>(null);
  const prevPageRef = useRef(currentPage);

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

  // Memoize user location to avoid recalculations
  const currentUserLocation = useMemo(() => {
    return userLocation || (latParam && lngParam ? {
      lat: parseFloat(latParam),
      lng: parseFloat(lngParam)
    } : null);
  }, [userLocation, latParam, lngParam]);

  // Memoize distance calculations - only calculate when needed for sorting
  const servicesWithDistances = useMemo(() => {
    const shouldComputeDistances = Boolean(
      currentUserLocation && currentUserLocation.lat && currentUserLocation.lng
    );

    if (!shouldComputeDistances || !currentUserLocation) {
      return services.map((s) => ({ ...s, _distance: Infinity }));
    }

    const loc = currentUserLocation;
    return services.map((s) => {
      const serviceLocation = s.location?.coordinates;
      
      if (!serviceLocation || serviceLocation.lat === undefined || serviceLocation.lng === undefined) {
        return { ...s, _distance: Infinity };
      }
      
      const distance = calculateDistance(
        loc.lat,
        loc.lng,
        serviceLocation.lat,
        serviceLocation.lng
      );
      
      return { ...s, _distance: distance };
    });
  }, [services, currentUserLocation, calculateDistance]);

  // Optimized filtering: Apply cheapest filters first, early returns
  const filteredServices = useMemo(() => {
    // Early return if no services
    if (services.length === 0) {
      return [];
    }

    let result = servicesWithDistances;

    // Client-only filters (backend already handles most filters)
    if (filters.verified) {
      result = result.filter((s) => {
        if (typeof s.provider === 'object' && s.provider !== null) {
          return s.provider.verified === true;
        }
        return false;
      });
      if (result.length === 0) return [];
    }

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

    // Radius filter (50km) when user location is available
    if (currentUserLocation && currentUserLocation.lat && currentUserLocation.lng) {
      result = result.filter((s) => {
        const distance = (s as any)._distance;
        // Keep items without coordinates so map can geocode them later
        if (distance === Infinity) return true;
        return typeof distance === "number" && distance <= mapRadiusKm;
      });
      if (result.length === 0) return [];
    }

    // Safety check: If all services were filtered out, show original services
    if (result.length === 0 && services.length > 0) {
      return servicesWithDistances;
    }

    return result;
  }, [servicesWithDistances, filters.verified, filters.deliveryTime, currentUserLocation]);

  // Reset pagination when results change
  useEffect(() => {
    if (viewMode === "map") {
      setCurrentPage(1);
    }
  }, [filteredServices.length, viewMode]);

  // Helpers for map coordinates (fallback to provider's businessAddress when service has no location)
  const getServiceCoordinates = (service: any): { lat: number; lng: number } | null => {
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
    // Fallback: use provider's businessAddress coordinates
    const providerAddr = service?.provider?.businessAddress;
    const provCoords = providerAddr?.coordinates;
    if (provCoords && provCoords.lat !== undefined && provCoords.lng !== undefined) {
      const pl = Number(provCoords.lat);
      const pn = Number(provCoords.lng);
      if (!Number.isNaN(pl) && !Number.isNaN(pn)) return { lat: pl, lng: pn };
    }
    return null;
  };

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

  // Map view services with coordinates or geocodable location (filter first, then paginate)
  const mapViewServicesAll = useMemo(() => {
    if (viewMode !== "map") return filteredServices;
    return filteredServices.filter((service) => {
      if (getServiceCoordinates(service)) return true;
      return Boolean(getServiceLocationKey(service));
    });
  }, [filteredServices, viewMode]);

  // Map view uses server-side pagination; show current page results
  const mapViewServicesToShow = useMemo(() => {
    if (viewMode !== "map") return filteredServices;
    return mapViewServicesAll;
  }, [filteredServices, viewMode, mapViewServicesAll]);

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

  const getProviderCoordinates = (provider: any): { lat: number; lng: number } | null => {
    const coords =
      provider?.businessAddress?.coordinates ||
      provider?.user?.location?.coordinates ||
      provider?.location?.coordinates;
    if (!coords) return null;
    const lat = Number(coords.lat);
    const lng = Number(coords.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  };

  const getProviderLocationKey = (provider: any): string => {
    const addr = provider?.businessAddress || provider?.user?.location || provider?.location || {};
    const parts = [addr.address, addr.city, addr.state]
      .filter(Boolean)
      .map((v: any) => String(v).trim())
      .filter(Boolean);
    return parts.length ? parts.join(", ") : "";
  };

  const mapViewProvidersAll = useMemo(() => {
    if (viewMode !== "map") return filteredProviders;
    return (filteredProviders || []).filter((p: any) => {
      if (getProviderCoordinates(p)) return true;
      return Boolean(getProviderLocationKey(p));
    });
  }, [filteredProviders, viewMode]);

  const mapViewProvidersPaginated = useMemo(() => {
    const start = (providersMapPage - 1) * PROVIDERS_MAP_PER_PAGE;
    return mapViewProvidersAll.slice(start, start + PROVIDERS_MAP_PER_PAGE);
  }, [mapViewProvidersAll, providersMapPage]);

  const providersMapTotalPages = Math.max(1, Math.ceil(mapViewProvidersAll.length / PROVIDERS_MAP_PER_PAGE));

  const mapboxReady = isMapboxConfigured();

  // Fetch user location for map center when in map view
  useEffect(() => {
    if (!mapboxReady || viewMode !== "map" || userLocation) return;
    getUserLocation().catch(() => {});
  }, [mapboxReady, viewMode]);

  // Map center for Mappls (city → URL → user search location → map-only GPS → Delhi)
  const mapCenter = useMemo(() => {
    if (typeof fixedLat === "number" && typeof fixedLng === "number") {
      return { lat: fixedLat, lng: fixedLng };
    }
    if (latParam && lngParam) {
      const lat = parseFloat(latParam);
      const lng = parseFloat(lngParam);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    if (userLocation) return userLocation;
    if (mapOnlyUserLocation) return mapOnlyUserLocation;
    return { lat: 28.6139, lng: 77.209 };
  }, [fixedLat, fixedLng, latParam, lngParam, userLocation, mapOnlyUserLocation]);

  // Mapbox service markers
  const mapboxServiceMarkers = useMemo((): ServiceMarker[] => {
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

  // Mapbox provider markers
  const mapboxProviderMarkers = useMemo((): ProviderMarker[] => {
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

  useEffect(() => {
    setProvidersMapPage(1);
  }, [mapViewProvidersAll.length]);

  // Dismiss loading toast when services finish loading
  useEffect(() => {
    if (!isLoading && filterChangeToastRef.current !== null) {
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

    if (!isLoading && paginationToastRef.current !== null) {
      dismissToast(String(paginationToastRef.current));
      paginationToastRef.current = null;
    }
  }, [isLoading, filteredServices.length, toast, dismissToast]);

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
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
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
          toast({
            title: "Location Error",
            description: errorMessage,
            variant: "destructive",
          });
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };



  return (
    <div className="min-h-screen flex flex-col">

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
                  {/* Providers / Services Toggle (mobile + desktop) */}
                  <div className="flex border rounded-lg overflow-hidden w-full sm:w-auto">
                    <Button
                      variant={browseMode === "providers" ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-none flex-1 sm:flex-initial"
                      onClick={() => {
                        setBrowseModeAndPersist("providers");
                        setCurrentPage(1);
                        // Keep map as default in providers mode
                        setViewMode("map");
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
                          const location = await getLocationForMapCenter();
                          setMapOnlyUserLocation(location); // Show blue marker – does not trigger search
                          setMapFlyTo({ lat: location.lat, lng: location.lng, zoom: 12 });
                          setMapFlyRevision((n) => n + 1);
                        } catch (error) {
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
                  
                  <div className="relative h-[300px] sm:h-[400px] md:h-[450px] rounded-lg border overflow-hidden bg-muted">
                    {mapboxReady ? (
                      <div
                        className="w-full h-full bg-muted"
                        style={{
                          display: viewMode === "map" ? "block" : "none",
                          minHeight: "600px",
                          position: "relative",
                          zIndex: viewMode === "map" ? 1 : -1,
                        }}
                      >
                        <MapboxMap
                          center={mapCenter}
                          zoom={12}
                          serviceMarkers={mapboxServiceMarkers}
                          providerMarkers={mapboxProviderMarkers}
                          userLocation={userLocation || mapOnlyUserLocation}
                          browseMode={browseMode}
                          className="rounded-lg"
                          flyToTarget={mapFlyTo}
                          flyToRevision={mapFlyRevision}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full min-h-[600px] bg-muted flex items-center justify-center" />
                    )}
                    {!mapboxReady && viewMode === "map" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-20 p-4">
                        <Card className="p-4 md:p-6 max-w-md w-full">
                          <CardContent className="text-center space-y-3 md:space-y-4">
                            <MapIcon className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground" />
                            <div>
                              <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Map access required</h3>
                              <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                                Add a <strong>Mappls</strong> key (primary) and/or a <strong>Mapbox</strong> public token (fallback). Mappls:{" "}
                                <a
                                  href="https://auth.mappls.com/console/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  Mappls Console
                                </a>
                                . Mapbox:{" "}
                                <a
                                  href="https://account.mapbox.com/access-tokens/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline"
                                >
                                  Mapbox tokens
                                </a>
                                .
                              </p>
                              <div className="text-left bg-muted p-2.5 md:p-3 rounded-lg space-y-1.5 md:space-y-2">
                                <p className="text-[11px] md:text-xs font-medium">Steps:</p>
                                <ol className="text-[10px] md:text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                                  <li>Preferred: Mappls static REST / map key</li>
                                  <li>
                                    In <code className="px-1 py-0.5 bg-background rounded text-[10px] md:text-xs">.env.local</code>:{" "}
                                    <code className="px-1 py-0.5 bg-background rounded text-[10px] md:text-xs break-all">
                                      NEXT_PUBLIC_MAPPLS_ACCESS_TOKEN=...
                                    </code>
                                  </li>
                                  <li>
                                    Fallback:{" "}
                                    <code className="px-1 py-0.5 bg-background rounded text-[10px] md:text-xs break-all">
                                      NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk....
                                    </code>
                                  </li>
                                  <li>Whitelist your domain (Mappls) if required</li>
                                  <li>Restart the dev server</li>
                                </ol>
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

                  {/* Map Sidebar */}
                  <div className="mt-3 md:mt-4">
                    {browseMode === "providers" ? (
                      providersLoading ? (
                        <div className="space-y-3">
                          <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                            Providers on Map
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                            {Array.from({ length: Math.min(itemsPerPage, 10) }).map((_, index) => (
                              <Card key={`map-provider-skeleton-${index}`} className="overflow-hidden">
                                <Skeleton className="w-full h-20" />
                                <CardContent className="p-2 space-y-2">
                                  <Skeleton className="h-3 w-3/4" />
                                  <Skeleton className="h-3 w-full" />
                                  <div className="flex items-center justify-between">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-12" />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : mapViewProvidersAll.length > 0 ? (
                        <>
                          <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                            Providers on Map ({mapViewProvidersAll.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                            {mapViewProvidersPaginated.map((p: any) => {
                              const coords = getProviderCoordinates(p);
                              const name = p?.businessName || p?.user?.name || "Provider";
                              const addr = p?.businessAddress || p?.user?.location || {};
                              const fullLocation = [addr.address, addr.city, addr.state]
                                .filter(Boolean)
                                .map((v: any) => String(v).trim())
                                .filter(Boolean)
                                .join(", ");
                              const distanceKm =
                                userLocation && coords
                                  ? calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
                                  : null;
                              return (
                                <Card
                                  key={p._id}
                                  className="border hover:shadow-md transition-shadow overflow-hidden"
                                >
                                <Link
                                  href={
                                    p?.isFallbackProfile
                                      ? `/services?provider=${encodeURIComponent(
                                          p?.user?._id || p?._id
                                        )}&view=services`
                                      : `/provider/${p?.slug || p._id}`
                                  }
                                >
                                    <div className="relative w-full h-20 overflow-hidden bg-muted flex items-center justify-center">
                                      <div className="text-muted-foreground text-[10px]">
                                        {p?.businessLogo ? " " : "Business"}
                                      </div>
                                    </div>
                                    <CardContent className="p-2 cursor-pointer">
                                      <div className="text-xs font-semibold line-clamp-2">{name}</div>
                                      <div className="text-[10px] text-muted-foreground line-clamp-1">
                                        {fullLocation || "Location"}
                                      </div>
                                      {distanceKm !== null && Number.isFinite(distanceKm) && (
                                        <div className="text-[10px] text-muted-foreground">
                                          {distanceKm.toFixed(1)} km away
                                        </div>
                                      )}
                                      
                                      {/* Rating and Experience */}
                                      <div className="flex items-center gap-2 mt-1.5">
                                        {/* Rating */}
                                        <div className="flex items-center gap-0.5">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          <span className="text-[10px] font-medium">
                                            {p?.averageRating ? p.averageRating.toFixed(1) : '4.5'}
                                          </span>
                                        </div>
                                        
                                        {/* Experience */}
                                        {p?.yearsOfExperience && (
                                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
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
                                            setMapFlyTo({ lat: coords.lat, lng: coords.lng, zoom: 14 });
                                            setMapFlyRevision((n) => n + 1);
                                          }}
                                        >
                                          <MapIcon className="h-4 w-4" />
                                        </Button>
                                        <Button asChild size="sm" className="flex-1 text-[11px]">
                                          <Link
                                            href={
                                              p?.isFallbackProfile
                                                ? `/services?provider=${encodeURIComponent(
                                                    p?.user?._id || p?._id
                                                  )}&view=services`
                                                : `/provider/${p?.slug || p._id}`
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            View Services
                                          </Link>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                          </div>
                          {mapViewProvidersAll.length > PROVIDERS_MAP_PER_PAGE && (
                            <div className="mt-3 md:mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-3">
                              <p className="text-xs md:text-sm text-muted-foreground">
                                Showing {(providersMapPage - 1) * PROVIDERS_MAP_PER_PAGE + 1}–{Math.min(providersMapPage * PROVIDERS_MAP_PER_PAGE, mapViewProvidersAll.length)} of {mapViewProvidersAll.length}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => setProvidersMapPage((prev) => Math.max(1, prev - 1))}
                                  disabled={providersMapPage <= 1}
                                >
                                  Previous
                                </Button>
                                <span className="text-xs text-muted-foreground px-1">
                                  Page {providersMapPage} of {providersMapTotalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => setProvidersMapPage((prev) => Math.min(providersMapTotalPages, prev + 1))}
                                  disabled={providersMapPage >= providersMapTotalPages}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 md:py-8">
                          <MapPin className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                          <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">No Providers Found</h3>
                          <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 px-4">
                            No providers match your search criteria in this area.
                          </p>
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
                      )
                    ) : isLoading ? (
                      <div className="space-y-3">
                        <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                          Services on Map
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                          {Array.from({ length: Math.min(itemsPerPage, 10) }).map((_, index) => (
                            <Card key={`map-service-skeleton-${index}`} className="overflow-hidden">
                              <Skeleton className="w-full h-20" />
                              <CardContent className="p-2 space-y-2">
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-3 w-full" />
                                <div className="flex items-center justify-between">
                                  <Skeleton className="h-3 w-16" />
                                  <Skeleton className="h-3 w-12" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : filteredServices.length > 0 ? (
                      <>
                        <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3">
                          Services on Map ({mapViewServicesAll.length})
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                          {mapViewServicesToShow.map((service) => {
                            const serviceLocation = service.location?.coordinates;
                            const distance = userLocation && serviceLocation
                              ? calculateDistance(
                                  userLocation.lat,
                                  userLocation.lng,
                                  serviceLocation.lat,
                                  serviceLocation.lng
                                )
                              : null;
                            
                            // Get service image
                            const getServiceImage = (): string | null => {
                              if (service.images && service.images.length > 0) {
                                return service.images[0];
                              }
                              if (service.image) {
                                return service.image;
                              }
                              return null;
                            };
                            
                            const serviceImage = getServiceImage();
                            
                            return (
                              <Card
                                key={service.id || service._id}
                                className="border hover:shadow-md transition-shadow overflow-hidden"
                              >
                                <Link href={`/service/${service.slug || service.id || service._id}`}>
                                  {/* Service Image */}
                                  {serviceImage ? (
                                    <div className="relative w-full h-32 overflow-hidden bg-muted flex items-center justify-center">
                                      <img
                                        src={serviceImage}
                                        alt={service.title}
                                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                        loading="lazy"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                      {service.featured && (
                                        <Badge className="absolute top-1 right-1 bg-warning text-warning-foreground text-[9px] px-1 py-0">
                                          Featured
                                        </Badge>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="relative w-full h-28 bg-muted flex items-center justify-center">
                                      <div className="text-muted-foreground text-[10px]">No Image</div>
                                      {service.featured && (
                                        <Badge className="absolute top-1 right-1 bg-warning text-warning-foreground text-[9px] px-1 py-0">
                                          Featured
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  <CardContent 
                                    className="p-2 cursor-pointer"
                                    onClick={(e) => {
                                      // Allow map interaction on click, but also navigate
                                      if (serviceLocation) {
                                        setMapFlyTo({
                                          lat: serviceLocation.lat,
                                          lng: serviceLocation.lng,
                                          zoom: 15,
                                        });
                                        setMapFlyRevision((n) => n + 1);
                                      }
                                    }}
                                  >
                                    <div className="mb-1">
                                      <h4 className="font-semibold text-xs line-clamp-2 hover:text-primary transition-colors leading-tight break-words">
                                        {service.title}
                                      </h4>
                                    </div>
                                    {(service.provider?.businessName || service.provider?.name) && (
                                      <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
                                        {service.provider?.businessName || service.provider?.name}
                                      </p>
                                    )}
                                    <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1.5 leading-relaxed">
                                      {service.description}
                                    </p>
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs">
                                          ₹{service.price?.toLocaleString()}
                                          <span className="font-normal text-muted-foreground ml-0.5">
                                            {(() => {
                                              const m: Record<string, string> = {
                                                fixed: "", hourly: "/hr", daily: "/day", per_minute: "/min",
                                                per_article: "/article", monthly: "/mo", per_kg: "/kg",
                                                per_litre: "/litre", per_unit: "/unit", metric_ton: "/metric ton",
                                                per_sqft: "/sqft", per_sqm: "/sqm", per_load: "/load",
                                                per_trip: "/trip", per_cuft: "/cuft", per_cum: "/cum",
                                                per_metre: "/metre", per_bag: "/bag", lumpsum: "",
                                                per_project: "/project", negotiable: "",
                                              };
                                              const pt = String(service.priceType || "");
                                              return m[pt] || "";
                                            })()}
                                          </span>
                                        </span>
                                        {/* Rating */}
                                        <div className="flex items-center gap-0.5">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          <span className="text-[10px] font-medium">
                                            {service.averageRating ? service.averageRating.toFixed(1) : '4.5'}
                                          </span>
                                        </div>
                                      </div>
                                      {distance !== null && (
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                          {distance.toFixed(1)} km
                                        </Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Link>
                              </Card>
                            );
                          })}
                        </div>
                        {/* Pagination for map view */}
                        {(() => {
                          const totalCount = servicesPagination?.total ?? mapViewServicesAll.length;
                          const totalPages = Math.ceil(totalCount / mapViewItemsPerPage);
                          if (totalPages <= 1) return null;
                          const startIndex = (mapViewCurrentPage - 1) * mapViewItemsPerPage;
                          const endIndex = Math.min(mapViewCurrentPage * mapViewItemsPerPage, totalCount);
                          
                          return (
                            <div className="mt-4 space-y-3">
                              <div className="text-center text-xs text-muted-foreground">
                                Showing {startIndex + 1}-{endIndex} of {totalCount}
                              </div>
                              <div className="flex justify-center">
                                <div className="flex gap-1 flex-wrap justify-center">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px]"
                                    disabled={mapViewCurrentPage === 1}
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                  >
                                    Prev
                                  </Button>
                                  
                                  {(() => {
                                    const pages: (number | string)[] = [];
                                    const maxVisible = 5;
                                    
                                    if (totalPages <= maxVisible) {
                                      for (let i = 1; i <= totalPages; i++) {
                                        pages.push(i);
                                      }
                                    } else {
                                      pages.push(1);
                                      
                                      if (mapViewCurrentPage > 3) {
                                        pages.push('...');
                                      }
                                      
                                      const start = Math.max(2, mapViewCurrentPage - 1);
                                      const end = Math.min(totalPages - 1, mapViewCurrentPage + 1);
                                      
                                      for (let i = start; i <= end; i++) {
                                        pages.push(i);
                                      }
                                      
                                      if (mapViewCurrentPage < totalPages - 2) {
                                        pages.push('...');
                                      }
                                      
                                      if (totalPages > 1) {
                                        pages.push(totalPages);
                                      }
                                    }
                                    
                                    return pages.map((page, idx) => {
                                      if (page === '...') {
                                        return (
                                          <span key={`map-ellipsis-${idx}`} className="px-1.5 py-1 text-[11px] text-muted-foreground">
                                            ...
                                          </span>
                                        );
                                      }
                                      
                                      const pageNum = page as number;
                                      return (
                                        <Button
                                          key={`map-page-${pageNum}`}
                                          variant={mapViewCurrentPage === pageNum ? "secondary" : "outline"}
                                          size="sm"
                                          className="text-[11px]"
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
                                    className="text-[11px]"
                                    disabled={mapViewCurrentPage === totalPages}
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                  >
                                    Next
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : isLoading ? (
                      /* Loading State with Skeleton for Map View Sidebar */
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Card key={index} className="overflow-hidden">
                            <Skeleton className="w-full h-20" />
                            <CardContent className="p-2 space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-full" />
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-12" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 md:py-8">
                        <MapPin className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                        <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">No Services Found</h3>
                        <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 px-4">
                          No services match your search criteria in this area.
                        </p>
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
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6"
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
                ) : filteredProviders.length > 0 ? (
                  <>
                    <div
                      className={
                        viewMode === "grid"
                          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6"
                          : "space-y-3 md:space-y-4"
                      }
                    >
                      {filteredProviders.map((p: any, index: number) => {
                        const name = p?.businessName || p?.user?.name || "Provider";
                        const addr = p?.businessAddress || p?.user?.location || {};
                        const coords = getProviderCoordinates(p);
                        const fullLocation = [addr.address, addr.city, addr.state]
                          .filter(Boolean)
                          .map((v: any) => String(v).trim())
                          .filter(Boolean)
                          .join(", ");
                        const distanceKm =
                          userLocation && coords
                            ? calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng)
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
              ) : isLoading ? (
                /* Loading State with Skeleton for Grid/List View */
                <div className="space-y-3 md:space-y-4">
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6"
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
                      const endIndex = Math.min(currentPage * itemsPerPage, totalCount);
                      
                      return (
                        <>
                          <div
                            className={
                              viewMode === "grid"
                                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6"
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
                                />
                              </div>
                            ))}
                          </div>
                          
                          {/* Pagination Info and Controls */}
                          {totalPages > 1 && (
                            <div className="mt-6 md:mt-8 lg:mt-10 px-4 space-y-4">
                              {/* Pagination Info */}
                              <div className="text-center text-sm text-muted-foreground">
                                Showing {startIndex}-{endIndex} of {totalCount} services
                                {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
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
                                
                                {(() => {
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
                                  disabled={currentPage === totalPages}
                                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
