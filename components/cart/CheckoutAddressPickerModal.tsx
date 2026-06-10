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
import { upsertSavedAddress } from "@/lib/savedAddresses";
import { useGeocoderByPolicy, type PlaceDetails } from "@/hooks/useGeocoderByPolicy";
import { useToast } from "@/hooks/use-toast";
import { Check, Loader2, MapPin, Plus } from "lucide-react";

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
  const [newAddress, setNewAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newZip, setNewZip] = useState("");
  const [newIsDefault, setNewIsDefault] = useState(false);
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
    }
  }, [open, setShowSuggestions]);

  const handlePick = (row: SavedAddress) => {
    onSelect(row);
    onOpenChange(false);
  };

  const handleSaveNew = () => {
    const line = newAddress.trim();
    if (!line) return;
    setSaving(true);
    try {
      const row: SavedAddress = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        label: newLabel.trim() || "Address",
        address: line,
        city: newCity.trim(),
        state: newState.trim(),
        zipCode: newZip.trim(),
        isDefault: newIsDefault,
      };
      const next = upsertSavedAddress(row);
      onAddressesChange(next);
      const saved = next.find((a) => a.id === row.id) || row;
      onSelect(saved);
      setNewAddress("");
      setNewCity("");
      setNewState("");
      setNewZip("");
      setNewLabel("Home");
      setNewIsDefault(false);
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
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Saved addresses
          </DialogTitle>
          <DialogDescription className="text-sm">
            Choose where the service should happen, or add a new address. Stored on this device only.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {addresses.length === 0 && !showAdd ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No saved addresses yet. Add one below.</p>
          ) : (
            <ul className="space-y-2">
              {addresses.map((row) => {
                const selected = row.id === selectedId;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => handlePick(row)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition-colors sm:p-4",
                        selected
                          ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20 dark:border-blue-600 dark:bg-blue-950/35"
                          : "border-slate-200/90 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/60",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 dark:border-slate-600",
                        )}
                      >
                        {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {row.label}
                          {row.isDefault ? (
                            <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">Default</span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-muted-foreground leading-snug">{row.address}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {[row.city, row.state, row.zipCode].filter(Boolean).join(", ") || "—"}
                        </span>
                      </span>
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
                className="h-11 w-full rounded-xl border-dashed border-slate-300 text-sm font-medium dark:border-slate-600"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new address
              </Button>
            ) : (
              <div className="space-y-3 rounded-xl border border-slate-200/90 bg-[#f9fafb] p-4 dark:border-slate-800 dark:bg-muted/30">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">New address</p>
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
                    {!hasAnyGeocoder ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add a Mapbox token or Google Maps key to enable place search; you can still type manually.
                      </p>
                    ) : null}
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
                    className="h-10 flex-1 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8]"
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
