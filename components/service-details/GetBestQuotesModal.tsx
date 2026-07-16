"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, Calendar, Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { CheckoutAddressPickerModal } from "@/components/cart/CheckoutAddressPickerModal";
import { loadSavedAddresses, type SavedAddress } from "@/lib/savedAddresses";
import { setActiveQuoteRequest } from "@/lib/activeQuoteRequest";
import { useAuth } from "@/contexts/AuthContext";

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
};

export function GetBestQuotesModal({
  open,
  onOpenChange,
  serviceId,
  serviceTitle,
}: GetBestQuotesModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const minDate = useMemo(() => formatLocalYMD(new Date()), []);

  useEffect(() => {
    if (!open) return;
    const saved = loadSavedAddresses();
    setSavedAddresses(saved);
    const def = saved.find((a) => a.isDefault) || saved[0];
    if (def) {
      setAddress(def.address);
      setCity(def.city);
      setStateVal(def.state);
      setZipCode(def.zipCode || "");
      setSelectedAddressId(def.id);
      setCoordinates(def.coordinates || null);
    }
    setDate((prev) => prev || minDate);
  }, [open, minDate]);

  const applySavedAddress = useCallback((row: SavedAddress) => {
    setAddress(row.address);
    setCity(row.city);
    setStateVal(row.state);
    setZipCode(row.zipCode || "");
    setSelectedAddressId(row.id);
    setCoordinates(row.coordinates || null);
    setAddressPickerOpen(false);
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to request quotes from nearby providers.",
        variant: "destructive",
      });
      return;
    }
    if (!quantity || quantity < 1) {
      toast({ title: "Quantity required", description: "Enter at least 1.", variant: "destructive" });
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
    if (!address.trim() || !city.trim() || !stateVal.trim()) {
      toast({
        title: "Address required",
        description: "Add full address, city, and state.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.quoteRequests.create({
        serviceId,
        quantity,
        preferredDate: date,
        preferredTime: time,
        address: address.trim(),
        city: city.trim(),
        state: stateVal.trim(),
        zipCode: zipCode.trim() || undefined,
        coordinates: coordinates || undefined,
        notes: notes.trim() || undefined,
      });

      const id = (res as any)?.data?.id;
      if (!res.success || !id) {
        throw new Error((res as any)?.error?.message || "Failed to send quote request");
      }

      setActiveQuoteRequest({
        id: String(id),
        expiresAt: (res as any)?.data?.expiresAt,
        serviceTitle,
      });

      onOpenChange(false);
      toast({
        title: "Request sent",
        description: "Nearby providers will share prices within 30 minutes.",
      });
      router.push(`/quote-requests/${id}`);
    } catch (err: any) {
      toast({
        title: "Could not send request",
        description: err?.message || "Please try again.",
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
              Share quantity, schedule, and delivery address for{" "}
              <span className="font-medium text-foreground">{serviceTitle}</span>. Nearby verified
              suppliers will send prices within 30 minutes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="rfq-qty" className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Quantity
              </Label>
              <Input
                id="rfq-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>

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
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Address
                </Label>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setAddressPickerOpen(true)}
                >
                  Saved addresses
                </Button>
              </div>
              <Textarea
                placeholder="Street / landmark"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setSelectedAddressId(null);
                }}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setSelectedAddressId(null);
                  }}
                />
                <Input
                  placeholder="State"
                  value={stateVal}
                  onChange={(e) => {
                    setStateVal(e.target.value);
                    setSelectedAddressId(null);
                  }}
                />
              </div>
              <Input
                placeholder="PIN (optional)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
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
        selectedId={selectedAddressId}
        onAddressesChange={setSavedAddresses}
        onSelect={applySavedAddress}
      />
    </>
  );
}
