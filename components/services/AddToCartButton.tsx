"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { ProviderMismatchDialog } from "@/components/cart/ProviderMismatchDialog";
import { useToast } from "@/hooks/use-toast";

type AddToCartButtonProps = {
  serviceId: string;
  providerName?: string;
  quantity?: number;
  className?: string;
  label?: string;
  onAdded?: () => void;
  /** Show quantity selector next to the button (default true) */
  showQuantity?: boolean;
  /** Max quantity allowed in selector */
  maxQuantity?: number;
};

export const AddToCartButton = ({
  serviceId,
  providerName,
  quantity: initialQuantity = 1,
  className,
  label = "Add to Cart",
  onAdded,
  showQuantity = true,
  maxQuantity,
}: AddToCartButtonProps) => {
  const { addToCart, clearCart } = useCart();
  const { toast } = useToast();
  const [showMismatch, setShowMismatch] = useState(false);
  const [pendingAdd, setPendingAdd] = useState(false);
  const minQty = 0.1;
  const [quantity, setQuantity] = useState(() => {
    const next = Math.max(minQty, Number(initialQuantity) || minQty);
    return typeof maxQuantity === "number" ? Math.min(next, maxQuantity) : next;
  });

  const clamp = (q: number) => {
    const next = Math.max(minQty, q);
    return typeof maxQuantity === "number" ? Math.min(next, maxQuantity) : next;
  };

  const handleAdd = async () => {
    const qty = clamp(quantity);
    setPendingAdd(true);
    // Optimistic: show feedback immediately, then run add in background
    toast({ title: "Added to cart" });
    setPendingAdd(false);
    onAdded?.();
    try {
      await addToCart(serviceId, qty, { silent: true });
    } catch (error: any) {
      // If provider mismatch, open dialog
      setShowMismatch(true);
    }
  };

  const handleClearAndAdd = async () => {
    const qty = clamp(quantity);
    try {
      await clearCart();
      await addToCart(serviceId, qty);
      onAdded?.();
      setShowMismatch(false);
    } catch (error: any) {
      toast({
        title: "Unable to add",
        description: error.message || "Please try again.",
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

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        {showQuantity && (
          <div className="flex items-center shrink-0">
            <Input
              type="number"
              min={minQty}
              max={maxQuantity}
              step={0.1}
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={() => setQuantity((q) => clamp(q))}
              className="w-14 h-9 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={pendingAdd}
              aria-label="Quantity"
            />
          </div>
        )}
        <Button
          onClick={handleAdd}
          disabled={pendingAdd}
          className={className ?? "flex-1 min-w-0"}
        >
          {pendingAdd ? "Adding..." : label}
        </Button>
      </div>

      <ProviderMismatchDialog
        open={showMismatch}
        onCancel={() => setShowMismatch(false)}
        onClearAndAdd={handleClearAndAdd}
        existingProviderName={providerName}
      />
    </>
  );
};
