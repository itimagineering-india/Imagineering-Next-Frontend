"use client";
import Link from "next/link";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Heart, Share2, MapPin, Crown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState, useMemo, memo } from "react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { withListImageParams } from "@/utils/serviceImageUrl";
import { shouldShowPricing, type ServiceWithInteraction } from "@/lib/interactionType";
import { AddToCartButton } from "@/components/services/AddToCartButton";
import { formatServicePrice, isRangePricedService } from "@/lib/formatServicePrice";

export interface ServiceCardProps {
 id: string;
 slug?: string;
 title: string;
 description: string;
 price: number;
 priceMode?: "exact" | "range";
 priceMin?: number;
 priceMax?: number;
 priceType: string;
 image: string;
 provider: {
  id?: string;
  _id?: string;
  name?: string;
  businessName?: string;
  avatar?: string;
  verified?: boolean;
  phone?: string;
  mobile?: string;
  whatsappNumber?: string;
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
 /** Distance from user search / GPS (km), when known */
 distanceKm?: number;
 hideProviderDetails?: boolean;
}

function ServiceCardComponent({
 id,
 slug,
 title,
 description,
 price,
 priceMode,
 priceMin,
 priceMax,
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
 distanceKm,
 hideProviderDetails = false,
}: ServiceCardProps) {
 // Memoize expensive computations
 const service: ServiceWithInteraction = useMemo(() => ({ category }), [category]);
 const showPricing = useMemo(() => shouldShowPricing(service), [service]);
 // On listing pages we always send user to details, so use a simple CTA label
 const ctaText = "View details";
 const formattedPrice = useMemo(
  () => formatServicePrice({ price, priceMode, priceMin, priceMax, priceType }),
  [price, priceMode, priceMin, priceMax, priceType]
 );
 const isRangePrice = isRangePricedService({ priceMode });
 const canAddToCart = showPricing && !isRangePrice;
 const [isFavorite, setIsFavorite] = useState(false);
 const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
 const [hasCheckedFavorite, setHasCheckedFavorite] = useState(false);
 const { toast } = useToast();
 const { isAuthenticated } = useAuth();

 // Lazy load favorite status - only check when user interacts with favorite button
 const checkFavoriteLazy = async () => {
  if (!isAuthenticated) {
   setHasCheckedFavorite(true);
   setIsFavorite(false);
   return;
  }

  if (hasCheckedFavorite || isLoadingFavorite) return;

  setIsLoadingFavorite(true);
  try {
   const response = await api.favorites.check(id);
   if (response.success && response.data) {
    const data = response.data as { isFavorite: boolean };
    setIsFavorite(data.isFavorite);
    setHasCheckedFavorite(true);
   }
  } catch {
   setHasCheckedFavorite(true);
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

  if (!isAuthenticated) {
   setHasCheckedFavorite(true);
   setIsFavorite(false);
   return;
  }

  if (!hasCheckedFavorite) {
   await checkFavoriteLazy();
   if (!isLoadingFavorite) {
    // continue
   } else {
    return;
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
 const imageSrc = withListImageParams(image, 300);
 const hasServiceImage = imageSrc.length > 0;
 const locationLine = useMemo(() => {
  const parts = [location?.address, location?.city, location?.state]
   .filter(Boolean)
   .map((x) => String(x).trim())
   .filter(Boolean);
  return parts.join(", ");
 }, [location?.address, location?.city, location?.state]);
 const whatsappUrl = useMemo(() => {
  const serviceLink =
   typeof window !== "undefined" ? window.location.origin + serviceUrl : serviceUrl;
  const details = [
   `Service: ${title}`,
   showPricing ? `Price: ${formattedPrice}` : "Price: Contact for pricing",
   provider?.businessName || provider?.name ? `Provider: ${provider.businessName || provider.name}` : null,
   `Link: ${serviceLink}`,
   "",
   "I want to know more about this product.",
  ]
   .filter(Boolean)
   .join("\n");

  return `https://wa.me/?text=${encodeURIComponent(details)}`;
 }, [serviceUrl, title, showPricing, formattedPrice, provider?.businessName, provider?.name]);

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

 const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
  if (!hideProviderDetails) return;
  const target = e.target as HTMLElement;
  if (target.closest("a, button, [role='button'], input, select, textarea")) return;
  window.open(serviceUrl, "_blank", "noopener,noreferrer");
 };

 if (viewMode === "list") {
  return (
   <Card
    onClick={handleCardClick}
    className={cn(
     "group transition-all duration-300 hover:shadow-md",
     hideProviderDetails && "cursor-pointer",
     className
    )}
   >
    <div className="flex flex-row gap-3 sm:gap-4 p-3 sm:p-4 items-start">
     <Link
      href={serviceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="relative w-[88px] h-[88px] sm:w-32 sm:h-32 shrink-0 rounded-lg overflow-hidden block bg-muted"
     >
      {hasServiceImage ? (
       <img
        src={imageSrc}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
        decoding="async"
       />
      ) : (
       <div className="flex h-full w-full items-center justify-center px-1 text-center text-xs font-medium leading-tight text-muted-foreground">
        No Image
       </div>
      )}
      {featured && (
       <Badge className="absolute top-1 left-1 bg-primary micro px-2 py-0 z-10 sm:top-2 sm:left-2 ">
        <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
        Featured
       </Badge>
      )}
      <div
       className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] bg-gradient-to-t from-black/80 via-black/45 to-transparent pt-8 pb-1 px-2 sm:pt-8 sm:pb-2 sm:px-2"
       aria-hidden
      >
       <div className="flex items-center gap-0.5 micro text-white drop-shadow-sm">
        <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400 shrink-0" />
        <span className="subtitle tabular-nums">{rating}</span>
        <span className="text-white/90">({reviewCount})</span>
       </div>
      </div>
     </Link>

     <div className="flex-1 min-w-0 flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-2">
       <div className="flex gap-2 items-start justify-between min-w-0">
        <Link href={serviceUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
         <h3 className="subtitle body min-w-0 overflow-hidden text-ellipsis break-words leading-snug line-clamp-2 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] sm:leading-normal hover:text-primary transition-colors">
          {title}
         </h3>
        </Link>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 -mt-0.5">
         <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          onClick={toggleFavorite}
          onMouseEnter={handleFavoriteButtonHover}
          disabled={isLoadingFavorite}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
         >
          <Heart className={cn("h-4 w-4", isFavorite && "fill-current text-destructive")} />
         </Button>
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
           <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
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

       {!hideProviderDetails && (provider?.businessName || provider?.name) && (
        <p className="caption line-clamp-1 -mt-0.5">
         {provider.businessName || provider.name}
        </p>
       )}

       {!hideProviderDetails && ((distanceKm != null && Number.isFinite(distanceKm)) || locationLine) ? (
        <div className="flex flex-col gap-1 caption ">
         {distanceKm != null && Number.isFinite(distanceKm) && (
          <span className="caption body text-foreground whitespace-nowrap">
           {distanceKm < 1
            ? `${Math.round(distanceKm * 1000)} m away`
            : `${distanceKm.toFixed(1)} km away`}
          </span>
         )}
         {locationLine ? (
          <div className="flex min-w-0 items-start gap-1.5 text-muted-foreground">
           <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
           <span className="body min-w-0 line-clamp-2 leading-snug" title={locationLine}>
            {locationLine}
           </span>
          </div>
         ) : null}
        </div>
       ) : null}

       {showPricing ? (
        <div className="text-left flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
         <span className="micro shrink-0">Price</span>
         <p className="listing-title leading-tight m-0">
          {formattedPrice}
         </p>
         {isRangePrice && <Badge variant="outline" className="text-[10px]">Enquiry only</Badge>}
        </div>
       ) : (
        <p className="caption ">Contact for pricing</p>
       )}
      </div>

      <div className="flex flex-col gap-2 w-full shrink-0 md:w-[148px] lg:w-[160px] md:pt-0">
       <div className={cn("grid gap-2 w-full", hideProviderDetails ? "grid-cols-1" : "grid-cols-2 md:grid-cols-1")}>
        {!hideProviderDetails && (
         <Button size="sm" asChild className="h-8 sm:h-9 w-full px-2 sm:px-3">
          <Link href={serviceUrl} target="_blank" rel="noopener noreferrer">{ctaText}</Link>
         </Button>
        )}
        {!hideProviderDetails && (
         <Button
          size="sm"
          asChild
          className="h-8 sm:h-9 w-full px-2 sm:px-3 bg-[#25D366] text-white hover:bg-[#1ebe5d]"
         >
          <a
           href={whatsappUrl}
           target="_blank"
           rel="noopener noreferrer"
           aria-label="Open WhatsApp for product enquiry"
           title="Open WhatsApp"
          >
           <MessageCircle className="h-4 w-4" />
          </a>
         </Button>
        )}
       </div>
       {canAddToCart && (
        <AddToCartButton
         serviceId={id}
         providerName={provider?.name}
         showQuantity={true}
         className="h-8 w-full min-w-0"
        />
       )}
      </div>
     </div>
    </div>
   </Card>
  );
 }

 return (
  <Card
   onClick={handleCardClick}
   className={cn(
    "group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col",
    featured && "ring-2 ring-warning",
    hideProviderDetails && "cursor-pointer",
    className
   )}
  >
   {/* Image + overlay actions */}
   <div className="relative">
    <Link
     href={serviceUrl}
     target="_blank"
     rel="noopener noreferrer"
     className="block aspect-square overflow-hidden bg-muted"
    >
     {hasServiceImage ? (
      <img
       src={imageSrc}
       alt={title}
       className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
       loading="lazy"
       decoding="async"
      />
     ) : (
      <div className="flex h-full min-h-0 w-full items-center justify-center px-3 text-center text-xs font-medium text-muted-foreground sm:text-sm">
       No Image
      </div>
     )}
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
     <div className="h-8 px-2 rounded-full bg-background/80 backdrop-blur-sm flex items-center gap-1 caption">
      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
      <span className="body">{rating}</span>
      <span className="text-muted-foreground">({reviewCount})</span>
     </div>
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

   <CardContent
    className={cn(
     "px-3 sm:px-4 pt-[2px] pb-[2px]",
     hideProviderDetails ? "flex-none" : "flex-1 flex flex-col"
    )}
   >
    {/* Title */}
    <Link href={serviceUrl} target="_blank" rel="noopener noreferrer">
     <h3 className="subtitle caption min-w-0 overflow-hidden text-ellipsis break-words text-foreground line-clamp-2 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] hover:text-primary transition-colors">
      {title}
     </h3>
    </Link>
    {!hideProviderDetails && (provider?.businessName || provider?.name) && (
     <p className="caption line-clamp-1 mt-0.5">
      {provider.businessName || provider.name}
     </p>
    )}
    {!hideProviderDetails && locationLine ? (
     <p className="body mt-0.5 flex items-start gap-1.5 text-muted-foreground" title={locationLine}>
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
      <span className="min-w-0 line-clamp-2 leading-snug">{locationLine}</span>
     </p>
    ) : null}
    {!hideProviderDetails && distanceKm != null && Number.isFinite(distanceKm) && (
     <p className="caption text-muted-foreground mt-0.5">
      {distanceKm < 1
       ? `${Math.round(distanceKm * 1000)} m away`
       : `${distanceKm.toFixed(1)} km away`}
     </p>
    )}

   </CardContent>

   <CardFooter
    className={cn(
     "p-3 sm:p-4 pt-2 pb-3 sm:pb-4 flex flex-col items-stretch gap-2",
     hideProviderDetails ? "mt-0" : "mt-auto"
    )}
   >
    {showPricing ? (
     <div className="w-full sm:w-auto">
      {!hideProviderDetails && <span className="caption">Price</span>}
      <p className="body text-foreground">
       {formattedPrice}
      </p>
      {isRangePrice && <Badge variant="outline" className="mt-1 text-[10px]">Enquiry only</Badge>}
     </div>
    ) : (
     <div className="w-full sm:w-auto caption">
      Contact for pricing
     </div>
    )}
    <div className="flex flex-col gap-2 w-full">
     <div className={cn("grid gap-2 w-full", hideProviderDetails ? "grid-cols-1" : "grid-cols-2")}>
      {!hideProviderDetails && (
       <Button size="sm" asChild className="w-full h-8 px-2 sm:px-3">
        <Link href={serviceUrl} target="_blank" rel="noopener noreferrer">{ctaText}</Link>
       </Button>
      )}
      {!hideProviderDetails && (
       <Button
        size="sm"
        asChild
        className="w-full h-8 px-2 sm:px-3 bg-[#25D366] text-white hover:bg-[#1ebe5d]"
       >
        <a
         href={whatsappUrl}
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Open WhatsApp for product enquiry"
         title="Open WhatsApp"
        >
         <MessageCircle className="h-4 w-4" />
        </a>
       </Button>
      )}
     </div>
     {canAddToCart && (
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
  prevProps.slug !== nextProps.slug ||
  prevProps.title !== nextProps.title ||
  prevProps.description !== nextProps.description ||
  prevProps.price !== nextProps.price ||
  prevProps.priceMode !== nextProps.priceMode ||
  prevProps.priceMin !== nextProps.priceMin ||
  prevProps.priceMax !== nextProps.priceMax ||
  prevProps.priceType !== nextProps.priceType ||
  prevProps.image !== nextProps.image ||
  prevProps.rating !== nextProps.rating ||
  prevProps.reviewCount !== nextProps.reviewCount ||
  prevProps.deliveryTime !== nextProps.deliveryTime ||
  prevProps.featured !== nextProps.featured ||
  prevProps.className !== nextProps.className ||
  prevProps.viewMode !== nextProps.viewMode ||
  prevProps.distanceKm !== nextProps.distanceKm ||
  prevProps.hideProviderDetails !== nextProps.hideProviderDetails
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
