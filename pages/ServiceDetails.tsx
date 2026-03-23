"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Home, Share2, Heart, Star, MapPin, MessageCircle, CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useBuyerPremium } from "@/hooks/useBuyerPremium";
import {
  ServiceGallery,
  ServiceDescription,
  ProviderCard,
  PricingBox,
  MapPreview,
  DynamicBookingModal,
  Reviews,
  SimilarServices,
  CustomFields,
  ServiceDetailSkeleton,
} from "@/components/service-details";
import {
  getServiceInteractionType,
  shouldShowPricing,
  canBookDirectly,
  getPrimaryCTAText,
  getSecondaryCTAText,
  getHelperText,
  type ServiceWithInteraction,
} from "@/lib/interactionType";
import { AddToCartButton } from "@/components/services/AddToCartButton";

export async function getServerSideProps() { return { props: {} }; }

// Price type labels mapping
const priceTypeLabels: Record<string, string> = {
  fixed: "",
  hourly: "/hr",
  daily: "/day",
  per_minute: "/min",
  per_article: "/article",
  monthly: "/mo",
  per_kg: "/kg",
  per_litre: "/litre",
  per_unit: "/unit",
  metric_ton: "/metric ton",
  per_sqft: "/sqft",
  per_sqm: "/sqm",
  per_load: "/load",
  per_trip: "/trip",
  per_cuft: "/cuft",
  per_cum: "/cum",
  per_metre: "/metre",
  per_bag: "/bag",
  lumpsum: "",
  per_project: "/project",
  negotiable: "",
};

