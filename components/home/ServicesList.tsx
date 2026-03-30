"use client";

import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, HTMLAttributes } from "react";
import { FixedSizeList } from "react-window";
import { CategoryProviderCard } from "./CategoryProviderCard";
import { CardSkeleton } from "./CardSkeleton";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
};

export type ServicesListHandle = {
  scrollByItems: (direction: "left" | "right", step?: number) => void;
};

type ServicesListProps = {
  services: Service[];
  prioritizeImages?: boolean;
  favoritesById: Record<string, boolean>;
  onToggleFavorite: (serviceId: string) => void;
  isLoading?: boolean;
  skeletonCount?: number;
};

const ITEM_WIDTH = 188;
const ITEM_HEIGHT = 260;

function ScrollOuterElement({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} className={cn("scrollbar-hide", className)} />;
}

export const ServicesList = memo(
  forwardRef<ServicesListHandle, ServicesListProps>(function ServicesList(
    {
      services,
      prioritizeImages = false,
      favoritesById,
      onToggleFavorite,
      isLoading = false,
      skeletonCount = 10,
    },
    ref
  ) {
    const outerRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const ro = new ResizeObserver((entries) => {
        const next = entries[0]?.contentRect?.width ?? 0;
        setWidth(next);
      });

      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const scrollByItems = useCallback((direction: "left" | "right", step: number = 3) => {
      const el = outerRef.current;
      if (!el) return;
      const delta = (direction === "left" ? -1 : 1) * step * ITEM_WIDTH;
      el.scrollBy({ left: delta, behavior: "smooth" });
    }, []);

    useImperativeHandle(ref, () => ({ scrollByItems }), [scrollByItems]);

    const itemCount = isLoading ? skeletonCount : services.length;

    const itemData = useMemo(
      () => ({
        services,
        prioritizeImages,
        favoritesById,
        onToggleFavorite,
        isLoading,
      }),
      [services, prioritizeImages, favoritesById, onToggleFavorite, isLoading]
    );

    const Row = useCallback(
      ({
        index,
        style,
        data,
      }: {
        index: number;
        style: CSSProperties;
        data: typeof itemData;
      }) => {
        if (data.isLoading) {
          return (
            <div style={style}>
              <CardSkeleton />
            </div>
          );
        }

        const service = data.services[index];
        if (!service) return null;

        return (
          <div style={style}>
            <CategoryProviderCard
              {...service}
              priority={data.prioritizeImages && index < 4}
              isFavorite={!!data.favoritesById[service.id]}
              onToggleFavorite={data.onToggleFavorite}
            />
          </div>
        );
      },
      [itemData]
    );

    if (!width || width < 1) {
      return <div ref={containerRef} className="w-full h-0" />;
    }

    return (
      <div ref={containerRef} className="w-full">
        <FixedSizeList
          outerRef={outerRef}
          outerElementType={ScrollOuterElement as any}
          direction="horizontal"
          height={ITEM_HEIGHT}
          width={width}
          itemCount={itemCount}
          itemSize={ITEM_WIDTH}
          itemData={itemData}
          overscanCount={3}
        >
          {Row}
        </FixedSizeList>
      </div>
    );
  })
);

