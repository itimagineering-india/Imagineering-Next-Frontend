"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReviewCard } from "@/components/ReviewCard";
import { ServiceCard } from "@/components/ServiceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Award,
  Calendar,
  Briefcase,
  MessageSquare,
  Grid3X3,
  List,
  Search,
  Loader2,
  Phone,
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useBuyerPremium } from "@/hooks/useBuyerPremium";
import { useAuth } from "@/contexts/AuthContext";

export async function getServerSideProps() { return { props: {} }; }

interface ProviderData {
  _id: string;
  slug?: string;
  user?: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
    phone?: string;
    location?: any;
    verified?: boolean;
    subscription?: {
      plan?: string;
    };
  };
  bio?: string;
  businessName?: string;
  businessLogo?: string;
  businessAddress?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  skills?: string[];
  portfolio?: Array<{ id: string; title: string; image: string }>;
  verified?: boolean;
  topRated?: boolean;
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  memberSince?: string;
  responseTime?: string;
  hourlyRate?: number;
  tagline?: string;
}

interface ServiceData {
  _id: string;
  id?: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  priceType: string;
  image?: string;
  images?: string[];
  provider: {
    _id: string;
    id?: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  category?: {
    _id: string;
    name: string;
    slug: string;
    interactionType?: 'CONTACT_ONLY' | 'PURCHASE_ONLY' | 'HYBRID';
  } | string;
  subcategory?: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  featured?: boolean;
  tags?: string[];
  location?: {
    city?: string;
    state?: string;
    address?: string;
  };
}

export default function ProviderProfile() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : params?.id?.[0];
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { isPremium: isBuyerPremium, loading: buyerSubLoading } = useBuyerPremium();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [totalServices, setTotalServices] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [bioExpanded, setBioExpanded] = useState(false);

  const SERVICES_PAGE_SIZE = 20;

  // Fetch provider (fast) and services (parallel) so provider card shows within seconds
  useEffect(() => {
    if (!id) {
      setError("Provider ID not found");
      setLoading(false);
      setServicesLoading(false);
      return;
    }

    setLoading(true);
    setServicesLoading(true);
    setError(null);

    const providerUrl = `/api/providers/${id}?servicesLimit=0`;
    const servicesUrl = `/api/providers/${id}/services?page=1&limit=${SERVICES_PAGE_SIZE}`;

    const fetchProvider = apiRequest<{ success: boolean; data?: { provider?: unknown }; error?: { message: string } }>(providerUrl, { timeoutMs: 25000 });
    const fetchServices = apiRequest<{ success: boolean; data?: { services?: unknown[]; totalServices?: number }; error?: { message: string } }>(servicesUrl, { timeoutMs: 25000 });

    Promise.allSettled([fetchProvider, fetchServices])
      .then(([providerResult, servicesResult]) => {
        const providerResponse = providerResult.status === "fulfilled" ? providerResult.value : null;
        const servicesResponse = servicesResult.status === "fulfilled" ? servicesResult.value : null;

        // Provider: show as soon as we have it (unblocks main loading)
        if (providerResponse?.success && providerResponse?.data) {
          const providerData = (providerResponse.data as any).provider || providerResponse.data;
          const hasId = !!(providerData?._id ?? providerData?.id);
          if (providerData && hasId) {
            setProvider({ ...providerData, _id: providerData._id ?? providerData.id });
            // Redirect to slug URL when visiting by id (for SEO-friendly URLs)
            const slug = providerData.slug;
            const providerId = providerData._id ?? providerData.id;
            const userId = providerData.user?._id ?? providerData.user;
            const isIdParam = /^[a-fA-F0-9]{24}$/.test(id);
            if (slug && isIdParam && (id === providerId?.toString?.() || id === userId?.toString?.())) {
              router.replace(`/provider/${slug}`, { scroll: false });
            }
          } else {
            setError("Provider data is invalid");
          }
        } else {
          const msg = providerResponse && (providerResponse as any).error?.message
            ? (providerResponse as any).error.message
            : providerResult.status === "rejected"
              ? (providerResult.reason?.message || "Failed to load provider")
              : "Provider not found";
          setError(msg);
          if (providerResult.status === "rejected") {
            toast({ title: "Error", description: msg, variant: "destructive" });
          }
        }
        setLoading(false);

        // Services: fill in when ready (provider card already shown if provider succeeded)
        if (servicesResponse?.success && servicesResponse?.data) {
          const providerData = providerResponse?.success && (providerResponse?.data as any)?.provider
            ? (providerResponse.data as any).provider
            : null;
          const servicesData = (servicesResponse.data as any).services || [];
          const total = (servicesResponse.data as any).totalServices ?? servicesData.length;
          setTotalServices(total);
          if (providerData) {
            const normalizedServices = servicesData.map((service: any) => {
              let providerObj = service.provider;
              if (!providerObj || typeof providerObj !== "object") {
                providerObj = {
                  _id: typeof service.provider === "string" ? service.provider : (providerData.user?._id || ""),
                  id: typeof service.provider === "string" ? service.provider : (providerData.user?._id || ""),
                  name: providerData.businessName || providerData.user?.name || "Provider",
                  avatar: providerData.businessLogo || providerData.user?.avatar || "",
                  verified: !!providerData.verified,
                };
              }
              return { ...service, provider: providerObj };
            });
            setServices(normalizedServices);
          }
        }
        setServicesLoading(false);
        setReviews([]);
      });
  }, [id, toast]);

