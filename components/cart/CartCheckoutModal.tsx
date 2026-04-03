"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { CashfreeCheckout } from "@/components/payments/CashfreeCheckout";
import { PaymentOptionsSelector, type PaymentOption, PAYMENT_AMOUNT_LIMIT } from "@/components/payments/PaymentOptionsSelector";
import api from "@/lib/api-client";
import {
  MapPin,
  Loader2,
  Upload,
  Building2,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  StickyNote,
  Receipt,
  ClipboardList,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useGoogleGeocoder } from "@/hooks/useGoogleGeocoder";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatLocalYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(base: Date, days: number) {
  const n = new Date(base);
  n.setDate(n.getDate() + days);
  return n;
}

function formatBookingDateDisplay(ymd: string) {
  const t = ymd.trim();
  if (!t) return "—";
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return t;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const TIME_SLOT_CHIPS: { id: string; label: string; value: string }[] = [
  { id: "morning", label: "Morning", value: "09:00" },
  { id: "afternoon", label: "Afternoon", value: "14:00" },
  { id: "evening", label: "Evening", value: "18:00" },
];

const inputFocusClass =
  "rounded-xl border-slate-200 transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-0 dark:border-slate-700";

const DETAILS_STEP_LABELS = ["Date & time", "Location", "Notes & invoice"] as const;
type DetailsStep = 1 | 2 | 3;

function BookingSectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-slate-200/90 bg-[#f9fafb] p-4 shadow-sm dark:border-slate-800 dark:bg-muted/40 sm:p-5",
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </span>
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </div>
  );
}

type CheckoutStep = "details" | "payment";

type CartCheckoutModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cartId: string;
  amount: number;
  couponUsageId?: string | null;
  onSuccess: () => void;
};

