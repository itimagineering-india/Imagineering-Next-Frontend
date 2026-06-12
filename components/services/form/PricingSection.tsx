import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock } from "lucide-react";

type PricingType = "fixed" | "hourly" | "daily" | "per_minute" | "per_article" | "monthly" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip" | "per_cuft" | "per_cum" | "per_metre" | "per_bag" | "lumpsum" | "per_project" | "negotiable";

interface PricingSectionProps {
  priceMode: "exact" | "range";
  pricingType: PricingType;
  startingPrice: string;
  priceMin: string;
  priceMax: string;
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  onPriceModeChange: (value: "exact" | "range") => void;
  onPricingTypeChange: (value: PricingType) => void;
  onStartingPriceChange: (value: string) => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onAvailabilityChange: (availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  }) => void;
  errors?: {
    priceMode?: string;
    pricingType?: string;
    startingPrice?: string;
    priceMin?: string;
    priceMax?: string;
  };
}

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

export function PricingSection({
  priceMode,
  pricingType,
  startingPrice,
  priceMin,
  priceMax,
  availability,
  onPriceModeChange,
  onPricingTypeChange,
  onStartingPriceChange,
  onPriceMinChange,
  onPriceMaxChange,
  onAvailabilityChange,
  errors,
}: PricingSectionProps) {
  const handleDayToggle = (day: string) => {
    const newDays = availability.days.includes(day)
      ? availability.days.filter((d) => d !== day)
      : [...availability.days, day];
    
    onAvailabilityChange({
      ...availability,
      days: newDays,
    });
  };

  const handleTimeSlotChange = (index: number, field: "start" | "end", value: string) => {
    const newTimeSlots = [...availability.timeSlots];
    if (!newTimeSlots[index]) {
      newTimeSlots[index] = { start: "09:00", end: "18:00" };
    }
    newTimeSlots[index][field] = value;
    onAvailabilityChange({
      ...availability,
      timeSlots: newTimeSlots,
    });
  };

  const addTimeSlot = () => {
    onAvailabilityChange({
      ...availability,
      timeSlots: [...availability.timeSlots, { start: "09:00", end: "18:00" }],
    });
  };

  const removeTimeSlot = (index: number) => {
    onAvailabilityChange({
      ...availability,
      timeSlots: availability.timeSlots.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>
          Price Option <span className="text-destructive">*</span>
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "exact" as const, title: "Exact Price", description: "Buyer can add this service to cart." },
            { value: "range" as const, title: "Price Range", description: "Show estimated range and collect enquiry." },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onPriceModeChange(option.value)}
              className={[
                "rounded-xl border p-4 text-left transition hover:border-primary/60",
                priceMode === option.value ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background",
              ].join(" ")}
            >
              <span className="block font-medium text-foreground">{option.title}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{option.description}</span>
            </button>
          ))}
        </div>
        {errors?.priceMode && <p className="caption text-destructive">{errors.priceMode}</p>}
      </div>

      {/* Pricing Type */}
      <div className="space-y-2">
        <Label htmlFor="pricingType">
          Pricing Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={pricingType}
          onValueChange={(value: any) => onPricingTypeChange(value)}
        >
          <SelectTrigger id="pricingType" className={errors?.pricingType ? "border-destructive" : ""}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">Fixed Price</SelectItem>
            <SelectItem value="hourly">Per Hour</SelectItem>
            <SelectItem value="daily">Per Day</SelectItem>
            <SelectItem value="per_minute">Per Minute</SelectItem>
            <SelectItem value="monthly">Per Month</SelectItem>
            <SelectItem value="per_article">Per Article</SelectItem>
            <SelectItem value="per_kg">Per KG</SelectItem>
            <SelectItem value="per_litre">Per Litre</SelectItem>
            <SelectItem value="per_unit">Per Unit</SelectItem>
            <SelectItem value="metric_ton">Metric Ton</SelectItem>
            <SelectItem value="per_sqft">Per Square Foot</SelectItem>
            <SelectItem value="per_sqm">Per Square Meter</SelectItem>
            <SelectItem value="per_load">Per Load</SelectItem>
            <SelectItem value="per_trip">Per Trip</SelectItem>
            <SelectItem value="per_cuft">Per Cubic Foot</SelectItem>
            <SelectItem value="per_cum">Per Cubic Meter</SelectItem>
            <SelectItem value="per_metre">Per Metre</SelectItem>
            <SelectItem value="per_bag">Per Bag</SelectItem>
            <SelectItem value="lumpsum">Lumsum</SelectItem>
            <SelectItem value="per_project">Per Project</SelectItem>
            <SelectItem value="negotiable">Negotiable</SelectItem>
          </SelectContent>
        </Select>
        {errors?.pricingType && (
          <p className="caption text-destructive">{errors.pricingType}</p>
        )}
      </div>

      {priceMode === "range" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priceMin">
              Min Price (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="priceMin"
              type="number"
              placeholder="0"
              value={priceMin}
              onChange={(e) => onPriceMinChange(e.target.value)}
              min="0"
              step="0.01"
              className={errors?.priceMin ? "border-destructive" : ""}
            />
            {errors?.priceMin && <p className="caption text-destructive">{errors.priceMin}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceMax">
              Max Price (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="priceMax"
              type="number"
              placeholder="0"
              value={priceMax}
              onChange={(e) => onPriceMaxChange(e.target.value)}
              min="0"
              step="0.01"
              className={errors?.priceMax ? "border-destructive" : ""}
            />
            {errors?.priceMax && <p className="caption text-destructive">{errors.priceMax}</p>}
          </div>
          <p className="caption sm:col-span-2">
            Range listings are enquiry-only and will not be added directly to cart.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="startingPrice">
            Starting Price (₹) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startingPrice"
            type="number"
            placeholder="0"
            value={startingPrice}
            onChange={(e) => onStartingPriceChange(e.target.value)}
            min="0"
            step="0.01"
            className={errors?.startingPrice ? "border-destructive" : ""}
          />
          {errors?.startingPrice && (
            <p className="caption text-destructive">{errors.startingPrice}</p>
          )}
          <p className="caption">
            Exact price for this service
          </p>
        </div>
      )}

      {/* Availability */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label>Availability</Label>
        </div>

        {/* Days of Week */}
        <div className="space-y-2">
          <Label className="body">Available Days</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {daysOfWeek.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={day.value}
                  checked={availability.days.includes(day.value)}
                  onCheckedChange={() => handleDayToggle(day.value)}
                />
                <Label
                  htmlFor={day.value}
                  className="body cursor-pointer"
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="body">Time Slots</Label>
            <button
              type="button"
              onClick={addTimeSlot}
              className="text-sm text-primary hover:underline"
            >
              + Add Time Slot
            </button>
          </div>
          {availability.timeSlots.length === 0 ? (
            <p className="caption">
              No time slots added. Click "Add Time Slot" to add availability times.
            </p>
          ) : (
            <div className="space-y-3">
              {availability.timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={slot.start}
                    onValueChange={(value) => handleTimeSlotChange(index, "start", value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="caption">to</span>
                  <Select
                    value={slot.end}
                    onValueChange={(value) => handleTimeSlotChange(index, "end", value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availability.timeSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTimeSlot(index)}
                      className="text-sm text-destructive hover:underline ml-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

