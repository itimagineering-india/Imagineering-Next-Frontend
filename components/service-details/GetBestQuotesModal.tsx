"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronRight, Loader2, Calendar, Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { CheckoutAddressPickerModal } from "@/components/cart/CheckoutAddressPickerModal";
import {
  formatSavedAddressLine,
  loadSavedAddresses,
  type SavedAddress,
} from "@/lib/savedAddresses";
import { setActiveQuoteRequest } from "@/lib/activeQuoteRequest";
import { useAuth } from "@/contexts/AuthContext";
import { getPriceTypeLabel, getQuantityUnitNoun } from "@/lib/priceTypeDisplay";
import { parseQuoteQuantity, QUOTE_QTY_MIN } from "@/lib/quoteQuantity";
import { pickRecoveredQuoteRequestId } from "@/lib/b2b/quoteRequestDisplay";

export type QuoteModalLine = {
  serviceId: string;
  title: string;
  quantity?: number;
  priceType?: string | null;
  catalogProductId?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatLocalYMD(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

const TIME_SLOT_CHIPS: { id: string; label: string; value: string }[] = [
  { id: "morning", label: "Morning", value: "09:00" },
  { id: "afternoon", label: "Afternoon", value: "14:00" },
  { id: "evening", label: "Evening", value: "18:00" },
];

type GetBestQuotesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceTitle: string;
  /** Product / service price unit (e.g. per_kg, per_bag) shown next to quantity. */
  priceType?: string | null;
  /** Multi-product RFQ. When set, quantities are per line. */
  items?: QuoteModalLine[];
  onSubmitted?: () => void;
  /** B2B product RFQs have no 30-minute countdown. */
  noCountdown?: boolean;
};

export function GetBestQuotesModal({
  open,
  onOpenChange,
  serviceId,
  serviceTitle,
  priceType,
  items,
  onSubmitted,
  noCountdown = false,
}: GetBestQuotesModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [lineQuantities, setLineQuantities] = useState<number[]>([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SavedAddress | null>(null);

  const minDate = useMemo(() => formatLocalYMD(new Date()), []);
  const quoteLines = useMemo(
    () => (Array.isArray(items) && items.length > 0 ? items : null),
    [items]
  );
  const isMulti = Boolean(quoteLines && quoteLines.length > 1);
  const headline = isMulti ? `${quoteLines!.length} products` : serviceTitle;
  const quantityUnit = useMemo(() => getQuantityUnitNoun(priceType), [priceType]);
  const quantityUnitLabel = useMemo(() => getPriceTypeLabel(priceType), [priceType]);

  useEffect(() => {
    if (!open) return;
    setQuantity(parseQuoteQuantity(quoteLines?.[0]?.quantity));
    setLineQuantities((quoteLines || []).map((line) => parseQuoteQuantity(line.quantity)));
  }, [open, quoteLines]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadSavedAddresses().then((saved) => {
      if (cancelled) return;
      setSavedAddresses(saved);
      setSelectedAddress((current) => {
        if (current) {
          return saved.find((a) => a.id === current.id) || current;
        }
        return saved.find((a) => a.isDefault) || saved[0] || null;
      });
    });
    setDate((prev) => prev || minDate);
    return () => {
      cancelled = true;
    };
  }, [open, minDate]);

  const addressLine = useMemo(() => {
    if (!selectedAddress) return "";
    return formatSavedAddressLine(selectedAddress) || selectedAddress.address || "";
  }, [selectedAddress]);

  const addressMeta = useMemo(() => {
    if (!selectedAddress) return "";
    return [selectedAddress.city, selectedAddress.state, selectedAddress.zipCode]
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .join(", ");
  }, [selectedAddress]);

  const applySavedAddress = useCallback((row: SavedAddress) => {
    setSelectedAddress(row);
    setAddressPickerOpen(false);
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to request quotes from providers who list this product.",
        variant: "destructive",
      });
      return;
    }
    const payloadItems =
      quoteLines?.map((line, idx) => ({
        serviceId: line.serviceId,
        title: line.title,
        quantity: parseQuoteQuantity(
          isMulti
            ? lineQuantities[idx] || line.quantity
            : idx === 0
              ? quantity
              : lineQuantities[idx] || line.quantity
        ),
        priceType: line.priceType || undefined,
        catalogProductId: line.catalogProductId,
      })) || undefined;
    const firstQty = payloadItems?.[0]?.quantity || quantity;
    if (!payloadItems && (!quantity || quantity < QUOTE_QTY_MIN)) {
      toast({ title: "Quantity required", description: "Enter a quantity greater than 0.", variant: "destructive" });
      return;
    }
    if (payloadItems?.some((line) => !line.quantity || line.quantity < QUOTE_QTY_MIN)) {
      toast({ title: "Quantity required", description: "Each product needs a quantity greater than 0.", variant: "destructive" });
      return;
    }
    if (!date || !time) {
      toast({
        title: "Date & time required",
        description: "Choose when you need delivery / service.",
        variant: "destructive",
      });
      return;
    }
    if (
      !selectedAddress ||
      !addressLine.trim() ||
      !String(selectedAddress.city || "").trim() ||
      !String(selectedAddress.state || "").trim()
    ) {
      toast({
        title: "Address required",
        description: "Please select a saved address with city and state.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.quoteRequests.create({
        serviceId: payloadItems?.[0]?.serviceId || serviceId,
        quantity: firstQty,
        items: payloadItems,
        preferredDate: date,
        preferredTime: time,
        address: addressLine.trim(),
        city: selectedAddress.city.trim(),
        state: selectedAddress.state.trim(),
        zipCode: selectedAddress.zipCode.trim() || undefined,
        coordinates: selectedAddress.coordinates || undefined,
        notes: notes.trim() || undefined,
      });

      const id = (res as any)?.data?.id;
      if (!res.success || !id) {
        throw new Error((res as any)?.error?.message || "Failed to send quote request");
      }

      setActiveQuoteRequest({
        id: String(id),
        expiresAt: (res as any)?.data?.expiresAt,
        serviceTitle: headline,
        persistent: noCountdown || (res as any)?.data?.timedWindow === false,
      });

      onSubmitted?.();
      onOpenChange(false);
      toast({
        title: "Request sent",
        description: noCountdown || (res as any)?.data?.timedWindow === false
          ? isMulti
            ? "Listed suppliers will share a combined quote. There is no time limit."
            : "Providers who list this product will share prices. There is no time limit."
          : isMulti
            ? "Listed suppliers will share a combined quote within 30 minutes."
            : "Providers who list this product will share prices within 30 minutes.",
      });
      router.push(`/quote-requests/${id}`);
    } catch (err: any) {
      try {
        const mine = await api.quoteRequests.getMine();
        const recoveredId = pickRecoveredQuoteRequestId((mine as any)?.data);
        if (recoveredId) {
          setActiveQuoteRequest({
            id: recoveredId,
            serviceTitle: headline,
            persistent: noCountdown,
          });
          onSubmitted?.();
          onOpenChange(false);
          toast({
            title: "Request sent",
            description: "Listed suppliers received your request. Track it from My requirements.",
          });
          router.push(`/quote-requests/${recoveredId}`);
          return;
        }
      } catch {
        /* keep original error */
      }
      toast({
        title: "Could not send request",
        description:
          err?.message ||
          "Please try again. If suppliers were already notified, open My requirements to see this request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Get Best Quotes</DialogTitle>
            <DialogDescription>
              {isMulti ? (
                <>
                  Share quantities, schedule, and delivery address for these{" "}
                  <span className="font-medium text-foreground">{quoteLines!.length} products</span>.
                  {noCountdown
                    ? " Listed suppliers will send a combined quote."
                    : " Listed suppliers will send a combined quote within 30 minutes."}
                </>
              ) : (
                <>
                  Share quantity, schedule, and delivery address for{" "}
                  <span className="font-medium text-foreground">{serviceTitle}</span>.{" "}
                  {noCountdown
                    ? "Listed suppliers will send prices."
                    : "Nearby verified suppliers will send prices within 30 minutes."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isMulti ? (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" /> Products
                </Label>
                <ul className="divide-y divide-border overflow-hidden rounded-lg border">
                  {quoteLines!.map((line, idx) => {
                    const unit = getQuantityUnitNoun(line.priceType);
                    return (
                    <li key={line.serviceId + idx} className="flex items-center gap-2 px-3 py-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{line.title}</p>
                      <Input
                        type="number"
                        min={QUOTE_QTY_MIN}
                        step="0.01"
                        aria-label={`Quantity for ${line.title}`}
                        className="h-9 w-20 shrink-0"
                        value={lineQuantities[idx] ?? line.quantity ?? 1}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setLineQuantities((prev) => {
                            const copy = [...prev];
                            copy[idx] = Number.isFinite(n) && n > 0 ? n : QUOTE_QTY_MIN;
                            return copy;
                          });
                        }}
                      />
                      {unit ? (
                        <span className="w-10 shrink-0 text-xs font-medium text-muted-foreground">
                          {unit}
                        </span>
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
            <div className="space-y-2">
              <Label htmlFor="rfq-qty" className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Quantity
                {quantityUnitLabel ? (
                  <span className="font-normal text-muted-foreground">· {quantityUnitLabel}</span>
                ) : null}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="rfq-qty"
                  type="number"
                  min={QUOTE_QTY_MIN}
                  step="0.01"
                  value={quantity}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    setQuantity(Number.isFinite(n) && n > 0 ? n : QUOTE_QTY_MIN);
                  }}
                  className="flex-1"
                  aria-describedby={quantityUnit ? "rfq-qty-unit" : undefined}
                />
                {quantityUnit ? (
                  <span
                    id="rfq-qty-unit"
                    className="inline-flex h-10 min-w-[4.5rem] shrink-0 items-center justify-center rounded-md border border-input bg-muted/60 px-3 text-sm font-medium text-muted-foreground"
                  >
                    {quantityUnit}
                  </span>
                ) : null}
              </div>
            </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="rfq-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Date
                </Label>
                <Input
                  id="rfq-date"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rfq-time" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Time
                </Label>
                <Input
                  id="rfq-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOT_CHIPS.map((chip) => (
                <Button
                  key={chip.id}
                  type="button"
                  size="sm"
                  variant={time === chip.value ? "default" : "outline"}
                  className="h-9 w-full px-1 text-xs sm:text-sm"
                  onClick={() => setTime(chip.value)}
                >
                  {chip.label}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm font-semibold">Address</Label>
                <button
                  type="button"
                  className="text-[13px] font-bold text-primary hover:underline"
                  onClick={() => setAddressPickerOpen(true)}
                >
                  {selectedAddress ? "Change" : "Saved addresses"}
                </button>
              </div>

              {selectedAddress ? (
                <button
                  type="button"
                  onClick={() => setAddressPickerOpen(true)}
                  className="flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 active:opacity-95"
                  aria-label="Change address"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-lg">
                    📍
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-900">
                      {selectedAddress.label || "Address"}
                      {selectedAddress.isDefault ? (
                        <span className="ml-2 text-[11px] font-semibold text-primary">Default</span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-[13px] font-medium leading-snug text-slate-800">
                      {addressLine}
                    </span>
                    {addressMeta ? (
                      <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                        {addressMeta}
                      </span>
                    ) : null}
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddressPickerOpen(true)}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 text-left transition hover:bg-slate-50"
                >
                  <p className="text-sm font-extrabold text-slate-900">No address selected</p>
                  <p className="mt-1 text-[13px] leading-snug text-slate-500">
                    Pick a saved address for delivery / site location.
                  </p>
                  <p className="mt-2 text-[13px] font-bold text-primary">Choose address →</p>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rfq-notes">Notes (optional)</Label>
              <Textarea
                id="rfq-notes"
                placeholder="Brand preference, grade, site access…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                "Submit request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CheckoutAddressPickerModal
        open={addressPickerOpen}
        onOpenChange={setAddressPickerOpen}
        addresses={savedAddresses}
        selectedId={selectedAddress?.id || null}
        onAddressesChange={setSavedAddresses}
        onSelect={applySavedAddress}
      />
    </>
  );
}
