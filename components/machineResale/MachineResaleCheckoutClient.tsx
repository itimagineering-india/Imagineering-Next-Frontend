"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  ChevronRight,
  Loader2,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api-client";
import { IMAGINEERING_CREDIT } from "@/lib/imagineering-product-labels";
import {
  formatSavedAddressLine,
  loadSavedAddresses,
  type SavedAddress,
} from "@/lib/savedAddresses";
import {
  buildAddressGeocodeQuery,
  geocodeAddressToCoordinates,
} from "@/lib/geocodeAddress";
import { CheckoutAddressPickerModal } from "@/components/cart/CheckoutAddressPickerModal";
import { CartOffersModal } from "@/components/cart/CartOffersModal";
import {
  PaymentOptionsSelector,
  type PaymentOption,
} from "@/components/payments/PaymentOptionsSelector";
import { SbiCollectPaymentPanel } from "@/components/payments/SbiCollectPaymentPanel";
import { useSbiCollectPayment } from "@/components/payments/useSbiCollectPayment";
import { PartialPaymentPanel } from "@/components/payments/PartialPaymentPanel";
import {
  computePartialBreakdown,
  type PartialAdvanceMethod,
} from "@/lib/partialPayment";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { CashfreeCheckout } from "@/components/payments/CashfreeCheckout";
import {
  ImagineeringCreditCheckoutPanel,
  useImagineeringCreditAvailable,
} from "@/components/imagineering-credit/ImagineeringCreditCheckoutPanel";
import { CreditsRedeemSection } from "@/components/wallet/CreditsRedeemSection";
import { RESALE_TEAL } from "@/lib/machineResale/machineResaleHubCatalog";

type Preview = {
  subtotal: number;
  platformFee: number;
  platformFeeGst: number;
  gst: number;
  total: number;
  productName?: string;
  unitPrice?: number;
  listedPrice?: number;
  priceType?: string;
};

type AppliedCoupon = {
  code: string;
  usageId: string;
  discountAmount: number;
  finalAmount: number;
  description?: string;
};