  const loadMoreServices = useCallback(async () => {
    if (!id || !provider) return;
    setLoadingMore(true);
    try {
      const page = Math.floor(services.length / SERVICES_PAGE_SIZE) + 1;
      const res = await apiRequest<{ success: boolean; data?: { services?: unknown[] }; error?: { message: string } }>(
        `/api/providers/${id}/services?page=${page}&limit=${SERVICES_PAGE_SIZE}`,
        { timeoutMs: 15000 }
      );
      if (res.success && (res.data as any)?.services) {
        const servicesData = (res.data as any).services as any[];
        const providerData = provider;
        const normalized = servicesData.map((service: any) => {
          let providerObj = service.provider;
          if (!providerObj || typeof providerObj !== "object") {
            providerObj = {
              _id: (providerData.user as any)?._id ?? "",
              id: (providerData.user as any)?._id ?? "",
              name: providerData.businessName || (providerData.user as any)?.name || "Provider",
              avatar: providerData.businessLogo || (providerData.user as any)?.avatar || "",
              verified: !!providerData.verified,
            };
          }
          return { ...service, provider: providerObj };
        });
        setServices((prev) => [...prev, ...normalized]);
      }
    } catch {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  }, [id, provider, services.length]);

  // Filter and search services
  const filteredServices = useMemo(() => {
    let filtered = [...services];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((service) => {
        if (typeof service.category === 'object' && service.category !== null) {
          return service.category._id === selectedCategory || service.category.slug === selectedCategory;
        }
        return false;
      });
    }

    return filtered;
  }, [services, searchQuery, selectedCategory]);

  // Final list to render: when no filters applied, always show all services
  const servicesToRender = useMemo(() => {
    const hasFilters =
      !!searchQuery.trim() ||
      selectedCategory !== "all";

    if (!hasFilters) {
      return services;
    }

    return filteredServices;
  }, [services, filteredServices, searchQuery, selectedCategory]);

  // Get unique categories from services
  const availableCategories = useMemo(() => {
    const categoryMap = new Map<string, { _id: string; name: string; slug: string }>();
    services.forEach((service) => {
      if (typeof service.category === 'object' && service.category !== null) {
        const cat = service.category;
        if (cat._id && cat.name) {
          categoryMap.set(cat._id, { _id: cat._id, name: cat.name, slug: cat.slug || '' });
        }
      }
    });
    return Array.from(categoryMap.values());
  }, [services]);

