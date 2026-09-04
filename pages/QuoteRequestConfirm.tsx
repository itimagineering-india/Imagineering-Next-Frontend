"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft, CreditCard, Package, Tag, Truck, MapPin, Building2, Upload } from "lucide-react";
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

type PartialAdvanceMethod = "razorpay" | "cashfree" | "sbicollect";

type PartialPreview = {
  orderTotal: number;
  minPercent: number;
  minPartialAmount: number;
  partialAmount: number;
  balanceDue: number;
  allowedAdvanceMethods: PartialAdvanceMethod[];
};

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

async function loadCashfreeSdk(): Promise<any> {
  if (typeof window === "undefined") return null;
  const mode =
    (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") || "sandbox";
  const existingFn = window.Cashfree;
  if (existingFn && typeof existingFn === "function") {
    return existingFn({ mode });
  }
  await new Promise<void>((resolve, reject) => {
    const scriptId = "cashfree-js-sdk";
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Cashfree")));
      if (window.Cashfree) resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree"));
    document.body.appendChild(script);
  });
  const cf = window.Cashfree;
  if (!cf || typeof cf !== "function") throw new Error("Cashfree SDK unavailable");
  return cf({ mode });
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
  const [sbiCollectDetails, setSbiCollectDetails] = useState<{
    paymentLink?: string;
    instructions?: string;
  } | null>(null);
  const [loadingSbiCollect, setLoadingSbiCollect] = useState(false);
  const [sbiCollectReceiptFile, setSbiCollectReceiptFile] = useState<File | null>(null);
  const [neftBankDetails, setNeftBankDetails] = useState<{
    accountName?: string;
    accountNo?: string;
    ifsc?: string;
    upi?: string;
  } | null>(null);
  const [loadingNeftDetails, setLoadingNeftDetails] = useState(false);
  const [neftReceiptFile, setNeftReceiptFile] = useState<File | null>(null);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [partialPreview, setPartialPreview] = useState<PartialPreview | null>(null);
  const [partialPreviewLoading, setPartialPreviewLoading] = useState(false);
  const [partialAdvanceMethod, setPartialAdvanceMethod] = useState<PartialAdvanceMethod>("razorpay");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

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

  const shippingAddress = useMemo(() => {
    const addr = data?.address || {};
    return {
      address: String(addr.address || "").trim(),
      city: String(addr.city || "").trim(),
      state: String(addr.state || "").trim(),
      zipCode: String(addr.zipCode || "").trim(),
    };
  }, [data?.address]);

  const shippingLabel = useMemo(() => {
    if (data?.addressLabel) return String(data.addressLabel);
    return [shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.zipCode]
      .filter(Boolean)
      .join(", ");
  }, [data?.addressLabel, shippingAddress]);

  useEffect(() => {
    if (!offer) return;
    if (deliveryUnavailable) setTransport("self_pickup");
    else setTransport("supplier");
  }, [offer?.id, deliveryUnavailable]);

  useEffect(() => {
    if (
      paymentOption !== "sbicollect" &&
      !(paymentOption === "partial" && partialAdvanceMethod === "sbicollect")
    ) {
      return;
    }
    setLoadingSbiCollect(true);
    api.settings
      .getSbiCollectDetails()
      .then((res) => {
        if (res.success && (res as any).data) setSbiCollectDetails((res as any).data);
        else setSbiCollectDetails({ instructions: "Contact support for SBI Collect payment details." });
      })
      .catch(() =>
        setSbiCollectDetails({ instructions: "Contact support for SBI Collect payment details." })
      )
      .finally(() => setLoadingSbiCollect(false));
  }, [paymentOption, partialAdvanceMethod]);

  useEffect(() => {
    if (paymentOption !== "neft") return;
    setLoadingNeftDetails(true);
    api.settings
      .getNeftBankDetails()
      .then((res) => {
        if (res.success && (res as any).data) setNeftBankDetails((res as any).data);
        else setNeftBankDetails(null);
      })
      .catch(() => setNeftBankDetails(null))
      .finally(() => setLoadingNeftDetails(false));
  }, [paymentOption]);

  const handleSbiCollectOpenLink = () => {
    if (sbiCollectDetails?.paymentLink) {
      window.open(sbiCollectDetails.paymentLink, "_blank", "noopener,noreferrer");
      toast({
        title: "Opened SBI Collect",
        description: "Complete payment there, then come back and upload your receipt.",
      });
      return;
    }
    toast({
      title: "Link not available",
      description: "SBI Collect payment link is not configured. Contact support.",
      variant: "destructive",
    });
  };
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
  const partialMin = partialPreview?.minPartialAmount ?? 0;
  const partialAmount = partialPreview?.partialAmount ?? 0;
  const partialBalanceDue = partialPreview?.balanceDue ?? 0;
  const isOfflineCheckout =
    paymentOption === "cod" ||
    paymentOption === "neft" ||
    paymentOption === "sbicollect" ||
    paymentOption === "imagineering_credit" ||
    (paymentOption === "partial" && partialAdvanceMethod === "sbicollect");
  const checkoutCta =
    paymentOption === "sbicollect" && !sbiCollectReceiptFile
      ? `Pay via SBI Collect — ${formatINR(payableTotal)}`
      : paymentOption === "partial" && partialAdvanceMethod === "sbicollect" && !sbiCollectReceiptFile
        ? `Pay via SBI Collect — ${formatINR(partialAmount)}`
        : paymentOption === "partial"
          ? `Pay ${formatINR(partialAmount)} now`
          : isOfflineCheckout
            ? "Place order"
            : `Pay ${formatINR(payableTotal)}`;
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

  useEffect(() => {
    if (paymentOption !== "partial" || !id || !offerId) {
      setPartialPreview(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setPartialPreviewLoading(true);
      const requested = Number(partialAmountInput);
      void api.quoteRequests
        .previewPartialOffer(id, offerId, {
          transport,
          couponUsageId: couponUsageId || undefined,
          creditsToApply: creditsToApply > 0 ? creditsToApply : undefined,
          partialAmount:
            Number.isFinite(requested) && requested > 0 ? requested : undefined,
        })
        .then((res) => {
          if (cancelled) return;
          const row = (res as any)?.data as PartialPreview | undefined;
          if (!res.success || !row) {
            setPartialPreview(null);
            return;
          }
          setPartialPreview(row);
          const typed = Number(partialAmountInput);
          if (!Number.isFinite(typed) || Math.abs(typed - row.partialAmount) > 0.011) {
            setPartialAmountInput(String(row.partialAmount));
          }
          const methods = row.allowedAdvanceMethods || [];
          setPartialAdvanceMethod((prev) =>
            methods.includes(prev) ? prev : methods[0] || "razorpay"
          );
        })
        .catch(() => {
          if (!cancelled) setPartialPreview(null);
        })
        .finally(() => {
          if (!cancelled) setPartialPreviewLoading(false);
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    paymentOption,
    id,
    offerId,
    transport,
    couponUsageId,
    creditsToApply,
    partialAmountInput,
  ]);

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
    if (!billingSameAsShipping) {
      if (!billingAddress.address.trim() || !billingAddress.city.trim() || !billingAddress.state.trim()) {
        toast({
          title: "Billing address required",
          description: "Enter address, city, and state — or use same as shipping.",
          variant: "destructive",
        });
        return;
      }
    }

    if (paymentOption === "sbicollect" && !sbiCollectReceiptFile) {
      handleSbiCollectOpenLink();
      return;
    }
    if (paymentOption === "partial" && partialAdvanceMethod === "sbicollect" && !sbiCollectReceiptFile) {
      handleSbiCollectOpenLink();
      return;
    }
    if (paymentOption === "neft" && !neftReceiptFile) {
      toast({
        title: "Receipt required",
        description: "Transfer the amount using the bank details above, then upload your payment receipt.",
        variant: "destructive",
      });
      return;
    }
    if (paymentOption === "partial") {
      if (!partialPreview) {
        toast({
          title: "Calculating…",
          description: "Partial payment amount is still loading. Please wait a moment.",
          variant: "destructive",
        });
        return;
      }
      if (!(partialAmount >= partialMin - 0.001)) {
        toast({
          title: "Partial payment too low",
          description: `Pay at least ${partialPreview.minPercent}% now (${formatINR(partialMin)}).`,
          variant: "destructive",
        });
        return;
      }
      if (!partialPreview.allowedAdvanceMethods.includes(partialAdvanceMethod)) {
        toast({
          title: "Payment method unavailable",
          description: "Choose another way to pay the advance amount.",
          variant: "destructive",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      let receiptUrl: string | undefined;
      const receiptFile =
        paymentOption === "sbicollect" ||
        (paymentOption === "partial" && partialAdvanceMethod === "sbicollect")
          ? sbiCollectReceiptFile
          : paymentOption === "neft"
            ? neftReceiptFile
            : null;
      if (receiptFile) {
        const uploadRes = await api.bookings.uploadNeftReceipt(receiptFile);
        if (!uploadRes.success || !(uploadRes as any).data?.receiptUrl) {
          throw new Error((uploadRes as any).error?.message || "Failed to upload receipt");
        }
        receiptUrl = String((uploadRes as any).data.receiptUrl);
      }

      const res = await api.quoteRequests.payOffer(id, offerId, {
        gstNumber: gstNumber.trim() || undefined,
        transport,
        paymentOption,
        couponUsageId: couponUsageId || undefined,
        creditsToApply: creditsToApply > 0 ? creditsToApply : undefined,
        receiptUrl,
        ...(paymentOption === "partial"
          ? { partialAmount, partialPaymentMethod: partialAdvanceMethod }
          : {}),
        billingSameAsShipping,
        ...(billingSameAsShipping
          ? {}
          : {
              billingAddress: {
                address: billingAddress.address.trim(),
                city: billingAddress.city.trim(),
                state: billingAddress.state.trim(),
                ...(billingAddress.zipCode.trim()
                  ? { zipCode: billingAddress.zipCode.trim() }
                  : {}),
              },
            }),
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
        paymentOption === "imagineering_credit" ||
        (paymentOption === "partial" && partialAdvanceMethod === "sbicollect");

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
                : paymentOption === "partial"
                  ? "Advance receipt uploaded. Remaining balance is due on delivery."
                  : paymentOption === "sbicollect" || paymentOption === "neft"
                    ? "Admin will verify your receipt and confirm the payment."
                    : "Order placed. Complete payment as selected.",
        });
        router.push("/buyer/orders");
        return;
      }

      if (
        (paymentOption === "razorpay" ||
          (paymentOption === "partial" && partialAdvanceMethod === "razorpay")) &&
        payload?.orderId &&
        payload?.paymentId &&
        payload?.key
      ) {
        await loadRazorpayScript();
        if (!window.Razorpay) throw new Error("Payment window could not be opened");
        await new Promise<void>((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: payload.key,
            amount: payload.amount,
            currency: payload.currency || "INR",
            name: "Imagineering India",
            description:
              paymentOption === "partial"
                ? `Partial payment for ${serviceTitle}`
                : `Quote for ${serviceTitle}`,
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
        toast({
          title: paymentOption === "partial" ? "Partial payment successful" : "Payment successful",
          description:
            paymentOption === "partial"
              ? "Advance paid. Remaining balance is due on delivery."
              : "Your order is placed.",
        });
        router.push("/buyer/orders");
        return;
      }

      if (
        (paymentOption === "cashfree" ||
          (paymentOption === "partial" && partialAdvanceMethod === "cashfree")) &&
        payload?.orderId &&
        payload?.paymentId &&
        payload?.paymentSessionId
      ) {
        const cashfree = await loadCashfreeSdk();
        const result = await cashfree.checkout({
          paymentSessionId: payload.paymentSessionId,
          redirectTarget: "_modal",
        });
        if (result?.error) {
          throw new Error(result.error?.message || "Payment cancelled or failed");
        }
        const verifyRes = await api.payments.verifyCashfreeQuoteRequest({
          orderId: String(payload.orderId),
          paymentId: String(payload.paymentId),
        });
        if (!verifyRes.success) {
          throw new Error((verifyRes as any)?.error?.message || "Payment verification failed");
        }
        clearActiveQuoteRequest(id);
        toast({
          title: paymentOption === "partial" ? "Partial payment successful" : "Payment successful",
          description:
            paymentOption === "partial"
              ? "Advance paid. Remaining balance is due on delivery."
              : "Your order is placed.",
        });
        router.push("/buyer/orders");
        return;
      }

      if (!payload?.bookingId) {
        throw new Error((res as any)?.error?.message || "Failed to place order");
      }
      clearActiveQuoteRequest(id);
      setBookingId(String(payload.bookingId));
      setPayAmount(Number(payload.amountRupees || payload.amount || displayTotal));
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
          <span className="font-medium text-foreground">{serviceTitle}</span>
          {(offer?.providerName || offer?.provider?.businessName || offer?.provider?.name) ? (
            <>
              {" "}
              from{" "}
              <span className="font-medium text-foreground">
                {offer.providerName || offer.provider?.businessName || offer.provider?.name}
              </span>
            </>
          ) : null}
          .
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-4 lg:order-1">
          <CheckoutSection
            title="Addresses"
            description="Shipping is from your quote request. Billing can match it or be different for the invoice."
          >
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Shipping address
                </div>
                <p className="mt-1.5 text-sm font-medium text-foreground">
                  {shippingLabel || "No shipping address on this request"}
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="billing-same-as-shipping"
                  checked={billingSameAsShipping}
                  onCheckedChange={(v) => {
                    const checked = v === true;
                    setBillingSameAsShipping(checked);
                    if (checked) {
                      setBillingAddress({ address: "", city: "", state: "", zipCode: "" });
                    }
                  }}
                  disabled={Boolean(bookingId)}
                  className="mt-0.5"
                />
                <Label htmlFor="billing-same-as-shipping" className="text-sm font-medium leading-snug">
                  Billing address same as shipping address
                </Label>
              </div>

              {!billingSameAsShipping ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="billing-street">Billing street / area</Label>
                    <Input
                      id="billing-street"
                      value={billingAddress.address}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, address: e.target.value }))
                      }
                      placeholder="Building, street, landmark"
                      disabled={Boolean(bookingId)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="billing-city">City</Label>
                    <Input
                      id="billing-city"
                      value={billingAddress.city}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, city: e.target.value }))
                      }
                      placeholder="City"
                      disabled={Boolean(bookingId)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="billing-state">State</Label>
                    <Input
                      id="billing-state"
                      value={billingAddress.state}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder="State"
                      disabled={Boolean(bookingId)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="billing-zip">PIN code (optional)</Label>
                    <Input
                      id="billing-zip"
                      value={billingAddress.zipCode}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, zipCode: e.target.value }))
                      }
                      placeholder="PIN code"
                      disabled={Boolean(bookingId)}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </CheckoutSection>

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
                  if (v !== "neft") setNeftReceiptFile(null);
                  if (v !== "sbicollect" && !(v === "partial" && partialAdvanceMethod === "sbicollect")) {
                    // keep receipt when switching into partial+sbi later
                  }
                  if (v !== "sbicollect") setSbiCollectReceiptFile(null);
                  if (v === "partial") {
                    setPartialAmountInput("");
                    setPartialPreview(null);
                  }
                }}
                amount={paymentOption === "imagineering_credit" ? displayTotal : paymentAmount}
                showImagineeringCredit={canUseImagineeringCredit}
                showPartialPayment
                className={bookingId ? "pointer-events-none opacity-60" : undefined}
              />
              <ImagineeringCreditCheckoutPanel
                orderTotal={displayTotal}
                selected={paymentOption === "imagineering_credit"}
              />
              {paymentOption === "partial" && !bookingId ? (
                <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                  <Label className="text-sm font-semibold">
                    Pay now (min {partialPreview?.minPercent ?? 5}%)
                  </Label>
                  {partialPreviewLoading && !partialPreview ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Calculating…</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Pay at least {formatINR(partialMin)} online to place the order. Remaining{" "}
                      {formatINR(partialBalanceDue)} is due on delivery.
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={partialMin || undefined}
                      max={partialPreview?.orderTotal || undefined}
                      step="1"
                      value={partialAmountInput}
                      onChange={(e) => setPartialAmountInput(e.target.value)}
                      disabled={Boolean(bookingId)}
                    />
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Pay now</span>
                      <span className="tabular-nums font-medium">{formatINR(partialAmount)}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Balance on delivery</span>
                      <span className="tabular-nums">{formatINR(partialBalanceDue)}</span>
                    </div>
                  </div>
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-medium">Pay advance with</Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(partialPreview?.allowedAdvanceMethods || ["razorpay", "cashfree", "sbicollect"]).map(
                        (method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              setPartialAdvanceMethod(method);
                              if (method !== "sbicollect") setSbiCollectReceiptFile(null);
                            }}
                            className={`rounded-lg border px-3 py-2 text-left text-sm ${
                              partialAdvanceMethod === method
                                ? "border-primary bg-primary/5 font-medium"
                                : "border-border"
                            }`}
                          >
                            {method === "razorpay"
                              ? "Razorpay"
                              : method === "cashfree"
                                ? "Cashfree"
                                : "SBI Collect"}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {partialAdvanceMethod === "sbicollect" ? (
                    <div className="space-y-3 border-t pt-3">
                      <p className="text-xs text-muted-foreground">
                        Open SBI Collect, pay {formatINR(partialAmount)}, then upload your receipt.
                      </p>
                      {loadingSbiCollect ? (
                        <p className="text-sm text-muted-foreground animate-pulse">
                          Loading SBI Collect details…
                        </p>
                      ) : sbiCollectDetails?.paymentLink ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full"
                          onClick={handleSbiCollectOpenLink}
                        >
                          Open SBI Collect — {formatINR(partialAmount)}
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {sbiCollectDetails?.instructions ||
                            "Contact support for SBI Collect payment details."}
                        </p>
                      )}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Upload payment receipt *</Label>
                        <label
                          htmlFor="quote-partial-sbicollect-receipt"
                          className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-muted/50"
                        >
                          <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">
                            {sbiCollectReceiptFile
                              ? sbiCollectReceiptFile.name
                              : "Choose file (image or PDF)"}
                          </span>
                        </label>
                        <input
                          id="quote-partial-sbicollect-receipt"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => setSbiCollectReceiptFile(e.target.files?.[0] || null)}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {paymentOption === "sbicollect" && !bookingId ? (
                <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </span>
                    <Label className="text-sm font-semibold">SBI Collect</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Step 1: Open SBI Collect and pay. Step 2: Upload your receipt. Step 3: Place order.
                  </p>
                  {loadingSbiCollect ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading SBI Collect details…</p>
                  ) : sbiCollectDetails ? (
                    <div className="space-y-3 text-sm">
                      {sbiCollectDetails.paymentLink ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 w-full"
                          onClick={handleSbiCollectOpenLink}
                        >
                          Open SBI Collect — {formatINR(payableTotal)}
                        </Button>
                      ) : null}
                      {sbiCollectDetails.instructions ? (
                        <p className="whitespace-pre-wrap rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                          {sbiCollectDetails.instructions}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Contact support for SBI Collect payment details.</p>
                  )}
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-medium">Upload payment receipt *</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label
                        htmlFor="quote-sbicollect-receipt"
                        className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-muted/50"
                      >
                        <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {sbiCollectReceiptFile ? sbiCollectReceiptFile.name : "Choose file (image or PDF)"}
                        </span>
                      </label>
                      <input
                        id="quote-sbicollect-receipt"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setSbiCollectReceiptFile(e.target.files?.[0] || null)}
                      />
                      {sbiCollectReceiptFile ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSbiCollectReceiptFile(null)}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We’ll verify your receipt before confirming the order.
                    </p>
                  </div>
                </div>
              ) : null}
              {paymentOption === "neft" && !bookingId ? (
                <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </span>
                    <Label className="text-sm font-semibold">NEFT / IMPS transfer</Label>
                  </div>
                  {loadingNeftDetails ? (
                    <p className="text-sm text-muted-foreground animate-pulse">Loading bank details…</p>
                  ) : neftBankDetails ? (
                    <div className="space-y-2 rounded-lg border bg-background p-3 text-sm">
                      <p>
                        <span className="text-muted-foreground">Account name</span>
                        <br />
                        <span className="font-medium">{neftBankDetails.accountName || "—"}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Account no.</span>
                        <br />
                        <span className="font-mono text-sm font-medium">{neftBankDetails.accountNo || "—"}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">IFSC</span>
                        <br />
                        <span className="font-mono text-sm font-medium">{neftBankDetails.ifsc || "—"}</span>
                      </p>
                      {neftBankDetails.upi ? (
                        <p>
                          <span className="text-muted-foreground">UPI</span>
                          <br />
                          <span className="font-medium">{neftBankDetails.upi}</span>
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Transfer {formatINR(payableTotal)} and upload your receipt below.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Contact support for NEFT bank details.</p>
                  )}
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-xs font-medium">Upload payment receipt *</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label
                        htmlFor="quote-neft-receipt"
                        className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm hover:bg-muted/50"
                      >
                        <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">
                          {neftReceiptFile ? neftReceiptFile.name : "Choose file (image or PDF)"}
                        </span>
                      </label>
                      <input
                        id="quote-neft-receipt"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => setNeftReceiptFile(e.target.files?.[0] || null)}
                      />
                      {neftReceiptFile ? (
                        <Button type="button" variant="ghost" size="sm" onClick={() => setNeftReceiptFile(null)}>
                          Remove
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
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
