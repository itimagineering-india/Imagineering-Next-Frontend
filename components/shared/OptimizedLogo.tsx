/**
 * OptimizedLogo Component
 * Loads logo from CDN (CloudFront) for fast delivery
 */

import { cn } from "@/lib/utils";

const LOGO_CDN_URL = "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png";

interface OptimizedLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  priority?: boolean; // If true, loads eagerly (for LCP)
  alt?: string;
}

const sizeMap = {
  sm: { width: 32, height: 32, class: "h-8 w-8" },
  md: { width: 64, height: 64, class: "h-10 w-10" },
  lg: { width: 128, height: 128, class: "h-16 w-16" },
  xl: { width: 256, height: 256, class: "h-32 w-32" },
};

export function OptimizedLogo({
  className,
  size = "md",
  priority = false,
  alt = "Imagineering India Logo",
}: OptimizedLogoProps) {
  const { width, height, class: sizeClass } = sizeMap[size];

  return (
    <img
      src={LOGO_CDN_URL}
      alt={alt}
      width={width}
      height={height}
      className={cn(sizeClass, "object-contain shrink-0", className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
