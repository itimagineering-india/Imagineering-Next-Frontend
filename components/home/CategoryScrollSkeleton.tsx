"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CardSkeleton } from "./CardSkeleton";
import { getCategoryProviderScrollMetrics } from "./CategoryProviderCard";

export function CategoryScrollRowSkeleton() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0]?.contentRect?.width ?? 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = useMemo(
    () => (width > 0 ? getCategoryProviderScrollMetrics(width) : null),
    [width]
  );

  const skeletonCount = metrics ? Math.min(12, Math.ceil(metrics.visibleCount) + 1) : 4;

  return (
    <div ref={containerRef} className="w-full overflow-hidden">
      <div className="flex items-start">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <div
            key={idx}
            className="box-border shrink-0 pr-2"
            style={{ width: metrics?.itemWidth ?? 148 }}
          >
            <CardSkeleton
              className="min-w-0 shrink-0"
              style={{
                width: metrics?.cardWidth ?? 140,
                maxWidth: metrics?.cardWidth ?? 140,
                minHeight: metrics?.cardHeight ?? 220,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryScrollSectionSkeleton() {
  return (
    <div className="py-3 md:py-4">
      <div className="mb-3 flex items-center justify-between gap-1.5 md:mb-6 md:gap-2">
        <div className="h-6 w-36 animate-pulse rounded-md bg-slate-200 sm:h-7 sm:w-44 md:w-52" />
        <div className="flex shrink-0 gap-1.5">
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 md:h-9 md:w-9" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200 md:h-9 md:w-9" />
        </div>
      </div>
      <CategoryScrollRowSkeleton />
    </div>
  );
}

export function CategorySectionsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <CategoryScrollSectionSkeleton key={idx} />
      ))}
    </>
  );
}
