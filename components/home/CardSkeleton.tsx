"use client";

import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

export function CardSkeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg bg-card ring-1 ring-border/40 md:rounded-xl",
        className
      )}
      style={{ contentVisibility: "auto", ...style }}
    >
      <div className="aspect-[4/3] bg-muted animate-pulse" />
      <div className="p-2 md:p-3 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded w-11/12" />
        <div className="h-3 bg-muted animate-pulse rounded w-7/12" />
        <div className="h-4 bg-muted animate-pulse rounded w-9/12" />
      </div>
    </div>
  );
}

