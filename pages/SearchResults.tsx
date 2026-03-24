"use client";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Map as MapIcon,
  LayoutGrid,
  MapPin,
  Star,
  Filter,
  Navigation,
} from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { isGoogleMapsConfigured } from "@/lib/mapConfig";
import { GoogleMap, type ServiceMarker } from "@/components/map/GoogleMap";

export async function getServerSideProps() { return { props: {} }; }

const ITEMS_PER_PAGE = 20;

type ServiceResult = {
  _id: string;
  slug?: string;
  title: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: string;
  provider?: {
    _id: string;
    name: string;
    location?: { address?: string; city?: string; state?: string; coordinates?: { lat: number; lng: number } };
    businessAddress?: { address?: string; city?: string; state?: string; coordinates?: { lat: number; lng: number } };
  };
  rating: number;
  reviewCount: number;
  price: number;
  priceType: string;
  location?: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
};

export default function SearchResults() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [services, setServices] = useState<ServiceResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreCallbackRef = useRef<() => void>(() => {});

  const selectedCategory = searchParams?.get("category") || "";
  const selectedSubcategory = searchParams?.get("subcategory") || "";
  const selectedLocation = searchParams?.get("location") || "Nearby";
  const query = searchParams?.get("q") || "";

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        if (response.success && response.data) {
          const d = response.data as { categories?: any[] };
          setCategories(d.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch services from API (initial load or when filters change)
  useEffect(() => {
    let isCancelled = false;
    setPage(1);
    setHasMore(true);

    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const categoryObj = categories.find((c) => c.slug === selectedCategory);
        const response = await api.search.search({
          q: query || undefined,
          category: categoryObj?._id || selectedCategory || undefined,
          subcategory: selectedSubcategory || undefined,
          location: selectedLocation !== "Nearby" ? selectedLocation : undefined,
          page: 1,
          limit: ITEMS_PER_PAGE,
        });

        if (isCancelled) return;

        if (response.success && response.data) {
          const d = response.data as { services?: any[] };
          setServices(d.services || []);
          const pag = (response as any).pagination;
          if (pag) {
            setTotalCount(pag.total ?? 0);
            setHasMore((pag.page ?? 1) < (pag.pages ?? 1));
            setPage(pag.page ?? 1);
          } else {
            setTotalCount(d.services?.length ?? 0);
            setHasMore(false);
          }
        } else {
          toast({
            title: "Error",
            description: response.error?.message || "Failed to fetch services",
            variant: "destructive",
          });
          setServices([]);
          setHasMore(false);
        }
      } catch (error: any) {
        if (!isCancelled) {
          console.error("Failed to fetch services:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to load services",
            variant: "destructive",
          });
          setServices([]);
          setHasMore(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchServices, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, selectedCategory, selectedSubcategory, selectedLocation, categories]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const categoryObj = categories.find((c) => c.slug === selectedCategory);
      const response = await api.search.search({
        q: query || undefined,
        category: categoryObj?._id || selectedCategory || undefined,
        subcategory: selectedSubcategory || undefined,
        location: selectedLocation !== "Nearby" ? selectedLocation : undefined,
        page: page + 1,
        limit: ITEMS_PER_PAGE,
      });
      if (response.success && response.data) {
        const d = response.data as { services?: any[] };
        const newServices = d.services || [];
        setServices((prev) => [...prev, ...newServices]);
        const pag = (response as any).pagination;
        if (pag) {
          setTotalCount(pag.total ?? 0);
          setHasMore((pag.page ?? page) < (pag.pages ?? 1));
          setPage(pag.page ?? page + 1);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, query, selectedCategory, selectedSubcategory, selectedLocation, categories]);

  loadMoreCallbackRef.current = loadMore;

  useEffect(() => {
    if (viewMode !== "list") return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        loadMoreCallbackRef.current();
      },
      { rootMargin: "120px", threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [viewMode]);

  const resultsCount = totalCount > 0 ? totalCount : services.length;

  // Services with coordinates OR address (Mappls geocodes address)
  const getServiceCoords = (s: ServiceResult): { lat: number; lng: number } | null => {
    const c = s.location?.coordinates;
    if (c?.lat != null && c?.lng != null) return { lat: Number(c.lat), lng: Number(c.lng) };
    const provAddr = s.provider?.businessAddress || s.provider?.location;
    const pc = provAddr?.coordinates;
    if (pc?.lat != null && pc?.lng != null) return { lat: Number(pc.lat), lng: Number(pc.lng) };
    return null;
  };
  const getServiceAddress = (s: ServiceResult): string => {
    const loc = (s.location || {}) as { address?: string; city?: string; state?: string };
    let parts = [loc.address, loc.city, loc.state].filter(Boolean).map(String).filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    const pa = s.provider?.businessAddress ?? s.provider?.location;
    if (pa && typeof pa === "object") {
      const p = pa as { address?: string; city?: string; state?: string };
      parts = [p.address, p.city, p.state].filter(Boolean).map(String).filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return "";
  };
  const servicesForMap = services.filter(
    (s) => getServiceCoords(s) || getServiceAddress(s)
  );
  const mapCenter = useMemo(() => {
    const first = servicesForMap.find((s) => getServiceCoords(s));
    const c = first ? getServiceCoords(first) : null;
    const lat = Number(searchParams?.get("lat")) || c?.lat || 19.076;
    const lng = Number(searchParams?.get("lng")) || c?.lng || 72.8777;
    return { lat, lng };
  }, [searchParams, servicesForMap]);
  const mapMarkers: ServiceMarker[] = servicesForMap.map((s) => {
    const coords = getServiceCoords(s);
    const addr = getServiceAddress(s);
    return {
      id: s._id,
      lat: coords?.lat,
      lng: coords?.lng,
      address: addr || undefined,
      title: s.title,
      categoryName: s.category?.name,
    };
  });

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero / filters */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 border-b">
          <div className="container py-8 md:py-12 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                    {isLoading ? "Loading..." : `${resultsCount} results`}
                  </span>
                  {selectedCategory && (
                    <>
                      <span>for</span>
                      <Badge variant="outline">
                        {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
                      </Badge>
                    </>
                  )}
                  {selectedLocation !== "Nearby" && (
                    <>
                      <span>in</span>
                      <Badge variant="outline">{selectedLocation}</Badge>
                    </>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Browse and compare providers
                </h1>
                <p className="text-muted-foreground">
                  Toggle between list and map. Premium suppliers appear with gold emphasis (UI only).
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  onClick={() => setViewMode("list")}
                  className="gap-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                  List View
                </Button>
                <Button
                  variant={viewMode === "map" ? "default" : "outline"}
                  onClick={() => setViewMode("map")}
                  className="gap-2"
                >
                  <MapIcon className="h-4 w-4" />
                  Map View
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-10">
          <div className="container">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg font-medium text-foreground mb-2">No services found</p>
                <p className="text-muted-foreground">Try adjusting your search filters</p>
              </div>
            ) : viewMode === "list" ? (
              <>
                <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2">
                {services.map((service) => (
                  <Card key={service._id} className="border shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-lg leading-tight">{service.title}</CardTitle>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {service.category && (
                              <Badge variant="outline">{service.category.name}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {service.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {service.location.address || `${service.location.city}, ${service.location.state}`}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 text-foreground">
                        <Star className="h-4 w-4 fill-primary text-primary" />
                        <span className="font-medium">
                          {service.rating?.toFixed(1) || "0.0"} ({service.reviewCount || 0} reviews)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-semibold text-lg">
                          ₹{service.price}
                          {service.priceType && (
                            <span className="text-sm text-muted-foreground ml-1">
                              /{service.priceType === "fixed" ? "project" : service.priceType}
                            </span>
                          )}
                        </span>
                        {service.location?.coordinates && (
                          <Button size="sm" variant="outline" className="gap-2">
                            <Navigation className="h-4 w-4" />
                            View on Map
                          </Button>
                        )}
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Provider: <span className="font-medium text-foreground">{service.provider?.name || "N/A"}</span>
                        </span>
                        <Button variant="ghost" size="sm" className="px-2 text-primary" asChild>
                          <a href={`/service/${service.slug || service._id}`}>View Details</a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
                {viewMode === "list" && (
                  <div ref={sentinelRef} className="min-h-[60px] flex items-center justify-center py-6">
                    {loadingMore && (
                      <p className="text-sm text-muted-foreground">Loading more services...</p>
                    )}
                    {!hasMore && services.length > 0 && (
                      <p className="text-sm text-muted-foreground">You&apos;ve seen all {resultsCount} results</p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="h-[480px] border-0 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.06),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.06),transparent_25%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.06),transparent_28%)]" />
                    <div className="absolute inset-0 p-4 flex flex-col">
                      <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2 inline-flex items-center gap-2 border mb-3 w-fit">
                        <MapIcon className="h-4 w-4 text-primary" />
                        Map view
                      </div>
                      {isGoogleMapsConfigured() ? (
                        <GoogleMap
                          center={mapCenter}
                          zoom={11}
                          serviceMarkers={mapMarkers}
                          providerMarkers={[]}
                          browseMode="services"
                          className="flex-1 rounded-xl"
                        />
                      ) : (
                        <div className="flex-1 rounded-xl border bg-muted flex items-center justify-center">
                          <p className="text-xs text-muted-foreground">
                            Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in .env for map.
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Providers nearby</h3>
                  <div className="space-y-3">
                    {services.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No services found</p>
                    ) : (
                      services.map((service) => (
                        <Card key={service._id} className="border-0 shadow-sm">
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground text-sm">{service.title}</p>
                            </div>
                            {service.location && (
                              <p className="text-xs text-muted-foreground">
                                {service.location.address || `${service.location.city}, ${service.location.state}`}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 fill-primary text-primary" />
                              {service.rating?.toFixed(1) || "0.0"} • {service.reviewCount || 0} reviews
                            </div>
                            <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
                              <a href={`/service/${service.slug || service._id}`}>View Details</a>
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

