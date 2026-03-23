"use client";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CartCheckoutModal } from "@/components/cart/CartCheckoutModal";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Minus } from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

const DEBOUNCE_MS = 500;

export default function CartPage() {
  const { cart, totals, updateQuantity, removeFromCart, clearCart, isRefreshing, loading } = useCart();
  const [openCheckout, setOpenCheckout] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponUsageId, setCouponUsageId] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  const items = cart?.items || [];
  const [inputQuantities, setInputQuantities] = useState<Record<string, number | string>>({});
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});

  // Sync input quantities when cart items change; skip the row currently being edited to avoid overwriting typing
  useEffect(() => {
    const next: Record<string, number | string> = {};
    items.forEach((it) => {
      const id = String(it.service?._id ?? it.service);
      if (id !== editingServiceId) next[id] = it.quantity;
    });
    setInputQuantities((prev) => ({ ...prev, ...next }));
  }, [items, editingServiceId]);

  const flushQtyDebounce = useCallback(
    (serviceId: string) => {
      const sid = String(serviceId);
      if (debounceRefs.current[sid]) {
        clearTimeout(debounceRefs.current[sid]);
        debounceRefs.current[sid] = undefined;
      }
    },
    []
  );

  const handleQtyInputChange = useCallback(
    (serviceId: string, value: string) => {
      const sid = String(serviceId);
      setInputQuantities((prev) => ({ ...prev, [sid]: value }));
      
      const qty = parseFloat(value);
      if (!Number.isNaN(qty) && qty > 0) {
        flushQtyDebounce(serviceId);
        debounceRefs.current[sid] = setTimeout(() => updateQuantity(serviceId, qty), DEBOUNCE_MS);
      }
    },
    [updateQuantity, flushQtyDebounce]
  );

  const handleQtyBlur = useCallback(
    (serviceId: string, currentInput: number | string) => {
      setEditingServiceId(null);
      flushQtyDebounce(serviceId);
      
      let qty = typeof currentInput === 'string' ? parseFloat(currentInput) : currentInput;
      if (Number.isNaN(qty) || qty <= 0) qty = 1;
      
      const item = items.find((i) => String(i.service?._id ?? i.service) === String(serviceId));
      if (item && item.quantity !== qty) updateQuantity(serviceId, qty);
      
      // Reset input to normalized value
      const sid = String(serviceId);
      setInputQuantities(prev => ({ ...prev, [sid]: qty }));
    },
    [items, updateQuantity, flushQtyDebounce]
  );

  const subtotal = useMemo(() => totals?.subtotal || 0, [totals]);
  const platformFee = useMemo(() => totals?.platformFee || 0, [totals]);
  const gst = useMemo(() => totals?.gst || 0, [totals]);
  const totalAmount = useMemo(() => {
    const total = subtotal + platformFee + gst - (couponDiscount || 0);
    return total > 0 ? Math.round(total * 100) / 100 : 0;
  }, [subtotal, platformFee, gst, couponDiscount]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true);
    setCouponError(null);
    try {
      const response = await api.coupons.validate({
        code: couponCode.trim(),
        amount: subtotal + platformFee + gst,
        type: "booking",
      });
      if (response.success && response.data) {
        const data = response.data as any;
        setCouponUsageId(data.usageId || null);
        setCouponDiscount(data.discountAmount || 0);
        toast({
          title: "Coupon applied",
          description: `You saved ₹${(data.discountAmount || 0).toLocaleString()}`,
        });
      } else {
        throw new Error(response.error?.message || "Invalid coupon");
      }
    } catch (error: any) {
      setCouponUsageId(null);
      setCouponDiscount(0);
      setCouponError(error.message || "Failed to apply coupon");
    } finally {
      setCouponApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponUsageId(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold">Your Cart</h1>
          {items.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearCart}
              className="w-full sm:w-auto"
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>

        {isRefreshing ? (
          <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-4 md:gap-6">
            <Card className="order-2 lg:order-1">
              <CardHeader className="pb-3 sm:pb-4">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`cart-item-skeleton-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border p-3 sm:p-4 rounded-lg"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 pl-0">
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-14 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="order-1 lg:order-2">
              <CardHeader className="pb-3 sm:pb-4">
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </CardContent>
            </Card>
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 sm:py-16 text-center text-muted-foreground">
              <p className="text-base sm:text-lg">Your cart is empty.</p>
              <p className="text-sm mt-2">Add services to your cart to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-[2fr_1fr] gap-4 md:gap-6">
            {/* Services List */}
            <Card className="order-2 lg:order-1">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Services ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {items.map((item) => {
                  const serviceId = item.service?._id ?? item.service;
                  const sid = String(serviceId);
                  // Use item.quantity when not editing this row so +/- never flicker; use input only while typing
                  const displayQty = editingServiceId === sid ? (inputQuantities[sid] ?? item.quantity) : (typeof item.quantity === 'number' ? item.quantity.toFixed(1) : item.quantity);
                  const qtyForTotal = item.quantity;
                  return (
                    <div 
                      key={sid} 
                      className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border p-3 sm:p-4 rounded-lg hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm sm:text-base line-clamp-2">{item.service?.title ?? "Service"}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          ₹{item.price?.toLocaleString() || 0} {item.priceType && `/${item.priceType}`}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Quantity: {typeof displayQty === 'number' ? displayQty.toFixed(1) : displayQty}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 pl-0">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            onClick={() => {
                              if (item.quantity > 0.1) {
                                const newQty = Math.round((item.quantity - 0.1) * 10) / 10;
                                updateQuantity(serviceId, Math.max(0.1, newQty));
                              }
                            }}
                            disabled={loading || item.quantity <= 0.1}
                            aria-label="Decrease quantity"
                            title="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            type="number"
                            min={0.1}
                            value={displayQty}
                            onFocus={() => setEditingServiceId(sid)}
                            step="0.1"
                            onChange={(e) => {
                              handleQtyInputChange(serviceId, e.target.value);
                            }}
                            onBlur={() => handleQtyBlur(serviceId, displayQty)}
                            className="w-14 sm:w-16 h-8 sm:h-9 text-center text-sm"
                            disabled={loading}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9"
                            onClick={() => {
                              const newQty = Math.round((item.quantity + 0.1) * 10) / 10;
                              updateQuantity(serviceId, newQty);
                            }}
                            disabled={loading}
                            aria-label="Increase quantity"
                            title="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFromCart(serviceId)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 sm:h-9 px-2 sm:px-3"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Remove</span>
                        </Button>
                      </div>
                      
                      <div className="flex sm:hidden items-center justify-between pt-2 border-t">
                        <span className="text-sm font-medium">Item Total:</span>
                        <span className="text-base font-semibold">
                          ₹{((item.price || 0) * qtyForTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Order Summary - Sticky on mobile */}
            <Card className="order-1 lg:order-2 lg:sticky lg:top-4 lg:self-start">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Platform Fee</span>
                    <span className="font-medium">₹{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">GST (18% on subtotal)</span>
                    <span className="font-medium">₹{gst.toLocaleString()}</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-success">
                      <span>Coupon Discount</span>
                      <span>-₹{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {totals.tax && totals.tax > 0 && (
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-muted-foreground">Tax</span>
                      <span className="font-medium">₹{totals.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {totals.discount && totals.discount > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-success">
                      <span>Discount</span>
                      <span>-₹{totals.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 sm:pt-3 mt-2 sm:mt-3">
                    <div className="flex justify-between text-base sm:text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-primary">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="h-9"
                      disabled={couponApplying}
                    />
                    {couponDiscount > 0 ? (
                      <Button variant="outline" size="sm" onClick={handleRemoveCoupon}>
                        Remove
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleApplyCoupon} disabled={couponApplying}>
                        {couponApplying ? "Applying..." : "Apply"}
                      </Button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-xs text-destructive">{couponError}</p>
                  )}
                </div>
                
                <Button 
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold mt-4 sm:mt-6" 
                  onClick={() => setOpenCheckout(true)}
                  size="lg"
                >
                  Proceed to Checkout
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Secure checkout with encrypted payment
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {cart && (
        <CartCheckoutModal
          open={openCheckout}
          onOpenChange={setOpenCheckout}
          cartId={cart._id}
          amount={totalAmount}
          couponUsageId={couponUsageId}
          onSuccess={() => {
            setOpenCheckout(false);
            router.push("/dashboard/buyer/orders");
          }}
        />
      )}
    </div>
  );
}
