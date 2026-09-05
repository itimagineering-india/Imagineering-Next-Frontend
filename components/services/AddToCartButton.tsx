"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProviderMismatchDialog } from "@/components/cart/ProviderMismatchDialog";
import { useToast } from "@/hooks/use-toast";
import { isMachineRentalCategorySlug } from "@/lib/machineRental";
import { formatServicePrice } from "@/lib/formatServicePrice";
import {
  formatDurationQtyLabel,
  getPriceTypeLabel,
  getQuantityUnitFieldLabel,
  isDurationPriceType,
} from "@/lib/priceTypeDisplay";

const OPEN_CART_PARAM = "openAddToCart";

type AddToCartButtonProps = {
  serviceId: string;
  providerName?: string;
  quantity?: number;
  className?: string;
  label?: string;
  onAdded?: () => void;
  /** @deprecated Quantity is collected in a modal; this prop is ignored. */
  showQuantity?: boolean;
  /** Max quantity allowed in selector */
  maxQuantity?: number;
  /** Service price type — used for rental duration labels (daily/hourly/per_trip). */
  priceType?: string | null;
  /** Category slug — enables rental duration UX when machine-rental. */
  categorySlug?: string | null;
  /** Unit selling price for live total preview in the modal. */
  unitPrice?: number | null;
  /** When set, cart uses this catalog variant's price override (hybrid pricing). */
  catalogVariantId?: string | null;
};

export const AddToCartButton = ({
  serviceId,
  providerName,
  quantity: initialQuantity = 1,
  className,
  label = "Add to Cart",
  onAdded,
  maxQuantity,
  priceType,
  categorySlug,
  unitPrice,
  catalogVariantId,
}: AddToCartButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { addToCart, clearCart } = useCart();
  const { toast } = useToast();
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showMismatch, setShowMismatch] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(false);

  const isRentalDuration =
    isMachineRentalCategorySlug(categorySlug || undefined) && isDurationPriceType(priceType);

  const minQty = isRentalDuration ? 1 : 0.1;
  const qtyStep = isRentalDuration ? (String(priceType).toLowerCase() === "hourly" ? 0.5 : 1) : 0.1;
  const fieldLabel = isRentalDuration ? getQuantityUnitFieldLabel(priceType) : "Quantity";
  const unitPriceLabel = formatServicePrice({
    price: unitPrice,
    priceMode: "exact",
    priceType: priceType || "fixed",
  });

  const [quantity, setQuantity] = useState(() => {
    const next = Math.max(minQty, Number(initialQuantity) || minQty);
    return typeof maxQuantity === "number" ? Math.min(next, maxQuantity) : next;
  });

  const clamp = useCallback(
    (q: number) => {
      let next = Math.max(minQty, q);
      if (isRentalDuration && String(priceType).toLowerCase() !== "hourly") {
        next = Math.max(minQty, Math.round(next));
      }
      return typeof maxQuantity === "number" ? Math.min(next, maxQuantity) : next;
    },
    [maxQuantity, minQty, isRentalDuration, priceType]
  );

  const estimatedTotal = useMemo(() => {
    const price = Number(unitPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    const qty = clamp(quantity);
    return Math.round(price * qty * 100) / 100;
  }, [unitPrice, quantity, clamp]);

  const buildCurrentPath = useCallback(() => {
    const qs = searchParams?.toString();
    return `${pathname || "/"}${qs ? `?${qs}` : ""}`;
  }, [pathname, searchParams]);

  const redirectToLogin = useCallback(() => {
    const base = buildCurrentPath();
    const sep = base.includes("?") ? "&" : "?";
    const redirectPath = `${base}${sep}${OPEN_CART_PARAM}=${encodeURIComponent(serviceId)}`;
    router.push(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }, [buildCurrentPath, router, serviceId]);

  useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;
    const pendingId = searchParams?.get(OPEN_CART_PARAM);
    if (pendingId !== serviceId) return;

    setQuantity(clamp(Number(initialQuantity) || minQty));
    setShowQuantityModal(true);

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete(OPEN_CART_PARAM);
    const next = params.toString();
    router.replace(`${pathname || "/"}${next ? `?${next}` : ""}`);
  }, [isAuthenticated, isAuthLoading, searchParams, serviceId, pathname, router, clamp, initialQuantity, minQty]);

  const handleOpenAdd = () => {
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }
    setQuantity(clamp(Number(initialQuantity) || minQty));
    setShowQuantityModal(true);
  };

  const performAdd = async (qty: number) => {
    setPendingAdd(true);
    try {
      await addToCart(serviceId, qty, {
        silent: true,
        catalogVariantId: catalogVariantId || undefined,
      });
      toast({
        title: "Added to cart",
        description: isRentalDuration
          ? formatDurationQtyLabel(qty, priceType)
          : undefined,
      });
      setShowQuantityModal(false);
      onAdded?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("provider")) {
        setShowMismatch(true);
      } else {
        toast({
          title: "Cannot add to cart",
          description: message || "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setPendingAdd(false);
    }
  };

  const handleConfirmAdd = () => {
    void performAdd(clamp(quantity));
  };

  const handleClearAndAdd = async () => {
    const qty = clamp(quantity);
    try {
      await clearCart();
      await addToCart(serviceId, qty, {
        catalogVariantId: catalogVariantId || undefined,
      });
      setShowQuantityModal(false);
      onAdded?.();
      setShowMismatch(false);
    } catch (error: unknown) {
      toast({
        title: "Unable to add",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || raw === ".") {
      setQuantity(minQty);
      return;
    }
    const v = parseFloat(raw);
    if (!Number.isNaN(v)) setQuantity(clamp(v));
  };

  const dialogDescription = isRentalDuration
    ? `How many ${fieldLabel.toLowerCase()} do you need? Rate is ${unitPriceLabel}.`
    : "Enter the quantity you need for this item.";

  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleOpenAdd();
        }}
        disabled={pendingAdd || isAuthLoading}
        className={cn(
          "h-9 w-full shrink-0 px-3 sm:px-4 text-sm font-semibold leading-normal",
          className
        )}
      >
        {label}
      </Button>

      <Dialog open={showQuantityModal} onOpenChange={setShowQuantityModal}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Add to Cart</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor={`cart-qty-${serviceId}`}>{fieldLabel}</Label>
              <Input
                id={`cart-qty-${serviceId}`}
                type="number"
                min={minQty}
                max={maxQuantity}
                step={qtyStep}
                value={quantity}
                onChange={handleQuantityChange}
                onBlur={() => setQuantity((q) => clamp(q))}
                disabled={pendingAdd}
                autoFocus
              />
              {isRentalDuration && getPriceTypeLabel(priceType) ? (
                <p className="text-xs text-muted-foreground">
                  Billed {getPriceTypeLabel(priceType).toLowerCase()}
                </p>
              ) : null}
            </div>
            {estimatedTotal != null ? (
              <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-semibold text-foreground">
                    ₹{estimatedTotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unitPriceLabel} × {formatDurationQtyLabel(clamp(quantity), priceType)}
                </p>
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowQuantityModal(false)}
              disabled={pendingAdd}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmAdd} disabled={pendingAdd}>
              {pendingAdd ? "Adding..." : "Add to Cart"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProviderMismatchDialog
        open={showMismatch}
        onCancel={() => setShowMismatch(false)}
        onClearAndAdd={handleClearAndAdd}
        existingProviderName={providerName}
      />
    </>
  );
};
