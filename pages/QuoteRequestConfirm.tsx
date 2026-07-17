"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, CreditCard, Package, Tag } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clearActiveQuoteRequest } from "@/lib/activeQuoteRequest";
import { PaymentOptionsSelector, type PaymentOption } from "@/components/payments/PaymentOptionsSelector";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { CashfreeCheckout } from "@/components/payments/CashfreeCheckout";
import { CartOffersModal } from "@/components/cart/CartOffersModal";

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

type Transport = "supplier" | "self_pickup";

export default function QuoteRequestConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const offerId = searchParams?.get("offerId") || "";
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gstNumber, setGstNumber] = useState("");
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("razorpay");
  const [transport, setTransport] = useState<Transport>("supplier");
  const [submitting, setSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  const [offersOpen, setOffersOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponUsageId, setCouponUsageId] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.quoteRequests.getById(id);
      if (!res.success) throw new Error((res as any)?.error?.message || "Failed to load");
      setData((res as any).data);
    } catch (err: any) {
      toast({
        title: "Could not load request",
        description: err?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/quote-requests/${id}/confirm?offerId=${offerId}`)}`
      );
      return;
    }
    fetchDetail();
  }, [authLoading, isAuthenticated, fetchDetail, id, offerId, router]);

  useEffect(() => {
    const fromProfile = typeof user?.gstNumber === "string" ? user.gstNumber : "";
    if (fromProfile) setGstNumber(fromProfile.toUpperCase().replace(/\s/g, ""));
  }, [user?.gstNumber]);

  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const offerIndex = offers.findIndex((o: any) => String(o.id) === String(offerId));
  const offer = offerIndex >= 0 ? offers[offerIndex] : null;
  const deliveryUnavailable = offer?.deliveryOption === "not_available";

  useEffect(() => {
    if (!offer) return;
    if (deliveryUnavailable) setTransport("self_pickup");
    else setTransport("supplier");
  }, [offer?.id, deliveryUnavailable]);

  const serviceTitle = useMemo(() => {
    const s = data?.service;
    if (s && typeof s === "object") return s.title || "your request";
    return "your request";
  }, [data?.service]);

  const serviceId = useMemo(() => {
    const s = data?.service;
    if (!s) return undefined;
    if (typeof s === "string") return s;
    return s.id || s._id || undefined;
  }, [data?.service]);

  const categoryId = useMemo(() => {
    const s = data?.service;
    if (!s || typeof s !== "object") return undefined;
    const cat = s.category;
    if (!cat) return undefined;
    if (typeof cat === "string") return cat;
    return cat._id || cat.id || undefined;
  }, [data?.service]);

  const productAmount = Number(offer?.amount || 0);
  const quotedDelivery =
    offer?.deliveryOption === "paid" ? Math.max(0, Number(offer?.deliveryCharge || 0)) : 0;
  const effectiveDelivery = transport === "self_pickup" ? 0 : quotedDelivery;
  const subtotalBeforeOffer = productAmount + effectiveDelivery;
  const displayTotal = Math.max(0, subtotalBeforeOffer - (couponDiscount || 0));

  // Transport changes the payable base — clear applied offer so user re-applies on the new total
  useEffect(() => {
    if (!couponUsageId && couponDiscount <= 0) return;
    setCouponUsageId(null);
    setCouponDiscount(0);
    setCouponError(null);
    // keep couponCode filled for quick re-apply
  }, [transport]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || bookingId) return;
    setCouponApplying(true);
    setCouponError(null);
    try {
      const response = await api.coupons.validate({
        code: couponCode.trim(),
        amount: subtotalBeforeOffer,
        type: "booking",
        serviceId: serviceId ? String(serviceId) : undefined,
        categoryId: categoryId ? String(categoryId) : undefined,
      });
      if (response.success && response.data) {
        setCouponUsageId(response.data.usageId || null);
        setCouponDiscount(response.data.discountAmount || 0);
        toast({
          title: "Offer applied",
          description: `You saved ${formatINR(response.data.discountAmount || 0)}`,
        });
      } else {
        throw new Error((response as any).error?.message || "Invalid offer");
      }
    } catch (err: any) {
      setCouponUsageId(null);
      setCouponDiscount(0);
      setCouponError(err?.message || "Failed to apply offer");
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

  const onContinue = async () => {
    if (!offer || !id || !offerId) return;
    if (deliveryUnavailable && transport === "supplier") {
      toast({
        title: "Delivery not available",
        description: "Please choose Self Pickup for this quote.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.quoteRequests.payOffer(id, offerId, {
        gstNumber: gstNumber.trim() || undefined,
        transport,
        paymentOption,
        couponUsageId: couponUsageId || undefined,
      });
      if (!res.success || !(res as any).data?.bookingId) {
        throw new Error((res as any)?.error?.message || "Failed to place order");
      }
      const payload = (res as any).data;
      const nextBookingId = String(payload.bookingId);
      const amount = Number(payload.amount || displayTotal);
      if (typeof payload.couponUsageId === "string" && payload.couponUsageId) {
        setCouponUsageId(payload.couponUsageId);
      }

      if (payload.requiresOnlinePayment === false || paymentOption === "cod" || paymentOption === "neft" || paymentOption === "sbicollect") {
        clearActiveQuoteRequest(id);
        toast({
          title: "Order placed",
          description:
            paymentOption === "cod"
              ? "Pay on delivery selected. The supplier will confirm your order."
              : "Order placed. Complete payment as selected.",
        });
        router.push("/dashboard/buyer/orders");
        return;
      }

      clearActiveQuoteRequest(id);
      setBookingId(nextBookingId);
      setPayAmount(amount);
    } catch (err: any) {
      toast({
        title: "Could not continue",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!data || !offer) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Quote not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This offer may no longer be available. Go back and pick another quote.
        </p>
        <Button asChild className="mt-4">
          <Link href={id ? `/quote-requests/${id}` : "/services"}>Back to quotes</Link>
        </Button>
      </main>
    );
  }

  if (data.status === "ordered" || data.booking) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Order already started</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You already selected a quote for this request.
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/buyer/orders">View orders</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href={`/quote-requests/${id}`}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to quotes
        </Link>
      </Button>

      <h1 className="text-2xl font-bold tracking-tight">Order Confirmation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Confirm GST, payment, and transport for{" "}
        <span className="font-medium text-foreground">{serviceTitle}</span>.
      </p>

      <div className="mt-6 rounded-xl border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">Quote {offerIndex + 1}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Package className="h-3.5 w-3.5" /> Qty {data.quantity}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Product: {formatINR(productAmount)}
              {transport === "supplier" && quotedDelivery > 0
                ? ` · Delivery: ${formatINR(quotedDelivery)}`
                : transport === "self_pickup"
                  ? " · Self pickup (no delivery charge)"
                  : offer.deliveryOption === "free"
                    ? " · Free delivery"
                    : ""}
            </p>
            {couponDiscount > 0 ? (
              <p className="mt-1 text-xs font-medium text-primary">
                Offer: −{formatINR(couponDiscount)}
                {couponCode ? ` (${couponCode})` : ""}
              </p>
            ) : null}
          </div>
          <p className="text-xl font-bold tabular-nums">{formatINR(displayTotal)}</p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="gst-number">GST No. (Optional)</Label>
          <Input
            id="gst-number"
            value={gstNumber}
            onChange={(e) =>
              setGstNumber(e.target.value.toUpperCase().replace(/\s/g, "").replace(/[^A-Z0-9]/g, ""))
            }
            placeholder="e.g. 22AAAAA0000A1Z5"
            maxLength={15}
            disabled={Boolean(bookingId)}
          />
        </div>

        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between gap-2">
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Offer / Coupon
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setOffersOpen(true)}
              disabled={Boolean(bookingId)}
            >
              View offers
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setCouponError(null);
              }}
              placeholder="Enter offer code"
              className="h-9"
              disabled={couponApplying || Boolean(bookingId) || couponDiscount > 0}
            />
            {couponDiscount > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveCoupon}
                disabled={Boolean(bookingId)}
              >
                Remove
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleApplyCoupon}
                disabled={couponApplying || !couponCode.trim() || Boolean(bookingId)}
              >
                {couponApplying ? "Applying..." : "Apply"}
              </Button>
            )}
          </div>
          {couponError ? <p className="text-xs text-destructive">{couponError}</p> : null}
        </div>

        <div className="space-y-2 border-t pt-6">
          <Label>Payment Method</Label>
          <PaymentOptionsSelector
            value={paymentOption}
            onChange={setPaymentOption}
            amount={displayTotal}
            className={bookingId ? "pointer-events-none opacity-60" : undefined}
          />
        </div>

        <div className="space-y-3 border-t pt-6">
          <Label>Transport</Label>
          <RadioGroup
            value={transport}
            onValueChange={(v) => setTransport(v as Transport)}
            disabled={Boolean(bookingId)}
            className="gap-3"
          >
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                transport === "supplier" ? "border-primary bg-primary/5" : ""
              } ${deliveryUnavailable ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <RadioGroupItem value="supplier" id="transport-supplier" disabled={deliveryUnavailable} />
              <div>
                <p className="text-sm font-medium">Supplier</p>
                <p className="text-xs text-muted-foreground">
                  {deliveryUnavailable
                    ? "Not available on this quote"
                    : quotedDelivery > 0
                      ? `Supplier delivers · ${formatINR(quotedDelivery)}`
                      : "Supplier delivers · Free"}
                </p>
              </div>
            </label>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                transport === "self_pickup" ? "border-primary bg-primary/5" : ""
              }`}
            >
              <RadioGroupItem value="self_pickup" id="transport-self" />
              <div>
                <p className="text-sm font-medium">Self Pickup</p>
                <p className="text-xs text-muted-foreground">Pick up from supplier · No delivery charge</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {!bookingId ? (
          <Button className="w-full" size="lg" onClick={onContinue} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
          </Button>
        ) : (
          <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium">Complete payment · {formatINR(payAmount)}</p>
            <div className="flex flex-wrap gap-2">
              {paymentOption === "razorpay" && (
                <RazorpayCheckout
                  bookingId={bookingId}
                  bookingDescription={`Quote for ${serviceTitle}`}
                  amount={payAmount}
                  couponUsageId={couponUsageId || undefined}
                  onSuccess={() => {
                    toast({ title: "Payment successful", description: "Your order is placed." });
                    router.push("/dashboard/buyer/orders");
                  }}
                >
                  <CreditCard className="h-4 w-4" /> Pay with Razorpay
                </RazorpayCheckout>
              )}
              {paymentOption === "cashfree" && (
                <CashfreeCheckout
                  bookingId={bookingId}
                  bookingDescription={`Quote for ${serviceTitle}`}
                  amount={payAmount}
                  couponUsageId={couponUsageId || undefined}
                  onSuccess={() => {
                    toast({ title: "Payment successful", description: "Your order is placed." });
                    router.push("/dashboard/buyer/orders");
                  }}
                >
                  <CreditCard className="h-4 w-4" /> Pay with Cashfree
                </CashfreeCheckout>
              )}
            </div>
          </div>
        )}
      </div>

      <CartOffersModal
        open={offersOpen}
        onOpenChange={setOffersOpen}
        onSelectCode={(code) => {
          setCouponCode(code);
          setCouponError(null);
          if (couponDiscount > 0) {
            setCouponUsageId(null);
            setCouponDiscount(0);
          }
        }}
      />
    </main>
  );
}
