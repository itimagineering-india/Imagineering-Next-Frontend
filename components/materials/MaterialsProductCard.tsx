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
  // Variant products still show Add to quote when the parent opens a picker modal.
  const quickAddToQuote = onAddToQuote;
  const quickCta = product.hasVariants ? undefined : onCta;

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
          <p className="line-clamp-2 min-h-[2.5rem] text-xs font-bold leading-snug text-slate-900 sm:min-h-0 sm:truncate sm:leading-[1.25]">
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
      <div className="mt-auto space-y-1 px-2.5 pb-2.5 sm:px-2 sm:pb-2">
        {quickAddToQuote ? (
          <button
            type="button"
            onClick={() => quickAddToQuote(product)}
            className={`inline-flex h-8 w-full items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition sm:h-7 sm:text-[10px] ${
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
            className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-[hsl(var(--red-accent))] px-2 text-[11px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60 sm:h-7 sm:text-[10px]"
          >
            {ctaLoading ? "…" : label}
          </button>
        ) : quickAddToQuote ? null : (
          <Link
            href={href}
            className="inline-flex h-8 w-full items-center justify-center rounded-lg bg-[hsl(var(--red-accent))] px-2 text-[11px] font-semibold text-white transition hover:brightness-110 sm:h-7 sm:text-[10px]"
          >
            View details
          </Link>
        )}
      </div>
    </article>
  );
}
