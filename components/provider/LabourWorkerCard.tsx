"use client";

import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatPriceLine } from "@/lib/priceTypeDisplay";

export type LabourWorkerListItem = {
  userId: string;
  displayName: string;
  avatar?: string;
  city?: string;
  state?: string;
  categoryLabel?: string;
  address?: string;
  experienceYears?: number | null;
  rating?: number;
  reviewCount?: number;
  price?: number | null;
  priceType?: string | null;
};

type LabourWorkerCardProps = {
  worker: LabourWorkerListItem;
  selected: boolean;
  onToggle: () => void;
  checkboxId: string;
  className?: string;
  /** Grid: card stack; list: full-width row */
  layout?: "grid" | "list";
};

function ProfileButton({ userId, fullWidth }: { userId: string; fullWidth?: boolean }) {
  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      className={cn("shrink-0 touch-manipulation", fullWidth && "w-full sm:w-auto")}
    >
      <Link href={`/provider/${encodeURIComponent(userId)}`} onClick={(e) => e.stopPropagation()}>
        View profile
      </Link>
    </Button>
  );
}

export function LabourWorkerCard({
  worker,
  selected,
  onToggle,
  checkboxId,
  className,
  layout = "grid",
}: LabourWorkerCardProps) {
  const w = worker;
  const initials = w.displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const rating = typeof w.rating === "number" ? w.rating : 0;
  const reviews = typeof w.reviewCount === "number" ? w.reviewCount : 0;
  const hasRating = rating > 0 || reviews > 0;

  const priceLine = formatPriceLine(w.price ?? null, w.priceType ?? null);
  const addressText = (w.address || "").trim() || "Address not listed";

  const detailsBlock = (
    <>
      <div className="flex gap-2 text-muted-foreground">
        <MapPin className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
        <span className="leading-snug break-words min-w-0">{addressText}</span>
      </div>

      <div>
        <span className="text-muted-foreground">Experience: </span>
        <span className="font-medium text-foreground">
          {w.experienceYears != null && w.experienceYears >= 0
            ? `${w.experienceYears} ${w.experienceYears === 1 ? "year" : "years"}`
            : "Not specified"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
        {hasRating ? (
          <span>
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              {" "}
              ({reviews} {reviews === 1 ? "review" : "reviews"})
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">No ratings yet</span>
        )}
      </div>

      <div className="pt-2 border-t border-border/80">
        <div className="text-muted-foreground text-xs uppercase tracking-wide">Price</div>
        <div className="mt-0.5 font-semibold text-foreground">
          {priceLine ? (
            <>
              <span>{priceLine.primary}</span>
              {priceLine.secondary ? (
                <span className="text-muted-foreground font-normal text-sm sm:ml-2 sm:inline block">
                  · {priceLine.secondary}
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-muted-foreground font-normal">Not listed</span>
          )}
        </div>
      </div>
    </>
  );

  if (layout === "list") {
    return (
      <div
        className={cn(
          "relative rounded-xl border bg-card text-card-foreground shadow-sm transition-colors cursor-pointer touch-manipulation min-w-0",
          selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/25",
          className
        )}
        onClick={onToggle}
      >
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          <Avatar className="h-16 w-16 shrink-0 border mx-auto sm:mx-0">
            {w.avatar ? <AvatarImage src={w.avatar} alt="" className="object-cover" /> : null}
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="font-semibold leading-tight text-base break-words">{w.displayName}</div>
                {w.categoryLabel ? (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {w.categoryLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
            {detailsBlock}
          </div>

          <div
            className="flex flex-row sm:flex-col items-center sm:items-end justify-center sm:justify-start gap-2 gap-y-3 shrink-0 pt-1 sm:pt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              id={checkboxId}
              checked={selected}
              onCheckedChange={onToggle}
              aria-label={`Select ${w.displayName}`}
            />
            <ProfileButton userId={w.userId} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative cursor-pointer rounded-xl border bg-card text-card-foreground shadow-sm transition-colors touch-manipulation min-w-0",
        selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-muted-foreground/25",
        className
      )}
      onClick={onToggle}
    >
      <div className="absolute right-3 top-3 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          id={checkboxId}
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${w.displayName}`}
        />
      </div>

      <div className="p-4 pr-12">
        <div className="flex gap-3">
          <Avatar className="h-14 w-14 shrink-0 border">
            {w.avatar ? <AvatarImage src={w.avatar} alt="" className="object-cover" /> : null}
            <AvatarFallback className="text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="font-semibold leading-tight break-words">{w.displayName}</div>
            {w.categoryLabel ? (
              <Badge variant="secondary" className="text-xs font-normal">
                {w.categoryLabel}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="mt-3 space-y-2 text-sm">{detailsBlock}</div>

        <div className="mt-3 pt-3 border-t border-border/60" onClick={(e) => e.stopPropagation()}>
          <ProfileButton userId={w.userId} fullWidth />
        </div>
      </div>
    </div>
  );
}
