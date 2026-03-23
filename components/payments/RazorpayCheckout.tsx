"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface RazorpayCheckoutProps {
  // Subscription payment props
  subscriptionId?: string;
  subscriptionType?: "buyer" | "provider";
  subscriptionName?: string;
  
          // Booking payment props
          bookingId?: string;
          cartId?: string;
          bookingDescription?: string;
          couponUsageId?: string;
          bookingPayload?: Record<string, any>;
  bookingPaymentStage?: "initial" | "balance";
  
  // Common props
  amount: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onAmountReceived?: (amount: number) => void; // Callback when backend confirms actual amount
  onBeforePayment?: () => Promise<void> | void; // Callback before payment is initiated
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  children?: React.ReactNode;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayCheckout({
          subscriptionId,
          subscriptionType,
          subscriptionName,
          bookingId,
          cartId,
          bookingDescription,
          couponUsageId,
        bookingPayload,
        bookingPaymentStage = "initial",
          amount,
          onSuccess,
          onError,
          onAmountReceived,
          onBeforePayment,
          className,
          variant = "default",
          children,
        }: RazorpayCheckoutProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Determine payment type
  const isSubscription = !!subscriptionId;
  const isBooking = !!bookingId || !!cartId;

  // Load Razorpay script - preload for faster modal opening
  useEffect(() => {
    // Filter console errors for Razorpay's unsafe header warnings (known SDK issue - doesn't affect functionality)
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    const filterRazorpayWarnings = (method: typeof console.error, ...args: any[]) => {
      const message = args[0]?.toString() || '';
      if (message.includes('unsafe header') || message.includes('x-rtb-fingerprint-id')) {
        // Suppress Razorpay's harmless unsafe header warnings
        return;
      }
      method.apply(console, args);
    };

    console.error = (...args: any[]) => filterRazorpayWarnings(originalConsoleError, ...args);
    console.warn = (...args: any[]) => filterRazorpayWarnings(originalConsoleWarn, ...args);

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    
    if (existingScript) {
      // Script already exists, check if Razorpay is ready
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        setTimeout(() => {
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
        }, 1000);
      } else {
        // Script exists but Razorpay not ready yet, wait for it
        const checkRazorpay = setInterval(() => {
          if (window.Razorpay) {
            setRazorpayLoaded(true);
            clearInterval(checkRazorpay);
            setTimeout(() => {
              console.error = originalConsoleError;
              console.warn = originalConsoleWarn;
            }, 1000);
          }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkRazorpay);
        }, 5000);
      }
    } else {
      // Load script with higher priority
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = false; // Load synchronously for faster initialization
    script.onload = () => {
      // Wait for Razorpay to be fully initialized
      const initCheck = setInterval(() => {
        if (window.Razorpay && typeof window.Razorpay === 'function') {
          setRazorpayLoaded(true);
          clearInterval(initCheck);
          // Additional check to ensure Razorpay is fully ready
          setTimeout(() => {
            if (window.Razorpay && typeof window.Razorpay === 'function') {
              // Razorpay is ready
            }
            // Restore console methods after initialization
            setTimeout(() => {
              console.error = originalConsoleError;
              console.warn = originalConsoleWarn;
            }, 500);
          }, 200);
        }
      }, 30); // Check more frequently
      
      // Timeout after 3 seconds
      setTimeout(() => {
        clearInterval(initCheck);
        if (window.Razorpay) {
          setRazorpayLoaded(true);
        }
      }, 3000);
    };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        toast({
          title: "Error",
          description: "Failed to load payment gateway. Please refresh the page.",
          variant: "destructive",
        });
      };
      
      document.body.appendChild(script);
    }

    return () => {
      // Restore console methods on cleanup
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [toast]);

  const handlePayment = async () => {
    // Ensure Razorpay is fully loaded and ready
    if (!razorpayLoaded || !window.Razorpay) {
      toast({
        title: "Loading",
        description: "Payment gateway is still loading. Please wait...",
        variant: "default",
      });
      return;
    }
    
    // Double check that Razorpay is a function (fully initialized)
    if (typeof window.Razorpay !== 'function') {
      toast({
        title: "Loading",
        description: "Initializing payment gateway. Please wait...",
        variant: "default",
      });
      // Wait a bit and try again
      setTimeout(() => {
        if (typeof window.Razorpay === 'function') {
          handlePayment();
        }
      }, 500);
      return;
    }

    if (!isSubscription && !isBooking) {
      toast({
        title: "Error",
        description: "Invalid payment configuration",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Call onBeforePayment callback if provided
      if (onBeforePayment) {
        await onBeforePayment();
      }

      // Create order on backend
      let orderResponse;
      if (isSubscription) {
        if (!subscriptionId || !subscriptionType) {
          throw new Error("Subscription ID and type are required");
        }
        orderResponse = await api.payments.createOrder({
          subscriptionId,
          subscriptionType,
        });
      } else if (isBooking) {
        if (bookingPaymentStage === "balance") {
          if (!bookingId) {
            throw new Error("Booking ID is required for balance payment");
          }
          orderResponse = await api.payments.createBookingBalanceOrder({
            bookingId,
          });
        } else {
          orderResponse = await api.payments.createBookingOrder({
            bookingId,
            cartId,
            couponUsageId: couponUsageId,
            ...(bookingPayload || {}),
          });
        }
      } else {
        throw new Error("Invalid payment type");
      }

      if (!orderResponse.success || !orderResponse.data) {
        const errorMessage = orderResponse.error?.message || "Failed to create payment order";
        const lower = errorMessage.toLowerCase();
        if (bookingPaymentStage === "balance" && lower.includes("no outstanding balance")) {
          setIsLoading(false);
          toast({
            title: "No pending balance",
            description: "This booking does not have any outstanding amount.",
            variant: "default",
          });
          return;
        }
        // 401 / auth errors: show clear message so user knows to log in
        const isAuthError =
          lower.includes("authentic") ||
          lower.includes("session expired") ||
          lower.includes("invalid token") ||
          lower.includes("log in") ||
          lower.includes("user not authenticated");
        if (isAuthError) {
          setIsLoading(false);
          toast({
            title: "Please log in",
            description: "You need to be logged in to complete payment. Please sign in and try again.",
            variant: "destructive",
          });
          onError?.("Please log in to continue");
          return;
        }
        throw new Error(errorMessage);
      }

      const { orderId, amount: orderAmount, currency, paymentId, key } = orderResponse.data;

      // Notify parent component of the actual amount from backend (convert from paise to rupees)
      if (onAmountReceived && orderAmount) {
        const amountInRupees = orderAmount / 100;
        onAmountReceived(amountInRupees);
      }

      // Initialize Razorpay checkout
      const options = {
        key: key,
        amount: orderAmount,
        currency: currency,
        name: "Imagineering India",
        description: isSubscription 
          ? `Subscription: ${subscriptionName || "Premium Plan"}`
          : bookingDescription || "Service Booking",
        order_id: orderId,
        handler: async function (response: any) {
          // Restore console methods when payment handler is called
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          
          try {
            // Verify payment on backend
            let verifyResponse;
            if (isSubscription) {
              verifyResponse = await api.payments.verify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: paymentId,
              });
            } else if (isBooking) {
              verifyResponse = await api.payments.verifyBooking({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: paymentId,
              });
            } else {
              throw new Error("Invalid payment type");
            }

            if (verifyResponse.success) {
              const bookingId = (verifyResponse as any)?.data?.booking?.id;
              const bookingStatus = (verifyResponse as any)?.data?.booking?.status;
              if (bookingId) {
                localStorage.setItem("lastBookingId", bookingId);
              }
              const bookingMessage =
                bookingPaymentStage === "balance"
                  ? "Your booking balance has been paid successfully."
                  : bookingStatus === "PENDING_PROVIDER"
                    ? "Your booking is pending provider acceptance."
                    : "Your booking has been confirmed successfully!";
              toast({
                title: "Payment Successful",
                description: isSubscription
                  ? "Your subscription has been activated successfully!"
                  : bookingMessage,
                variant: "default",
              });
              onSuccess?.();
            } else {
              throw new Error(verifyResponse.error?.message || "Payment verification failed");
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast({
              title: "Verification Failed",
              description: error.message || "Failed to verify payment. Please contact support.",
              variant: "destructive",
            });
            onError?.(error.message || "Payment verification failed");
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          // You can get user details from auth context if available
        },
        theme: {
          color: "#2563eb", // Primary color
        },
        modal: {
          ondismiss: function () {
            // Restore console methods when modal is dismissed
            console.error = originalConsoleError;
            console.warn = originalConsoleWarn;
            setIsLoading(false);
            toast({
              title: "Payment Cancelled",
              description: "You cancelled the payment process.",
              variant: "default",
            });
          },
          // Ensure modal is fully interactive
          animation: true,
          backdropclose: true,
          escape: true,
        },
      };

      // Suppress Razorpay's unsafe header warnings during payment operations
      // This is a known Razorpay SDK issue - the warning doesn't affect payment functionality
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      
      const suppressRazorpayWarnings = (method: typeof console.error, ...args: any[]) => {
        const message = args[0]?.toString() || '';
        if (message.includes('unsafe header') || message.includes('x-rtb-fingerprint-id') || 
            message.includes('Refused to get unsafe header')) {
          // Suppress known harmless Razorpay SDK warnings
          return;
        }
        method.apply(console, args);
      };
      
      console.error = (...args: any[]) => suppressRazorpayWarnings(originalConsoleError, ...args);
      console.warn = (...args: any[]) => suppressRazorpayWarnings(originalConsoleWarn, ...args);

      try {
        const razorpay = new window.Razorpay(options);
        
        // Set up event handlers before opening
        razorpay.on("payment.failed", function (response: any) {
          console.error("Payment failed:", response);
          setIsLoading(false);
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          toast({
            title: "Payment Failed",
            description: response.error.description || "Payment could not be processed.",
            variant: "destructive",
          });
          onError?.(response.error.description || "Payment failed");
        });

        // Open modal - ensure Razorpay instance is fully ready
        // Use requestAnimationFrame for smoother modal opening
        try {
          // Use requestAnimationFrame to ensure DOM is ready and modal opens smoothly
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              try {
                // Open the modal
                razorpay.open();
                
                // Restore console methods after modal opens
                // Note: The iframe inside loads asynchronously - this is normal Razorpay behavior
                // The modal will become fully interactive once the iframe content loads
                setTimeout(() => {
                  console.error = originalConsoleError;
                  console.warn = originalConsoleWarn;
                }, 2000);
                
              } catch (openError: any) {
                console.error("Error opening Razorpay modal:", openError);
                setIsLoading(false);
                console.error = originalConsoleError;
                console.warn = originalConsoleWarn;
                toast({
                  title: "Error",
                  description: "Failed to open payment window. Please try again.",
                  variant: "destructive",
                });
                onError?.(openError.message || "Failed to open payment window");
              }
            });
          });
          
        } catch (error: any) {
          console.error("Error initializing Razorpay:", error);
          setIsLoading(false);
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
          onError?.(error.message || "Failed to initialize payment");
        }
      } catch (error: any) {
        // Restore console methods on error
        console.error = originalConsoleError;
        console.warn = originalConsoleWarn;
        throw error;
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      onError?.(error.message || "Failed to initiate payment");
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || !razorpayLoaded}
      className={className}
      variant={variant}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        children || `Pay ₹${amount.toLocaleString()}`
      )}
    </Button>
  );
}
