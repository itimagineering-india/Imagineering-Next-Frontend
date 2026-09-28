"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MaterialsProduct } from "@/lib/materials/constructionMaterialsCatalog";

type Props = {
  product: MaterialsProduct;
  onCta?: (product: MaterialsProduct) => void;
  ctaLabel?: string;
  ctaLoading?: boolean;
  hidePrice?: boolean;
  onAddToQuote?: (product: MaterialsProduct) => void;
  inQuoteList?: boolean;
  /** Override product detail link (default: construction-materials). */
  detailHref?: string;
};

export function MaterialsProductCard({
  product,
  onCta,
  ctaLoading,
  hidePrice,
  onAddToQuote,
  inQuoteList,
  detailHref,
}: Props) {
  const href = detailHref || `/construction-materials/product/${product.id}`;
  const plusHandler = onAddToQuote || onCta;
  const plusActive = Boolean(onAddToQuote && inQuoteList);
  const plusLabel = onAddToQuote
    ? inQuoteList
      ? "Added to quote"
      : "Add to quote"
    : product.hasVariants
      ? "Choose options"
      : product.isPriceRange
        ? "Get Best Quote"
        : "Add to Cart";

  return (
    <article className="flex h-full min-w-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <Link href={href} className="flex min-h-0 min-w-0 flex-1 flex-col">
        {product.imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUri}
            alt={product.name}
            className="aspect-square w-full shrink-0 bg-slate-50 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-square w-full shrink-0 items-center justify-center bg-slate-50 text-lg font-bold text-slate-300">
            {(product.brand || product.name || "NA").slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5 sm:p-2">
          <p className="min-h-[1rem] truncate text-[10px] font-bold uppercase leading-4 tracking-wide text-orange-600">
            {product.brand || "\u00A0"}
          </p>
          <p className="truncate text-xs font-bold leading-snug text-slate-900" title={product.name}>
            {product.name}
          </p>
          {product.variantSummary ? (
            <p className="truncate text-[10px] leading-4 text-slate-500">
              {product.variantSummary} available
            </p>
          ) : (
            <p className="min-h-4 truncate text-[10px] leading-4 text-transparent" aria-hidden>
              &nbsp;
            </p>
          )}
          {hidePrice ? null : (
            <p className="truncate text-xs font-semibold leading-snug text-slate-900">
              {product.priceRange}
            </p>
          )}
        </div>
      </Link>
      <div className="mt-auto px-2.5 pb-2.5 sm:px-2 sm:pb-2">
        <div className="flex w-full gap-1.5">
          <Button
            size="sm"
            asChild
            variant="outline"
            className="h-7 min-w-0 flex-1 px-2 text-[10px] sm:text-[11px]"
          >
            <Link href={href}>View</Link>
          </Button>
          {plusHandler ? (
            <Button
              type="button"
              size="sm"
              variant={plusActive ? "default" : "outline"}
              className="h-7 w-7 shrink-0 px-0"
              aria-label={plusLabel}
              title={plusLabel}
              disabled={ctaLoading}
              onClick={() => plusHandler(product)}
            >
              {ctaLoading ? "…" : <Plus className="h-3.5 w-3.5" />}
            </Button>
          ) : (
            <Button
              size="sm"
              asChild
              variant="outline"
              className="h-7 w-7 shrink-0 px-0"
              aria-label="View product"
              title="View product"
            >
              <Link href={href}>
                <Plus className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
