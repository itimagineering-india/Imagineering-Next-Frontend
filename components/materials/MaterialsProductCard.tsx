"use client";

import Link from "next/link";
import type { MaterialsProduct } from "@/lib/materials/constructionMaterialsCatalog";

type Props = {
  product: MaterialsProduct;
  onCta?: (product: MaterialsProduct) => void;
  ctaLabel?: string;
  ctaLoading?: boolean;
};

export function MaterialsProductCard({ product, onCta, ctaLabel, ctaLoading }: Props) {
  const href = `/construction-materials/product/${product.id}`;
  const label =
    ctaLabel || (product.isPriceRange ? "Get Best Quote" : "Add to Cart");

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
          <p className="line-clamp-2 h-[2.5em] text-xs font-bold leading-[1.25] text-slate-900">
            {product.name}
          </p>
          <p className="truncate text-xs font-semibold text-slate-900">{product.priceRange}</p>
        </div>
      </Link>
      <div className="px-2 pb-2">
        {onCta ? (
          <button
            type="button"
            disabled={ctaLoading}
            onClick={() => onCta(product)}
            className="inline-flex h-7 w-full items-center justify-center rounded-lg bg-[hsl(var(--red-accent))] px-2 text-[10px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {ctaLoading ? "…" : label}
          </button>
        ) : (
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
