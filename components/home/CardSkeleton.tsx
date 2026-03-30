"use client";

import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex-shrink-0 w-[160px] sm:w-[180px] bg-card rounded-lg md:rounded-xl overflow-hidden shadow-sm",
        className
      )}
      style={{ contentVisibility: "auto" }}
    >
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-2 md:p-3 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-11/12" />
        <div className="h-3 bg-muted animate-pulse rounded w-7/12" />
        <div className="h-4 bg-muted animate-pulse rounded w-9/12" />
        <div className="h-7 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

