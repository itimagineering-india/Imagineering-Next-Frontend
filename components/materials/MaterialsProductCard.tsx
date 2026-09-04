"use client";

import Link from "next/link";
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
  ctaLabel,
  ctaLoading,
  hidePrice,
  onAddToQuote,
  inQuoteList,
  detailHref,
}: Props) {
  const href = detailHref || `/construction-materials/product/${product.id}`;
  const label =
    ctaLabel || (product.isPriceRange ? "Get Best Quote" : "Add to Cart");
  // Variants need selection on the detail page before quote/cart.
  const quickAddToQuote = product.hasVariants ? undefined : onAddToQuote;
  const quickCta = product.hasVariants ? undefined : onCta;

  return (
    <article className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <Link href={href} className="block">
        {product.imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUri}
            alt={product.name}
            className="aspect-square w-full bg-slate-50 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-square w-full items-center justify-center bg-slate-50 text-lg font-bold text-slate-300">
            {product.brand.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="space-y-1 p-2">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-orange-600">
            {product.brand}
          </p>
          <p className="truncate text-xs font-bold leading-[1.25] text-slate-900">
            {product.name}
          </p>
          {product.variantSummary ? (
            <p className="truncate text-[10px] text-slate-500">{product.variantSummary} available</p>
          ) : null}
          {hidePrice ? null : (
            <p className="truncate text-xs font-semibold text-slate-900">{product.priceRange}</p>
          )}
        </div>
      </Link>
      <div className="space-y-1 px-2 pb-2">
        {quickAddToQuote ? (
          <button
            type="button"
            onClick={() => quickAddToQuote(product)}
            className={`inline-flex h-7 w-full items-center justify-center rounded-lg px-2 text-[10px] font-semibold transition ${
              inQuoteList
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            {inQuoteList ? "Added to quote" : "Add to quote"}
          </button>
        ) : null}
        {quickCta ? (
          <button
            type="button"
            disabled={ctaLoading}
            onClick={() => quickCta(product)}
            className="inline-flex h-7 w-full items-center justify-center rounded-lg bg-[hsl(var(--red-accent))] px-2 text-[10px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {ctaLoading ? "…" : label}
          </button>
        ) : quickAddToQuote ? null : (
          <Link
            href={href}
            className="inline-flex h-7 w-full items-center justify-center rounded-lg bg-[hsl(var(--red-accent))] px-2 text-[10px] font-semibold text-white transition hover:brightness-110"
          >
            View details
          </Link>
        )}
      </div>
    </article>
  );
}
