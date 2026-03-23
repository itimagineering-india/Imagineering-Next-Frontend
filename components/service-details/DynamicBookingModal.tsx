"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Clock, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { DynamicBookingField, BookingFieldConfig } from "@/components/booking/DynamicBookingField";
import { usePlacesAutocomplete } from "@/hooks/usePlacesAutocomplete";
import api from "@/lib/api-client";
import { getMapplsAccessToken } from "@/lib/mapConfig";
import { mapplsReverseGeocode as mapplsRevGeocodeApi } from "@/lib/mapplsApi";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// Google Maps types are declared elsewhere

interface DynamicBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    title: string;
    price: number;
    category?: string | { name?: string; slug?: string };
    subcategory?: string;
    itemType?: string;
  };
  onSubmit: (data: {
    date: Date;
    time: string;
    requirementNote: string;
    location?: {
      address: string;
      city: string;
      state: string;
      zipCode?: string;
    };
    formData?: Record<string, any>;
    paymentOption: "full";
    saveOnly: boolean;
  }) => Promise<string | void>;
  bookingId?: string | null;
}

interface BookingFormData {
  date: Date;
  time: string;
  requirementNote: string;
  location?: {
    address: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  [key: string]: any; // For dynamic fields
}

export function DynamicBookingModal({
  open,
  onOpenChange,
  service,
  onSubmit,
  bookingId,
}: DynamicBookingModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<"details" | "payment">("details");
  const [isSaving, setIsSaving] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(bookingId || null);
  const [dynamicFields, setDynamicFields] = useState<BookingFieldConfig[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponUsageId, setCouponUsageId] = useState<string | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [actualPaymentAmount, setActualPaymentAmount] = useState<number | null>(null);
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Calculate payment amounts (centralized to ensure consistency)
  const paymentCalculation = useMemo(() => {
    // Get quantity from bookingDetails.formData or metadata, default to 1
    const quantity = bookingDetails?.formData?.quantity || 
                     bookingDetails?.metadata?.quantity || 
                     1;
    
    // Ensure quantity is a number and at least 1
    const qty = Math.max(1, Number(quantity) || 1);
    
    // Get base service price
    const basePrice = service.price;
    
    // Calculate service amount: base price * quantity
    // Always calculate from base price * quantity to ensure quantity is accounted for
    const serviceAmount = basePrice * qty;
    
    const platformCharge = bookingDetails?.buyerFee ?? 0; // Use nullish coalescing to handle 0 values correctly
    
    // Calculate GST (18% on Service Amount)
    const gst = Math.round((serviceAmount * 18) / 100);
    
    // Calculate subtotal: Service Amount + Platform Charge + GST
    const subtotal = serviceAmount + platformCharge + gst;
    
    // Apply discount if coupon is applied
    const discount = appliedCoupon?.discountAmount || 0;
    
    // Calculate total payable: Subtotal - Discount (minimum 0)
    const totalPayable = Math.max(0, subtotal - discount);
    
    // Debug logging (remove in production if needed)
    console.log('Payment Calculation:', {
      quantity: qty,
      basePrice,
      serviceAmount,
      platformCharge,
      gst,
      subtotal,
      discount,
      totalPayable,
      bookingDetailsAmount: bookingDetails?.amount,
      bookingDetailsBuyerFee: bookingDetails?.buyerFee,
      servicePrice: service.price,
      formData: bookingDetails?.formData,
      metadata: bookingDetails?.metadata,
    });
    
    return {
      serviceAmount,
      platformCharge,
      gst,
      subtotal,
      discount,
      totalPayable,
    };
  }, [bookingDetails?.amount, bookingDetails?.buyerFee, bookingDetails?.formData, bookingDetails?.metadata, service.price, appliedCoupon?.discountAmount]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BookingFormData>({
    defaultValues: {
      date: undefined,
      time: "",
      requirementNote: "",
    },
  });

  // Google Places autocomplete hook for address input
  const addressInputRef = useRef<HTMLInputElement>(null);
  const {
    inputRef: placesInputRef,
    isLoaded: isPlacesLoaded,
  } = usePlacesAutocomplete({
    onPlaceSelect: (place) => {
      try {
        // Extract address components
        let address = "";
        let city = "";
        let state = "";
        let zipCode = "";
        
        // Get detailed place information using PlacesService
        if (window.google && window.google.maps && window.google.maps.places && place.place_id) {
          const service = new window.google.maps.places.PlacesService(document.createElement("div"));
          service.getDetails(
            {
              placeId: place.place_id,
            } as any,
            (placeDetails: any, status: string) => {
              if (status === "OK" && placeDetails) {
                // Parse address_components
                if (placeDetails.address_components) {
                  placeDetails.address_components.forEach((component: any) => {
                    const types = component.types;
                    if (types.includes("street_number")) {
                      address = component.long_name + " ";
                    } else if (types.includes("route")) {
                      address += component.long_name;
                    } else if (types.includes("locality") || types.includes("postal_town")) {
                      city = component.long_name;
                    } else if (types.includes("administrative_area_level_1")) {
                      state = component.long_name;
                    } else if (types.includes("postal_code")) {
                      zipCode = component.long_name;
                    }
                  });
                }
              }
              
              // Fallback: parse from formatted_address if address is empty
              if (!address.trim()) {
                address = place.formatted_address.split(",")[0] || "";
              }

              // Set form values
              setValue("location.address", address.trim() || place.formatted_address);
              if (city) setValue("location.city", city);
              if (state) setValue("location.state", state);
              if (zipCode) setValue("location.zipCode", zipCode);

              toast({
                title: "Location selected",
                description: "Address details filled automatically",
              });
            }
          );
        } else {
          // Fallback: parse from formatted_address
          const parts = place.formatted_address.split(",");
          if (parts.length >= 2) {
            address = parts[0]?.trim() || "";
            city = parts[parts.length - 3]?.trim() || "";
            state = parts[parts.length - 2]?.trim() || "";
            const zipMatch = state.match(/\d{6}/);
            if (zipMatch) {
              zipCode = zipMatch[0];
              state = state.replace(/\d{6}/, "").trim();
            }
          }

          setValue("location.address", address || place.formatted_address);
          if (city) setValue("location.city", city);
          if (state) setValue("location.state", state);
          if (zipCode) setValue("location.zipCode", zipCode);

          toast({
            title: "Location selected",
            description: "Address details filled automatically",
          });
        }
      } catch (error: any) {
        console.error("Error processing place selection:", error);
        toast({
          title: "Error",
          description: "Failed to process location. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("Places autocomplete error:", error);
    },
  });

  // Sync refs when addressInputRef changes
  useEffect(() => {
    if (addressInputRef.current && placesInputRef && typeof placesInputRef === 'object' && 'current' in placesInputRef) {
      placesInputRef.current = addressInputRef.current;
    }
  }, [addressInputRef.current, placesInputRef]);

  // Get category slug
  const categorySlug =
    typeof service.category === "string"
      ? service.category
      : service.category?.slug || service.category?.name || "";

  const { user: authUser } = useAuth();

  // Fetch user info and dynamic fields when modal opens
  useEffect(() => {
    if (open) {
      setUser(authUser || null);
      if (categorySlug) {
        fetchDynamicFields();
      }
    }
  }, [open, authUser, categorySlug, service.subcategory, service.itemType]);

  // Keep user in sync while modal is open
  useEffect(() => {
    if (!open) return;
    setUser(authUser || null);
  }, [open, authUser]);

  // Update bookingId when prop changes
  useEffect(() => {
    if (bookingId) {
      setCurrentBookingId(bookingId);
    }
  }, [bookingId]);

  // Fetch booking details when currentBookingId is available and on payment step
  useEffect(() => {
    if (currentBookingId && step === "payment") {
      fetchBookingDetails();
    }
  }, [currentBookingId, step]);

  // Pre-fill GST number and PAN number from booking details when loaded
  useEffect(() => {
    if (bookingDetails?.metadata?.buyerGST && !gstNumber) {
      setGstNumber(bookingDetails.metadata.buyerGST);
    }
    if (bookingDetails?.metadata?.buyerPAN && !panNumber) {
      setPanNumber(bookingDetails.metadata.buyerPAN);
    }
  }, [bookingDetails]);

  // Update booking with GST number and PAN number before payment
  const updateBookingTaxDetails = async () => {
    if (!currentBookingId || (!gstNumber.trim() && !panNumber.trim())) return;
    
    try {
      // Update booking metadata with GST number and PAN number
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/bookings/${currentBookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          metadata: {
            ...bookingDetails?.metadata,
            ...(gstNumber.trim() && { buyerGST: gstNumber.trim() }),
            ...(panNumber.trim() && { buyerPAN: panNumber.trim() }),
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update tax details');
      }
    } catch (error: any) {
      console.error("Failed to update booking tax details:", error);
      // Don't show error toast as this is optional
    }
  };

  const fetchBookingDetails = async () => {
    if (!currentBookingId) return;
    
    setLoadingBooking(true);
    try {
      const response = await api.bookings.getById(currentBookingId);
      if (response.success && response.data) {
        const data = response.data as any;
        setBookingDetails(data.booking || data);
      }
    } catch (error: any) {
      console.error("Failed to fetch booking details:", error);
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingBooking(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    // Don't require bookingDetails - use fallback values from service
    setValidatingCoupon(true);
    try {
      // Get quantity from bookingDetails.formData or metadata, default to 1
      const quantity = bookingDetails?.formData?.quantity || 
                       bookingDetails?.metadata?.quantity || 
                       1;
      
      // Ensure quantity is a number and at least 1
      const qty = Math.max(1, Number(quantity) || 1);
      
      // Calculate service amount: base price * quantity
      const basePrice = service.price;
      const serviceAmount = basePrice * qty;
      
      const buyerFee = bookingDetails?.buyerFee || 0;
      const gst = Math.round((serviceAmount * 18) / 100); // 18% GST on Service Amount
      const subtotal = serviceAmount + buyerFee + gst; // Include GST in subtotal for coupon validation
      
      // Extract categoryId from bookingDetails or service
      let categoryId: string | undefined;
      
      // First try to get from bookingDetails.service.category (most accurate)
      if (bookingDetails?.service?.category) {
        const bookingCategory = bookingDetails.service.category;
        if (typeof bookingCategory === 'object' && (bookingCategory as any)._id) {
          categoryId = (bookingCategory as any)._id;
        } else if (typeof bookingCategory === 'string') {
          categoryId = bookingCategory;
        }
      }
      
      // Fallback to service.category if not found in bookingDetails
      if (!categoryId && service.category) {
        if (typeof service.category === 'object') {
          const categoryObj = service.category as any;
          // Check for _id first (most common case)
          if (categoryObj._id) {
            categoryId = categoryObj._id;
          } else if (categoryObj.id) {
            categoryId = categoryObj.id;
          }
        } else if (typeof service.category === 'string') {
          // If category is a string, it could be an ID or slug
          // Try to use it as ID first (backend will validate)
          categoryId = service.category;
        }
      }
      
      // If still no categoryId and we have serviceId, try to fetch service details
      // This is a fallback for cases where category info is missing
      if (!categoryId && service.id) {
        try {
          const serviceResponse = await api.services.getById(service.id);
          if (serviceResponse.success && serviceResponse.data) {
            const serviceData = (serviceResponse.data as any).service || serviceResponse.data;
            if (serviceData.category) {
              if (typeof serviceData.category === 'object' && serviceData.category._id) {
                categoryId = serviceData.category._id;
              } else if (typeof serviceData.category === 'string') {
                categoryId = serviceData.category;
              }
            }
          }
        } catch (error) {
          console.error('Failed to fetch service details for category:', error);
          // Continue without categoryId - backend will handle validation
        }
      }

      const response = await api.coupons.validate({
        code: couponCode.trim(),
        amount: subtotal,
        type: "booking",
        serviceId: service.id,
        categoryId: categoryId,
        bookingId: currentBookingId || undefined,
      });

      if (response.success && response.data) {
        setAppliedCoupon(response.data);
        setCouponUsageId(response.data.usageId || null);
        toast({
          title: "Coupon Applied",
          description: `Discount of ₹${response.data.discountAmount.toLocaleString()} applied!`,
          variant: "default",
        });
      } else {
        // Handle case where response is not successful
        toast({
          title: "Invalid Coupon",
          description: (response as any).error?.message || "This coupon code is invalid or expired",
          variant: "destructive",
        });
        setAppliedCoupon(null);
      }
    } catch (error: any) {
      console.error("Coupon validation error:", error);
      // Handle different error formats
      const errorMessage = 
        error?.response?.data?.error?.message ||
        error?.error?.message ||
        error?.message ||
        "This coupon code is invalid or expired";
      
      toast({
        title: "Invalid Coupon",
        description: errorMessage,
        variant: "destructive",
      });
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = async () => {
    // Cancel coupon usage if it was created
    if (couponUsageId) {
      try {
        await api.coupons.cancelUsage(couponUsageId);
      } catch (error) {
        console.error("Failed to cancel coupon usage:", error);
      }
    }
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponUsageId(null);
  };

  const fetchDynamicFields = async () => {
    setLoadingFields(true);
    try {
      const response = await api.bookingFields.getConfig({
        category: categorySlug,
        subcategory: service.subcategory,
        itemType: service.itemType,
      });

      if (response.success && response.data) {
        setDynamicFields(response.data.fields || []);
      }
    } catch (error: any) {
      console.error("Failed to load booking fields:", error);
      // Continue without dynamic fields if fetch fails
      setDynamicFields([]);
    } finally {
      setLoadingFields(false);
    }
  };

  const handleAutoFetchLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser does not support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const token = getMapplsAccessToken();
            const placeName = token
              ? await mapplsRevGeocodeApi(latitude, longitude, token)
              : null;
            if (placeName) {
              const parts = placeName.split(",").map((p) => p.trim());
              const address = parts[0] || "";
              const city = parts.length >= 2 ? parts[parts.length - 3] || parts[1] : "";
              const stateZip = parts.length >= 2 ? parts[parts.length - 2] || "" : "";
              const stateZipMatch = stateZip.match(/^(.+?)\s+(\d{5,6})$/);
              const state = stateZipMatch ? stateZipMatch[1].trim() : stateZip;
              const zipCode = stateZipMatch ? stateZipMatch[2].trim() : "";

              setValue("location.address", address);
              if (city) setValue("location.city", city);
              if (state) setValue("location.state", state);
              if (zipCode) setValue("location.zipCode", zipCode);

              toast({
                title: "Location fetched",
                description: "Your current location has been auto-filled.",
              });
            } else {
              toast({
                title: "Failed to fetch address",
                description: "Could not get address from your location. Please enter manually.",
                variant: "destructive",
              });
            }
          } catch (error: any) {
            toast({
              title: "Error",
              description: error.message || "Failed to get your location address.",
              variant: "destructive",
            });
          } finally {
            setIsFetchingLocation(false);
          }
        },
        (error) => {
          let errorMessage = "Unable to get your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
              break;
          }
          toast({
            title: "Location error",
            description: errorMessage,
            variant: "destructive",
          });
          setIsFetchingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load location services.",
        variant: "destructive",
      });
      setIsFetchingLocation(false);
    }
  };

  const onFormSubmit = async (data: BookingFormData) => {
    if (step === "details") {
      setIsSaving(true);
      try {
        // Extract dynamic field values
        const formData: Record<string, any> = {};
        dynamicFields.forEach((field) => {
          if (data[field.fieldKey] !== undefined) {
            formData[field.fieldKey] = data[field.fieldKey];
          }
        });

        const result = await onSubmit({
          date: data.date,
          time: data.time,
          requirementNote: data.requirementNote,
          location: data.location,
          formData: Object.keys(formData).length > 0 ? formData : undefined,
          paymentOption: "full",
          saveOnly: true,
        });

        if (result) {
          setCurrentBookingId(result);
          
          // Save GST number and PAN number immediately after booking is created
          if (gstNumber.trim() || panNumber.trim()) {
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/bookings/${result}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                },
                body: JSON.stringify({
                  metadata: {
                    ...(gstNumber.trim() && { buyerGST: gstNumber.trim() }),
                    ...(panNumber.trim() && { buyerPAN: panNumber.trim() }),
                  },
                }),
              });
              
              if (response.ok) {
                // Reload booking details to get updated metadata
                const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/bookings/${result}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                  },
                });
                if (bookingResponse.ok) {
                  const bookingData = await bookingResponse.json();
                  setBookingDetails(bookingData);
                }
              }
            } catch (error) {
              console.error("Failed to save GST number:", error);
              // Don't show error as this is optional
            }
          }
        }

