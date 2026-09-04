"use client";

import { useEffect, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronRight, MapPin, Plus } from "lucide-react";
import {
  PinAddressOnMapPanel,
  type PinnedAddressResult,
} from "@/components/cart/PinAddressOnMapPanel";

const inputClass =
  "rounded-xl border-slate-200 transition-all duration-200 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/25 dark:border-slate-700";

type AddStep = "list" | "pin" | "details";

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
  const [addStep, setAddStep] = useState<AddStep>("list");
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
  const { toast } = useToast();

  const resetFormFields = () => {
    setNewAddress("");
    setNewHouseNo("");
    setNewLandmark("");
    setNewCity("");
    setNewState("");
    setNewZip("");
    setNewLabel("Home");
    setNewIsDefault(false);
    setNewCoordinates(null);
  };

  useEffect(() => {
    if (!open) {
      setAddStep("list");
      setSaving(false);
      resetFormFields();
    }
  }, [open]);

  const handlePick = (row: SavedAddress) => {
    onSelect(row);
    onOpenChange(false);
  };

  const applyPinned = (pinned: PinnedAddressResult) => {
    setNewAddress(pinned.address);
    setNewCity(pinned.city);
    setNewState(pinned.state);
    setNewZip(pinned.zipCode);
    setNewCoordinates(pinned.coordinates);
    setAddStep("details");
  };

  const handleSaveNew = async () => {
    const line = newAddress.trim();
    if (!line) return;
    if (
      !newCoordinates ||
      !Number.isFinite(newCoordinates.lat) ||
      !Number.isFinite(newCoordinates.lng)
    ) {
      toast({
        title: "Location needed",
        description: "Please pin the location on the map so we can save coordinates for delivery.",
        variant: "destructive",
      });
      setAddStep("pin");
      return;
    }
    setSaving(true);
    try {
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
        coordinates: newCoordinates,
      };
      const next = await upsertSavedAddress(row);
      onAddressesChange(next);
      const saved = next.find((a) => a.id === row.id) || row;
      onSelect(saved);
      resetFormFields();
      setAddStep("list");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0",
          addStep === "pin" ? "sm:max-w-lg" : "sm:max-w-md"
        )}
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-slate-200/90 px-4 pb-4 pt-5 text-left dark:border-slate-800 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5 text-primary" />
            {addStep === "pin"
              ? "Pin address"
              : addStep === "details"
                ? "Address details"
                : "Saved addresses"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {addStep === "pin"
              ? "Place the pin on the map first — fields fill automatically, like in the app."
              : addStep === "details"
                ? "Review the pinned address, add house / landmark if needed, then save."
                : "Choose a delivery / site address. Synced with your Imagineering India account on web and app."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4">
          {addStep === "pin" ? (
            <PinAddressOnMapPanel
              initialCoordinates={newCoordinates}
              initialAddress={newAddress || undefined}
              onConfirm={applyPinned}
              onCancel={() => {
                if (newCoordinates) setAddStep("details");
                else {
                  resetFormFields();
                  setAddStep("list");
                }
              }}
            />
          ) : addStep === "details" ? (
            <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-[#f9fafb] p-4 dark:border-slate-800 dark:bg-muted/30">
              <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">New address</p>

              <button
                type="button"
                onClick={() => setAddStep("pin")}
                className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-800/60"
              >
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Change pin
                  </span>
                  {newCoordinates ? (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      {newCoordinates.lat.toFixed(5)}, {newCoordinates.lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Open map to pin location
                    </span>
                  )}
                </span>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              </button>

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
                <div>
                  <Label htmlFor="addr-line" className="text-xs">
                    Area / street <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="addr-line"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Street, building, area"
                    autoComplete="street-address"
                    className={cn("mt-1 h-10", inputClass)}
                  />
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
                  disabled={!newAddress.trim() || !newCoordinates || saving}
                  onClick={handleSaveNew}
                >
                  Save & use
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10"
                  onClick={() => {
                    resetFormFields();
                    setAddStep("list");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center">
                  <p className="text-sm font-extrabold text-slate-900">No saved addresses yet</p>
                  <p className="mt-1 text-[13px] text-slate-500">
                    Add one by pinning on the map, like in the app.
                  </p>
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
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-xl border-dashed border-slate-300 text-sm font-semibold dark:border-slate-600"
                  onClick={() => {
                    resetFormFields();
                    setAddStep("pin");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add new address
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
