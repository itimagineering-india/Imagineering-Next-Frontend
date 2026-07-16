"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, usePathname, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  BadgeCheck,
  BadgePercent,
  Boxes,
  ChevronRight,
  Clock3,
  CreditCard,
  Heart,
  Home,
  MapPin,
  MapPinned,
  PackageCheck,
  ReceiptText,
  Share2,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ServiceGallery,
  ProviderCard,
  MapPreview,
  DynamicBookingModal,
  Reviews,
  SimilarServices,
  CustomFields,
  ServiceDetailSkeleton,
  ConstructionMaterialProductLayout,
} from "@/components/service-details";
import { GetBestQuotesModal } from "@/components/service-details/GetBestQuotesModal";
import {
  shouldShowPricing,
  canBookDirectly,
  getHelperText,
  type ServiceWithInteraction,
} from "@/lib/interactionType";
import { AddToCartButton } from "@/components/services/AddToCartButton";
import { BestSupplierCard } from "@/components/routing/BestSupplierCard";
import { ProviderOffersModal } from "@/components/providers/ProviderOffersModal";
import { formatServicePrice, isRangePricedService } from "@/lib/formatServicePrice";
import { useTranslation } from "react-i18next";
import { isConstructionMaterialsCategorySlug } from "@/lib/constructionMaterials";
import type { ImagineScoreData } from "@/components/trust/ImagineScorePanel";

export async function getServerSideProps() { return { props: {} }; }

const EXCLUDED_METADATA_KEYS = new Set([
  "title",
  "description",
  "price",
  "priceType",
  "images",
  "image",
  "category",
  "subcategory",
  "location",
]);

function toReadableFieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferFieldType(value: unknown): "text" | "number" | "boolean" | "select" {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  return "text";
}

/** Build display rows from Service.metadata (e.g. construction materials from admin/app). */
function metadataToCustomFields(metadata: unknown): Array<{
  label: string;
  value: string | number | boolean;
  type: "text" | "number" | "boolean" | "select";
}> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];

  const out: Array<{
    label: string;
    value: string | number | boolean;
    type: "text" | "number" | "boolean" | "select";
  }> = [];

  for (const [key, rawValue] of Object.entries(metadata as Record<string, unknown>)) {
    if (EXCLUDED_METADATA_KEYS.has(key)) continue;
    if (rawValue === null || rawValue === undefined) continue;

    if (typeof rawValue === "string") {
      const v = rawValue.trim();
      if (!v) continue;
      out.push({ label: toReadableFieldLabel(key), value: v, type: "text" });
      continue;
    }

    if (typeof rawValue === "number" || typeof rawValue === "boolean") {
      out.push({ label: toReadableFieldLabel(key), value: rawValue, type: inferFieldType(rawValue) });
      continue;
    }

    if (Array.isArray(rawValue)) {
      const joined = rawValue
        .map((item) => (item == null ? "" : String(item).trim()))
        .filter(Boolean)
        .join(", ");
      if (joined) {
        out.push({ label: toReadableFieldLabel(key), value: joined, type: "text" });
      }
      continue;
    }

    if (typeof rawValue === "object") {
      const serialized = JSON.stringify(rawValue);
      if (serialized && serialized !== "{}") {
        out.push({ label: toReadableFieldLabel(key), value: serialized, type: "text" });
      }
    }
  }

  return out;
}

interface ServiceData {
  id: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
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
    experience?: number;
    yearsOfExperience?: number;
    experienceYears?: number;
    completedJobs?: number;
    trustBadges?: string[];
    imagineScore?: ImagineScoreData | null;
  };
  location?: {
    address: string;
    area?: string;
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
  metadata?: Record<string, unknown>;
}