        // Move to payment step
        setTimeout(() => {
          setStep("payment");
        }, 100);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to save booking",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePaymentSuccess = () => {
    reset();
    setStep("details");
    setCurrentBookingId(null);
    setGstNumber("");
    onOpenChange(false);
    // Redirect to bookings page after successful payment
    router.push("/dashboard/buyer/orders");
    toast({
      title: "Booking Confirmed!",
      description: "Your booking has been confirmed. View it in My Bookings.",
      variant: "default",
    });
  };

  const handleCancel = () => {
    reset();
    setStep("details");
    setCurrentBookingId(null);
    setGstNumber("");
    setPanNumber("");
    onOpenChange(false);
  };

  const watchedDate = watch("date");
  const watchedTime = watch("time");
  const watchedRequirementNote = watch("requirementNote");

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent dialog from closing when clicking on Google Places autocomplete suggestions
          const target = e.target as HTMLElement;
          if (target.closest('.pac-container')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step === "details" ? "Book Service" : "Complete Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "details"
              ? `Fill in the details to book ${service.title}`
              : "Complete your payment to confirm the booking"}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
            {/* Core Fields - Date */}
            <div className="space-y-2">
              <Label>
                Preferred Date <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground",
                          errors.date && "border-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.date && (
                <p className="text-sm text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>

            {/* Core Fields - Time */}
            <div className="space-y-2">
              <Label>
                Preferred Time <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  {...register("time", { required: "Time is required" })}
                  className={cn("pl-9", errors.time && "border-destructive")}
                />
              </div>
              {errors.time && (
                <p className="text-sm text-destructive">
                  {errors.time.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Provider will confirm availability
              </p>
            </div>

            {/* Core Fields - Location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Service Location <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFetchLocation}
                  disabled={isFetchingLocation}
                  className="h-7 text-xs gap-1.5"
                >
                  {isFetchingLocation ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      Auto Fetch
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <Controller
                  name="location.address"
                  control={control}
                  rules={{ required: "Address is required" }}
                  render={({ field }) => {
                    const { ref: fieldRef, ...fieldProps } = field;
                    return (
                      <Input
                        {...fieldProps}
                        ref={(e) => {
                          // Set react-hook-form ref
                          if (typeof fieldRef === 'function') {
                            fieldRef(e);
                          } else if (fieldRef && typeof fieldRef === 'object' && 'current' in fieldRef) {
                            (fieldRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                          }
                          // Set local ref for autocomplete
                          if (addressInputRef) {
                            addressInputRef.current = e;
                          }
                          // Set autocomplete ref
                          if (placesInputRef && typeof placesInputRef === 'object' && 'current' in placesInputRef) {
                            (placesInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
                          }
                        }}
                        placeholder="Address"
                        className={cn(errors.location?.address && "border-destructive")}
                      />
                    );
                  }}
                />
                {errors.location?.address && (
                  <p className="text-sm text-destructive">{errors.location.address.message}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="City"
                    {...register("location.city", {
                      required: "City is required",
                    })}
                    className={cn(errors.location?.city && "border-destructive")}
                  />
                  <Input
                    placeholder="State"
                    {...register("location.state", {
                      required: "State is required",
                    })}
                    className={cn(errors.location?.state && "border-destructive")}
                  />
                </div>
                <Input
                  placeholder="ZIP Code (optional)"
                  {...register("location.zipCode")}
                />
              </div>
              {(errors.location?.address || errors.location?.city || errors.location?.state) && (
                <p className="text-sm text-destructive">
                  Please fill all required location fields
                </p>
              )}
            </div>

            {/* Core Fields - Additional Notes */}
            <div className="space-y-2">
              <Label>
                Additional Requirements <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Describe your requirements, special requests, or any additional details..."
                {...register("requirementNote", {
                  required: "Requirements are required",
                  minLength: {
                    value: 10,
                    message: "Please provide at least 10 characters",
                  },
                })}
                rows={4}
                className={cn(errors.requirementNote && "border-destructive")}
              />
              {errors.requirementNote && (
                <p className="text-sm text-destructive">
                  {errors.requirementNote.message}
                </p>
              )}
            </div>

            {/* GST Number Field */}
            <div className="space-y-2">
              <Label htmlFor="gst-number-form">
                GST Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </Label>
              <Input
                id="gst-number-form"
                placeholder="Enter your GST number (e.g., 27ABCDE1234F1Z5)"
                value={gstNumber}
                onChange={(e) => {
                  // Allow only alphanumeric characters and remove spaces
                  const value = e.target.value.toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/g, '');
                  setGstNumber(value);
                }}
                maxLength={15}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter your GSTIN if you need an invoice with GST details
              </p>
            </div>

            {/* PAN Number Field */}
            <div className="space-y-2">
              <Label htmlFor="pan-number-form">
                PAN Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
              </Label>
              <Input
                id="pan-number-form"
                placeholder="Enter your PAN number (e.g., ABCDE1234F)"
                value={panNumber}
                onChange={(e) => {
                  // Allow only alphanumeric characters and remove spaces, max 10 characters
                  const value = e.target.value.toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/g, '');
                  setPanNumber(value);
                }}
                maxLength={10}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter your PAN if you need an invoice with PAN details
              </p>
            </div>

            {/* Dynamic Fields */}
            {loadingFields ? (
              <div className="space-y-4 pt-4 border-t">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : dynamicFields.length > 0 ? (
              <div className="space-y-4 pt-4 border-t">
                <Label className="text-sm font-semibold">Additional Details</Label>
                {dynamicFields.map((field) => (
                  <DynamicBookingField
                    key={field._id}
                    field={field}
                    control={control}
                    errors={errors}
                  />
                ))}
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-4">
            {/* Payment Step */}
            {currentBookingId ? (
              loadingBooking ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading payment details...</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Service:</span>
                      <span className="font-semibold">{service.title}</span>
                    </div>
                    
                    {/* Payment Breakup */}
                    <div className="space-y-2 pt-2 border-t">
                      {/* Service Amount */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Amount:</span>
                        <span className="font-medium">₹{paymentCalculation.serviceAmount.toLocaleString()}</span>
                      </div>
                      
                      {/* Platform Charge */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Platform Charge:</span>
                        <span className="font-medium">₹{paymentCalculation.platformCharge.toLocaleString()}</span>
                      </div>
                      
                      {/* GST Calculation */}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (18% on Service Amount):</span>
                        <span className="font-medium">₹{paymentCalculation.gst.toLocaleString()}</span>
                      </div>
                      
                      {/* Subtotal */}
                      <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                        <span className="text-muted-foreground font-medium">Subtotal:</span>
                        <span className="font-semibold">₹{paymentCalculation.subtotal.toLocaleString()}</span>
                      </div>
                      
                      {/* Discount (if coupon applied) */}
                      {appliedCoupon && paymentCalculation.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 pt-1">
                          <span className="font-medium">Discount ({appliedCoupon.coupon.code}):</span>
                          <span className="font-semibold">-₹{paymentCalculation.discount.toLocaleString()}</span>
                        </div>
                      )}
                      
                      {/* Total Payable */}
                      <div className="flex justify-between text-base font-bold pt-2 border-t-2 mt-2">
                        <span>Total Payable:</span>
                        <span className="text-primary">₹{paymentCalculation.totalPayable.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code Section */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <Label htmlFor="coupon-code">Coupon Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon-code"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={validatingCoupon || !!appliedCoupon}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !validatingCoupon && couponCode.trim() && !appliedCoupon) {
                            e.preventDefault();
                            handleApplyCoupon();
                          }
                        }}
                      />
                      {appliedCoupon ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveCoupon}
                          className="whitespace-nowrap"
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyCoupon}
                          disabled={validatingCoupon || !couponCode.trim()}
                        >
                          {validatingCoupon ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Applying...
                            </>
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      )}
                    </div>
                    {appliedCoupon && (
                      <div className="space-y-1">
                        <p className="text-xs text-green-600 font-medium">
                          ✓ {appliedCoupon.coupon.description || `Discount applied: ${appliedCoupon.coupon.discountType === 'percentage' ? `${appliedCoupon.coupon.discountValue}%` : `₹${appliedCoupon.coupon.discountValue}`}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          You saved ₹{appliedCoupon.discountAmount.toLocaleString()}!
                        </p>
                      </div>
                    )}
                  </div>

                  {/* GST Number Section */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <Label htmlFor="gst-number">
                      GST Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="gst-number"
                      placeholder="Enter your GST number (e.g., 27ABCDE1234F1Z5)"
                      value={gstNumber}
                      onChange={(e) => {
                        // Allow only alphanumeric characters and remove spaces
                        const value = e.target.value.toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/g, '');
                        setGstNumber(value);
                      }}
                      maxLength={15}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your GSTIN if you need an invoice with GST details
                    </p>
                  </div>

                  {/* PAN Number Section */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <Label htmlFor="pan-number">
                      PAN Number <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                    </Label>
                    <Input
                      id="pan-number"
                      placeholder="Enter your PAN number (e.g., ABCDE1234F)"
                      value={panNumber}
                      onChange={(e) => {
                        // Allow only alphanumeric characters and remove spaces, max 10 characters
                        const value = e.target.value.toUpperCase().replace(/\s/g, '').replace(/[^A-Z0-9]/g, '');
                        setPanNumber(value);
                      }}
                      maxLength={10}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your PAN if you need an invoice with PAN details
                    </p>
                  </div>

                  {/* Total Amount */}
                  <div className="p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">Total to Pay:</span>
                      <span className="font-bold text-xl text-primary">
                        ₹{(actualPaymentAmount || paymentCalculation.totalPayable).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <RazorpayCheckout
                    bookingId={currentBookingId}
                    bookingDescription={service.title}
                    amount={paymentCalculation.totalPayable}
                    couponUsageId={couponUsageId ?? undefined}
                    onAmountReceived={(amount) => {
                      // Update display amount when backend confirms the actual amount
                      setActualPaymentAmount(amount);
                    }}
                    onSuccess={handlePaymentSuccess}
                    onBeforePayment={async () => {
                      // Update booking with GST number and PAN number before payment
                      if (gstNumber.trim() || panNumber.trim()) {
                        await updateBookingTaxDetails();
                      }
                    }}
                    className="w-full"
                  >
                    Pay ₹{(actualPaymentAmount || paymentCalculation.totalPayable).toLocaleString()} Now
                  </RazorpayCheckout>
                </>
              )
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Preparing payment...</p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("details")}>
                Back
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
