"use client";
import Link from "next/link";
import { memo, useState, useRef } from "react";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "@/components/services/AddToCartButton";

interface CategoryProviderCardProps {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  className?: string;
  priority?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (serviceId: string) => void;
}

// Card display width ~180px; request 240 for 1.3x density
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
  mrp,
  priceLabel,
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

  return (
    <Link
      href={`/service/${id}`}
      className={cn(
        "group flex-shrink-0 w-[160px] sm:w-[180px] bg-card rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]",
        className
      )}
      style={{ contentVisibility: "auto" }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
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
            variant="ghost"
            size="icon"
            className={cn(
              "absolute top-1.5 md:top-2 right-1.5 md:right-2 h-6 w-6 md:h-7 md:w-7 rounded-full bg-background/90 backdrop-blur-sm hover:bg-background",
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

      {/* Content */}
      <div className="p-2 md:p-3">
        <h3 className="font-semibold text-foreground text-xs md:text-sm line-clamp-2 break-words group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {location}
        </p>
        
        <div className="flex items-center justify-between mt-1.5 md:mt-2">
          <p className="text-foreground text-xs md:text-sm">
            {mrp != null && mrp > 0 && (
              <span className="text-[10px] md:text-xs text-muted-foreground line-through mr-1">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
            <span className="font-bold">₹{price.toLocaleString('en-IN')}</span>
            <span className="text-[10px] md:text-xs text-muted-foreground"> {priceLabel}</span>
          </p>
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 md:h-3.5 md:w-3.5 fill-foreground text-foreground" />
            <span className="font-medium text-[10px] md:text-xs">{rating}</span>
          </div>
        </div>

        <div
          className="mt-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <AddToCartButton
            serviceId={id}
            providerName={name}
            showQuantity={false}
            label="Add to cart"
            className="h-7 text-xs px-3 flex-1 min-w-0 whitespace-nowrap"
          />
        </div>
      </div>
    </Link>
  );
}

export const CategoryProviderCard = memo(CategoryProviderCardComponent);