export function MachineResaleCheckoutClient() {
  const { t } = useTranslation("machineResale");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const sp = searchParams ?? new URLSearchParams();
  const serviceId = String(sp.get("serviceId") || "").trim();
  const listingName = String(sp.get("name") || "").trim() || t("title");
  const offerId = String(sp.get("offerId") || "").trim();

  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption | null>(null);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);
  const [pendingPayBookingId, setPendingPayBookingId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [offersOpen, setOffersOpen] = useState(false);
  const [creditsToApply, setCreditsToApply] = useState(0);
  const [creditsDiscount, setCreditsDiscount] = useState(0);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [partialAdvanceMethod, setPartialAdvanceMethod] =
    useState<PartialAdvanceMethod>("razorpay");
  const [pendingPartialCharge, setPendingPartialCharge] = useState<number | null>(null);
  const appliedCouponRef = useRef<AppliedCoupon | null>(null);
  appliedCouponRef.current = appliedCoupon;

  const sbiEnabled =
    paymentMethod === "sbicollect" ||
    (paymentMethod === "partial" && partialAdvanceMethod === "sbicollect");
  const sbi = useSbiCollectPayment({ enabled: sbiEnabled });
  const previewErrorToastAt = useRef(0);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      const qs = searchParams?.toString() || "";
      router.replace(
        `/login?redirect=${encodeURIComponent(`/machine-resale/checkout?${qs}`)}`
      );
    }
  }, [authLoading, isAuthenticated, router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    loadSavedAddresses().then((saved) => {
      if (cancelled) return;
      setSavedAddresses(saved);
      setSelectedAddress((current) => {
        if (current) return saved.find((a) => a.id === current.id) || current;
        return saved.find((a) => a.isDefault) || saved[0] || null;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!serviceId || !isAuthenticated) return;
    let cancelled = false;
    setLoadingPreview(true);
    api.bookings
      .previewMachineResale({ serviceId, ...(offerId ? { offerId } : {}) })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const d = res.data as Preview;
          setPreview({
            subtotal: Number(d.subtotal) || 0,
            platformFee: Number(d.platformFee) || 0,
            platformFeeGst: Number(d.platformFeeGst) || 0,
            gst: Number(d.gst) || 0,
            total: Number(d.total) || 0,
            productName: d.productName,
            unitPrice: Number(d.unitPrice) || 0,
            listedPrice: Number(d.listedPrice) || undefined,
            priceType: d.priceType,
          });
        } else {
          setPreview(null);
          const msg = String(res.error?.message || "");
          if (msg) {
            const now = Date.now();
            if (now - previewErrorToastAt.current > 2500) {
              previewErrorToastAt.current = now;
              toast({
                title: msg,
                variant: "destructive",
              });
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, offerId, isAuthenticated, toast]);

  const skipCouponResetOnMount = useRef(true);
  useEffect(() => {
    if (skipCouponResetOnMount.current) {
      skipCouponResetOnMount.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      const current = appliedCouponRef.current;
      if (!current) return;
      try {
        await api.coupons.cancelUsage(current.usageId);
      } catch {
        /* ignore */
      }
      if (!cancelled) {
        setAppliedCoupon(null);
        setCouponError(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

  const payableTotal = useMemo(() => {
    if (appliedCoupon && Number.isFinite(appliedCoupon.finalAmount)) {
      return Math.max(0, Number(appliedCoupon.finalAmount));
    }
    return Math.max(0, Number(preview?.total || 0));
  }, [appliedCoupon, preview?.total]);

  const paymentAmount = Math.max(0, payableTotal - creditsDiscount);
  const partialBreakdown = useMemo(
    () => computePartialBreakdown(paymentAmount, partialAmountInput),
    [paymentAmount, partialAmountInput]
  );
  const partialAmount = partialBreakdown.partialAmount;

  useEffect(() => {
    if (paymentMethod !== "partial") return;
    if (!partialAmountInput.trim()) {
      setPartialAmountInput(String(computePartialBreakdown(paymentAmount).partialAmount));
    }
  }, [paymentMethod, paymentAmount, partialAmountInput]);

  const handleCreditsChange = useCallback((credits: number, discount: number) => {
    setCreditsToApply(credits);
    setCreditsDiscount(discount);
  }, []);

  const { canUse: canUseImagineeringCredit } = useImagineeringCreditAvailable(payableTotal);

  const addressLine = useMemo(
    () => (selectedAddress ? formatSavedAddressLine(selectedAddress) : ""),
    [selectedAddress]
  );

  const serviceTitle = preview?.productName || listingName;

  const clearCouponQuietly = useCallback(async () => {
    if (!appliedCoupon) return;
    try {
      await api.coupons.cancelUsage(appliedCoupon.usageId);
    } catch {
      /* ignore */
    }
    setAppliedCoupon(null);
  }, [appliedCoupon]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError(t("checkoutCouponEmpty"));
      return;
    }
    const amount = Number(preview?.total || 0);
    if (!amount || amount <= 0) {
      setCouponError(t("checkoutCouponNoAmount"));
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      if (appliedCoupon) {
        try {
          await api.coupons.cancelUsage(appliedCoupon.usageId);
        } catch {
          /* ignore */
        }
      }
      const res = await api.coupons.validate({ code, amount, type: "booking" });
      if (!res.success || !res.data?.usageId) {
        throw new Error(res.error?.message || t("checkoutCouponFailed"));
      }
      const data = res.data;
      setAppliedCoupon({
        code: String(data.coupon?.code || code).toUpperCase(),
        usageId: data.usageId,
        discountAmount: Number(data.discountAmount) || 0,
        finalAmount: Number(data.finalAmount ?? amount),
        description: data.coupon?.description,
      });
      setCouponCode(String(data.coupon?.code || code).toUpperCase());
      toast({
        title: t("checkoutCouponAppliedTitle"),
        description: t("checkoutCouponAppliedBody", {
          amount: `₹${(Number(data.discountAmount) || 0).toLocaleString("en-IN")}`,
        }),
      });
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : t("checkoutCouponFailed"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    setCouponError(null);
    try {
      await clearCouponQuietly();
      setCouponCode("");
    } finally {
      setCouponLoading(false);
    }
  };

  const goSuccess = useCallback(
    (bookingId: string) => {
      router.replace(`/buyer/orders?bookingId=${encodeURIComponent(bookingId)}`);
    },
    [router]
  );

  const createBooking = useCallback(async (receiptUrl?: string) => {
    if (!selectedAddress) {
      toast({ title: t("checkoutAddressRequired"), variant: "destructive" });
      return null;
    }
    if (!paymentMethod) {
      toast({ title: t("checkoutPaymentRequired"), variant: "destructive" });
      return null;
    }
    if (!serviceId) {
      toast({
        title: t("listingNotFound"),
        description: t("checkoutMissingListing"),
        variant: "destructive",
      });
      return null;
    }

    let coordinates = selectedAddress.coordinates;
    const lat = Number(coordinates?.lat);
    const lng = Number(coordinates?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const query = buildAddressGeocodeQuery({
        address: formatSavedAddressLine(selectedAddress),
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
      });
      coordinates = (await geocodeAddressToCoordinates(query)) || undefined;
    }

    const res = await api.bookings.createMachineResale({
      serviceId,
      ...(offerId ? { offerId } : {}),
      paymentMethod,
      receiptUrl: receiptUrl || undefined,
      couponUsageId: appliedCoupon?.usageId,
      creditsToApply: creditsToApply > 0 ? creditsToApply : undefined,
      notes: notes.trim() || undefined,
      ...(paymentMethod === "partial"
        ? {
            partialAmount,
            partialPaymentMethod: partialAdvanceMethod,
          }
        : {}),
      location: {
        address: formatSavedAddressLine(selectedAddress),
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        coordinates,
      },
    });
    if (!res.success || !(res.data as { bookingId?: string })?.bookingId) {
      throw new Error(res.error?.message || t("checkoutError"));
    }
    return res.data as {
      bookingId: string;
      requiresPayment?: boolean;
      total?: number;
      partialAmount?: number;
    };
  }, [
    appliedCoupon?.usageId,
    creditsToApply,
    notes,
    partialAdvanceMethod,
    partialAmount,
    paymentMethod,
    selectedAddress,
    serviceId,
    offerId,
    t,
    toast,
  ]);

  const onConfirm = async () => {
    if (
      (paymentMethod === "sbicollect" ||
        (paymentMethod === "partial" && partialAdvanceMethod === "sbicollect")) &&
      !sbi.hasReceipt
    ) {
      sbi.openLink();
      return;
    }
    if (paymentMethod === "partial") {
      if (!(partialAmount >= partialBreakdown.minPartialAmount - 0.001)) {
        toast({
          title: "Invalid advance amount",
          description: `Pay at least ₹${partialBreakdown.minPartialAmount.toLocaleString("en-IN")} (5% of order total).`,
          variant: "destructive",
        });
        return;
      }
    }
    setSubmitting(true);
    try {
      let receiptUrl: string | undefined;
      if (
        paymentMethod === "sbicollect" ||
        (paymentMethod === "partial" && partialAdvanceMethod === "sbicollect")
      ) {
        receiptUrl = await sbi.uploadReceipt();
      }
      const created = await createBooking(receiptUrl);
      if (!created) return;
      const onlineAdvance =
        paymentMethod === "razorpay" ||
        paymentMethod === "cashfree" ||
        (paymentMethod === "partial" &&
          (partialAdvanceMethod === "razorpay" || partialAdvanceMethod === "cashfree"));
      if (created.requiresPayment && onlineAdvance) {
        setPendingPartialCharge(
          paymentMethod === "partial"
            ? Number(created.partialAmount ?? partialAmount)
            : null
        );
        setPendingPayBookingId(created.bookingId);
        return;
      }
      if (paymentMethod === "sbicollect" || (paymentMethod === "partial" && partialAdvanceMethod === "sbicollect")) {
        sbi.clearReceipt();
        toast({
          title: "Order placed",
          description:
            paymentMethod === "partial"
              ? "Advance receipt uploaded. Remaining balance is due on delivery."
              : "Admin will verify your receipt and confirm the payment.",
        });
      } else {
        toast({
          title:
            paymentMethod === "imagineering_credit"
              ? "Payment successful"
              : t("checkoutSuccessTitle"),
          description:
            paymentMethod === "imagineering_credit"
              ? `Paid using ${IMAGINEERING_CREDIT.name} · ₹${payableTotal.toLocaleString("en-IN")}`
              : t("checkoutSuccessBody"),
        });
      }
      goSuccess(created.bookingId);
    } catch (err) {
      toast({
        title: t("checkoutError"),
        description: err instanceof Error ? err.message : t("checkoutError"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        {t("checkoutLoginRequired")}
      </div>
    );
  }

  const total = paymentAmount;
  const chargeNow =
    pendingPartialCharge != null && pendingPartialCharge > 0
      ? pendingPartialCharge
      : total;
  const showOnlinePay =
    pendingPayBookingId &&
    (paymentMethod === "razorpay" ||
      paymentMethod === "cashfree" ||
      (paymentMethod === "partial" &&
        (partialAdvanceMethod === "razorpay" || partialAdvanceMethod === "cashfree")));

  const confirmLabel =
    paymentMethod === "cod"
      ? t("checkoutConfirmCod")
      : paymentMethod === "sbicollect" ||
          (paymentMethod === "partial" && partialAdvanceMethod === "sbicollect")
        ? sbi.hasReceipt
          ? paymentMethod === "partial"
            ? "Place order (partial · SBI Collect)"
            : "Place order (SBI Collect)"
          : paymentMethod === "partial"
            ? `Pay via SBI Collect · ₹${partialAmount.toLocaleString("en-IN")}`
            : "Pay via SBI Collect"
        : paymentMethod === "imagineering_credit"
          ? `Confirm · ${IMAGINEERING_CREDIT.name}`
          : paymentMethod === "partial"
            ? `Pay ₹${partialAmount.toLocaleString("en-IN")} now`
            : t("checkoutPay");

  const renderPayButton = () => {
    const onlineMethod =
      paymentMethod === "partial" ? partialAdvanceMethod : paymentMethod;
    if (showOnlinePay && onlineMethod === "razorpay" && pendingPayBookingId) {
      return (
        <RazorpayCheckout
          bookingId={pendingPayBookingId}
          amount={chargeNow}
          couponUsageId={appliedCoupon?.usageId}
          creditsToApply={
            paymentMethod === "partial"
              ? undefined
              : creditsToApply > 0
                ? creditsToApply
                : undefined
          }
          bookingDescription={`Machine resale · ${serviceTitle}`}
          bookingPayload={
            paymentMethod === "partial"
              ? {
                  paymentMethod: "partial",
                  partialAmount: chargeNow,
                  partialPaymentMethod: "razorpay",
                }
              : undefined
          }
          className="h-11 w-full rounded-xl font-semibold"
          onSuccess={() => goSuccess(pendingPayBookingId)}
          onError={(msg) =>
            toast({ title: t("checkoutError"), description: msg, variant: "destructive" })
          }
        >
          {paymentMethod === "partial"
            ? `Pay ₹${chargeNow.toLocaleString("en-IN")} now`
            : t("checkoutPay")}
        </RazorpayCheckout>
      );
    }
    if (showOnlinePay && onlineMethod === "cashfree" && pendingPayBookingId) {
      return (
        <CashfreeCheckout
          bookingId={pendingPayBookingId}
          amount={chargeNow}
          couponUsageId={appliedCoupon?.usageId}
          creditsToApply={
            paymentMethod === "partial"
              ? undefined
              : creditsToApply > 0
                ? creditsToApply
                : undefined
          }
          bookingDescription={`Machine resale · ${serviceTitle}`}
          bookingPayload={
            paymentMethod === "partial"
              ? {
                  paymentMethod: "partial",
                  partialAmount: chargeNow,
                  partialPaymentMethod: "cashfree",
                }
              : undefined
          }
          className="h-11 w-full rounded-xl font-semibold"
          onSuccess={() => goSuccess(pendingPayBookingId)}
          onError={(msg) =>
            toast({ title: t("checkoutError"), description: msg, variant: "destructive" })
          }
        >
          {paymentMethod === "partial"
            ? `Pay ₹${chargeNow.toLocaleString("en-IN")} now`
            : t("checkoutPay")}
        </CashfreeCheckout>
      );
    }
    return (
      <Button
        type="button"
        disabled={
          submitting ||
          !serviceId ||
          !paymentMethod ||
          (paymentMethod === "imagineering_credit" && !canUseImagineeringCredit)
        }
        className="h-11 w-full rounded-xl font-semibold text-white"
        style={{ backgroundColor: RESALE_TEAL }}
        onClick={() => void onConfirm()}
      >
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : !paymentMethod ? (
          t("checkoutSelectPayment")
        ) : (
          confirmLabel
        )}
      </Button>
    );
  };

  const renderSummary = (opts?: { showPay?: boolean }) => (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {t("checkoutSummary")}
      </p>
      <div className="mt-3 border-b border-slate-100 pb-4">
        <p className="text-base font-bold leading-snug text-slate-900">{serviceTitle}</p>
        {preview?.unitPrice ? (
          <div className="mt-2">
            <Badge className="bg-teal-50 text-teal-900 hover:bg-teal-50">
              {offerId && preview.listedPrice && preview.listedPrice > Number(preview.unitPrice || 0)
                ? t("checkoutAgreedPrice")
                : t("sellingPrice")}{" "}
              · ₹{Number(preview.unitPrice).toLocaleString("en-IN")}
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        {loadingPreview ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("checkoutLoadingPreview")}
          </div>
        ) : preview ? (
          <>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{t("checkoutSubtotal")}</span>
              <span className="font-medium text-slate-800">
                ₹{preview.subtotal.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-500">{t("checkoutPlatformFee")}</span>
              <span className="font-medium text-slate-800">
                ₹{preview.platformFee.toLocaleString("en-IN")}
              </span>
            </div>
            {(preview.gst > 0 || preview.platformFeeGst > 0) && (
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">{t("checkoutGst")}</span>
                <span className="font-medium text-slate-800">
                  ₹{(preview.gst || preview.platformFeeGst).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {appliedCoupon && appliedCoupon.discountAmount > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-emerald-700">
                  {t("checkoutCouponLine", { code: appliedCoupon.code })}
                </span>
                <span className="font-medium text-emerald-700">
                  -₹{appliedCoupon.discountAmount.toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}
            {creditsDiscount > 0 ? (
              <div className="flex justify-between gap-3">
                <span className="text-emerald-700">Wallet points</span>
                <span className="font-medium text-emerald-700">
                  -₹{creditsDiscount.toLocaleString("en-IN")}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-base font-bold">
              <span className="text-slate-900">{t("checkoutTotal")}</span>
              <span style={{ color: RESALE_TEAL }}>
                ₹{paymentAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </>
        ) : (
          <p className="text-slate-500">{t("checkoutPreviewUnavailable")}</p>
        )}
      </div>

      {opts?.showPay ? <div className="mt-5">{renderPayButton()}</div> : null}

      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm text-slate-600">
        <li className="flex gap-2">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          {t("trustVerified")}
        </li>
        <li className="flex gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
          {t("trustPay")}
        </li>
      </ul>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F0FDFA] pb-24 xl:pb-0">
      <div className="layout-shell overflow-x-clip py-6 sm:py-8 md:py-10">
        <nav className="mb-6 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm text-muted-foreground">
          <Link href="/machine-resale" className="hover:text-foreground">
            {t("title")}
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          {serviceId ? (
            <>
              <Link
                href={`/machine-resale/listing/${serviceId}`}
                className="max-w-[12rem] truncate hover:text-foreground"
              >
                {serviceTitle}
              </Link>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </>
          ) : null}
          <span className="font-medium text-foreground">{t("checkoutBreadcrumb")}</span>
        </nav>

        <div className="mb-8 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground xl:text-3xl">
            {t("checkoutTitle")}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold text-foreground">{t("checkoutDetails")}</h2>
              <div className="mt-4 rounded-xl border border-slate-100 bg-teal-50/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("checkoutService")}
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">{serviceTitle}</p>
                {preview?.unitPrice ? (
                  <p className="mt-1 text-sm font-medium text-teal-800">
                    ₹{Number(preview.unitPrice).toLocaleString("en-IN")}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-foreground">{t("checkoutAddress")}</h2>
                <button
                  type="button"
                  className="text-sm font-semibold text-teal-800 hover:underline"
                  onClick={() => setAddressPickerOpen(true)}
                >
                  {selectedAddress ? t("checkoutChangeAddress") : t("checkoutPickAddress")}
                </button>
              </div>

              {selectedAddress ? (
                <button
                  type="button"
                  onClick={() => setAddressPickerOpen(true)}
                  className="mt-4 flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-teal-600/30 hover:bg-teal-50/30"
                >
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                  <div className="min-w-0 flex-1">
                    {selectedAddress.label ? (
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedAddress.label}
                      </p>
                    ) : null}
                    <p className="text-sm leading-relaxed text-slate-700">{addressLine}</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddressPickerOpen(true)}
                  className="mt-4 w-full rounded-xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-500 transition hover:border-teal-600/40"
                >
                  {t("checkoutAddressRequired")}
                </button>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <Label htmlFor="resale-notes" className="text-lg font-bold text-foreground">
                {t("checkoutNotes")}
              </Label>
              <Textarea
                id="resale-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={t("checkoutNotesPlaceholder")}
                className="mt-4 rounded-xl border-slate-200 bg-white"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Tag className="h-5 w-5 text-teal-700" />
                  {t("checkoutOffersTitle")}
                </h2>
                <button
                  type="button"
                  className="text-sm font-semibold text-teal-800 hover:underline"
                  onClick={() => setOffersOpen(true)}
                >
                  {t("checkoutViewOffers")}
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    setCouponError(null);
                  }}
                  placeholder={t("checkoutCouponPlaceholder")}
                  className="h-11 rounded-xl"
                  disabled={couponLoading || !!appliedCoupon}
                  autoCapitalize="characters"
                />
                {appliedCoupon ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 shrink-0 rounded-xl"
                    disabled={couponLoading}
                    onClick={() => void handleRemoveCoupon()}
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("checkoutCouponRemove")
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="h-11 shrink-0 rounded-xl text-white"
                    style={{ backgroundColor: RESALE_TEAL }}
                    disabled={couponLoading || !preview?.total}
                    onClick={() => void handleApplyCoupon()}
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      t("checkoutCouponApply")
                    )}
                  </Button>
                )}
              </div>
              {couponError ? (
                <p className="mt-2 text-sm text-red-600">{couponError}</p>
              ) : null}
            </section>

            {preview && preview.total > 0 && paymentMethod !== "imagineering_credit" ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <CreditsRedeemSection
                  orderTotal={payableTotal}
                  onCreditsChange={handleCreditsChange}
                />
              </div>
            ) : null}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="mb-4 text-lg font-bold text-foreground">{t("checkoutPayment")}</h2>
              <PaymentOptionsSelector
                value={paymentMethod}
                onChange={(v) => {
                  setPaymentMethod(v);
                  if (v === "imagineering_credit") {
                    setCreditsToApply(0);
                    setCreditsDiscount(0);
                  }
                  if (v !== "sbicollect" && !(v === "partial" && partialAdvanceMethod === "sbicollect")) {
                    sbi.clearReceipt();
                  }
                  if (v === "partial") {
                    setPartialAmountInput(
                      String(computePartialBreakdown(paymentAmount).partialAmount)
                    );
                  }
                }}
                amount={paymentMethod === "imagineering_credit" ? payableTotal : paymentAmount}
                showImagineeringCredit={canUseImagineeringCredit}
                showPartialPayment
              />
              {paymentMethod === "partial" ? (
                <div className="mt-4">
                  <PartialPaymentPanel
                    orderTotal={paymentAmount}
                    amountInput={partialAmountInput}
                    onAmountInputChange={setPartialAmountInput}
                    advanceMethod={partialAdvanceMethod}
                    onAdvanceMethodChange={(m) => {
                      setPartialAdvanceMethod(m);
                      if (m !== "sbicollect") sbi.clearReceipt();
                    }}
                  >
                    {partialAdvanceMethod === "sbicollect" ? (
                      <div className="mt-3 space-y-3 border-t pt-3">
                        <SbiCollectPaymentPanel
                          amount={partialAmount}
                          details={sbi.details}
                          loading={sbi.loading}
                          receiptFile={sbi.receiptFile}
                          onReceiptFileChange={sbi.setReceiptFile}
                          onOpenLink={() => sbi.openLink()}
                          inputId="resale-partial-sbicollect-receipt-upload"
                        />
                      </div>
                    ) : null}
                  </PartialPaymentPanel>
                </div>
              ) : null}
              {paymentMethod === "sbicollect" ? (
                <div className="mt-4">
                  <SbiCollectPaymentPanel
                    amount={paymentAmount}
                    details={sbi.details}
                    loading={sbi.loading}
                    receiptFile={sbi.receiptFile}
                    onReceiptFileChange={sbi.setReceiptFile}
                    onOpenLink={() => sbi.openLink()}
                    inputId="resale-sbicollect-receipt-upload"
                  />
                </div>
              ) : null}
              <ImagineeringCreditCheckoutPanel
                orderTotal={payableTotal}
                selected={paymentMethod === "imagineering_credit"}
              />
            </section>

            <div className="xl:hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {renderSummary()}
            </div>
          </div>

          <aside className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              {renderSummary({ showPay: true })}
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-500">{t("checkoutTotal")}</p>
            <p className="truncate text-lg font-bold text-slate-900">
              {preview ? `₹${paymentAmount.toLocaleString("en-IN")}` : "—"}
            </p>
          </div>
          <div className="w-[min(100%,220px)] shrink-0">{renderPayButton()}</div>
        </div>
      </div>

      <CheckoutAddressPickerModal
        open={addressPickerOpen}
        onOpenChange={setAddressPickerOpen}
        addresses={savedAddresses}
        selectedId={selectedAddress?.id ?? null}
        onSelect={(addr) => {
          setSelectedAddress(addr);
          setAddressPickerOpen(false);
        }}
        onAddressesChange={setSavedAddresses}
      />

      <CartOffersModal
        open={offersOpen}
        onOpenChange={setOffersOpen}
        onSelectCode={(code) => {
          setCouponCode(code);
          setCouponError(null);
        }}
      />
    </div>
  );
}
