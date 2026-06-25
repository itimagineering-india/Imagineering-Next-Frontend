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
      <div className="aspect-[4/3] w-full shrink-0 bg-muted animate-pulse" />
      <div className="shrink-0 space-y-2 p-2 md:p-3">
        <div className="h-4 w-11/12 rounded bg-muted animate-pulse" />
        <div className="h-3 w-7/12 rounded bg-muted animate-pulse" />
        <div className="flex justify-between gap-2 pt-1">
          <div className="h-4 w-9/12 rounded bg-muted animate-pulse" />
          <div className="h-4 w-8 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

