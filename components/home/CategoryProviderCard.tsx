"use client";
import Link from "next/link";
import { memo, useState, useRef } from "react";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/services/AddToCartButton";
import { formatServicePrice, isRangePricedService } from "@/lib/formatServicePrice";

interface CategoryProviderCardProps {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
  priceType?: string;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  className?: string;
  priority?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (serviceId: string) => void;
}

// Shared dimensions for horizontal category scroll (keep in sync with ServicesList ITEM_HEIGHT).
export const CATEGORY_PROVIDER_CARD_WIDTH = 180;
export const CATEGORY_PROVIDER_CARD_HEIGHT = 296;
const CARD_IMAGE_WIDTH = 240;

// Get API origin for our own uploads (e.g. /uploads/ or full API URL)
function getApiOrigin(): string {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    if (base && typeof base === "string") {
      return new URL(base).origin;
    }
  } catch {
    /* ignore */
  }
  return "http://localhost:5000";
}

// Optimize image URL: our API uploads, Unsplash; data URLs left as-is
const optimizeImageUrl = (url: string, width: number = CARD_IMAGE_WIDTH): string => {
  if (!url) return "";

  // Data URLs (base64) – cannot add params; use as-is
  if (url.startsWith("data:")) return url;

  const apiOrigin = getApiOrigin();
  const isOwnUpload =
    (apiOrigin && url.startsWith(apiOrigin + "/")) ||
    url.startsWith("/uploads/");

  if (isOwnUpload) {
    const base = url.startsWith("http") ? url : `${apiOrigin}${url}`;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}w=${width}&q=80`;
  }

  if (url.includes("unsplash.com")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}w=${width}&q=75&auto=format&fit=crop`;
  }

  return url;
};

function CategoryProviderCardComponent({
  id,
  name,
  image,
  location,
  price,
  priceMode,
  priceMin,
  priceMax,
  priceType,
  mrp,
  rating,
  reviewCount,
  className,
  priority = false,
  isFavorite,
  onToggleFavorite,
}: CategoryProviderCardProps) {
  const optimizedImage = optimizeImageUrl(image, CARD_IMAGE_WIDTH);
  const fallbackImage = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=240&q=75&auto=format&fit=crop";
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const isRangePrice = isRangePricedService({ priceMode });
  const formattedPrice = formatServicePrice({ price, priceMode, priceMin, priceMax, priceType });

  return (
    <Link
      href={`/service/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border/40 transition-all duration-300 hover:shadow-md hover:ring-primary/20 md:rounded-xl",
        className
      )}
      style={{ contentVisibility: "auto" }}
    >
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-muted">
        <img
          ref={imgRef}
          src={optimizedImage}
          alt={name}
          loading="lazy"
          decoding="async"
          width="180"
          height="135"
          className={cn(
            "h-full w-full object-cover transition-transform duration-500 group-hover:scale-110",
            "transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
            setLoaded(true);
          }}
        />
        {!priority && (
          <Button
            variant="icon"
            size="icon"
            className={cn(
              "absolute top-2 md:top-2 right-1.5 md:right-2 h-6 w-6 md:h-7 md:w-7 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background",
              isFavorite ? "text-destructive" : "hover:text-destructive"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(id);
            }}
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart className={cn("h-3 w-3 md:h-3.5 md:w-3.5", isFavorite && "fill-current")} />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 md:p-3">
        <h3
          className="h-[2.05rem] shrink-0 overflow-hidden text-ellipsis break-words text-xs font-semibold leading-snug text-foreground transition-colors line-clamp-2 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] group-hover:text-primary md:h-[2.4rem] md:text-sm"
          title={name}
        >
          {name}
        </h3>
        <p className="mt-0.5 h-3.5 shrink-0 truncate text-[10px] text-muted-foreground md:text-xs">
          {location}
        </p>

        <div className="mt-2 flex h-9 shrink-0 min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1 truncate text-xs font-bold leading-tight text-foreground md:text-sm">
            {!isRangePrice && mrp != null && mrp > 0 && (
              <span className="mr-1 text-[10px] font-normal text-muted-foreground line-through md:text-xs">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
            <span>{formattedPrice}</span>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Star className="h-3 w-3 fill-foreground text-foreground md:h-3.5 md:w-3.5" />
            <span className="text-[10px] font-medium md:text-xs">{rating}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        <div
          className="w-full min-w-0 shrink-0"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {isRangePrice ? (
            <Button variant="outline" className="h-8 w-full min-w-0 max-w-full px-2 text-xs sm:px-3">
              Enquire now
            </Button>
          ) : (
            <AddToCartButton
              serviceId={id}
              providerName={name}
              showQuantity={false}
              label="Add to cart"
              className="h-8 w-full min-w-0 max-w-full px-2 text-xs sm:px-3"
            />
          )}
        </div>
      </div>
    </Link>
  );
}

export const CategoryProviderCard = memo(CategoryProviderCardComponent);