  // Transform provider data for display - prioritize business profile data
  const providerDisplay = useMemo(() => {
    if (!provider) return null;
    
    // Build address from businessAddress or user location
    let addressDisplay = "Address not available";
    if (provider.businessAddress) {
      const addr = provider.businessAddress;
      const parts = [];
      if (addr.address) parts.push(addr.address);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.zipCode) parts.push(addr.zipCode);
      addressDisplay = parts.join(", ");
    } else if (provider.user?.location) {
      if (typeof provider.user.location === 'string') {
        addressDisplay = provider.user.location;
      } else if (provider.user.location.city) {
        const parts = [];
        if (provider.user.location.address) parts.push(provider.user.location.address);
        parts.push(provider.user.location.city);
        if (provider.user.location.state) parts.push(provider.user.location.state);
        if (provider.user.location.zipCode) parts.push(provider.user.location.zipCode);
        addressDisplay = parts.join(", ");
      }
    }
    
    return {
      // Business name takes priority over user name
      name: provider.businessName || provider.user?.name || "Provider",
      // Business logo takes priority over user avatar
      avatar: provider.businessLogo || provider.user?.avatar || "",
      tagline: provider.tagline || provider.bio || "",
      bio: provider.bio || "",
      skills: provider.skills || [],
      portfolio: provider.portfolio || [],
      verified: provider.verified || provider.user?.verified || false,
      topRated: provider.topRated || false,
      rating: provider.rating || 0,
      reviewCount: provider.reviewCount || 0,
      completedJobs: provider.completedJobs || 0,
      memberSince: provider.memberSince || "",
      responseTime: provider.responseTime || "N/A",
      hourlyRate: provider.hourlyRate || 0,
      // Business address takes priority
      location: addressDisplay,
      // Business email/phone take priority
      email: provider.businessEmail || provider.user?.email || "",
      phone: provider.businessPhone || provider.user?.phone || "",
      website: provider.website || "",
      // Current offer (from provider profile)
      offerTitle: (provider as any).offerTitle || "",
      offerDescription: (provider as any).offerDescription || "",
      offerBannerUrl: (provider as any).offerBannerUrl || "",
      offerValidFrom: (provider as any).offerValidFrom || "",
      offerValidTo: (provider as any).offerValidTo || "",
    };
  }, [provider]);

  const handleCallNow = useCallback(() => {
    const buyerPlansPath = "/subscriptions/buyer";
    if (!isAuthenticated) {
      router.push(buyerPlansPath);
      return;
    }
    if (buyerSubLoading) {
      return;
    }
    if (!isBuyerPremium) {
      router.push(buyerPlansPath);
      return;
    }
    const raw = providerDisplay?.phone?.trim();
    if (!raw) {
      toast({
        title: "Phone unavailable",
        description: "This provider has not shared a phone number yet.",
        variant: "destructive",
      });
      return;
    }
    const dial = raw.replace(/[^\d+]/g, "");
    if (!dial) {
      toast({
        title: "Invalid number",
        description: "Could not start a call from this number.",
        variant: "destructive",
      });
      return;
    }
    window.location.href = `tel:${dial}`;
  }, [isAuthenticated, buyerSubLoading, isBuyerPremium, router, toast, providerDisplay?.phone]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">
          <div className="container py-12">
            <div className="space-y-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error || !provider || !providerDisplay) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-bold mb-2">Provider Not Found</h2>
              <p className="text-muted-foreground mb-4">
                {error || "The provider you're looking for doesn't exist."}
              </p>
              <Button asChild>
                <Link href="/services">Browse Services</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12">
          <div className="container">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Business Profile Info */}
              <div className="flex-1">
                <div className="flex items-start gap-6">
                  {/* Business Logo */}
                  <div className="flex-shrink-0">
                    {providerDisplay.avatar || provider?.businessLogo || provider?.user?.avatar ? (
                      <div className="h-24 w-24 md:h-32 md:w-32 rounded-lg overflow-hidden ring-4 ring-background shadow-lg bg-card border-2 border-border">
                        <img 
                          src={providerDisplay.avatar || provider?.businessLogo || provider?.user?.avatar} 
                          alt={providerDisplay.name || 'Business Logo'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to avatar if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement?.classList.add('bg-primary/10');
                          }}
                        />
                      </div>
                    ) : (
                      <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-4 ring-background shadow-lg">
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                          {(providerDisplay.name || provider?.businessName || provider?.user?.name || 'B')[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {/* Business Name */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {providerDisplay.name || provider?.user?.name || 'Business Name'}
                      </h1>
                      {providerDisplay.verified && (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      )}
                      {providerDisplay.topRated && (
                        <Badge className="bg-warning text-warning-foreground">
                          <Award className="h-3 w-3 mr-1" />
                          Top Rated
                        </Badge>
                      )}
                    </div>
                    
                    {/* Business Description */}
                    <div className="mb-4">
                      <p className="text-base md:text-lg text-muted-foreground">
                        {(() => {
                          const fullText = providerDisplay.bio || providerDisplay.tagline || provider?.bio || 'No description available';
                          const charLimit = 200;
                          const isLong = fullText.length > charLimit;
                          const displayText = !bioExpanded && isLong ? fullText.slice(0, charLimit) + '...' : fullText;
                          return (
                            <>
                              {displayText}
                              {isLong && (
                                <>
                                  {' '}
                                  <button
                                    type="button"
                                    onClick={() => setBioExpanded((prev) => !prev)}
                                    className="text-primary hover:underline font-medium text-sm inline"
                                  >
                                    {bioExpanded ? 'Read less' : 'Read more'}
                                  </button>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </p>
                    </div>
                    
                    {/* Rating and Business Address */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-medium">
                          {providerDisplay.rating > 0 ? providerDisplay.rating.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-muted-foreground">
                          ({providerDisplay.reviewCount || 0} {providerDisplay.reviewCount === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                      
                      {/* Business Address */}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {providerDisplay.location || 
                           provider?.user?.location?.address || 
                           (provider?.user?.location?.city && provider?.user?.location?.state 
                             ? `${provider.user.location.city}, ${provider.user.location.state}`
                             : provider?.user?.location?.city || 
                               provider?.user?.location?.state || 
                               'Address not available')}
                        </span>
                      </div>
                      
                      {providerDisplay.responseTime && providerDisplay.responseTime !== "N/A" && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Responds in {providerDisplay.responseTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Card */}
              <Card className="w-full md:w-80 shrink-0">
                <CardHeader className="pb-4">
                  {providerDisplay.hourlyRate > 0 ? (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">
                        ₹{providerDisplay.hourlyRate}
                        <span className="text-lg font-normal text-muted-foreground">
                          /hr
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Starting rate
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {totalServices || services.length} Services Available
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Browse our catalog
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700 hover:text-white"
                    size="lg"
                    onClick={handleCallNow}
                    disabled={isAuthenticated && buyerSubLoading}
                  >
                    {isAuthenticated && buyerSubLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking subscription…
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Call Now
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      if (!provider?.user?._id) return;
                      if (!isBuyerPremium) {
                        router.push("/subscriptions/buyer");
                        return;
                      }
                      router.push(`/chat?providerId=${provider.user._id}&name=${encodeURIComponent(providerDisplay.name)}`);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat with Provider
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Provider Offer Banner (from provider's current offer) */}
        {providerDisplay.offerBannerUrl && (
          <section className="bg-background py-4">
            <div className="container">
              <div className="relative w-full max-w-5xl mx-auto rounded-xl overflow-hidden border bg-muted aspect-[4/1] min-h-[140px]">
                <img
                  src={providerDisplay.offerBannerUrl}
                  alt={providerDisplay.offerTitle || "Current offer"}
                  className="w-full h-full object-cover object-center"
                />
                {(providerDisplay.offerTitle || providerDisplay.offerDescription) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                    {providerDisplay.offerTitle && (
                      <p className="text-sm sm:text-base font-semibold text-white line-clamp-1">
                        {providerDisplay.offerTitle}
                      </p>
                    )}
                    {providerDisplay.offerDescription && (
                      <p className="text-[11px] sm:text-xs text-white/90 line-clamp-2">
                        {providerDisplay.offerDescription}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Stats Bar */}
        <section className="border-y bg-card py-4">
          <div className="container">
            <div className="flex flex-wrap justify-center md:justify-start gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {totalServices || services.length}
                </p>
                <p className="text-sm text-muted-foreground">Services</p>
              </div>
              <Separator orientation="vertical" className="h-12 hidden md:block" />
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {providerDisplay.completedJobs}
                </p>
                <p className="text-sm text-muted-foreground">Jobs Completed</p>
              </div>
              {providerDisplay.memberSince && (
                <>
                  <Separator orientation="vertical" className="h-12 hidden md:block" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {providerDisplay.memberSince}
                    </p>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12" id="services">
          <div className="container">
            <Tabs defaultValue="services" className="space-y-8">
              <TabsList className="w-full md:w-auto">
                <TabsTrigger value="services">Services ({totalServices || services.length})</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
                {providerDisplay.portfolio.length > 0 && (
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                )}
                <TabsTrigger value="reviews">Reviews ({providerDisplay.reviewCount})</TabsTrigger>
              </TabsList>

              {/* Services Tab - Storefront Style */}
              <TabsContent value="services" className="space-y-6">
                {/* Storefront Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {providerDisplay.name}'s Store
                    </h2>
                    <p className="text-muted-foreground">
                      {servicesToRender.length} {servicesToRender.length === 1 ? 'service' : 'services'} available
                      {searchQuery && ` matching "${searchQuery}"`}
                    </p>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {availableCategories.length > 0 && (
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {availableCategories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Services Grid/List */}
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading services...</span>
                  </div>
                ) : servicesToRender.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        : "space-y-4"
                    }
                  >
                    {servicesToRender.map((service) => (
                      <ServiceCard
                        key={service._id || service.id}
                        id={service._id || service.id || ""}
                        slug={service.slug}
                        title={service.title}
                        description={service.description}
                        price={service.price}
                        priceType={service.priceType}
                        image={service.images?.[0] || service.image || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"}
                        provider={{
                          id: service.provider._id || service.provider.id || "",
                          name: service.provider.name,
                          avatar: service.provider.avatar || "",
                          verified: service.provider.verified,
                        }}
                        rating={service.rating}
                        reviewCount={service.reviewCount}
                        deliveryTime={service.deliveryTime}
                        featured={service.featured}
                        tags={service.tags}
                        viewMode={viewMode}
                        location={service.location}
                        category={service.category}
                      />
                    ))}
                  </div>
                ) : null}
                {!servicesLoading && servicesToRender.length > 0 && totalServices > services.length && !searchQuery && selectedCategory === "all" && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMoreServices}
                      disabled={loadingMore}
                      className="gap-2"
                    >
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {loadingMore ? "Loading..." : `Load more (${services.length} of ${totalServices})`}
                    </Button>
                  </div>
                )}
                {!servicesLoading && servicesToRender.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        {searchQuery || selectedCategory !== "all"
                          ? "No services match your filters."
                          : "No services listed yet."}
                      </p>
                      {(searchQuery || selectedCategory !== "all") && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                          }}
                          className="mt-4"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* About Tab */}
              <TabsContent value="about" className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {providerDisplay.bio || "No bio available."}
                    </p>
                  </CardContent>
                </Card>

                {providerDisplay.skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Expertise</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {providerDisplay.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                {providerDisplay.portfolio.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providerDisplay.portfolio.map((item) => (
                      <Card key={item.id} className="overflow-hidden group cursor-pointer">
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-medium">{item.title}</h3>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No portfolio items yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Client Reviews</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {providerDisplay.reviewCount} reviews • {providerDisplay.rating.toFixed(1)} average
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <ReviewCard key={review.id || review._id} {...review} />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No reviews yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

    </div>
  );
}