export default function ServiceDetails() {
  const { t } = useTranslation("serviceDetails");
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
  const [quotesModalOpen, setQuotesModalOpen] = useState(false);
  const [offersModalOpen, setOffersModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [similarServices, setSimilarServices] = useState<any[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const latestActualIdRef = useRef(actualId);
  latestActualIdRef.current = actualId;

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
  const CACHE_KEY = `service_details_v2_${actualId}`;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

  // Fetch service data
  useEffect(() => {
    const idForThisRun = actualId;
    let cancelled = false;

    const isStale = () => cancelled || latestActualIdRef.current !== idForThisRun;

    const fetchService = async () => {
      if (!idForThisRun) {
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
            if (isStale()) return;
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
      if (!idForThisRun) return;

      if (isStale()) return;
      setLoading(true);
      setError(null);
      
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout")), 10000)
        );
        
        // Fetch enriched service data (includes favorite status and similar services)
        const apiPromise = api.services.getById(idForThisRun);
        const response = await Promise.race([apiPromise, timeoutPromise]) as any;

        if (isStale()) return;
        
        if (response.success && response.data) {
          const serviceData = response.data.service;
          const isFavoriteResult = response.data.isFavorite || false;
          const similarServicesResult = response.data.similarServices || [];
          
          const providerExperience =
            serviceData.provider?.yearsOfExperience ??
            serviceData.provider?.experienceYears ??
            serviceData.provider?.experience ??
            0;

          // Transform API response
          const transformedService: ServiceData = {
            id: serviceData._id || serviceData.id,
            slug: serviceData.slug,
            title: serviceData.title || "Untitled Service",
            description: serviceData.description || "No description available.",
            price: serviceData.price || 0,
            priceMode: serviceData.priceMode || "exact",
            priceMin: serviceData.priceMin,
            priceMax: serviceData.priceMax,
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
              slug: serviceData.provider?.slug,
              name: serviceData.provider?.name || "Provider",
              businessName: serviceData.provider?.businessName,
              email: serviceData.provider?.email,
              // If no custom avatar is set, don't force a stock photo – let AvatarFallback show initials instead.
              avatar: serviceData.provider?.avatar || "",
              phone: serviceData.provider?.phone,
              location: serviceData.provider?.location,
              verified: serviceData.provider?.verified,
              rating: serviceData.provider?.rating,
              experience: Number(providerExperience) || 0,
              yearsOfExperience: Number(providerExperience) || 0,
              experienceYears: Number(providerExperience) || 0,
              completedJobs: serviceData.provider?.completedJobs,
              trustBadges: serviceData.provider?.trustBadges,
              imagineScore: serviceData.provider?.imagineScore,
            },
            location: serviceData.location,
            rating: serviceData.rating || 0,
            reviewCount: serviceData.reviewCount || 0,
            deliveryTime: serviceData.deliveryTime || "Contact for details",
            tags: serviceData.tags || [],
            featured: serviceData.featured || false,
            metadata: serviceData.metadata,
            customFields:
              serviceData.customFields && serviceData.customFields.length > 0
                ? serviceData.customFields
                : metadataToCustomFields(serviceData.metadata),
          };
          
          setService(transformedService);
          setIsSaved(isFavoriteResult);
          setSimilarServices(similarServicesResult);

          // Redirect to slug URL when visiting by id (for SEO-friendly URLs)
          const slug = serviceData.slug;
          const serviceIdVal = serviceData._id || serviceData.id;
          const isIdParam = /^[a-fA-F0-9]{24}$/.test(idForThisRun || "");
          if (slug && isIdParam && idForThisRun === serviceIdVal?.toString?.()) {
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
          if (!isStale()) setError("Service not found");
        }
      } catch (error: any) {
        console.error("Error fetching service:", error);
        if (!isStale()) setError(error.message || "Failed to load service details. Please try again.");
      } finally {
        if (!isStale()) setLoading(false);
      }
    };

    fetchService();
    return () => {
      cancelled = true;
    };
  }, [actualId, CACHE_KEY, router]);

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
  
  const showPricing = useMemo(() => shouldShowPricing(serviceWithInteraction), [serviceWithInteraction]);
  const canBook = useMemo(() => canBookDirectly(serviceWithInteraction), [serviceWithInteraction]);
  const helperText = useMemo(() => getHelperText(serviceWithInteraction), [serviceWithInteraction]);
  const formattedServicePrice = useMemo(
    () => (service ? formatServicePrice(service) : ""),
    [service]
  );
  const isRangePrice = useMemo(
    () => (service ? isRangePricedService(service) : false),
    [service]
  );
  const canAddToCart = showPricing && !isRangePrice;

  const categorySlug = useMemo(() => {
    if (!service) return "";
    return typeof service.category === "object" ? service.category.slug : "";
  }, [service]);

  const isConstructionMaterialPage = useMemo(
    () => isConstructionMaterialsCategorySlug(categorySlug),
    [categorySlug],
  );

  const specFields = useMemo(() => {
    if (!service) return [];
    const fromCustom = service.customFields || [];
    if (fromCustom.length > 0) return fromCustom;
    return metadataToCustomFields(service.metadata);
  }, [service]);

  const cityLabel = service?.location?.city || "your city";

  const fieldValue = useCallback((labels: string[]) => {
    const fields = service?.customFields || [];
    const normalizedLabels = labels.map((label) => label.toLowerCase());
    const found = fields.find((field) => {
      const label = String(field.label || "").toLowerCase();
      return normalizedLabels.some((candidate) => label.includes(candidate));
    });
    if (!found || found.value === null || found.value === undefined) return "";
    return String(found.value).trim();
  }, [service?.customFields]);

  const availability = useMemo(() => {
    const raw = fieldValue(["availability", "stock status", "material availability"]).toLowerCase();
    if (raw.includes("out")) return "Out of Stock";
    if (raw.includes("limited") || raw.includes("low")) return "Limited Stock";
    if (raw.includes("stock") || raw.includes("available")) return "In Stock";
    return "In Stock";
  }, [fieldValue]);

  const deliveryTime = useMemo(
    () => fieldValue(["delivery time", "estimated delivery"]) || service?.deliveryTime || "Contact supplier",
    [fieldValue, service?.deliveryTime]
  );
  const deliveryCharges = useMemo(
    () => fieldValue(["delivery charges", "delivery charge"]) || "Contact supplier",
    [fieldValue]
  );
  const deliveryOption = useMemo(
    () => fieldValue(["delivery option", "delivery available"]) || "Delivery Available",
    [fieldValue]
  );
  const loadingSupport = useMemo(
    () => fieldValue(["loading unloading", "loading", "unloading"]) || "Ask supplier",
    [fieldValue]
  );
  const serviceRadius = useMemo(
    () => fieldValue(["radius", "service radius", "delivery radius"]) || "15 km",
    [fieldValue]
  );

  const trustBadges = useMemo(() => {
    if (!service) return [];
    const badges = [
      service.provider.imagineScore?.isImagineeringVerified
        ? { label: "Imagineering Verified", icon: ShieldCheck, className: "bg-emerald-50 text-emerald-700 border-emerald-200" }
        : null,
      service.provider.verified ? { label: "Business Verified", icon: BadgeCheck, className: "bg-blue-50 text-blue-700 border-blue-200" } : null,
      fieldValue(["gst", "gst invoice"]) ? { label: "GST Verified", icon: ReceiptText, className: "bg-emerald-50 text-emerald-700 border-emerald-200" } : null,
      deliveryOption.toLowerCase().includes("available") ? { label: "Delivery Available", icon: Truck, className: "bg-orange-50 text-orange-700 border-orange-200" } : null,
      deliveryTime.toLowerCase().includes("same day") ? { label: "Same Day Delivery", icon: Clock3, className: "bg-purple-50 text-purple-700 border-purple-200" } : null,
      loadingSupport && !loadingSupport.toLowerCase().includes("ask") ? { label: "Loading Included", icon: PackageCheck, className: "bg-indigo-50 text-indigo-700 border-indigo-200" } : null,
      { label: "Trusted Supplier", icon: ShieldCheck, className: "bg-slate-50 text-slate-700 border-slate-200" },
    ];
    return badges.filter(Boolean) as Array<{ label: string; icon: typeof ShieldCheck; className: string }>;
  }, [deliveryOption, deliveryTime, fieldValue, loadingSupport, service]);

  const redirectToLogin = useCallback(() => {
    const currentPath = `${pathname || `/service/${actualId}`}${searchParamsFromUrl?.toString() ? `?${searchParamsFromUrl.toString()}` : ""}`;
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  }, [actualId, pathname, router, searchParamsFromUrl]);

  // Memoized handlers
  const handleRequestViaPlatform = useCallback(() => {
    if (!isAuthenticated) {
      redirectToLogin();
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
  }, [isAuthenticated, service, toast, canBook, redirectToLogin]);

  const buildServiceEnquiryMessage = useCallback(() => {
    if (!service) {
      return "Hi, I want to know more about this item.";
    }

    const categoryName =
      typeof service.category === "string" ? service.category : service.category?.name;
    const locationText = [
      service.location?.area,
      service.location?.city,
      service.location?.state,
    ]
      .filter(Boolean)
      .join(", ");
    const shortDescription = service.description?.trim()
      ? service.description.trim().slice(0, 220)
      : "";

    return [
      "Hi, I want to know more about this item.",
      "",
      `Service: ${service.title}`,
      showPricing && formattedServicePrice ? `Price: ${formattedServicePrice}` : "",
      categoryName ? `Category: ${categoryName}` : "",
      service.subcategory ? `Subcategory: ${service.subcategory}` : "",
      locationText ? `Location: ${locationText}` : "",
      shortDescription ? `Details: ${shortDescription}${service.description.length > 220 ? "..." : ""}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }, [formattedServicePrice, service, showPricing]);

  const handleOpenChat = useCallback(async (prefillEnquiry = false) => {
    if (!isAuthenticated) {
      redirectToLogin();
      toast({
        title: "Login Required",
        description: "Please login to chat with the provider",
        variant: "destructive",
      });
      return;
    }
    const providerUserId = service?.provider?._id;
    const providerName = service?.provider?.name || service?.provider?.businessName;
    if (!providerUserId) return;
    const enquiryMessage = prefillEnquiry ? buildServiceEnquiryMessage() : "";
    const params = new URLSearchParams({
      providerId: String(providerUserId),
      ...(service?.id && { serviceId: String(service.id) }),
      ...(providerName && { name: String(providerName) }),
      ...(prefillEnquiry && { message: enquiryMessage }),
    });
    try {
      sessionStorage.setItem(
        "ii_pending_chat_intent",
        JSON.stringify({
          providerId: String(providerUserId),
          serviceId: service?.id ? String(service.id) : "",
          name: providerName ? String(providerName) : "",
          message: prefillEnquiry ? enquiryMessage : "",
          createdAt: Date.now(),
        })
      );
    } catch {
      // URL params are still enough when session storage is unavailable.
    }
    router.push(`/chat?${params.toString()}`);
  }, [buildServiceEnquiryMessage, isAuthenticated, router, toast, service?.provider, service?.id, redirectToLogin]);

  const handleGetBestQuotes = useCallback(() => {
    if (!isAuthenticated) {
      redirectToLogin();
      toast({
        title: "Login Required",
        description: "Please login to get quotes from nearby providers",
        variant: "destructive",
      });
      return;
    }
    setQuotesModalOpen(true);
  }, [isAuthenticated, redirectToLogin, toast]);

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
          <h1 className="text-2xl font-bold">{t("serviceNotFound", "Service Not Found")}</h1>
          <p className="text-muted-foreground">{error || "The service you're looking for doesn't exist."}</p>
          <Button onClick={() => router.push("/services")}>
            {t("backToServices", "Back to Services")}
          </Button>
        </div>
      </main>
    );
  }


  return (
    <div className="min-h-screen max-w-full overflow-x-clip flex flex-col bg-[radial-gradient(circle_at_top_left,rgba(255,56,92,0.08),transparent_34%),linear-gradient(180deg,#fff,rgba(248,250,252,0.9))]">
        <main className="min-w-0 flex-1 overflow-x-clip">
          <div className={`layout-shell overflow-x-clip pt-4 sm:pt-6 md:pt-8 ${isConstructionMaterialPage ? "pb-28 lg:pb-28" : "pb-28 lg:pb-8"}`}>
            {isConstructionMaterialPage && (
              <ConstructionMaterialProductLayout
                service={service}
                categoryName={categoryName}
                categorySlug={categorySlug}
                formattedPrice={formattedServicePrice}
                isRangePrice={isRangePrice}
                showPricing={showPricing}
                specFields={specFields}
                similarServices={similarServices}
                cityLabel={cityLabel}
                onGetQuotes={handleGetBestQuotes}
                onShare={handleShare}
                onFavorite={handleToggleFavorite}
                isSaved={isSaved}
              />
            )}

            <div className={isConstructionMaterialPage ? "lg:hidden" : undefined}>
            <nav className="mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-1 text-xs text-muted-foreground sm:mb-6 sm:text-sm">
              <Link href="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5" />
                Home
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/services" className="hover:text-foreground transition-colors">
                Services
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="max-w-[180px] truncate font-medium text-foreground sm:max-w-none">
                {service.title}
              </span>
            </nav>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-8">
              <div className="min-w-0 space-y-4 sm:space-y-5">
                <Card className="overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-rose-50/40 to-orange-50/40 shadow-sm">
                  <CardContent className="relative p-2 sm:p-3">
                    <ServiceGallery images={service.images} />
                    <div className="absolute right-3 top-3 z-10 flex gap-2 sm:right-5 sm:top-5">
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/90 shadow-md backdrop-blur-sm sm:h-9 sm:w-9" onClick={handleShare}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background/90 shadow-md backdrop-blur-sm sm:h-9 sm:w-9" onClick={handleToggleFavorite}>
                        <Heart className={`h-4 w-4 ${isSaved ? "fill-destructive text-destructive" : ""}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
                <Card className="rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-white to-rose-50/70 shadow-lg shadow-primary/5">
                  <CardContent className="space-y-4 p-4 sm:space-y-5 sm:p-6">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="rounded-full px-3 py-1">{categoryName}</Badge>
                      {service.subcategory && <Badge className="rounded-full bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">{service.subcategory}</Badge>}
                      <Badge
                        className={`rounded-full px-3 py-1 ${
                          availability === "Out of Stock"
                            ? "bg-red-50 text-red-700 hover:bg-red-50"
                            : availability === "Limited Stock"
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {availability}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h1 className="text-2xl font-bold leading-[1.14] tracking-[-0.035em] text-foreground sm:text-4xl lg:text-[42px]">{service.title}</h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground sm:text-sm lg:text-base">
                        <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-foreground">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          {service.rating.toFixed(1)}
                        </span>
                        <span>({service.reviewCount} {service.reviewCount === 1 ? "review" : "reviews"})</span>
                        {service.location && (
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="truncate">{service.location.city || service.location.address}{service.location.state ? `, ${service.location.state}` : ""}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {trustBadges.map((badge) => {
                        const Icon = badge.icon;
                        return (
                          <span key={badge.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold lg:text-sm ${badge.className}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>

                    <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/15 via-rose-50 to-amber-50 shadow-sm">
                      <CardContent className="space-y-3 p-3 sm:p-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:text-sm">Current Price</p>
                          {showPricing ? (
                            <div className="mt-1 flex flex-wrap items-end gap-2">
                              {!isRangePrice && service.mrp != null && service.mrp > service.price && (
                                <span className="text-lg font-semibold tabular-nums text-muted-foreground line-through">₹{service.mrp.toLocaleString()}</span>
                              )}
                              <span className="min-w-0 break-words text-3xl font-extrabold tabular-nums tracking-[-0.04em] text-primary sm:text-5xl lg:text-[52px]">{formattedServicePrice}</span>
                              {isRangePrice && <Badge variant="outline" className="mb-1">Enquiry only</Badge>}
                            </div>
                          ) : (
                            <p className="mt-1 text-2xl font-bold tracking-[-0.02em] text-foreground">
                              {t("contactForQuotation", "Contact for quotation")}
                            </p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-sm font-bold tracking-[-0.01em] text-foreground">Offers & EMI Plans</p>
                              <p className="text-xs font-medium text-muted-foreground">
                                Provider promotions, platform deals & coupon codes
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto shrink-0 rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                              onClick={() => setOffersModalOpen(true)}
                            >
                              View offers
                            </Button>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            {[
                              { label: "Bulk order offer", value: "Best price on quantity orders", icon: BadgePercent },
                              { label: "EMI plans", value: "Available on eligible orders", icon: CreditCard },
                            ].map((offer) => {
                              const Icon = offer.icon;
                              return (
                                <div key={offer.label} className="flex gap-2 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-2.5 sm:p-3">
                                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{offer.label}</p>
                                    <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">{offer.value}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {service?.id && (
                      <BestSupplierCard
                        serviceId={service.id}
                        city={service.location?.city}
                        lat={service.location?.coordinates?.lat}
                        lng={service.location?.coordinates?.lng}
                        urgency="flexible"
                      />
                    )}

                    <div className="hidden space-y-2 lg:block">
                      {canAddToCart ? (
                        <AddToCartButton serviceId={service.id} providerName={service.provider?.name} label={t("addToCart", "Add to Cart")} className="h-12 w-full text-base font-semibold" />
                      ) : showPricing && isRangePrice ? (
                        <Button onClick={handleGetBestQuotes} className="h-12 w-full text-base font-semibold">
                          Get Best Quotes
                        </Button>
                      ) : showPricing ? (
                        <Button onClick={() => handleOpenChat(true)} className="h-12 w-full text-base font-semibold">
                          {t("enquireNow", "Enquire Now")}
                        </Button>
                      ) : null}
                      {helperText && <p className="text-center text-xs text-muted-foreground lg:text-sm">{helperText}</p>}
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>

            <div className="mt-6 space-y-4 md:hidden">
              <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                <CardHeader className="p-4">
                  <CardTitle className="text-xl font-bold tracking-[-0.02em]">About this Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0">
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{service.description}</p>
                  {service.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {service.tags.map((tag, index) => <Badge key={index} variant="outline" className="rounded-full">{tag}</Badge>)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <section className="space-y-3">
                <h2 className="px-1 text-xl font-bold tracking-[-0.02em] text-foreground">{t("specifications")}</h2>
                {service.customFields?.length ? (
                  <CustomFields fields={service.customFields} />
                ) : (
                  <Card className="rounded-2xl bg-gradient-to-br from-white to-slate-50"><CardContent className="p-4 text-sm text-muted-foreground">No specifications added yet.</CardContent></Card>
                )}
              </section>

              <section className="space-y-3">
                <h2 className="px-1 text-xl font-bold tracking-[-0.02em] text-foreground">{t("deliveryInfo")}</h2>
                <div className="grid gap-3">
                  {[
                    { label: "Delivery Radius", value: serviceRadius, icon: MapPinned },
                    { label: "Delivery Time", value: deliveryTime, icon: Clock3 },
                    { label: "Loading / Unloading", value: loadingSupport, icon: PackageCheck },
                    { label: "Delivery Charges", value: deliveryCharges, icon: ReceiptText },
                    { label: "Available Locations", value: service.location ? `${service.location.city || service.location.address}${service.location.state ? `, ${service.location.state}` : ""}` : "Contact supplier", icon: MapPin },
                    { label: "Stock Status", value: availability, icon: Boxes },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card key={item.label} className="rounded-2xl border-primary/10 bg-gradient-to-br from-white via-primary/5 to-sky-50/70 shadow-sm">
                        <CardContent className="flex items-start gap-3 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium tracking-wide text-muted-foreground">{item.label}</p>
                            <p className="mt-1 break-words text-sm font-semibold tabular-nums text-foreground">{item.value}</p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="grid gap-4">
                  {service.location?.coordinates && (
                    <MapPreview
                      location={{
                        address: service.location.address,
                        area: service.location.area || service.location.city || "",
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
                      experience: service.provider.experience ?? 0,
                      completedJobs: service.provider.completedJobs ?? 0,
                      rating: service.provider.rating ?? service.rating,
                      trustBadges: service.provider.trustBadges,
                      imagineScore: service.provider.imagineScore,
                    }}
                    onSave={handleToggleFavorite}
                    isSaved={isSaved}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="px-1 text-xl font-bold tracking-[-0.02em] text-foreground">{t("reviews")}</h2>
                <Reviews serviceId={service.id} averageRating={service.rating} totalReviews={service.reviewCount} reviews={[]} />
              </section>
            </div>

            <Tabs defaultValue="overview" className="mt-6 hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-slate-50 to-rose-50/50 p-2 shadow-sm sm:mt-8 sm:p-4 md:block">
              <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-white/80 p-1 shadow-inner md:grid-cols-4 lg:w-auto">
                <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
                <TabsTrigger value="specifications">{t("specifications")}</TabsTrigger>
                <TabsTrigger value="delivery">{t("deliveryInfo")}</TabsTrigger>
                <TabsTrigger value="reviews">{t("reviews")}</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5">
                <Card className="rounded-2xl border-primary/10 bg-gradient-to-br from-white to-slate-50 shadow-sm">
                  <CardHeader className="p-4 sm:p-6"><CardTitle className="text-xl font-bold tracking-[-0.02em] lg:text-2xl">About this Product</CardTitle></CardHeader>
                  <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                    <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base lg:text-[17px] lg:leading-8">{service.description}</p>
                    {service.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {service.tags.map((tag, index) => <Badge key={index} variant="outline" className="rounded-full">{tag}</Badge>)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="specifications" className="mt-5">
                {service.customFields?.length ? (
                  <CustomFields fields={service.customFields} />
                ) : (
                  <Card className="rounded-2xl bg-gradient-to-br from-white to-slate-50"><CardContent className="p-6 text-sm text-muted-foreground">No specifications added yet.</CardContent></Card>
                )}
              </TabsContent>

              <TabsContent value="delivery" className="mt-5">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: "Delivery Radius", value: serviceRadius, icon: MapPinned },
                    { label: "Delivery Time", value: deliveryTime, icon: Clock3 },
                    { label: "Loading / Unloading", value: loadingSupport, icon: PackageCheck },
                    { label: "Delivery Charges", value: deliveryCharges, icon: ReceiptText },
                    { label: "Available Locations", value: service.location ? `${service.location.city || service.location.address}${service.location.state ? `, ${service.location.state}` : ""}` : "Contact supplier", icon: MapPin },
                    { label: "Stock Status", value: availability, icon: Boxes },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card key={item.label} className="rounded-2xl border-primary/10 bg-gradient-to-br from-white via-primary/5 to-sky-50/70 shadow-sm">
                        <CardContent className="p-4 sm:p-5">
                          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-medium tracking-wide text-muted-foreground lg:text-base">{item.label}</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-foreground lg:text-base">{item.value}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  {service.location?.coordinates && (
                    <MapPreview
                      location={{
                        address: service.location.address,
                        area: service.location.area || service.location.city || "",
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
                      experience: service.provider.experience ?? 0,
                      completedJobs: service.provider.completedJobs ?? 0,
                      rating: service.provider.rating ?? service.rating,
                      trustBadges: service.provider.trustBadges,
                      imagineScore: service.provider.imagineScore,
                    }}
                    onSave={handleToggleFavorite}
                    isSaved={isSaved}
                  />
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-5">
                <Reviews serviceId={service.id} averageRating={service.rating} totalReviews={service.reviewCount} reviews={[]} />
              </TabsContent>
            </Tabs>

            {similarServices.length > 0 && (
              <div className="mt-10 min-w-0 overflow-x-clip">
                <SimilarServices services={similarServices} title="Similar Products" />
              </div>
            )}
            </div>
          </div>
        </main>
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
          <div>
            {canAddToCart ? (
              <AddToCartButton serviceId={service.id} providerName={service.provider?.name} label={t("addToCart", "Add to Cart")} className="h-11 w-full text-sm font-semibold" />
            ) : showPricing && isRangePrice ? (
              <Button onClick={handleGetBestQuotes} className="h-11 w-full text-sm font-semibold">
                Get Best Quotes
              </Button>
            ) : (
              <Button onClick={() => handleOpenChat(true)} className="h-11 w-full text-sm font-semibold">
                {t("enquireNow", "Enquire Now")}
              </Button>
            )}
          </div>
        </div>

        {service && (
          <GetBestQuotesModal
            open={quotesModalOpen}
            onOpenChange={setQuotesModalOpen}
            serviceId={service.id}
            serviceTitle={service.title}
          />
        )}

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

        <ProviderOffersModal
          open={offersModalOpen}
          onOpenChange={setOffersModalOpen}
          providerId={service?.provider?.slug || service?.provider?._id || null}
          serviceId={service?.id || null}
          providerName={service?.provider?.businessName || service?.provider?.name}
        />
      </div>
  );
}
