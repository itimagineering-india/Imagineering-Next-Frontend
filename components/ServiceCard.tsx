"use client";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Heart, Share2, MapPin, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, memo } from "react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  getServiceInteractionType,
  shouldShowPricing,
  getPrimaryCTAText,
  type ServiceWithInteraction,
} from "@/lib/interactionType";
import { AddToCartButton } from "@/components/services/AddToCartButton";

interface ServiceCardProps {
  id: string;
  slug?: string;
  title: string;
  description: string;
  price: number;
  priceType: string;
  image: string;
  provider: {
    id?: string;
    _id?: string;
    name?: string;
    businessName?: string;
    avatar?: string;
    verified?: boolean;
  };
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  featured?: boolean;
  tags?: string[];
  className?: string;
  viewMode?: "grid" | "list";
  location?: {
    city?: string;
    state?: string;
    address?: string;
  };
  category?: {
    _id?: string;
    name?: string;
    slug?: string;
    interactionType?: 'CONTACT_ONLY' | 'PURCHASE_ONLY' | 'HYBRID';
  } | string;
}

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

function ServiceCardComponent({
  id,
  slug,
  title,
  description,
  price,
  priceType,
  image,
  provider,
  rating,
  reviewCount,
  deliveryTime,
  featured,
  tags,
  className,
  viewMode = "grid",
  location,
  category,
}: ServiceCardProps) {
  // Memoize expensive computations
  const service: ServiceWithInteraction = useMemo(() => ({ category }), [category]);
  const showPricing = useMemo(() => shouldShowPricing(service), [service]);
  // On listing pages we always send user to details, so use a simple CTA label
  const ctaText = "View details";
  const priceLabel = useMemo(() => priceTypeLabels[priceType] || "", [priceType]);
  const formattedPrice = useMemo(() => price.toLocaleString(), [price]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const [hasCheckedFavorite, setHasCheckedFavorite] = useState(false);
  const { toast } = useToast();

  // Lazy load favorite status - only check when user interacts with favorite button
  const checkFavoriteLazy = async () => {
    if (hasCheckedFavorite || isLoadingFavorite) return;
    
    setIsLoadingFavorite(true);
    try {
      const response = await api.favorites.check(id);
      if (response.success && response.data) {
        const data = response.data as { isFavorite: boolean };
        setIsFavorite(data.isFavorite);
        setHasCheckedFavorite(true);
      }
    } catch (error) {
      // Silently fail - user might not be logged in
      console.log('Could not check favorite status:', error);
      setHasCheckedFavorite(true); // Mark as checked to prevent retries
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Toggle favorite via API
  const toggleFavorite = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isLoadingFavorite) return;

    // If we haven't checked favorite status yet, check it first
    if (!hasCheckedFavorite) {
      await checkFavoriteLazy();
      // After checking, toggle it
      if (!isLoadingFavorite) {
        // Continue with toggle
      } else {
        return; // Wait for check to complete
      }
    }

    setIsLoadingFavorite(true);
    try {
      const response = await api.favorites.toggle(id);
      if (response.success && response.data) {
        const data = response.data as { isFavorite: boolean };
        setIsFavorite(data.isFavorite);
        toast({
          title: data.isFavorite ? "Added to favorites" : "Removed from favorites",
          description: data.isFavorite 
            ? "Service saved to your favorites" 
            : "Service removed from favorites",
        });
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error);
      toast({
        title: "Error",
        description: error?.error?.message || "Failed to update favorite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  // Check favorite on hover over favorite button (lazy loading)
  const handleFavoriteButtonHover = () => {
    if (!hasCheckedFavorite && !isLoadingFavorite) {
      checkFavoriteLazy();
    }
  };

  const serviceUrl = `/service/${slug || id}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: window.location.origin + serviceUrl,
      });
    } else {
      navigator.clipboard.writeText(window.location.origin + serviceUrl);
      alert("Link copied to clipboard!");
    }
  };

  if (viewMode === "list") {
    return (
      <Card className={cn("group transition-all duration-300 hover:shadow-md", className)}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Image */}
          <Link
            href={serviceUrl}
            className="relative w-full sm:w-32 h-40 sm:h-32 shrink-0 rounded-lg overflow-hidden block"
          >
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            {featured && (
              <Badge className="absolute top-2 left-2 bg-primary text-xs z-10">
                <Crown className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <Link href={serviceUrl}>
                  <h3 className="font-semibold text-base sm:text-lg line-clamp-2 hover:text-primary transition-colors">
                    {title}
                  </h3>
                </Link>
                
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                  <div className="flex items-center gap-1 text-xs sm:text-sm">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="text-sm font-medium">{rating}</span>
                    <span className="text-xs text-muted-foreground">({reviewCount})</span>
                  </div>

                  {location?.city && (
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">
                        {location.city}
                        {location.state && `, ${location.state}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 sm:gap-3 shrink-0 mt-3 sm:mt-0">
                {showPricing && (
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Price</span>
                    <p className="text-xl font-bold">
                      ₹{formattedPrice}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {priceLabel}
                      </span>
                    </p>
                  </div>
                )}
                
                <div className="flex w-full sm:w-auto justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFavorite}
                    onMouseEnter={handleFavoriteButtonHover}
                    disabled={isLoadingFavorite}
                    className={isFavorite ? "text-destructive" : ""}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          aria-label="Share service"
                          title="Share service"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShare}>
                        Share Service
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                    <Button size="sm" asChild className="whitespace-nowrap">
                      <Link href={`/service/${id}`}>View Details</Link>
                    </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col",
        featured && "ring-2 ring-warning",
        className
      )}
    >
      {/* Image + overlay actions */}
      <div className="relative">
        <Link
          href={serviceUrl}
          className="block aspect-[16/10] overflow-hidden"
        >
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
        {featured && (
          <Badge className="absolute top-3 left-3 bg-warning text-warning-foreground">
            <Crown className="h-3 w-3 mr-1" />
            Featured
          </Badge>
        )}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={(e) => toggleFavorite(e)}
            onMouseEnter={handleFavoriteButtonHover}
            disabled={isLoadingFavorite}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-destructive text-destructive")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                aria-label="Share service"
                title="Share service"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleShare}>
                Share Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="px-3 sm:px-4 pt-[2px] pb-[2px] flex-1 flex flex-col">
        {/* Title */}
        <Link href={serviceUrl}>
          <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        {(provider?.businessName || provider?.name) && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {provider.businessName || provider.name}
          </p>
        )}

        {/* Rating & Delivery */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium">{rating}</span>
            <span className="text-muted-foreground">({reviewCount})</span>
          </div>
          {location?.city && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">
                {location.city}
                {location.state && `, ${location.state}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-2 pb-3 sm:pb-4 mt-auto flex flex-col items-stretch gap-2">
        {showPricing ? (
          <div className="w-full sm:w-auto">
            <span className="text-xs text-muted-foreground">Price</span>
            <p className="text-sm sm:text-base font-bold text-foreground">
              ₹{formattedPrice}
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {priceLabel}
              </span>
            </p>
          </div>
        ) : (
          <div className="w-full sm:w-auto text-xs text-muted-foreground">
            Contact for pricing
          </div>
        )}
        <div className="flex flex-col gap-2 w-full">
          <Button size="sm" asChild className="w-full h-8 px-3">
            <Link href={serviceUrl}>{ctaText}</Link>
          </Button>
          {showPricing && (
            <AddToCartButton
              serviceId={id}
              providerName={provider?.name}
              showQuantity={true}
              className="h-8 flex-1 min-w-0"
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Custom comparison function for React.memo
const areEqual = (prevProps: ServiceCardProps, nextProps: ServiceCardProps) => {
  // Compare primitive values
  if (
    prevProps.id !== nextProps.id ||
    prevProps.title !== nextProps.title ||
    prevProps.description !== nextProps.description ||
    prevProps.price !== nextProps.price ||
    prevProps.priceType !== nextProps.priceType ||
    prevProps.image !== nextProps.image ||
    prevProps.rating !== nextProps.rating ||
    prevProps.reviewCount !== nextProps.reviewCount ||
    prevProps.deliveryTime !== nextProps.deliveryTime ||
    prevProps.featured !== nextProps.featured ||
    prevProps.className !== nextProps.className ||
    prevProps.viewMode !== nextProps.viewMode
  ) {
    return false;
  }

  // Compare provider object
  if (
    prevProps.provider?.id !== nextProps.provider?.id ||
    prevProps.provider?._id !== nextProps.provider?._id ||
    prevProps.provider?.name !== nextProps.provider?.name ||
    prevProps.provider?.businessName !== nextProps.provider?.businessName ||
    prevProps.provider?.avatar !== nextProps.provider?.avatar ||
    prevProps.provider?.verified !== nextProps.provider?.verified
  ) {
    return false;
  }

  // Compare location object
  if (
    prevProps.location?.city !== nextProps.location?.city ||
    prevProps.location?.state !== nextProps.location?.state ||
    prevProps.location?.address !== nextProps.location?.address
  ) {
    return false;
  }

  // Compare category (can be object or string)
  const prevCategoryId = typeof prevProps.category === 'object' 
    ? prevProps.category?._id 
    : prevProps.category;
  const nextCategoryId = typeof nextProps.category === 'object' 
    ? nextProps.category?._id 
    : nextProps.category;
  if (prevCategoryId !== nextCategoryId) {
    return false;
  }

  // Compare tags array
  if (prevProps.tags?.length !== nextProps.tags?.length) {
    return false;
  }
  if (prevProps.tags && nextProps.tags) {
    for (let i = 0; i < prevProps.tags.length; i++) {
      if (prevProps.tags[i] !== nextProps.tags[i]) {
        return false;
      }
    }
  }

  return true; // Props are equal
};

// Export memoized component
export const ServiceCard = memo(ServiceCardComponent, areEqual);
