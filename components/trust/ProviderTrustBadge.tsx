"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImagineVerifiedBadge, type ImagineScoreData } from "./ImagineScorePanel";

type ProviderTrustBadgeProps = {
  imagineScore?: ImagineScoreData | null;
  /** Legacy KYC/business verified flag when Imagine Score is unavailable */
  verified?: boolean;
  className?: string;
  legacyClassName?: string;
  size?: "sm" | "md";
};

export function ProviderTrustBadge({
  imagineScore,
  verified,
  className,
  legacyClassName,
  size = "md",
}: ProviderTrustBadgeProps) {
  if (imagineScore?.isImagineeringVerified) {
    return <ImagineVerifiedBadge score={imagineScore} className={className} />;
  }

  if (verified) {
    return (
      <CheckCircle2
        className={cn(
          size === "sm" ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4",
          "text-primary shrink-0",
          legacyClassName,
          className
        )}
        aria-label="Verified supplier"
      />
    );
  }

  return null;
}
