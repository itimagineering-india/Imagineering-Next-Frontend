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
import * as ReactWindow from "react-window";
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

type ServicesRowData = {
  services: Service[];
  prioritizeImages: boolean;
  favoritesById: Record<string, boolean>;
  onToggleFavorite: (serviceId: string) => void;
  isLoading: boolean;
  skeletonCount: number;
  favoritesVersion: number;
};

const ServicesRow = memo(function ServicesRow({
  index,
  style,
  data,
}: {
  index: number;
  style: CSSProperties;
  data: ServicesRowData;
}) {
  if (data.isLoading) {
    return (
      <div style={style} className="box-border flex pr-2">
        <CardSkeleton className="h-full w-full max-w-[180px]" />
      </div>
    );
  }

  const service = data.services[index];
  if (!service) return null;

  return (
    <div style={style} className="box-border flex h-full min-h-0 pr-2">
      <CategoryProviderCard
        {...service}
        className="h-full w-full max-w-[180px] min-w-0"
        priority={data.prioritizeImages && index < 4}
        isFavorite={!!data.favoritesById[service.id]}
        onToggleFavorite={data.onToggleFavorite}
      />
    </div>
  );
});

export type ServicesListHandle = {
  scrollByItems: (direction: "left" | "right", step?: number) => void;
};

type ServicesListProps = {
  services: Service[];
  prioritizeImages?: boolean;
  favoritesById: Record<string, boolean>;
  /** When favorites change (e.g. same object ref), bump to re-render rows. Defaults to 0. */
  favoritesVersion?: number;
  onToggleFavorite: (serviceId: string) => void;
  isLoading?: boolean;
  skeletonCount?: number;
};

const ITEM_WIDTH = 188;
const ITEM_HEIGHT = 320;

function ScrollOuterElement({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      className={cn("scrollbar-hide overflow-x-auto overflow-y-hidden", className)}
    />
  );
}

export const ServicesList = memo(
  forwardRef<ServicesListHandle, ServicesListProps>(function ServicesList(
    {
      services,
      prioritizeImages = false,
      favoritesById,
      favoritesVersion = 0,
      onToggleFavorite,
      isLoading = false,
      skeletonCount = 10,
    },
    ref
  ) {
    const fixedList = (ReactWindow as any).FixedSizeList;
    const variableList = (ReactWindow as any).VariableSizeList;
    const VirtualList = fixedList || variableList;

    const itemSizeFn = useCallback(() => ITEM_WIDTH, []);

    const outerRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [width, setWidth] = useState(0);
    const widthRef = useRef(0);
    const resizeTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const ro = new ResizeObserver((entries) => {
        const next = entries[0]?.contentRect?.width ?? 0;
        if (Math.abs(next - widthRef.current) < 1) return;
        if (resizeTimeoutRef.current != null) {
          window.clearTimeout(resizeTimeoutRef.current);
        }
        resizeTimeoutRef.current = window.setTimeout(() => {
          widthRef.current = next;
          setWidth(next);
        }, 100);
      });

      ro.observe(el);
      return () => {
        ro.disconnect();
        if (resizeTimeoutRef.current != null) {
          window.clearTimeout(resizeTimeoutRef.current);
        }
      };
    }, []);

    const scrollByItems = useCallback((direction: "left" | "right", step: number = 3) => {
      const el = outerRef.current;
      if (!el) return;
      const delta = (direction === "left" ? -1 : 1) * step * ITEM_WIDTH;
      el.scrollBy({ left: delta, behavior: "smooth" });
    }, []);

    useImperativeHandle(ref, () => ({ scrollByItems }), [scrollByItems]);

    const itemCount = isLoading ? skeletonCount : services.length;

    const itemData = useMemo<ServicesRowData>(
      () => ({
        services,
        prioritizeImages,
        favoritesById,
        onToggleFavorite,
        isLoading,
        skeletonCount,
        favoritesVersion,
      }),
      [
        services,
        prioritizeImages,
        favoritesById,
        onToggleFavorite,
        isLoading,
        skeletonCount,
        favoritesVersion,
      ]
    );

    if (!VirtualList) return null;

    if (!width || width < 1) {
      return (
        <div
          ref={containerRef}
          className="w-full h-0"
          style={{ contentVisibility: "auto", containIntrinsicSize: "180px 135px" }}
        />
      );
    }

    const isVariable = VirtualList === variableList;

    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{ contentVisibility: "auto", containIntrinsicSize: "180px 135px" }}
      >
        <VirtualList
          outerRef={outerRef}
          outerElementType={ScrollOuterElement as any}
          direction="horizontal"
          layout="horizontal"
          height={ITEM_HEIGHT}
          width={width}
          itemCount={itemCount}
          itemSize={isVariable ? itemSizeFn : ITEM_WIDTH}
          itemData={itemData}
          overscanCount={3}
        >
          {ServicesRow}
        </VirtualList>
      </div>
    );
  })
);