interface ServiceData {
  id: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  mrp?: number;
  priceType: string;
  images: string[];
  category: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  subcategory: string;
  itemType?: string;
  provider: {
    _id: string;
    slug?: string;
    name: string;
    businessName?: string;
    email?: string;
    avatar?: string;
    phone?: string;
    location?: any;
    verified?: boolean;
    rating?: number;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  tags: string[];
  featured: boolean;
  customFields?: Array<{
    label: string;
    value: string | number | boolean;
    type: 'text' | 'number' | 'boolean' | 'select';
  }>;
}

export default function ServiceDetails() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : params?.id?.[0];
  const serviceId = typeof params?.serviceId === "string" ? params.serviceId : params?.serviceId?.[0];
  const serviceSlug = typeof params?.serviceSlug === "string" ? params.serviceSlug : params?.serviceSlug?.[0];
  const serviceParam = typeof params?.service === "string" ? params.service : params?.service?.[0];
  const actualId = serviceId || id || serviceSlug || serviceParam; // Support :id, :serviceId, :serviceSlug, :service routes
  const router = useRouter();
  const pathname = usePathname();
  const searchParamsFromUrl = useSearchParams();
  const { toast } = useToast();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarServices, setSimilarServices] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Open modal after login redirect (auth handled globally via AuthProvider)
  useEffect(() => {
    if (!isAuthenticated) return;
    const openModal = searchParamsFromUrl?.get("openModal");
    if (openModal === "true") {
      setRequestModalOpen(true);
      router.replace(pathname ?? "/");
    }
  }, [isAuthenticated, searchParamsFromUrl, pathname, router]);

  // Cache configuration
  const CACHE_KEY = `service_details_${actualId}`;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Fetch service data
  useEffect(() => {
    const fetchService = async () => {
      if (!actualId) {
        setError("Service ID not found");
        setLoading(false);
        return;
      }

      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          const age = Date.now() - timestamp;
          
          if (age < CACHE_TTL) {
            console.log('[ServiceDetails] Using cached data (age:', Math.round(age / 1000), 'seconds)');
            setService(data.service);
            setIsSaved(data.isSaved || false);
            setSimilarServices(data.similarServices || []);
            setLoading(false);
            
            // Fetch fresh data in background
            setTimeout(() => {
              fetchServiceFresh();
            }, 100);
            return;
          } else {
            console.log('[ServiceDetails] Cache expired, fetching fresh data');
            localStorage.removeItem(CACHE_KEY);
          }
        } catch (e) {
          console.warn('[ServiceDetails] Invalid cache, fetching fresh data');
          localStorage.removeItem(CACHE_KEY);
        }
      }

      await fetchServiceFresh();
    };

    const fetchServiceFresh = async () => {
      if (!actualId) return;

      setLoading(true);
      setError(null);
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );
        
        // Fetch enriched service data (includes favorite status and similar services)
        const apiPromise = api.services.getById(actualId);
        const response = await Promise.race([apiPromise, timeoutPromise]) as any;
        
        if (response.success && response.data) {
          const serviceData = response.data.service;
          const isFavoriteResult = response.data.isFavorite || false;
          const similarServicesResult = response.data.similarServices || [];
          
          // Transform API response
          const transformedService: ServiceData = {
            id: serviceData._id || serviceData.id,
            slug: serviceData.slug,
            title: serviceData.title || "Untitled Service",
            description: serviceData.description || "No description available.",
            price: serviceData.price || 0,
            mrp: serviceData.mrp,
            priceType: serviceData.priceType || "fixed",
            images: serviceData.images && serviceData.images.length > 0 
              ? serviceData.images 
              : serviceData.image 
                ? [serviceData.image] 
                : ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
            category: serviceData.category || { _id: "", name: "Services", slug: "services" },
            subcategory: serviceData.subcategory || "",
            itemType: serviceData.itemType,
            provider: {
              _id: serviceData.provider?._id || "",
              name: serviceData.provider?.name || "Provider",
              businessName: serviceData.provider?.businessName,
              email: serviceData.provider?.email,
              // If no custom avatar is set, don't force a stock photo – let AvatarFallback show initials instead.
              avatar: serviceData.provider?.avatar || "",
              phone: serviceData.provider?.phone,
              location: serviceData.provider?.location,
              verified: serviceData.provider?.verified,
              rating: serviceData.provider?.rating,
            },
            location: serviceData.location,
            rating: serviceData.rating || 0,
            reviewCount: serviceData.reviewCount || 0,
            deliveryTime: serviceData.deliveryTime || "Contact for details",
            tags: serviceData.tags || [],
            featured: serviceData.featured || false,
            customFields: serviceData.customFields || [],
          };
          
          setService(transformedService);
          setIsSaved(isFavoriteResult);
          setSimilarServices(similarServicesResult);

          // Redirect to slug URL when visiting by id (for SEO-friendly URLs)
          const slug = serviceData.slug;
          if (slug && actualId === (serviceData._id || serviceData.id)) {
            router.replace(`/service/${slug}`, { scroll: false });
          }

          // Cache the result
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              data: {
                service: transformedService,
                isSaved: isFavoriteResult,
                similarServices: similarServicesResult,
              },
              timestamp: Date.now(),
            }));
          } catch (cacheError) {
            console.warn('[ServiceDetails] Failed to cache data:', cacheError);
          }
        } else {
          setError("Service not found");
        }
      } catch (error: any) {
        console.error("Error fetching service:", error);
        setError(error.message || "Failed to load service details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [actualId, CACHE_KEY]);

  // Memoized computed values (must be before handlers that use them)
  // Safe defaults when service is not loaded yet
  const categoryName = useMemo(() => {
    if (!service) return "Services";
    return typeof service.category === 'object' 
      ? service.category.name 
      : service.category || "Services";
  }, [service]);

  const serviceWithInteraction: ServiceWithInteraction = useMemo(() => {
    if (!service) return { category: "Services" };
    return { category: service.category };
  }, [service]);
  
  const interactionType = useMemo(() => getServiceInteractionType(serviceWithInteraction), [serviceWithInteraction]);
  const showPricing = useMemo(() => shouldShowPricing(serviceWithInteraction), [serviceWithInteraction]);
  const canBook = useMemo(() => canBookDirectly(serviceWithInteraction), [serviceWithInteraction]);
  const primaryCTA = useMemo(() => getPrimaryCTAText(serviceWithInteraction), [serviceWithInteraction]);
  const secondaryCTA = useMemo(() => getSecondaryCTAText(serviceWithInteraction), [serviceWithInteraction]);
  const helperText = useMemo(() => getHelperText(serviceWithInteraction), [serviceWithInteraction]);

  // Memoized handlers
  const handleRequestViaPlatform = useCallback(() => {
    if (!isAuthenticated) {
      const currentPath = `/service/${actualId}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}&openModal=true`);
      toast({
        title: "Login Required",
        description: "Please login to request this service",
        variant: "destructive",
      });
      return;
    }
    
    // Check if service allows direct booking
    if (service && !canBook) {
      // For CONTACT_ONLY services, show contact options instead of booking modal
      toast({
        title: "Contact Required",
        description: "This service requires contact with the provider. Please use the contact options below.",
        variant: "default",
      });
      return;
    }
    
    setBookingId(null);
    setRequestModalOpen(true);
  }, [isAuthenticated, service, actualId, router, toast, canBook]);

  const { isPremium: isBuyerPremium } = useBuyerPremium();

  const handleOpenChat = useCallback(() => {
    if (!isAuthenticated) {
      const currentPath = `/service/${actualId}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      toast({
        title: "Login Required",
        description: "Please login to chat with the provider",
        variant: "destructive",
      });
      return;
    }
    if (user?.role === "buyer" && !isBuyerPremium) {
      toast({
        title: "Subscription Required",
        description: "Please subscribe to a buyer plan to chat with providers.",
        variant: "destructive",
      });
      router.push("/subscriptions/buyer");
      return;
    }
    const providerUserId = service?.provider?._id;
    const providerName = service?.provider?.name || service?.provider?.businessName;
    if (!providerUserId) return;
    const params = new URLSearchParams({
      providerId: String(providerUserId),
      ...(service?.id && { serviceId: String(service.id) }),
      ...(providerName && { name: String(providerName) }),
    });
    router.push(`/chat?${params.toString()}`);
  }, [isAuthenticated, user?.role, isBuyerPremium, actualId, router, toast, service?.provider, service?.id]);

  const handleSubmitRequest = useCallback(async (data: {
    date: Date;
    time: string;
    requirementNote: string;
    paymentMethod?: string;
    advancePayment?: number;
    paymentOption: "full" | "advance" | "later";
    saveOnly?: boolean;
  }) => {
    try {
      if (data.saveOnly) {
        if (!service?.id) {
          toast({ title: "Error", description: "Service not found", variant: "destructive" });
          return;
        }
        const dateStr = data.date.toISOString().split('T')[0];
        const bookingData = {
          service: service.id,
          date: dateStr,
          time: data.time,
          requirementNote: data.requirementNote,
          paymentOption: data.paymentOption,
        };
        
        const response = await api.bookings.create(bookingData);
        
        if (response.success && response.data) {
          const booking = (response.data as any).booking;
          const savedBookingId = booking._id || booking.id;
          setBookingId(savedBookingId);
          toast({
            title: "Booking Saved",
            description: "Your booking has been saved. Please proceed with payment.",
          });
        } else {
          throw new Error(response.error?.message || "Failed to save booking");
        }
      } else {
        if (!bookingId) {
          toast({
            title: "Error",
            description: "Booking not found. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        const paymentData = {
          paymentMethod: data.paymentMethod!,
          amount: service?.price || 0,
          paymentOption: "full" as const,
        };
        
        const response = await api.bookings.updatePayment(bookingId, paymentData);
        
        if (response.success) {
          toast({
            title: "Payment Successful",
            description: `Your booking is confirmed! Payment of ₹${paymentData.amount.toLocaleString()} has been processed.`,
          });
          setBookingId(null);
          setRequestModalOpen(false);
        } else {
          throw new Error(response.error?.message || "Payment failed");
        }
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }, [service, toast]);

  const handleToggleFavorite = useCallback(async () => {
    if (!service) return;
    
    try {
      const response = await api.favorites.toggle(service.id);
      if (response.success && response.data) {
        const data = response.data as { isFavorite: boolean };
        setIsSaved(data.isFavorite);
        toast({
          title: data.isFavorite ? "Added to favorites" : "Removed from favorites",
          description: data.isFavorite 
            ? "Service saved to your favorites" 
            : "Service removed from favorites",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.error?.message || "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    }
  }, [service, toast]);

  const handleShare = useCallback(async () => {
    if (navigator.share && service) {
      try {
        await navigator.share({
          title: service.title,
          text: `Check out this service: ${service.title}`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else if (service) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Service link copied to clipboard",
      });
    }
  }, [service, toast]);

  // SEO metadata - Update document head (must be before any early returns)
  useEffect(() => {
    if (!service) return;

    const locationString = service.location 
      ? `${service.location.city || ""}${service.location.state ? `, ${service.location.state}` : ""}`.trim()
      : "";

    const pageTitle = `${service.title}${locationString ? ` in ${locationString}` : ""} | Imagineering India`;
    const pageDescription = service.description.length > 160 
      ? service.description.substring(0, 157) + "..." 
      : service.description;
    
    // Update document title
    document.title = pageTitle;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', pageDescription);
    
    // Update or create Open Graph tags
    const ogTags = [
      { property: 'og:title', content: service.title },
      { property: 'og:description', content: pageDescription },
      { property: 'og:image', content: service.images[0] || '' },
      { property: 'og:url', content: window.location.href },
      { property: 'og:type', content: 'product' },
    ];
    
    ogTags.forEach(({ property, content }) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    });
    
    // Add JSON-LD schema
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Service",
      "name": service.title,
      "description": service.description,
      "provider": {
        "@type": "Organization",
        "name": service.provider.name,
      },
      "areaServed": locationString,
      "offers": {
        "@type": "Offer",
        "price": service.price,
        "priceCurrency": "INR",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": service.rating,
        "reviewCount": service.reviewCount,
      },
    });
    
    // Remove existing schema script if any
    const existingSchema = document.querySelector('script[type="application/ld+json"]');
    if (existingSchema) {
      existingSchema.remove();
    }
    document.head.appendChild(schemaScript);
    
    // Cleanup function
    return () => {
      document.title = 'Imagineering India';
    };
  }, [service]);

  // Loading state
  if (loading || isAuthLoading) {
    return <ServiceDetailSkeleton />;
  }

  // Error state
  if (error || !service) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Service Not Found</h1>
          <p className="text-muted-foreground">{error || "The service you're looking for doesn't exist."}</p>
          <Button onClick={() => router.push("/services")}>
            Back to Services
          </Button>
        </div>
      </main>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1">
          <div className="container px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/services" className="hover:text-foreground transition-colors">
                Services
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">
                {service.title}
              </span>
            </nav>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
              {/* Left: Image Gallery */}
              <div className="space-y-4">
                <div className="relative">
                  <ServiceGallery images={service.images} />
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-all bg-background/90 backdrop-blur-sm"
                      onClick={handleShare}
                      aria-label="Share this service"
                      title="Share this service"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 rounded-full shadow-md hover:shadow-lg transition-all bg-background/90 backdrop-blur-sm"
                      onClick={handleToggleFavorite}
                      aria-label={isSaved ? "Remove from favorites" : "Add to favorites"}
                      title={isSaved ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Product Info & CTA */}
              <div className="lg:sticky lg:top-6 lg:self-start space-y-6">
                {/* Category Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-sm">{categoryName}</Badge>
                  {service.subcategory && (
                    <Badge variant="secondary" className="text-sm bg-primary/10 text-primary">
                      {service.subcategory}
                    </Badge>
                  )}
                  {service.itemType && (
                    <Badge variant="outline" className="text-sm">
                      {service.itemType}
                    </Badge>
                  )}
                  {service.featured && (
                    <Badge variant="default" className="text-sm">
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {service.title}
                </h1>

                {/* Rating & Location */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-warning text-warning" />
                      <span className="font-semibold text-base">{service.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-muted-foreground">
                      ({service.reviewCount} {service.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                  {service.location && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {service.location.city || service.location.address}
                        {service.location.state && `, ${service.location.state}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Provider Info */}
                <Card className="border bg-card/60 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={service.provider.avatar} />
                      <AvatarFallback>
                        {service.provider.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/provider/${service.provider.slug || service.provider._id}`}
                          className="font-semibold hover:text-primary transition-colors truncate"
                        >
                          {service.provider.businessName || service.provider.name}
                        </Link>
                        {service.provider.verified && (
                          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {service.provider.businessName ? "Business" : service.provider.name ? "Service Provider" : "Provider"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Price */}
                {showPricing && (
                  <Card className="border border-primary/20 bg-primary/5 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <div className="flex flex-wrap items-baseline gap-2">
                        {service.mrp != null && service.mrp > 0 && (
                          <span className="text-lg sm:text-xl font-semibold text-muted-foreground line-through">
                            ₹{service.mrp.toLocaleString()}
                            {priceTypeLabels[service.priceType] ? ` ${priceTypeLabels[service.priceType]}` : ""}
                          </span>
                        )}
                        <span className="text-3xl sm:text-4xl font-bold text-primary">
                          ₹{service.price.toLocaleString()}
                        </span>
                        {priceTypeLabels[service.priceType] && (
                          <span className="text-lg sm:text-xl font-semibold text-foreground">
                            {priceTypeLabels[service.priceType]}
                          </span>
                        )}
                      </div>
                      {service.priceType === "negotiable" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Price is negotiable
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
                {!showPricing && (
                  <Card className="border bg-muted/60 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">Pricing</p>
                      <p className="text-base font-medium text-foreground">
                        Contact for quotation
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* CTA & Quick Info */}
                <Card className="border bg-card shadow-sm">
                  <CardContent className="space-y-4 p-4">
                    {/* CTA Buttons */}
                    <div className="space-y-3">
                      {canBook ? (
                        <>
                          {interactionType === "PURCHASE_ONLY" ? (
                            // No Book Now - show Add to Cart below when showPricing
                            isAuthenticated ? null : (
                              <Button
                                onClick={handleRequestViaPlatform}
                                className="w-full h-12 text-base font-semibold"
                                size="lg"
                              >
                                Login to Continue
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={handleRequestViaPlatform}
                              className="w-full h-12 text-base font-semibold"
                              size="lg"
                            >
                              {isAuthenticated ? primaryCTA : "Login to Continue"}
                            </Button>
                          )}
                          {secondaryCTA && secondaryCTA !== "Book Now" && showPricing && (
                            isAuthenticated ? (
                              <AddToCartButton
                                serviceId={service.id}
                                providerName={service.provider?.name}
                                label={secondaryCTA}
                                onAdded={() => router.push("/cart")}
                                className="w-full h-11 border-2"
                              />
                            ) : (
                              <Button
                                onClick={handleRequestViaPlatform}
                                variant="outline"
                                className="w-full h-11 border-2"
                                size="lg"
                              >
                                Login to Continue
                              </Button>
                            )
                          )}
                          {showPricing && (
                            <AddToCartButton
                              serviceId={service.id}
                              providerName={service.provider?.name}
                              label="Add to Cart"
                              className="w-full h-11"
                            />
                          )}
                        </>
                      ) : (
                        <Button
                          onClick={handleRequestViaPlatform}
                          className="w-full h-12 text-base font-semibold"
                          size="lg"
                        >
                          {isAuthenticated ? primaryCTA : "Login to Continue"}
                        </Button>
                      )}
                      {/* Chat - platform-only contact (OLX style) */}
                      <Button
                        onClick={handleOpenChat}
                        variant="outline"
                        className="w-full h-11 border-2"
                        size="lg"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Provider
                      </Button>
                      {helperText && (
                        <p className="text-xs text-muted-foreground text-center">
                          {helperText}
                        </p>
                      )}
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground mb-1">Delivery Time</p>
                        <p className="text-sm font-semibold">{service.deliveryTime}</p>
                      </div>
                      {service.provider.rating && (
                        <div className="p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground mb-1">Provider Rating</p>
                          <p className="text-sm font-semibold">{service.provider.rating.toFixed(1)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs Section */}
            <div className="mb-8">
              <Tabs defaultValue="description" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="reviews">
                    Reviews ({service.reviewCount})
                  </TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                </TabsList>
                
                <TabsContent value="description" className="mt-6">
                  <ServiceDescription
                    description={service.description}
                    included={[]}
                    notIncluded={[]}
                    availability={service.deliveryTime}
                  />
                  
                  {/* Custom Fields - Dynamic Section */}
                  {service.customFields && service.customFields.length > 0 && (
                    <div className="mt-6">
                      <CustomFields fields={service.customFields} />
                    </div>
                  )}
                  
                  {/* Tags */}
                  {service.tags && service.tags.length > 0 && (
                    <div className="mt-6">
                      <Card>
                        <CardContent className="p-6">
                          <h3 className="text-lg font-semibold mb-4">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {service.tags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="reviews" className="mt-6">
                  <Reviews
                    serviceId={service.id}
                    averageRating={service.rating}
                    totalReviews={service.reviewCount}
                    reviews={[]}
                  />
                </TabsContent>
                
                <TabsContent value="location" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {service.location?.coordinates && (
                      <MapPreview
                        location={{
                          address: service.location.address,
                          area: (service.location as any).area || service.location.city || "",
                          city: service.location.city,
                          coordinates: service.location.coordinates,
                        }}
                        serviceRadius={15}
                      />
                    )}
                    <ProviderCard
                      provider={{
                        id: service.provider._id,
                        name: service.provider.name,
                        avatar: service.provider.avatar,
                        isVerified: !!service.provider.verified,
                        experience: (service.provider as any).experience ?? 0,
                        completedJobs: (service.provider as any).completedJobs ?? 0,
                        rating: service.provider.rating ?? service.rating,
                        trustBadges: (service.provider as any).trustBadges,
                      }}
                      onSave={handleToggleFavorite}
                      isSaved={isSaved}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Similar Services */}
            {similarServices.length > 0 && (
              <SimilarServices services={similarServices} />
            )}
          </div>
        </main>

        {/* Request Modal */}
        {service && (
          <DynamicBookingModal
            open={requestModalOpen}
            onOpenChange={(open) => {
              setRequestModalOpen(open);
              if (!open) {
                setBookingId(null);
              }
            }}
            service={{
              id: service.id,
              title: service.title,
              price: service.price,
              category: service.category,
              subcategory: service.subcategory,
              itemType: service.itemType,
            }}
            bookingId={bookingId}
            onSubmit={async (data) => {
              try {
                if (data.saveOnly) {
                  const dateStr = data.date.toISOString().split('T')[0];
                  const bookingData: any = {
                    service: service.id,
                    date: dateStr,
                    time: data.time,
                    requirementNote: data.requirementNote,
                    paymentOption: data.paymentOption,
                    formData: data.formData,
                    location: data.location,
                  };
                  
                  const response = await api.bookings.create(bookingData);
                  
                  if (response.success && response.data) {
                    const booking = (response.data as any).booking;
                    const savedBookingId = booking._id || booking.id;
                    setBookingId(savedBookingId);
                    toast({
                      title: "Booking Saved",
                      description: "Your booking has been saved. Please proceed with payment.",
                    });
                    return savedBookingId;
                  } else {
                    throw new Error(response.error?.message || "Failed to save booking");
                  }
                }
              } catch (error: any) {
                console.error("Booking error:", error);
                toast({
                  title: "Error",
                  description: error.message || "Something went wrong. Please try again.",
                  variant: "destructive",
                });
                throw error;
              }
            }}
          />
        )}
      </div>
  );
}