export const CartCheckoutModal = ({ open, onOpenChange, cartId, amount, couponUsageId, onSuccess }: CartCheckoutModalProps) => {
  const [step, setStep] = useState<CheckoutStep>("details");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zip, setZip] = useState("");
  const [notes, setNotes] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("razorpay");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [neftReceiptFile, setNeftReceiptFile] = useState<File | null>(null);
  const [neftBankDetails, setNeftBankDetails] = useState<{ accountName: string; accountNo: string; ifsc: string; upi: string } | null>(null);
  const [loadingNeftDetails, setLoadingNeftDetails] = useState(false);
  const [sbiCollectDetails, setSbiCollectDetails] = useState<{ paymentLink?: string; instructions?: string } | null>(null);
  const [loadingSbiCollect, setLoadingSbiCollect] = useState(false);
  const [sbiCollectReceiptFile, setSbiCollectReceiptFile] = useState<File | null>(null);
  const [addressExtrasOpen, setAddressExtrasOpen] = useState(false);
  const [detailsStep, setDetailsStep] = useState<DetailsStep>(1);
  const { toast } = useToast();
  const { user } = useAuth();

  const buyerGST = useMemo(() => {
    const v = user?.gstNumber;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t || undefined;
  }, [user?.gstNumber]);

  const buyerPAN = useMemo(() => {
    const v = user?.panNumber;
    if (typeof v !== "string") return undefined;
    const t = v.trim();
    return t || undefined;
  }, [user?.panNumber]);

  // Reset step and progressive-disclosure UI when modal opens
  useEffect(() => {
    if (open) {
      setStep("details");
      setDetailsStep(1);
      setAddressExtrasOpen(false);
    }
  }, [open]);

  // When amount exceeds limit, switch to sbicollect if currently on limited methods
  useEffect(() => {
    if (amount > PAYMENT_AMOUNT_LIMIT && ["razorpay", "cashfree", "cod"].includes(paymentMethod)) {
      setPaymentMethod("sbicollect");
      setNeftReceiptFile(null);
      setSbiCollectReceiptFile(null);
    }
  }, [amount, paymentMethod]);

  // Fetch NEFT bank details from backend when NEFT is selected (security: not in frontend)
  useEffect(() => {
    if (paymentMethod !== "neft") return;
    setLoadingNeftDetails(true);
    api.settings.getNeftBankDetails().then((res) => {
      if (res.success && res.data) {
        setNeftBankDetails(res.data as { accountName: string; accountNo: string; ifsc: string; upi: string });
      } else {
        setNeftBankDetails({
          accountName: "—",
          accountNo: "—",
          ifsc: "—",
          upi: "—",
        });
      }
    }).catch(() => {
      setNeftBankDetails({ accountName: "—", accountNo: "—", ifsc: "—", upi: "—" });
    }).finally(() => setLoadingNeftDetails(false));
  }, [paymentMethod]);

  // Fetch SBI Collect details when SBI Collect is selected
  useEffect(() => {
    if (paymentMethod !== "sbicollect") return;
    setLoadingSbiCollect(true);
    api.settings.getSbiCollectDetails().then((res) => {
      if (res.success && res.data) {
        setSbiCollectDetails(res.data);
      } else {
        setSbiCollectDetails({ instructions: "Contact support for SBI Collect payment details." });
      }
    }).catch(() => {
      setSbiCollectDetails({ instructions: "Contact support for SBI Collect payment details." });
    }).finally(() => setLoadingSbiCollect(false));
  }, [paymentMethod]);

  const parseAddress = (formatted: string) => {
    let addr = formatted || "";
    let parsedCity = "";
    let parsedState = "";
    let parsedZip = "";

    const parts = formatted.split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      addr = parts[0] || "";
      parsedCity = parts[parts.length - 3] || "";
      const stateZipPart = parts[parts.length - 2] || "";
      const stateZipMatch = stateZipPart.match(/^(.+?)\s+(\d{5,6}(?:-\d{4})?)$/);
      if (stateZipMatch) {
        parsedState = stateZipMatch[1].trim();
        parsedZip = stateZipMatch[2].trim();
      } else {
        parsedState = stateZipPart.trim();
      }
    } else if (parts.length === 2) {
      addr = parts[0] || "";
      const cityStateZip = parts[1] || "";
      const cityStateZipMatch = cityStateZip.match(/^(.+?),\s*(.+?)\s+(\d{5,6}(?:-\d{4})?)$/);
      if (cityStateZipMatch) {
        parsedCity = cityStateZipMatch[1].trim();
        parsedState = cityStateZipMatch[2].trim();
        parsedZip = cityStateZipMatch[3].trim();
      } else {
        parsedCity = cityStateZip.trim();
      }
    }

    return { addr, parsedCity, parsedState, parsedZip };
  };

  const {
    inputRef: addressInputRef,
    isLoaded: isLocationLoaded,
    getCurrentLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
  } = useGoogleGeocoder({
    onPlaceSelect: (place) => {
      const formatted = place.formatted_address || "";
      const { addr, parsedCity, parsedState, parsedZip } = parseAddress(formatted);

      setAddress(addr || formatted);
      setCity(parsedCity);
      setStateVal(parsedState);
      setZip(parsedZip);
      setIsGettingLocation(false);
    },
    onError: () => {
      setIsGettingLocation(false);
    },
  });

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    getCurrentLocation();
  };

  const location = address
    ? { address, city, state: stateVal, zipCode: zip }
    : undefined;

  const handleCodCheckout = async () => {
    setIsPlacingOrder(true);
    try {
      const response = await api.bookings.createFromCart({
        date,
        time,
        location,
        requirementNote: notes,
        notes,
        buyerGST: buyerGST,
        buyerPAN: buyerPAN,
        paymentMethod: "cod",
      });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to place order");
      }
      toast({
        title: "Order placed",
        description: "Pay on delivery selected. Provider will confirm your booking.",
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleNeftCheckout = async () => {
    if (!neftReceiptFile) {
      toast({
        title: "Receipt required",
        description: "Please upload your NEFT/IMPS payment receipt before submitting.",
        variant: "destructive",
      });
      return;
    }
    setIsPlacingOrder(true);
    try {
      const uploadRes = await api.bookings.uploadNeftReceipt(neftReceiptFile);
      if (!uploadRes.success || !(uploadRes as { data?: { receiptUrl?: string } }).data?.receiptUrl) {
        throw new Error((uploadRes as { error?: { message?: string } }).error?.message || "Failed to upload receipt");
      }
      const receiptUrl = (uploadRes as { data: { receiptUrl: string } }).data.receiptUrl;
      const response = await api.bookings.createFromCart({
        date,
        time,
        location,
        requirementNote: notes,
        notes,
        buyerGST: buyerGST,
        buyerPAN: buyerPAN,
        paymentMethod: "neft",
        receiptUrl,
      });
      if (!response.success) {
        throw new Error(response.error?.message || "Failed to place order");
      }
      toast({
        title: "Order placed",
        description: "Pending payment verification. Admin will verify your receipt and confirm the order.",
      });
      setNeftReceiptFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Open SBI Collect in new tab (user pays first, then comes back to upload receipt)
  const handleSbiCollectOpenLink = () => {
    if (sbiCollectDetails?.paymentLink) {
      window.open(sbiCollectDetails.paymentLink, "_blank", "noopener,noreferrer");
      toast({
        title: "Opened SBI Collect",
        description: "Complete payment there, then come back and upload your receipt.",
      });
    } else {
      toast({
        title: "Link not available",
        description: "SBI Collect payment link is not configured. Contact support.",
        variant: "destructive",
      });
    }
  };

  // Place order with SBI Collect receipt (after user has paid and uploaded receipt)
  const handleSbiCollectCheckout = async () => {
    if (!sbiCollectReceiptFile) {
      toast({
        title: "Receipt required",
        description: "Please pay via SBI Collect first, then upload your payment receipt.",
        variant: "destructive",
      });
      return;
    }
    setIsPlacingOrder(true);
    try {
      const uploadRes = await api.bookings.uploadNeftReceipt(sbiCollectReceiptFile);
      if (!uploadRes.success || !(uploadRes as any).data?.receiptUrl) {
        throw new Error((uploadRes as any).error?.message || "Failed to upload receipt");
      }
      const receiptUrl = (uploadRes as any).data.receiptUrl;
      const response = await api.bookings.createFromCart({
        date,
        time,
        location,
        requirementNote: notes,
        notes,
        buyerGST: buyerGST,
        buyerPAN: buyerPAN,
        paymentMethod: "sbicollect",
        receiptUrl,
      });
      if (!response.success) {
        throw new Error((response as any).error?.message || "Failed to place order");
      }
      toast({
        title: "Order placed",
        description: "Admin will verify your receipt and confirm the payment.",
      });
      setSbiCollectReceiptFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const paymentAmount = amount;

  const canProceedToPayment = date.trim() !== "" && time.trim() !== "" && address.trim() !== "";

  const handleProceedToPayment = () => {
    if (!canProceedToPayment) {
      toast({
        title: "Complete required fields",
        description: "Please fill Date, Time, and Address before proceeding to payment.",
        variant: "destructive",
      });
      return;
    }
    setStep("payment");
  };

  const handleDetailsNext = () => {
    if (detailsStep === 1) {
      if (!date.trim() || !time.trim()) {
        toast({
          title: "Date & time required",
          description: "Please choose a date and time to continue.",
          variant: "destructive",
        });
        return;
      }
      setDetailsStep(2);
      return;
    }
    if (detailsStep === 2) {
      if (!address.trim()) {
        toast({
          title: "Address required",
          description: "Please enter or select a service address.",
          variant: "destructive",
        });
        return;
      }
      setDetailsStep(3);
    }
  };

  const handleDetailsBack = () => {
    setDetailsStep((s) => (s <= 1 ? 1 : ((s - 1) as DetailsStep)));
  };

  const { todayYmd, tomorrowYmd } = useMemo(() => {
    const now = new Date();
    return { todayYmd: formatLocalYMD(now), tomorrowYmd: formatLocalYMD(addDays(now, 1)) };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-y-auto overflow-x-hidden border-0 p-0 shadow-xl sm:max-w-lg sm:rounded-2xl"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".pac-container")) {
            e.preventDefault();
          }
        }}
      >
        {step === "details" ? (
          <>
            <div className="shrink-0 bg-gradient-to-br from-slate-50 via-slate-50 to-sky-100/70 px-6 pb-4 pt-6 dark:from-slate-950 dark:via-slate-900 dark:to-sky-950/40">
              <DialogHeader className="space-y-1.5 pr-6 text-left">
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Book Your Service
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Fill in details to confirm your booking
                </DialogDescription>
                <div className="mt-4 space-y-2">
                  <div className="flex gap-1.5" aria-hidden>
                    {[1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors duration-200",
                          detailsStep >= s ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Step {detailsStep} of 3 · {DETAILS_STEP_LABELS[detailsStep - 1]}
                  </p>
                </div>
              </DialogHeader>
            </div>

            <div className="flex flex-col">
              <div className="space-y-4 px-4 py-4 sm:px-6">
                {detailsStep === 1 && (
                  <BookingSectionCard icon={Calendar} title="Date & time">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-9 rounded-full border-slate-200 px-4 text-sm transition-all duration-200 hover:bg-slate-100 dark:border-slate-600",
                              date === todayYmd && "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-100",
                            )}
                            onClick={() => setDate(todayYmd)}
                          >
                            Today
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-9 rounded-full border-slate-200 px-4 text-sm transition-all duration-200 hover:bg-slate-100 dark:border-slate-600",
                              date === tomorrowYmd && "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-100",
                            )}
                            onClick={() => setDate(tomorrowYmd)}
                          >
                            Tomorrow
                          </Button>
                        </div>
                        <div className="mt-3">
                          <Label htmlFor="checkout-date" className="sr-only">
                            Select date
                          </Label>
                          <Input
                            id="checkout-date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className={cn("h-11", inputFocusClass)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Time</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {TIME_SLOT_CHIPS.map((slot) => (
                            <Button
                              key={slot.id}
                              type="button"
                              variant="outline"
                              size="sm"
                              className={cn(
                                "h-9 rounded-full border-slate-200 px-4 text-sm transition-all duration-200 hover:bg-slate-100 dark:border-slate-600",
                                time === slot.value &&
                                  "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-100",
                              )}
                              onClick={() => setTime(slot.value)}
                            >
                              {slot.label}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                          <Input
                            id="checkout-time"
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className={cn("h-11 flex-1", inputFocusClass)}
                          />
                        </div>
                      </div>
                    </div>
                  </BookingSectionCard>
                )}

                {detailsStep === 2 && (
                  <BookingSectionCard icon={MapPin} title="Location">
                    <div className="space-y-3">
                      <Label htmlFor="checkout-address" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Search address
                      </Label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="checkout-address"
                          ref={addressInputRef}
                          value={address}
                          onChange={(e) => {
                            setAddress(e.target.value);
                            handleInputChange(e);
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          placeholder="Search address"
                          className={cn("h-11 pl-10", inputFocusClass)}
                          disabled={!isLocationLoaded}
                          autoComplete="street-address"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full z-[2147483647] mt-1 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-popover shadow-lg dark:border-slate-700">
                            {suggestions.map((s, i) => (
                              <button
                                key={s.id || i}
                                type="button"
                                className="w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  void selectSuggestion(s);
                                }}
                              >
                                {s.place_name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {!isLocationLoaded ? (
                        <p className="text-xs text-muted-foreground">Loading address search…</p>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 w-full rounded-xl border-slate-200 transition-all duration-200 hover:bg-slate-100 dark:border-slate-600 sm:w-auto"
                        onClick={handleGetCurrentLocation}
                        disabled={!isLocationLoaded || isGettingLocation}
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Getting location…
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-2 h-4 w-4" />
                            Use current location
                          </>
                        )}
                      </Button>

                      <Collapsible open={addressExtrasOpen} onOpenChange={setAddressExtrasOpen}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                          >
                            <span>City, state & PIN</span>
                            <ChevronDown
                              className={cn("h-4 w-4 shrink-0 transition-transform duration-200", addressExtrasOpen && "rotate-180")}
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-2 data-[state=closed]:animate-none">
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <Input
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="City"
                              aria-label="City"
                              className={cn("h-10", inputFocusClass)}
                            />
                            <Input
                              value={stateVal}
                              onChange={(e) => setStateVal(e.target.value)}
                              placeholder="State"
                              aria-label="State"
                              className={cn("h-10", inputFocusClass)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="checkout-zip">PIN / ZIP</Label>
                            <Input
                              id="checkout-zip"
                              value={zip}
                              onChange={(e) => setZip(e.target.value)}
                              placeholder="PIN or ZIP"
                              className={cn("h-10", inputFocusClass)}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </BookingSectionCard>
                )}

                {detailsStep === 3 && (
                  <div className="space-y-4">
                    <BookingSectionCard icon={Receipt} title="GST / PAN (invoices)">
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {buyerGST || buyerPAN ? (
                          <>Tax invoices will use the GST/PAN saved on your profile.</>
                        ) : (
                          <>
                            GST / PAN for invoices: add or edit under{" "}
                            <Link
                              href="/profile"
                              className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                              onClick={() => onOpenChange(false)}
                            >
                              Profile → Edit profile
                            </Link>
                            .
                          </>
                        )}
                      </p>
                    </BookingSectionCard>
                    <BookingSectionCard icon={StickyNote} title="Additional notes (optional)">
                      <Label htmlFor="checkout-notes" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Note for the provider
                      </Label>
                      <Textarea
                        id="checkout-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Gate code, floor, parking — anything helpful"
                        className={cn(
                          "mt-2 min-h-[5rem] resize-none rounded-xl border-slate-200 transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-700",
                        )}
                      />
                    </BookingSectionCard>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-slate-200/90 bg-background/95 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 dark:border-slate-800 sm:px-6">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Amount to pay</span>
                  <span className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                    ₹{amount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-end sm:gap-3">
                  {detailsStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDetailsBack}
                      className="h-12 shrink-0 rounded-xl border-slate-200 transition-all duration-200 sm:min-w-[7rem]"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  )}
                  {detailsStep < 3 ? (
                    <Button
                      type="button"
                      onClick={handleDetailsNext}
                      className="h-12 flex-1 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#1d4ed8] sm:min-w-[10rem]"
                    >
                      Continue
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={!canProceedToPayment}
                      className="h-12 flex-1 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-md transition-all duration-200 hover:bg-[#1d4ed8] disabled:opacity-50 sm:min-w-[10rem]"
                    >
                      Proceed to Payment
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col">
            <div className="shrink-0 bg-gradient-to-br from-slate-50 via-slate-50 to-emerald-50/70 px-6 pb-4 pt-6 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/35">
              <DialogHeader className="space-y-1.5 pr-6 text-left">
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                  Complete payment
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                  Review your booking and pay securely to confirm the order.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 to-sky-50/60 px-4 py-3.5 dark:border-blue-900/45 dark:from-blue-950/45 dark:to-sky-950/35">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-800/90 dark:text-blue-300/95">
                    Total payable
                  </p>
                  <p className="mt-0.5 text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                    ₹{amount.toLocaleString("en-IN")}
                  </p>
                </div>

                <BookingSectionCard icon={ClipboardList} title="Booking summary">
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Date</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{formatBookingDateDisplay(date)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Time</p>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{time || "—"}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Service address</p>
                        <p className="break-words font-medium leading-snug text-slate-900 dark:text-slate-100">
                          {address}
                          {city ? `, ${city}` : ""}
                          {stateVal ? `, ${stateVal}` : ""}
                          {zip ? ` ${zip}` : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 w-full rounded-lg border-slate-200 text-xs font-medium transition-colors sm:w-auto"
                      onClick={() => {
                        setStep("details");
                        setDetailsStep(3);
                      }}
                    >
                      <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                      Edit booking details
                    </Button>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {buyerGST || buyerPAN ? (
                        <>Tax invoice will use GST/PAN from your profile.</>
                      ) : (
                        <>
                          Need GST/PAN on invoices? Add them under{" "}
                          <Link
                            href="/profile"
                            className="font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                            onClick={() => onOpenChange(false)}
                          >
                            Profile
                          </Link>
                          .
                        </>
                      )}
                    </p>
                  </div>
                </BookingSectionCard>

                <BookingSectionCard icon={Wallet} title="Payment method">
                  <PaymentOptionsSelector
                    value={paymentMethod}
                    onChange={(v) => {
                      setPaymentMethod(v);
                      if (v !== "neft") setNeftReceiptFile(null);
                      if (v !== "sbicollect") setSbiCollectReceiptFile(null);
                    }}
                    amount={amount}
                    className="[&>label]:text-xs [&>label]:font-medium [&>label]:text-slate-600 dark:[&>label]:text-slate-400"
                  />
                </BookingSectionCard>

                {paymentMethod === "sbicollect" && (
                  <div className="space-y-3 rounded-[12px] border border-slate-200/90 bg-[#f9fafb] p-4 shadow-sm dark:border-slate-800 dark:bg-muted/40 sm:p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">SBI Collect</Label>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Pay on SBI Collect in a new tab, then upload your receipt here to place the order.
                    </p>
                    {loadingSbiCollect ? (
                      <p className="text-sm text-muted-foreground animate-pulse">Loading SBI Collect details…</p>
                    ) : sbiCollectDetails ? (
                      <div className="space-y-3 text-sm">
                        {sbiCollectDetails.paymentLink ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 w-full rounded-xl border-slate-200 font-medium transition-all hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800/80"
                            onClick={handleSbiCollectOpenLink}
                          >
                            Open SBI Collect — ₹{amount.toLocaleString("en-IN")}
                          </Button>
                        ) : null}
                        {sbiCollectDetails.instructions ? (
                          <p className="whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-xs text-slate-600 ring-1 ring-slate-200/80 dark:bg-slate-900/50 dark:text-slate-300 dark:ring-slate-700">
                            {sbiCollectDetails.instructions}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Contact support for SBI Collect payment details.</p>
                    )}
                    <div className="space-y-2 border-t border-slate-200/90 pt-3 dark:border-slate-700">
                      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Upload payment receipt *</Label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                          htmlFor="sbicollect-receipt-upload"
                          className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-blue-400/60 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/80"
                        >
                          <Upload className="h-4 w-4 shrink-0 text-slate-500" />
                          <span className="truncate break-all text-slate-700 dark:text-slate-200">
                            {sbiCollectReceiptFile ? sbiCollectReceiptFile.name : "Choose file (image or PDF)"}
                          </span>
                        </label>
                        <input
                          id="sbicollect-receipt-upload"
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
                            className="shrink-0 text-slate-600"
                            onClick={() => setSbiCollectReceiptFile(null)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">We’ll verify your receipt before confirming the booking.</p>
                    </div>
                  </div>
                )}

                {paymentMethod === "neft" && (
                  <div className="space-y-3 rounded-[12px] border border-slate-200/90 bg-[#f9fafb] p-4 shadow-sm dark:border-slate-800 dark:bg-muted/40 sm:p-5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
                        <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </span>
                      <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">NEFT / IMPS transfer</Label>
                    </div>
                    {loadingNeftDetails ? (
                      <p className="text-sm text-muted-foreground animate-pulse">Loading bank details…</p>
                    ) : neftBankDetails ? (
                      <div className="space-y-2 rounded-lg bg-white/80 p-3 text-sm ring-1 ring-slate-200/80 dark:bg-slate-900/50 dark:ring-slate-700">
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">Account name</span>
                          <br />
                          <span className="font-medium text-slate-900 dark:text-slate-100">{neftBankDetails.accountName}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">Account no.</span>
                          <br />
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{neftBankDetails.accountNo}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">IFSC</span>
                          <br />
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{neftBankDetails.ifsc}</span>
                        </p>
                        <p>
                          <span className="text-slate-500 dark:text-slate-400">UPI ID</span>
                          <br />
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{neftBankDetails.upi}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Unable to load bank details.</p>
                    )}
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      Transfer <span className="font-semibold">₹{amount.toLocaleString("en-IN")}</span>, then upload the receipt below.
                    </p>
                    <div className="space-y-2 border-t border-slate-200/90 pt-3 dark:border-slate-700">
                      <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">Upload payment receipt *</Label>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <label
                          htmlFor="neft-receipt-upload"
                          className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-blue-400/60 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-800/80"
                        >
                          <Upload className="h-4 w-4 shrink-0 text-slate-500" />
                          <span className="truncate break-all text-slate-700 dark:text-slate-200">
                            {neftReceiptFile ? neftReceiptFile.name : "Choose file (image or PDF)"}
                          </span>
                        </label>
                        <input
                          id="neft-receipt-upload"
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => setNeftReceiptFile(e.target.files?.[0] || null)}
                        />
                        {neftReceiptFile ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="shrink-0 text-slate-600"
                            onClick={() => setNeftReceiptFile(null)}
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">We’ll verify your payment before confirming the order.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === "payment" && (
          <DialogFooter className="mt-0 shrink-0 flex-col gap-3 border-t border-slate-200/90 bg-background/95 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 dark:border-slate-800 sm:flex-row sm:px-6">
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("details");
                  setDetailsStep(3);
                }}
                className="h-12 w-full shrink-0 rounded-xl border-slate-200 sm:order-first sm:w-auto sm:min-w-[7.5rem]"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              {paymentMethod === "cod" ? (
                <Button
                  onClick={handleCodCheckout}
                  disabled={isPlacingOrder}
                  className="h-12 w-full flex-1 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:opacity-50 sm:min-w-[12rem]"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing order…
                    </>
                  ) : (
                    `Place order · Pay on delivery · ₹${paymentAmount.toLocaleString("en-IN")}`
                  )}
                </Button>
              ) : paymentMethod === "neft" ? (
                <Button
                  onClick={handleNeftCheckout}
                  disabled={isPlacingOrder}
                  className="h-12 w-full flex-1 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:opacity-50 sm:min-w-[12rem]"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit order (NEFT / IMPS)"
                  )}
                </Button>
              ) : paymentMethod === "sbicollect" ? (
                <Button
                  onClick={sbiCollectReceiptFile ? handleSbiCollectCheckout : handleSbiCollectOpenLink}
                  disabled={isPlacingOrder}
                  className="h-12 w-full flex-1 rounded-xl bg-[#2563eb] text-base font-semibold text-white shadow-md transition-all hover:bg-[#1d4ed8] disabled:opacity-50 sm:min-w-[12rem]"
                >
                  {isPlacingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : sbiCollectReceiptFile ? (
                    "Place order (SBI Collect)"
                  ) : (
                    "Pay via SBI Collect"
                  )}
                </Button>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row">
                  {paymentMethod === "razorpay" && (
                    <RazorpayCheckout
                      cartId={cartId}
                      amount={paymentAmount}
                      couponUsageId={couponUsageId || undefined}
                      bookingDescription="Cart Checkout"
                      bookingPayload={{
                        date,
                        time,
                        location,
                        requirementNote: notes,
                        notes,
                        buyerGST: buyerGST,
                        buyerPAN: buyerPAN,
                      }}
                      onSuccess={onSuccess}
                      className="h-12 w-full rounded-xl bg-[#2563eb] px-4 text-base font-semibold text-white shadow-md hover:bg-[#1d4ed8]"
                    >
                      Pay ₹{paymentAmount.toLocaleString("en-IN")} · Razorpay
                    </RazorpayCheckout>
                  )}
                  {paymentMethod === "cashfree" && (
                    <CashfreeCheckout
                      cartId={cartId}
                      amount={paymentAmount}
                      couponUsageId={couponUsageId || undefined}
                      bookingDescription="Cart Checkout"
                      bookingPayload={{
                        date,
                        time,
                        location,
                        requirementNote: notes,
                        notes,
                        buyerGST: buyerGST,
                        buyerPAN: buyerPAN,
                      }}
                      onSuccess={onSuccess}
                      className="h-12 w-full rounded-xl bg-[#2563eb] px-4 text-base font-semibold text-white shadow-md hover:bg-[#1d4ed8]"
                    >
                      Pay ₹{paymentAmount.toLocaleString("en-IN")} · Cashfree
                    </CashfreeCheckout>
                  )}
                </div>
              )}
            </>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

  );
};
