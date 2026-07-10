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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Star,
  MapPin,
  Clock,
  CheckCircle2,
  Award,
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
import { useTranslation } from "react-i18next";
import {
  ImagineVerifiedBadge,
  type ImagineScoreData,
} from "@/components/trust/ImagineScorePanel";
import { type ProviderAchievement } from "@/components/trust/AchievementBadges";
import { ProviderTrustSummary } from "@/components/trust/ProviderTrustSummary";
import { ProviderOffersModal } from "@/components/providers/ProviderOffersModal";

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
  coverImage?: string;
  businessAddress?: {
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  googleMapLink?: string;
  skills?: string[];
  portfolio?: Array<{ id: string; title: string; image: string }>;
  verified?: boolean;
  topRated?: boolean;
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  yearsOfExperience?: number;
  experienceYears?: number;
  experience?: number | string;
  memberSince?: string;
  responseTime?: string;
  hourlyRate?: number;
  tagline?: string;
  imagineScore?: ImagineScoreData | null;
}

interface ServiceData {
  _id: string;
  id?: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
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
  const { t } = useTranslation("providerProfile");
  const params = useParams();
  const id =
    (typeof params?.id === "string" ? params.id : params?.id?.[0]) ||
    (typeof params?.slug === "string" ? params.slug : params?.slug?.[0]);
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
  const [bioExpanded, setBioExpanded] = useState(false);
  const [achievements, setAchievements] = useState<ProviderAchievement[]>([]);
  const [offersModalOpen, setOffersModalOpen] = useState(false);

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
        const providerDataForReviews = providerResponse?.success && (providerResponse?.data as any)?.provider
          ? (providerResponse.data as any).provider
          : null;
        const providerUserIdForReviews =
          providerDataForReviews?.user?._id ||
          (typeof providerDataForReviews?.user === "string" ? providerDataForReviews.user : null);
        if (providerUserIdForReviews) {
          void apiRequest<{ success: boolean; data?: { reviews?: any[] } }>(
            `/api/reviews/provider/${providerUserIdForReviews}?page=1&limit=20`,
            { timeoutMs: 15000 }
          ).then((reviewsRes) => {
            if (reviewsRes?.success) {
              const list = (reviewsRes.data as any)?.reviews || [];
              const normalized = list.map((r: any) => ({
                id: r._id,
                author: r.buyer?.name || "Buyer",
                avatar: r.buyer?.avatar || "",
                rating: Number(r.rating || 0),
                date: r.createdAt || new Date().toISOString(),
                content: r.content || "",
              }));
              setReviews(normalized);
            } else {
              setReviews([]);
            }
          }).catch(() => setReviews([]));
        } else {
          setReviews([]);
        }
      });
  }, [id, toast, router]);

  useEffect(() => {
    const providerKey = provider?.slug || provider?._id || id;
    if (!providerKey) return;
    void apiRequest<{ achievements?: ProviderAchievement[] }>(
      `/api/trust/providers/${encodeURIComponent(String(providerKey))}/achievements`
    ).then((res) => {
      if (res?.success && res.data?.achievements) {
        setAchievements(res.data.achievements);
      }
    });
  }, [provider?._id, provider?.slug, id]);

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

    return filtered;
  }, [services, searchQuery]);

  // Final list to render: when no filters applied, always show all services
  const servicesToRender = useMemo(() => {
    const hasFilters = !!searchQuery.trim();

    if (!hasFilters) {
      return services;
    }

    return filteredServices;
  }, [services, filteredServices, searchQuery]);

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
    
    const rawExperience =
      provider.yearsOfExperience ??
      provider.experienceYears ??
      provider.experience ??
      0;
    const numericExperience =
      typeof rawExperience === "string" ? Number(rawExperience) : rawExperience;
    const experienceYears =
      Number.isFinite(numericExperience) && Number(numericExperience) > 0
        ? Math.floor(Number(numericExperience))
        : 0;

    return {
      // Business name takes priority over user name
      name: provider.businessName || provider.user?.name || "Provider",
      ownerName: provider.user?.name || provider.businessName || "Provider",
      // Business logo takes priority over user avatar
      avatar: provider.businessLogo || provider.user?.avatar || "",
      coverImage: provider.coverImage || "",
      tagline: provider.tagline || provider.bio || "",
      bio: provider.bio || "",
      skills: provider.skills || [],
      portfolio: provider.portfolio || [],
      verified: provider.verified || provider.user?.verified || false,
      topRated: provider.topRated || false,
      rating: provider.rating || 0,
      reviewCount: provider.reviewCount || 0,
      completedJobs: provider.completedJobs || 0,
      experienceText: experienceYears > 0 ? `${experienceYears}+ Years` : "",
      memberSince: provider.memberSince || "",
      responseTime: provider.responseTime || "N/A",
      hourlyRate: provider.hourlyRate || 0,
      // Business address takes priority
      location: addressDisplay,
      // Business email/phone take priority
      email: provider.businessEmail || provider.user?.email || "",
      phone: provider.businessPhone || provider.user?.phone || "",
      website: provider.website || "",
      googleMapLink: provider.googleMapLink || "",
      // Current offer (from provider profile)
      offerTitle: (provider as any).offerTitle || "",
      offerDescription: (provider as any).offerDescription || "",
      offerBannerUrl: (provider as any).offerBannerUrl || "",
      offerValidFrom: (provider as any).offerValidFrom || "",
      offerValidTo: (provider as any).offerValidTo || "",
    };
  }, [provider]);

  const providerPublicId = provider?.slug || provider?._id || id || null;

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
              <h2 className="text-xl font-bold mb-2">{t("providerNotFound")}</h2>
              <p className="text-muted-foreground mb-4">
                {error || "The provider you're looking for doesn't exist."}
              </p>
              <Button asChild>
                <Link href="/services">{t("browseServices")}</Link>
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
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12">
          {providerDisplay.coverImage && (
            <img
              src={providerDisplay.coverImage}
              alt={`${providerDisplay.name || "Provider"} cover`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {providerDisplay.coverImage && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px]" />
          )}
          <div className="container relative z-10">
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
                          {t("topRated", "Top Rated")}
                        </Badge>
                      )}
                      <ImagineVerifiedBadge score={provider?.imagineScore} />
                    </div>
                    {provider?.imagineScore?.isImagineeringVerified && provider?.slug && (
                      <Link
                        href={`/verified/${provider.slug}`}
                        className="mb-3 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                      >
                        View Imagineering Verified profile
                      </Link>
                    )}
                    {providerDisplay.ownerName && (
                      <p className="mb-3 text-sm font-medium text-muted-foreground md:text-base">
                        Owner: <span className="text-foreground">{providerDisplay.ownerName}</span>
                      </p>
                    )}
                    
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
                                    {bioExpanded ? t("readLess", "Read less") : t("readMore", "Read more")}
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
                        {providerDisplay.googleMapLink ? (
                          <a
                            href={providerDisplay.googleMapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-1 hover:text-primary hover:underline"
                          >
                            {providerDisplay.location ||
                             provider?.user?.location?.address ||
                             (provider?.user?.location?.city && provider?.user?.location?.state
                               ? `${provider.user.location.city}, ${provider.user.location.state}`
                               : provider?.user?.location?.city ||
                                 provider?.user?.location?.state ||
                                 'Open directions')}
                          </a>
                        ) : (
                          <span className="line-clamp-1">
                            {providerDisplay.location ||
                             provider?.user?.location?.address ||
                             (provider?.user?.location?.city && provider?.user?.location?.state
                               ? `${provider.user.location.city}, ${provider.user.location.state}`
                               : provider?.user?.location?.city ||
                                 provider?.user?.location?.state ||
                                 'Address not available')}
                          </span>
                        )}
                      </div>
                      
                      {providerDisplay.responseTime && providerDisplay.responseTime !== "N/A" && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                        <span>{t("respondsIn", "Responds in")} {providerDisplay.responseTime}</span>
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
                        {t("startingRate", "Starting rate")}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg font-semibold text-foreground">
                        {totalServices || services.length} {t("servicesAvailable", "Services Available")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("browseCatalog", "Browse our catalog")}
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
                        {t("checkingSubscription", "Checking subscription...")}
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        {t("callNow", "Call Now")}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    size="lg"
                    onClick={() => {
                      if (!provider?.user?._id) return;
                      router.push(`/chat?providerId=${provider.user._id}&name=${encodeURIComponent(providerDisplay.name)}`);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    {t("chatWithProvider", "Chat with Provider")}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6">
              <ProviderTrustSummary
                score={provider?.imagineScore}
                achievements={achievements}
                onViewOffers={() => setOffersModalOpen(true)}
                offersLabel={t("offers", "Offers")}
              />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12" id="services">
          <div className="container">
            <div className="space-y-8">
              {/* Services - Storefront Style */}
              <div className="space-y-6">
                {/* Storefront Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                      {providerDisplay.name}'s Store
                    </h2>
                    <p className="text-muted-foreground">
                      {servicesToRender.length} {servicesToRender.length === 1 ? t("service", "service") : t("services")} {t("available", "available")}
                      {searchQuery && ` ${t("matching", "matching")} "${searchQuery}"`}
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
                      placeholder={t("searchServices")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12"
                    />
                  </div>
                </div>

                {/* Services Grid/List */}
                {servicesLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>{t("loadingServices")}</span>
                  </div>
                ) : servicesToRender.length > 0 ? (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch"
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
                        priceMode={service.priceMode}
                        priceMin={service.priceMin}
                        priceMax={service.priceMax}
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
                        hideProviderDetails
                      />
                    ))}
                  </div>
                ) : null}
                {!servicesLoading && servicesToRender.length > 0 && totalServices > services.length && !searchQuery && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMoreServices}
                      disabled={loadingMore}
                      className="gap-2"
                    >
                      {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {loadingMore ? t("loading", "Loading...") : `${t("loadMore", "Load more")} (${services.length} ${t("of", "of")} ${totalServices})`}
                    </Button>
                  </div>
                )}
                {!servicesLoading && servicesToRender.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">
                        {searchQuery ? t("noServicesMatch", "No services match your search.") : t("noServicesListed", "No services listed yet.")}
                      </p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchQuery("");
                          }}
                          className="mt-4"
                        >
                          {t("clearFilters", "Clear Filters")}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Reviews */}
              <div>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>{t("clientReviews")}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {providerDisplay.reviewCount} {t("reviews", "reviews")} • {providerDisplay.rating.toFixed(1)} {t("average", "average")}
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
                        <p className="text-muted-foreground">{t("noReviews")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {providerDisplay.portfolio.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground">{t("portfolio")}</h2>
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
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <ProviderOffersModal
        open={offersModalOpen}
        onOpenChange={setOffersModalOpen}
        providerId={providerPublicId}
        providerName={providerDisplay?.name}
      />
    </div>
  );
}
