"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

interface RequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceTitle: string;
  servicePrice?: number;
  bookingId?: string | null; // Booking ID after saving booking details
  onSubmit: (data: {
    date: Date;
    time: string;
    requirementNote: string;
    paymentMethod?: string;
    advancePayment?: number;
    paymentOption: "full" | "advance" | "later";
    saveOnly?: boolean; // If true, only save booking, don't process payment
  }) => void;
  onBookingSaved?: (bookingId: string) => void; // Callback when booking is saved
}

export function RequestModal({
  open,
  onOpenChange,
  serviceTitle,
  servicePrice = 0,
  bookingId,
  onSubmit,
  onBookingSaved,
}: RequestModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [requirementNote, setRequirementNote] = useState("");
  const [step, setStep] = useState<"details" | "payment">("details"); // Two-step flow
  const [isSaving, setIsSaving] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(bookingId || null);

  // Update currentBookingId when bookingId prop changes
  useEffect(() => {
    if (bookingId) {
      setCurrentBookingId(bookingId);
    }
  }, [bookingId]);

  // Step 1: Save booking details with pending payment
  const handleProceedToPayment = async () => {
    if (!date || !time || !requirementNote.trim()) {
      return;
    }
    
    setIsSaving(true);
    try {
      // Save booking with pending payment status
      await onSubmit({ 
        date, 
        time, 
        requirementNote,
        paymentMethod: undefined, // Will be set in payment step
        advancePayment: undefined,
        paymentOption: "full", // Always full payment
        saveOnly: true, // Flag to indicate this is just saving, not processing payment
      });
      
      // Wait a bit for parent to set bookingId, then move to payment step
      setTimeout(() => {
        setStep("payment");
      }, 100);
    } catch (error) {
      console.error("Error saving booking:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    setDate(undefined);
    setTime("");
    setRequirementNote("");
    setStep("details");
    setCurrentBookingId(null);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {step === "details" ? "Request Service" : "Complete Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "details" 
              ? `Fill in the details to request ${serviceTitle}`
              : "Complete your payment to confirm the booking"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Preferred Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Preferred Time *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Provider will confirm availability
            </p>
          </div>

          {/* Requirement Note */}
          <div className="space-y-2">
            <Label>Additional Requirements *</Label>
            <Textarea
              placeholder="Describe your requirements, special requests, or any additional details..."
              value={requirementNote}
              onChange={(e) => setRequirementNote(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Provide as much detail as possible for better service
            </p>
          </div>


          {/* Payment Step - Show Razorpay payment */}
          {step === "payment" && currentBookingId && (
            <div className="space-y-4 pt-4 border-t">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Service:</span>
                  <span className="font-semibold">{serviceTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-semibold text-lg">
                    ₹{servicePrice.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">Total to Pay:</span>
                  <span className="font-semibold">₹{servicePrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Razorpay Payment Button */}
              <div className="pt-2">
                <RazorpayCheckout
                  bookingId={currentBookingId}
                  bookingDescription={serviceTitle}
                  amount={servicePrice}
                  onSuccess={handlePaymentSuccess}
                  className="w-full"
                >
                  Pay ₹{servicePrice.toLocaleString()} Now
                </RazorpayCheckout>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {step === "details" ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={!date || !time || !requirementNote.trim() || isSaving}
              >
                {isSaving ? "Saving..." : "Proceed to Payment"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
              {!currentBookingId && (
                <Button disabled>
                  Please wait...
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

