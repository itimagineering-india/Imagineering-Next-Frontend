"use client";

import { useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePlacesAutocomplete, type PlaceDetails } from "@/hooks/usePlacesAutocomplete";

function cityStateFromComponents(
  components?: PlaceDetails["address_components"]
): { city: string; state: string } {
  if (!components?.length) return { city: "", state: "" };
  let city = "";
  let state = "";
  for (const c of components) {
    if (c.types.includes("locality")) city = c.long_name;
    if (c.types.includes("administrative_area_level_1")) state = c.long_name;
  }
  if (!city) {
    for (const c of components) {
      if (c.types.includes("sublocality_level_1") || c.types.includes("administrative_area_level_2")) {
        city = c.long_name;
        break;
      }
    }
  }
  return { city, state };
}

type Patch = Partial<{ addressQ: string; city: string; state: string }>;

type Props = {
  id: string;
  value: string;
  onPatch: (partial: Patch) => void;
  className?: string;
};

export function LabourAddressFilterInput({ id, value, onPatch, className }: Props) {
  const patchRef = useRef(onPatch);
  patchRef.current = onPatch;

  const onPlaceSelect = useCallback((place: PlaceDetails) => {
    const { city, state } = cityStateFromComponents(place.address_components);
    patchRef.current({
      addressQ: place.formatted_address,
      ...(city ? { city } : {}),
      ...(state ? { state } : {}),
    });
  }, []);

  const { inputRef, isLoaded } = usePlacesAutocomplete({
    onPlaceSelect,
    componentRestrictions: { country: "in" },
  });

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (el.value !== value) el.value = value;
  }, [value, inputRef]);

  const hasMapsKey = Boolean(
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  );

  return (
    <div className="space-y-1">
      <Input
        ref={inputRef}
        id={id}
        className={cn("h-9 w-full min-w-0", className)}
        placeholder="Street, city, state, PIN…"
        defaultValue={value}
        autoComplete="off"
        onChange={(e) => patchRef.current({ addressQ: e.target.value })}
      />
      {hasMapsKey && !isLoaded ? (
        <p className="text-[11px] text-muted-foreground">Loading address suggestions…</p>
      ) : null}
    </div>
  );
}
