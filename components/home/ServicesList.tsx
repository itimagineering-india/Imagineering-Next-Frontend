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
import { CategoryProviderCard, CATEGORY_PROVIDER_CARD_HEIGHT, getCategoryProviderScrollMetrics, CATEGORY_PROVIDER_CARD_MAX_WIDTH, CATEGORY_PROVIDER_CARD_GAP } from "./CategoryProviderCard";
import { CardSkeleton } from "./CardSkeleton";
import { cn } from "@/lib/utils";

type Service = {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
  priceType?: string;
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
  cardWidth: number;
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
      <div style={style} className="box-border flex items-start overflow-hidden pr-2">
      <CardSkeleton className="min-w-0" style={{ width: data.cardWidth, maxWidth: data.cardWidth }} />
      </div>
    );
  }

  const service = data.services[index];
  if (!service) return null;

  return (
    <div style={style} className="box-border flex items-start overflow-hidden pr-2">
      <CategoryProviderCard
        {...service}
        className="min-w-0"
        style={{ width: data.cardWidth, maxWidth: data.cardWidth }}
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

const FALLBACK_ITEM_WIDTH = CATEGORY_PROVIDER_CARD_MAX_WIDTH + CATEGORY_PROVIDER_CARD_GAP;
const FALLBACK_ITEM_HEIGHT = CATEGORY_PROVIDER_CARD_HEIGHT;

function ScrollOuterElement({
  className,
  style,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        ...style,
        overflowX: "auto",
        overflowY: "hidden",
      }}
      className={cn("scrollbar-hide touch-pan-x", className)}
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

    const itemSizeFn = useCallback(() => itemWidthRef.current, []);

    const outerRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemWidthRef = useRef(FALLBACK_ITEM_WIDTH);
    const [width, setWidth] = useState(0);
    const widthRef = useRef(0);
    const resizeTimeoutRef = useRef<number | null>(null);

    const scrollMetrics = useMemo(
      () => (width > 0 ? getCategoryProviderScrollMetrics(width) : null),
      [width]
    );
    const itemWidth = scrollMetrics?.itemWidth ?? FALLBACK_ITEM_WIDTH;
    const cardWidth = scrollMetrics?.cardWidth ?? CATEGORY_PROVIDER_CARD_MAX_WIDTH;
    const itemHeight = scrollMetrics?.cardHeight ?? FALLBACK_ITEM_HEIGHT;
    itemWidthRef.current = itemWidth;

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
      const delta = (direction === "left" ? -1 : 1) * step * itemWidthRef.current;
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
        cardWidth,
      }),
      [
        services,
        prioritizeImages,
        favoritesById,
        onToggleFavorite,
        isLoading,
        skeletonCount,
        favoritesVersion,
        cardWidth,
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
        className="w-full overflow-hidden"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: `${CATEGORY_PROVIDER_CARD_MAX_WIDTH}px ${FALLBACK_ITEM_HEIGHT}px`,
        }}
      >
        <VirtualList
          key={`${itemWidth}-${itemHeight}`}
          outerRef={outerRef}
          outerElementType={ScrollOuterElement as any}
          direction="horizontal"
          layout="horizontal"
          height={itemHeight}
          width={width}
          itemCount={itemCount}
          itemSize={isVariable ? itemSizeFn : itemWidth}
          itemData={itemData}
          overscanCount={3}
        >
          {ServicesRow}
        </VirtualList>
      </div>
    );
  })
);
