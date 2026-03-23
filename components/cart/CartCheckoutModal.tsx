"use client";

import { useState, useEffect, useMemo } from "react";
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
import { MapPin, Loader2, Upload, Building2, ArrowLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useMapboxGeocoder } from "@/hooks/useMapboxGeocoder";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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
  const [noteOpen, setNoteOpen] = useState(false);
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
      setAddressExtrasOpen(false);
      setNoteOpen(false);
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
  } = useMapboxGeocoder({
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg max-h-[85vh] flex flex-col gap-0 overflow-hidden p-6 sm:rounded-lg"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest(".pac-container")) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="shrink-0 space-y-1.5 pr-8 text-left">
          <DialogTitle>{step === "details" ? "Booking details" : "Payment"}</DialogTitle>
          <DialogDescription>
            {step === "details"
              ? "Add when and where you need the service. You’ll pick how to pay on the next step."
              : "Choose payment and complete your order."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
        {step === "details" ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">When</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="checkout-date">Date</Label>
                  <Input id="checkout-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="checkout-time">Time</Label>
                  <Input id="checkout-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Where</p>
              <div className="space-y-1">
                <Label htmlFor="checkout-address">Service address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="checkout-address"
                    ref={addressInputRef}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      handleInputChange(e);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Start typing — pick a suggestion"
                    className="pl-10"
                    disabled={!isLocationLoaded}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-[2147483647] max-h-48 overflow-auto">
                      {suggestions.map((s, i) => (
                        <button
                          key={s.id || i}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          onMouseDown={() => selectSuggestion(s)}
                        >
                          {s.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!isLocationLoaded ? (
                  <p className="text-xs text-muted-foreground">Loading location search…</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Tip: choose a result from the list or use current location — city, state and PIN fill in automatically.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleGetCurrentLocation}
                  disabled={!isLocationLoaded || isGettingLocation}
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      Getting location…
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3 mr-2" />
                      Use current location
                    </>
                  )}
                </Button>
              </div>

              <Collapsible open={addressExtrasOpen} onOpenChange={setAddressExtrasOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>Edit city, state & PIN code</span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 transition-transform duration-200", addressExtrasOpen && "rotate-180")}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 data-[state=closed]:animate-none">
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" aria-label="City" />
                    <Input value={stateVal} onChange={(e) => setStateVal(e.target.value)} placeholder="State" aria-label="State" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="checkout-zip">PIN / ZIP code</Label>
                    <Input id="checkout-zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="PIN or ZIP" />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Optional</p>

              <Collapsible open={noteOpen} onOpenChange={setNoteOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span>Note for the provider</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", noteOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=closed]:animate-none">
                  <div className="space-y-1 pt-1">
                    <Label htmlFor="checkout-notes" className="text-muted-foreground font-normal">
                      Anything the provider should know? (optional)
                    </Label>
                    <Textarea
                      id="checkout-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="e.g. gate code, floor, access instructions"
                      className="resize-none min-h-[4rem]"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <p className="text-xs text-muted-foreground pt-1">
                GST / PAN for invoices: add or edit them in{" "}
                <Link href="/profile" className="text-primary underline-offset-2 hover:underline" onClick={() => onOpenChange(false)}>
                  Profile → Edit profile
                </Link>
                .
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary of checkout details */}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium text-muted-foreground mb-2">Booking summary</p>
              <p><span className="text-muted-foreground">Date:</span> {date}</p>
              <p><span className="text-muted-foreground">Time:</span> {time}</p>
              <p><span className="text-muted-foreground">Address:</span> {address}{city ? `, ${city}` : ""}{stateVal ? `, ${stateVal}` : ""}{zip ? ` ${zip}` : ""}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 -ml-2"
                onClick={() => setStep("details")}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Edit details
              </Button>
              <p className="text-xs text-muted-foreground mt-2 border-t border-border/60 pt-2">
                {buyerGST || buyerPAN ? (
                  <>Tax invoice: using GST/PAN from your profile.</>
                ) : (
                  <>
                    Add GST/PAN under{" "}
                    <Link href="/profile" className="text-primary underline-offset-2 hover:underline" onClick={() => onOpenChange(false)}>
                      Profile
                    </Link>{" "}
                    if you need them on invoices.
                  </>
                )}
              </p>
            </div>

            <PaymentOptionsSelector
              value={paymentMethod}
              onChange={(v) => {
                setPaymentMethod(v);
                if (v !== "neft") setNeftReceiptFile(null);
                if (v !== "sbicollect") setSbiCollectReceiptFile(null);
              }}
              amount={amount}
            />

          {paymentMethod === "sbicollect" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">SBI Collect Payment</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Step 1: Click below to pay on SBI Collect. Step 2: After payment success, upload receipt and place order.
              </p>
              {loadingSbiCollect ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading SBI Collect details...</p>
              ) : sbiCollectDetails ? (
                <div className="space-y-3 text-sm">
                  {sbiCollectDetails.paymentLink ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleSbiCollectOpenLink}
                    >
                      Pay ₹{amount.toLocaleString()} via SBI Collect (opens in new tab)
                    </Button>
                  ) : null}
                  {sbiCollectDetails.instructions ? (
                    <p className="text-muted-foreground whitespace-pre-wrap text-xs">{sbiCollectDetails.instructions}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Contact support for SBI Collect payment details.</p>
              )}
              <div className="space-y-2 pt-2 border-t">
                <Label>After payment, upload receipt *</Label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="sbicollect-receipt-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-muted/50"
                  >
                    <Upload className="h-4 w-4" />
                    {sbiCollectReceiptFile ? sbiCollectReceiptFile.name : "Choose file (image or PDF)"}
                  </label>
                  <input
                    id="sbicollect-receipt-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setSbiCollectReceiptFile(e.target.files?.[0] || null)}
                  />
                  {sbiCollectReceiptFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSbiCollectReceiptFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Admin will verify receipt. Booking will be confirmed after verification.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === "neft" && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                <Label className="text-sm font-medium">Bank Details for NEFT/IMPS</Label>
              </div>
              {loadingNeftDetails ? (
                <p className="text-sm text-muted-foreground animate-pulse">Loading bank details...</p>
              ) : neftBankDetails ? (
                <div className="space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Account Name:</span> {neftBankDetails.accountName}</p>
                  <p><span className="text-muted-foreground">Account No:</span> {neftBankDetails.accountNo}</p>
                  <p><span className="text-muted-foreground">IFSC:</span> {neftBankDetails.ifsc}</p>
                  <p><span className="text-muted-foreground">UPI ID:</span> {neftBankDetails.upi}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load bank details.</p>
              )}
              <p className="text-xs text-muted-foreground">
                Transfer ₹{amount.toLocaleString()} and upload the payment receipt below.
              </p>
              <div className="space-y-2">
                <Label>Upload Payment Receipt *</Label>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="neft-receipt-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-4 py-2 text-sm hover:bg-muted/50"
                  >
                    <Upload className="h-4 w-4" />
                    {neftReceiptFile ? neftReceiptFile.name : "Choose file (image or PDF)"}
                  </label>
                  <input
                    id="neft-receipt-upload"
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => setNeftReceiptFile(e.target.files?.[0] || null)}
                  />
                  {neftReceiptFile && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNeftReceiptFile(null)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Status: Pending for payment verification. Admin will verify and confirm your order.
                </p>
              </div>
            </div>
          )}
          </div>
        )}
        </div>

        <DialogFooter className="mt-0 shrink-0 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
          {step === "details" ? (
            <Button
              onClick={handleProceedToPayment}
              disabled={!canProceedToPayment}
              className="w-full sm:w-auto"
            >
              Proceed to Payment
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("details")}
                className="w-full sm:w-auto order-last sm:order-first"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {paymentMethod === "cod" ? (
            <Button onClick={handleCodCheckout} disabled={isPlacingOrder} className="w-full sm:w-auto">
              {isPlacingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing...
                </>
              ) : (
                "Place Order (Pay on Delivery)"
              )}
            </Button>
          ) : paymentMethod === "neft" ? (
            <Button onClick={handleNeftCheckout} disabled={isPlacingOrder} className="w-full sm:w-auto">
              {isPlacingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing...
                </>
              ) : (
                "Place Order (NEFT/IMPS)"
              )}
            </Button>
          ) : paymentMethod === "sbicollect" ? (
            <Button
              onClick={sbiCollectReceiptFile ? handleSbiCollectCheckout : handleSbiCollectOpenLink}
              disabled={isPlacingOrder}
              className="w-full sm:w-auto"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Placing...
                </>
              ) : sbiCollectReceiptFile ? (
                "Place Order (SBI Collect)"
              ) : (
                "Pay via SBI Collect"
              )}
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
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
                >
                  Pay ₹{paymentAmount.toLocaleString()} – Razorpay
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
                >
                  Pay ₹{paymentAmount.toLocaleString()} – Cashfree
                </CashfreeCheckout>
              )}
            </div>
          )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
