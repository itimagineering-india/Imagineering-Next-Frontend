"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { SavedAddress } from "@/lib/savedAddresses";
import { formatSavedAddressLine, upsertSavedAddress } from "@/lib/savedAddresses";
import { useGeocoderByPolicy, type PlaceDetails } from "@/hooks/useGeocoderByPolicy";
import { buildAddressGeocodeQuery, geocodeAddressToCoordinates } from "@/lib/geocodeAddress";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronRight, Loader2, MapPin, Plus } from "lucide-react";

const inputClass =
  "rounded-xl border-slate-200 transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-700";

function fillNewAddressFieldsFromPlace(place: PlaceDetails, setters: {
  setNewAddress: (v: string) => void;
  setNewCity: (v: string) => void;
  setNewState: (v: string) => void;
  setNewZip: (v: string) => void;
}) {
  const { setNewAddress, setNewCity, setNewState, setNewZip } = setters;
  const full = (place.formatted_address || "").trim();
  const parts = full.split(",").map((p) => p.trim()).filter(Boolean);
  const street = parts[0] || full;
  setNewAddress(street || full);

  let city = (place.city || "").trim();
  let state = (place.state || "").trim();
  let zip = (place.postalCode || "").trim();

  if (!city && parts.length >= 3) city = parts[parts.length - 3] || "";
  if (!state && parts.length >= 2) state = parts[parts.length - 2] || "";
  if (!zip && parts.length >= 1) {
    const last = parts[parts.length - 1] || "";
    const m = last.match(/\b(\d{5,6})\b/);
    if (m) zip = m[1];
  }
  if (state) state = state.replace(/\b\d{5,6}\b/g, "").trim();

  setNewCity(city);
  setNewState(state);
  setNewZip(zip);
}

type CheckoutAddressPickerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: SavedAddress[];
  selectedId: string | null;
  onAddressesChange: (rows: SavedAddress[]) => void;
  onSelect: (address: SavedAddress) => void;
};

