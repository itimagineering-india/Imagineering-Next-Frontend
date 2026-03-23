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
  pricingType: PricingType;
  startingPrice: string;
  availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  };
  onPricingTypeChange: (value: PricingType) => void;
  onStartingPriceChange: (value: string) => void;
  onAvailabilityChange: (availability: {
    days: string[];
    timeSlots: {
      start: string;
      end: string;
    }[];
  }) => void;
  errors?: {
    pricingType?: string;
    startingPrice?: string;
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
  pricingType,
  startingPrice,
  availability,
  onPricingTypeChange,
  onStartingPriceChange,
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
          <p className="text-sm text-destructive">{errors.pricingType}</p>
        )}
      </div>

      {/* Starting Price */}
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
          <p className="text-sm text-destructive">{errors.startingPrice}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Minimum price for this service
        </p>
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label>Availability</Label>
        </div>

        {/* Days of Week */}
        <div className="space-y-2">
          <Label className="text-sm">Available Days</Label>
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
                  className="text-sm font-normal cursor-pointer"
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
            <Label className="text-sm">Time Slots</Label>
            <button
              type="button"
              onClick={addTimeSlot}
              className="text-sm text-primary hover:underline"
            >
              + Add Time Slot
            </button>
          </div>
          {availability.timeSlots.length === 0 ? (
            <p className="text-xs text-muted-foreground">
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
                  <span className="text-sm text-muted-foreground">to</span>
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

