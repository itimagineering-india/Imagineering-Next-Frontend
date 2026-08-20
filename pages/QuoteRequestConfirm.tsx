"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, CreditCard, Package, Tag, Truck } from "lucide-react";
import api from "@/lib/api-client";
import { IMAGINEERING_CREDIT } from "@/lib/imagineering-product-labels";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clearActiveQuoteRequest } from "@/lib/activeQuoteRequest";
import { PaymentOptionsSelector, type PaymentOption } from "@/components/payments/PaymentOptionsSelector";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { CashfreeCheckout } from "@/components/payments/CashfreeCheckout";
import {
  ImagineeringCreditCheckoutPanel,
  useImagineeringCreditAvailable,
} from "@/components/imagineering-credit/ImagineeringCreditCheckoutPanel";
import { CreditsRedeemSection } from "@/components/wallet/CreditsRedeemSection";
import { CartOffersModal } from "@/components/cart/CartOffersModal";
import { quoteOfferItems, quoteRequestHeadline, quoteRequestItems } from "@/lib/b2b/quoteRequestDisplay";
import { formatQuoteQtyLabel } from "@/lib/priceTypeDisplay";
import { parseQuoteQuantity } from "@/lib/quoteQuantity";

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function normalizeGstNumber(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .toUpperCase()
    .replace(/\s/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 15);
}

function gstNumberFromProfile(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const row = user as Record<string, unknown>;
  const nested =
    row.user && typeof row.user === "object" ? (row.user as Record<string, unknown>) : null;
  return (
    normalizeGstNumber(row.gstNumber) ||
    normalizeGstNumber(row.gstIN) ||
    normalizeGstNumber(row.gstin) ||
    normalizeGstNumber(nested?.gstNumber)
  );
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const src = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load payment")));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load payment"));
    document.body.appendChild(script);
  });
}

type Transport = "supplier" | "self_pickup";

type QuoteCheckoutPreview = {
  productAmount: number;
  deliveryCharge: number;
  supplierGst: number;
  gstPercent: number | null;
  subtotal: number;
  platformFee: number;
  platformFeeGst: number;
  gst: number;
  total: number;
  quantity: number;
};

function CheckoutSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function BillRow({
  label,
  value,
  muted,
  emphasize,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 text-sm ${emphasize ? "font-semibold" : ""}`}>
      <span className={muted ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`shrink-0 tabular-nums ${muted ? "text-muted-foreground" : ""}`}>{value}</span>
    </div>
  );
}

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
  const gstTouchedRef = useRef(false);
  const profileGst = useMemo(() => gstNumberFromProfile(user), [user]);
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
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [creditsDiscount, setCreditsDiscount] = useState(0);
  const [preview, setPreview] = useState<QuoteCheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

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
    if (gstTouchedRef.current) return;
    if (profileGst) {
      setGstNumber(profileGst);
      return;
    }
    let cancelled = false;
    void api.auth
      .getMe()
      .then((res) => {
        if (cancelled || gstTouchedRef.current) return;
        const gst = gstNumberFromProfile(res.data);
        if (gst) setGstNumber(gst);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profileGst]);

  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const offerIndex = offers.findIndex((o: any) => String(o.id) === String(offerId));
  const offer = offerIndex >= 0 ? offers[offerIndex] : null;
  const deliveryUnavailable = offer?.deliveryOption === "not_available";

  useEffect(() => {
    if (!offer) return;
    if (deliveryUnavailable) setTransport("self_pickup");
    else setTransport("supplier");
  }, [offer?.id, deliveryUnavailable]);

  useEffect(() => {
    if (!id || !offerId || !offer) return;
    let cancelled = false;
    setPreviewLoading(true);
    void api.quoteRequests
      .previewOffer(id, offerId, transport)
      .then((res) => {
        if (cancelled) return;
        const row = (res as any)?.data as QuoteCheckoutPreview | undefined;
        if (res.success && row) {
          setPreview({
            productAmount: Number(row.productAmount) || 0,
            deliveryCharge: Number(row.deliveryCharge) || 0,
            supplierGst: Number(row.supplierGst) || 0,
            gstPercent:
              row.gstPercent != null && Number.isFinite(Number(row.gstPercent))
                ? Number(row.gstPercent)
                : null,
            subtotal: Number(row.subtotal) || 0,
            platformFee: Number(row.platformFee) || 0,
            platformFeeGst: Number(row.platformFeeGst) || 0,
            gst: Number(row.gst) || 0,
            total: Number(row.total) || 0,
            quantity: Number(row.quantity) || 1,
          });
        } else {
          setPreview(null);
        }
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, offerId, offer?.id, transport]);

  const serviceTitle = useMemo(() => quoteRequestHeadline(data) || "your request", [data]);
  const requestItems = useMemo(() => quoteRequestItems(data), [data]);
  const offerLines = useMemo(() => quoteOfferItems(offer), [offer]);
  const lineRows = useMemo(() => {
    if (offerLines.length > 0) {
      return offerLines.map((item, idx) => {
        const req =
          requestItems.find((row) => row.serviceId && row.serviceId === item.serviceId) ||
          requestItems[idx];
        return {
          title: String(item.title || req?.title || `Item ${idx + 1}`),
          quantity: parseQuoteQuantity(item.quantity ?? req?.quantity, 1),
          priceType: req?.priceType,
          unitPrice: Number(item.unitPrice || 0),
          lineTotal: Number(item.lineTotal || 0),
        };
      });
    }
    return requestItems.map((item, idx) => ({
      title: String(item.title || `Item ${idx + 1}`),
      quantity: parseQuoteQuantity(item.quantity, 1),
      priceType: item.priceType,
      unitPrice: 0,
      lineTotal: 0,
    }));
  }, [offerLines, requestItems]);

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
  const supplierGst = Number(offer?.gstAmount || 0);
  const quotedDelivery =
    offer?.deliveryOption === "paid" ? Math.max(0, Number(offer?.deliveryCharge || 0)) : 0;
  const effectiveDelivery = transport === "self_pickup" ? 0 : quotedDelivery;
  const fallbackSubtotal = productAmount + effectiveDelivery + supplierGst;
  const previewBase = preview && preview.total > 0 ? preview.total : fallbackSubtotal;
  const displayTotal = Math.max(0, previewBase - (couponDiscount || 0));
  const paymentAmount = Math.max(0, displayTotal - creditsDiscount);
  const payableTotal = bookingId ? Math.max(0, payAmount - creditsDiscount) : paymentAmount;
  const isOfflineCheckout =
    paymentOption === "cod" ||
    paymentOption === "neft" ||
    paymentOption === "sbicollect" ||
    paymentOption === "imagineering_credit";
  const checkoutCta = isOfflineCheckout ? "Place order" : `Pay ${formatINR(payableTotal)}`;
  const shownProduct = preview?.productAmount ?? productAmount;
  const shownSupplierGst = preview?.supplierGst ?? supplierGst;
  const shownDelivery = preview?.deliveryCharge ?? effectiveDelivery;
  const platformFee = preview?.platformFee ?? 0;
  const platformFeeGst = preview?.platformFeeGst || preview?.gst || 0;
  const { canUse: canUseImagineeringCredit } = useImagineeringCreditAvailable(displayTotal);

  const handleCreditsChange = useCallback((credits: number, discount: number) => {
    setCreditsToApply(credits);
    setCreditsDiscount(discount);
  }, []);

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
        amount: previewBase,
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
        creditsToApply: creditsToApply > 0 ? creditsToApply : undefined,
      });
      const payload = (res as any).data;
      if (!res.success) {
        throw new Error((res as any)?.error?.message || "Failed to place order");
      }
      if (typeof payload?.couponUsageId === "string" && payload.couponUsageId) {
        setCouponUsageId(payload.couponUsageId);
      }

      if (payload?.alreadyOrdered && payload?.bookingId) {
        clearActiveQuoteRequest(id);
        toast({ title: "Order placed", description: "You already selected a quote for this request." });
        router.push("/buyer/orders");
        return;
      }

      const offlinePay =
        payload?.requiresOnlinePayment === false ||
        paymentOption === "cod" ||
        paymentOption === "neft" ||
        paymentOption === "sbicollect" ||
        paymentOption === "imagineering_credit";

      if (offlinePay) {
        if (!payload?.bookingId) {
          throw new Error((res as any)?.error?.message || "Failed to place order");
        }
        clearActiveQuoteRequest(id);
        toast({
          title: "Order placed",
          description:
            paymentOption === "cod"
              ? "Pay on delivery selected. The supplier will confirm your order."
              : paymentOption === "imagineering_credit"
                ? `Paid with ${IMAGINEERING_CREDIT.name}. Your order is placed.`
                : "Order placed. Complete payment as selected.",
        });
        router.push("/buyer/orders");
        return;
      }

      if (paymentOption === "razorpay" && payload?.orderId && payload?.paymentId && payload?.key) {
        await loadRazorpayScript();
        if (!window.Razorpay) throw new Error("Payment window could not be opened");
        await new Promise<void>((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: payload.key,
            amount: payload.amount,
            currency: payload.currency || "INR",
            name: "Imagineering India",
            description: `Quote for ${serviceTitle}`,
            order_id: payload.orderId,
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            handler: async (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
              try {
                const verifyRes = await api.payments.verifyQuoteRequest({
                  razorpayOrderId: response.razorpay_order_id || payload.orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                  paymentId: String(payload.paymentId),
                });
                if (!verifyRes.success) {
                  throw new Error((verifyRes as any)?.error?.message || "Payment verification failed");
                }
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Payment cancelled")),
            },
          });
          razorpay.open();
        });
        clearActiveQuoteRequest(id);
        toast({ title: "Payment successful", description: "Your order is placed." });
        router.push("/buyer/orders");
        return;
      }

      if (!payload?.bookingId) {
        throw new Error((res as any)?.error?.message || "Failed to place order");
      }
      clearActiveQuoteRequest(id);
      setBookingId(String(payload.bookingId));
      setPayAmount(Number(payload.amount || payload.amountRupees || displayTotal));
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
          <Link href="/buyer/orders">View orders</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 sm:py-8 lg:pb-10">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
        <Link href={`/quote-requests/${id}`}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to quotes
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm GST, payment, and delivery for{" "}
          <span className="font-medium text-foreground">{serviceTitle}</span>.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-4 lg:order-1">
          <CheckoutSection
            title="GST number"
            description="Optional — used on the invoice. Editable for this order."
          >
            <Input
              id="gst-number"
              value={gstNumber}
              onChange={(e) => {
                gstTouchedRef.current = true;
                setGstNumber(normalizeGstNumber(e.target.value));
              }}
              placeholder="e.g. 22AAAAA0000A1Z5"
              maxLength={15}
              className="font-mono"
              disabled={Boolean(bookingId)}
            />
            {profileGst && gstNumber === profileGst ? (
              <p className="mt-2 text-xs text-muted-foreground">Filled from your profile.</p>
            ) : profileGst && gstNumber && gstNumber !== profileGst ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Changed for this order only — profile GST stays {profileGst}.
              </p>
            ) : null}
          </CheckoutSection>

          <CheckoutSection title="Offer / coupon">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError(null);
                }}
                placeholder="Enter offer code"
                className="h-10"
                disabled={couponApplying || Boolean(bookingId) || couponDiscount > 0}
              />
              <div className="flex shrink-0 gap-2">
                {couponDiscount > 0 ? (
                  <Button variant="outline" onClick={handleRemoveCoupon} disabled={Boolean(bookingId)}>
                    Remove
                  </Button>
                ) : (
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={couponApplying || !couponCode.trim() || Boolean(bookingId)}
                  >
                    {couponApplying ? "Applying..." : "Apply"}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOffersOpen(true)}
                  disabled={Boolean(bookingId)}
                >
                  <Tag className="mr-1.5 h-3.5 w-3.5" />
                  View offers
                </Button>
              </div>
            </div>
            {couponError ? <p className="mt-2 text-xs text-destructive">{couponError}</p> : null}
            {couponDiscount > 0 ? (
              <p className="mt-2 text-sm font-medium text-emerald-700">
                {couponCode ? `${couponCode} applied` : "Offer applied"} · −{formatINR(couponDiscount)}
              </p>
            ) : null}
          </CheckoutSection>

          <CheckoutSection title="Payment" description="Wallet discount and payment method">
            <div className="space-y-4">
              {!bookingId && paymentOption !== "imagineering_credit" && (
                <CreditsRedeemSection orderTotal={displayTotal} onCreditsChange={handleCreditsChange} />
              )}
              <PaymentOptionsSelector
                value={paymentOption}
                onChange={(v) => {
                  setPaymentOption(v);
                  if (v === "imagineering_credit") {
                    setCreditsToApply(0);
                    setCreditsDiscount(0);
                  }
                }}
                amount={paymentOption === "imagineering_credit" ? displayTotal : paymentAmount}
                showImagineeringCredit={canUseImagineeringCredit}
                className={bookingId ? "pointer-events-none opacity-60" : undefined}
              />
              <ImagineeringCreditCheckoutPanel
                orderTotal={displayTotal}
                selected={paymentOption === "imagineering_credit"}
              />
            </div>
          </CheckoutSection>

          <CheckoutSection title="Delivery">
            <RadioGroup
              value={transport}
              onValueChange={(v) => setTransport(v as Transport)}
              disabled={Boolean(bookingId)}
              className="gap-3"
            >
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                  transport === "supplier" ? "border-primary bg-primary/5" : "border-border"
                } ${deliveryUnavailable ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <RadioGroupItem value="supplier" id="transport-supplier" disabled={deliveryUnavailable} className="mt-0.5" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                    Supplier delivery
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {deliveryUnavailable
                      ? "Not available on this quote"
                      : quotedDelivery > 0
                        ? formatINR(quotedDelivery)
                        : "Free"}
                  </p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                  transport === "self_pickup" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="self_pickup" id="transport-self" className="mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Self pickup</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Pick up from supplier · No delivery charge</p>
                </div>
              </label>
            </RadioGroup>
          </CheckoutSection>

          {!bookingId ? (
            <Button className="hidden h-12 w-full text-base lg:inline-flex" size="lg" onClick={onContinue} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : checkoutCta}
            </Button>
          ) : (
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-medium">Complete payment · {formatINR(payableTotal)}</p>
              <div className="flex flex-wrap gap-2">
                {paymentOption === "razorpay" && (
                  <RazorpayCheckout
                    bookingId={bookingId}
                    bookingDescription={`Quote for ${serviceTitle}`}
                    amount={payableTotal}
                    couponUsageId={couponUsageId || undefined}
                    creditsToApply={creditsToApply > 0 ? creditsToApply : undefined}
                    onSuccess={() => {
                      toast({ title: "Payment successful", description: "Your order is placed." });
                      router.push("/buyer/orders");
                    }}
                  >
                    <CreditCard className="h-4 w-4" /> Pay with Razorpay
                  </RazorpayCheckout>
                )}
                {paymentOption === "cashfree" && (
                  <CashfreeCheckout
                    bookingId={bookingId}
                    bookingDescription={`Quote for ${serviceTitle}`}
                    amount={payableTotal}
                    couponUsageId={couponUsageId || undefined}
                    creditsToApply={creditsToApply > 0 ? creditsToApply : undefined}
                    onSuccess={() => {
                      toast({ title: "Payment successful", description: "Your order is placed." });
                      router.push("/buyer/orders");
                    }}
                  >
                    <CreditCard className="h-4 w-4" /> Pay with Cashfree
                  </CashfreeCheckout>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="order-first lg:sticky lg:top-24 lg:order-2">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="border-b px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Quote {offerIndex + 1}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {lineRows.length > 1 ? `${lineRows.length} products` : formatQuoteQtyLabel(lineRows[0]?.quantity || parseQuoteQuantity(data.quantity, 1), lineRows[0]?.priceType)}
                  </p>
                </div>
              </div>
            </div>

            <ul className="divide-y">
              {lineRows.map((item, idx) => (
                <li key={`${item.title}-${idx}`} className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatQuoteQtyLabel(item.quantity, item.priceType)}
                      {item.unitPrice > 0 ? ` · ${formatINR(item.unitPrice)} each` : ""}
                    </p>
                  </div>
                  {item.lineTotal > 0 ? (
                    <p className="shrink-0 text-sm font-medium tabular-nums">{formatINR(item.lineTotal)}</p>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="space-y-2.5 border-t px-4 py-4 sm:px-5">
              <BillRow label="Product" value={formatINR(shownProduct)} muted />
              {shownSupplierGst > 0 ? (
                <BillRow
                  label={`GST${offer.gstPercent != null && Number(offer.gstPercent) > 0 ? ` (${offer.gstPercent}%)` : ""}`}
                  value={formatINR(shownSupplierGst)}
                  muted
                />
              ) : offer.gstLabel ? (
                <BillRow label={String(offer.gstLabel)} value="—" muted />
              ) : null}
              <BillRow
                label={transport === "self_pickup" ? "Delivery (self pickup)" : "Delivery"}
                value={
                  transport === "self_pickup"
                    ? "₹0"
                    : shownDelivery > 0
                      ? formatINR(shownDelivery)
                      : "Free"
                }
                muted
              />
              <BillRow
                label="Platform fee (excl. GST)"
                value={previewLoading && !preview ? "…" : formatINR(platformFee)}
                muted
              />
              <BillRow
                label="GST on platform fee (18%)"
                value={previewLoading && !preview ? "…" : formatINR(platformFeeGst)}
                muted
              />
              {couponDiscount > 0 ? (
                <BillRow
                  label={couponCode ? `Offer (${couponCode})` : "Offer"}
                  value={`−${formatINR(couponDiscount)}`}
                />
              ) : null}
              {creditsDiscount > 0 ? (
                <BillRow label="Wallet" value={`−${formatINR(creditsDiscount)}`} />
              ) : null}
              <div className="border-t pt-3">
                <BillRow label="To pay" value={formatINR(payableTotal)} emphasize />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {!bookingId ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">To pay</p>
              <p className="truncate text-lg font-bold tabular-nums">{formatINR(payableTotal)}</p>
            </div>
            <Button size="lg" className="h-11 min-w-[9.5rem] px-5" onClick={onContinue} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : checkoutCta}
            </Button>
          </div>
        </div>
      ) : null}

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