export function CheckoutAddressPickerModal({
  open,
  onOpenChange,
  addresses,
  selectedId,
  onAddressesChange,
  onSelect,
}: CheckoutAddressPickerModalProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("Home");
  const [newHouseNo, setNewHouseNo] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
  const [newCoordinates, setNewCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const { toast } = useToast();

  const onPlaceResolved = useCallback(
    (place: PlaceDetails) => {
      setLocating(false);
      fillNewAddressFieldsFromPlace(place, {
        setNewAddress,
        setNewCity,
        setNewState,
        setNewZip,
      });
      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setNewCoordinates({ lat: Number(lat), lng: Number(lng) });
      } else {
        setNewCoordinates(null);
      }
      toast({
        title: "Address filled",
        description: "Review the fields below, then save if it looks correct.",
      });
    },
    [toast],
  );

  const {
    inputRef: geoInputRef,
    getCurrentLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
    hasAnyGeocoder,
  } = useGeocoderByPolicy("public", {
    deferScriptLoad: true,
    onPlaceSelect: onPlaceResolved,
    onError: (msg) => {
      setLocating(false);
      toast({ title: "Location", description: msg, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!open) {
      setShowAdd(false);
      setSaving(false);
      setLocating(false);
      setShowSuggestions(false);
      setNewCoordinates(null);
    }
  }, [open, setShowSuggestions]);

  const handlePick = (row: SavedAddress) => {
    onSelect(row);
    onOpenChange(false);
  };

  const handleSaveNew = async () => {
    const line = newAddress.trim();
    if (!line) return;
    setSaving(true);
    try {
      let coordinates = newCoordinates;
      if (!coordinates) {
        coordinates = await geocodeAddressToCoordinates(
          buildAddressGeocodeQuery({
            address: line,
            city: newCity,
            state: newState,
            zipCode: newZip,
          })
        );
      }
      if (!coordinates) {
        toast({
          title: "Location needed",
          description: "Please pick an address from search suggestions so we can save map coordinates for distance.",
          variant: "destructive",
        });
        return;
      }

      const row: SavedAddress = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        label: newLabel.trim() || "Address",
        address: line,
        ...(newHouseNo.trim() ? { houseNo: newHouseNo.trim() } : {}),
        ...(newLandmark.trim() ? { landmark: newLandmark.trim() } : {}),
        city: newCity.trim(),
        state: newState.trim(),
        zipCode: newZip.trim(),
        isDefault: newIsDefault,
        coordinates,
      };
      const next = await upsertSavedAddress(row);
      onAddressesChange(next);
      const saved = next.find((a) => a.id === row.id) || row;
      onSelect(saved);
      setNewAddress("");
      setNewHouseNo("");
      setNewLandmark("");
      setNewCity("");
      setNewState("");
      setNewZip("");
      setNewLabel("Home");
      setNewIsDefault(false);
      setNewCoordinates(null);
      setShowAdd(false);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        onInteractOutside={(e) => {
          const t = e.target as HTMLElement;
          if (t.closest(".pac-container")) e.preventDefault();
        }}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-200/90 px-4 pb-4 pt-5 text-left dark:border-slate-800 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            Saved addresses
          </DialogTitle>
          <DialogDescription className="text-sm">
            Choose a delivery / site address. Synced with your Imagineering India account on web and app.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {addresses.length === 0 && !showAdd ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center">
              <p className="text-sm font-extrabold text-slate-900">No saved addresses yet</p>
              <p className="mt-1 text-[13px] text-slate-500">Add one to use for quotes and delivery.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {addresses.map((row) => {
                const selected = row.id === selectedId;
                const line = formatSavedAddressLine(row) || row.address || "";
                const meta = [row.city, row.state, row.zipCode].filter(Boolean).join(", ");
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(row)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition sm:p-3.5",
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-base">
                        📍
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {row.label || "Address"}
                          {row.isDefault ? (
                            <span className="ml-2 text-[11px] font-semibold text-primary">Default</span>
                          ) : null}
                        </span>
                        {line ? (
                          <span className="mt-1 block text-[13px] font-medium leading-snug text-slate-700 dark:text-slate-300">
                            {line}
                          </span>
                        ) : null}
                        {meta ? (
                          <span className="mt-1 block truncate text-xs font-medium text-slate-500">
                            {meta}
                          </span>
                        ) : null}
                      </span>
                      {selected ? (
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 border-t border-slate-200/90 pt-4 dark:border-slate-800">
            {!showAdd ? (
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-xl border-dashed border-slate-300 text-sm font-semibold dark:border-slate-600"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new address
              </Button>
            ) : (
              <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-[#f9fafb] p-4 dark:border-slate-800 dark:bg-muted/30">
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">New address</p>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="addr-label" className="text-xs">
                      Label
                    </Label>
                    <Input
                      id="addr-label"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Home, Office…"
                      className={cn("mt-1 h-10", inputClass)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="addr-line" className="text-xs">
                      Search address <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="addr-line"
                        ref={geoInputRef}
                        value={newAddress}
                        onChange={(e) => {
                          setNewAddress(e.target.value);
                          setNewCoordinates(null);
                          handleInputChange(e);
                        }}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder={hasAnyGeocoder ? "Type to search places…" : "Street, building, area"}
                        autoComplete="street-address"
                        className={cn("h-10 pl-10", inputClass)}
                      />
                      {showSuggestions && suggestions.length > 0 ? (
                        <div className="absolute left-0 right-0 top-full z-[2147483647] mt-1 max-h-48 overflow-auto rounded-xl border border-slate-200 bg-popover shadow-lg dark:border-slate-700">
                          {suggestions.map((s, i) => (
                            <button
                              key={s.id || i}
                              type="button"
                              className="w-full px-3 py-3 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                void selectSuggestion(s);
                              }}
                            >
                              {s.place_name}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 h-10 w-full rounded-xl border-slate-200 sm:w-auto"
                      disabled={!hasAnyGeocoder || locating}
                      onClick={() => {
                        setLocating(true);
                        getCurrentLocation();
                      }}
                    >
                      {locating ? (
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
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="addr-house" className="text-xs">
                        House / Flat
                      </Label>
                      <Input
                        id="addr-house"
                        value={newHouseNo}
                        onChange={(e) => setNewHouseNo(e.target.value)}
                        placeholder="Flat / plot"
                        className={cn("mt-1 h-10", inputClass)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="addr-landmark" className="text-xs">
                        Landmark
                      </Label>
                      <Input
                        id="addr-landmark"
                        value={newLandmark}
                        onChange={(e) => setNewLandmark(e.target.value)}
                        placeholder="Near…"
                        className={cn("mt-1 h-10", inputClass)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="addr-city" className="text-xs">
                        City
                      </Label>
                      <Input
                        id="addr-city"
                        value={newCity}
                        onChange={(e) => setNewCity(e.target.value)}
                        placeholder="City"
                        className={cn("mt-1 h-10", inputClass)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="addr-state" className="text-xs">
                        State
                      </Label>
                      <Input
                        id="addr-state"
                        value={newState}
                        onChange={(e) => setNewState(e.target.value)}
                        placeholder="State"
                        className={cn("mt-1 h-10", inputClass)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="addr-zip" className="text-xs">
                      PIN / ZIP
                    </Label>
                    <Input
                      id="addr-zip"
                      value={newZip}
                      onChange={(e) => setNewZip(e.target.value)}
                      placeholder="PIN"
                      className={cn("mt-1 h-10", inputClass)}
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <Checkbox checked={newIsDefault} onCheckedChange={(v) => setNewIsDefault(v === true)} />
                    Set as default address
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    className="h-10 flex-1 rounded-xl"
                    disabled={!newAddress.trim() || saving}
                    onClick={handleSaveNew}
                  >
                    Save & use
                  </Button>
                  <Button type="button" variant="ghost" className="h-10" onClick={() => setShowAdd(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
