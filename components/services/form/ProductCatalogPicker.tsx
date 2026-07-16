"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package, CheckCircle2 } from "lucide-react";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { resolveMaterialTypeKeyForServiceForm } from "@/lib/constructionMaterials";
import { type CatalogProductItem } from "@/lib/productCatalog";
import { getSubcategoryImageUrl } from "@/lib/subcategoryImages";

interface ProductCatalogPickerProps {
  categorySlug: string;
  subcategory: string;
  itemType?: string;
  /** Single-select mode */
  selectedProductId?: string | null;
  onSelect?: (product: CatalogProductItem | null) => void;
  /** Multi-select mode */
  multiple?: boolean;
  selectedProductIds?: string[];
  onToggleProduct?: (product: CatalogProductItem) => void;
  /** Catalog-only flow — no manual listing fallback */
  catalogOnlyMode?: boolean;
  /** list = compact rows (modal), grid = card grid (full page) */
  layout?: "list" | "grid";
}

function formatPrice(product: CatalogProductItem): string | null {
  const min = product.suggestedPriceMin;
  const max = product.suggestedPriceMax;
  if (min != null && max != null && min > 0 && max > 0) {
    return `₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}`;
  }
  if (min != null && min > 0) return `₹${min.toLocaleString("en-IN")}`;
  return null;
}

export function ProductCatalogPicker({
  categorySlug,
  subcategory,
  itemType = "",
  selectedProductId = null,
  onSelect,
  multiple = false,
  selectedProductIds = [],
  onToggleProduct,
  catalogOnlyMode = false,
  layout = "list",
}: ProductCatalogPickerProps) {
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subcategory.trim()) {
      setProducts([]);
      setError(null);
      return;
    }

    const materialTypeKey = resolveMaterialTypeKeyForServiceForm(
      categorySlug,
      subcategory,
      itemType,
    );

    let cancelled = false;
    setLoading(true);
    setError(null);

    api.productCatalog
      .list({
        categorySlug,
        ...(materialTypeKey ? { materialTypeKey } : { subcategory }),
        limit: 50,
      })
      .then((res) => {
        if (cancelled) return;
        if (!res.success) {
          setProducts([]);
          setError(res.error?.message || "Could not load catalog products");
          return;
        }
        const list =
          (res.data as { products?: CatalogProductItem[] })?.products || [];
        setProducts(list);
        if (list.length === 0) {
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setError("Could not load catalog products");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categorySlug, subcategory, itemType]);

  if (!subcategory.trim()) return null;

  const selectedCount = multiple ? selectedProductIds.length : selectedProductId ? 1 : 0;

  const handleProductClick = (product: CatalogProductItem) => {
    if (multiple && onToggleProduct) {
      onToggleProduct(product);
      return;
    }
    if (!onSelect) return;
    const selected = selectedProductId === product._id;
    onSelect(selected ? null : product);
  };

  const isProductSelected = (productId: string) =>
    multiple ? selectedProductIds.includes(productId) : selectedProductId === productId;

  if (catalogOnlyMode) {
    const useGrid = layout === "grid";

    return (
      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : error ? (
          <p className="text-sm text-destructive py-6 text-center">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No products here yet.
          </p>
        ) : useGrid ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {products.map((product) => {
              const selected = isProductSelected(product._id);
              const imageUrl =
                product.images?.[0] ||
                getSubcategoryImageUrl(categorySlug, subcategory);

              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className={cn(
                    "relative overflow-hidden rounded-lg border bg-card text-left transition-all",
                    selected
                      ? "border-primary ring-1 ring-primary/25"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="aspect-[5/3] overflow-hidden bg-muted">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{product.name}</p>
                    {product.brand && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{product.brand}</p>
                    )}
                  </div>
                  {selected && (
                    <div className="absolute top-1 right-1 rounded-full bg-primary p-px text-primary-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-h-[min(360px,45vh)] overflow-y-auto -mx-1 px-1 space-y-1.5">
            {products.map((product) => {
              const selected = isProductSelected(product._id);
              const imageUrl =
                product.images?.[0] ||
                getSubcategoryImageUrl(categorySlug, subcategory);

              return (
                <button
                  key={product._id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/40",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                    )}
                  >
                    {selected && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug truncate">{product.name}</p>
                    {product.brand && (
                      <p className="text-xs text-muted-foreground truncate">{product.brand}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            {catalogOnlyMode
              ? multiple
                ? "Select products you sell"
                : "Select product"
              : "Select product from catalog"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {catalogOnlyMode ? (
              multiple ? (
                <>
                  Choose all standard products you offer under{" "}
                  <span className="font-medium">{subcategory}</span>. Listing details come from the
                  catalog automatically.
                </>
              ) : (
                <>
                  Choose the catalog product for this listing under{" "}
                  <span className="font-medium">{subcategory}</span>.
                </>
              )
            ) : (
              <>
                Choose a standard product for <span className="font-medium">{subcategory}</span>.
                Listing details will auto-fill; you can still edit price and location.
              </>
            )}
          </p>
        </div>
        {!multiple && selectedProductId && onSelect && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelect(null)}>
            Clear
          </Button>
        )}
        {multiple && selectedCount > 0 && (
          <Badge variant="secondary" className="shrink-0">
            {selectedCount} selected
          </Badge>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading products…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive py-4 text-center">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center rounded-md border border-dashed">
          {catalogOnlyMode
            ? "No catalog products for this subcategory yet. Contact Imagineering India admin."
            : "No catalog products for this subcategory yet. You can still create a listing manually below."}
        </p>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1",
            catalogOnlyMode ? "max-h-[min(420px,50vh)] overflow-y-auto" : "max-h-72 overflow-y-auto",
          )}
        >
          {products.map((product) => {
            const selected = isProductSelected(product._id);
            const imageUrl =
              product.images?.[0] ||
              getSubcategoryImageUrl(categorySlug, subcategory);
            const priceLabel = formatPrice(product);

            return (
              <button
                key={product._id}
                type="button"
                onClick={() => handleProductClick(product)}
                className={cn(
                  "text-left rounded-lg border bg-card transition-all hover:border-primary/50 hover:shadow-sm",
                  selected && "border-primary ring-2 ring-primary/20",
                )}
              >
                <Card className="border-0 shadow-none">
                  <CardContent className="p-3 flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-medium text-sm leading-snug line-clamp-2">
                          {product.name}
                        </p>
                        {selected && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </div>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {product.brand}
                        </p>
                      )}
                      {priceLabel && (
                        <p className="text-xs font-medium text-primary mt-1">{priceLabel}</p>
                      )}
                      {product.customFields && product.customFields.length > 0 && (
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {product.customFields.length} specs
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
