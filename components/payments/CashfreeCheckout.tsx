"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface CashfreeCheckoutProps {
  // Booking payment props
  bookingId?: string;
  cartId?: string;
  bookingDescription?: string;
  couponUsageId?: string;
  bookingPayload?: Record<string, any>;
  bookingPaymentStage?: "initial" | "balance";
  requirementId?: string;
  requirementDescription?: string;

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
    Cashfree?: any;
  }
}

export function CashfreeCheckout({
  bookingId,
  cartId,
  bookingDescription,
  couponUsageId,
  bookingPayload,
  bookingPaymentStage = "initial",
  requirementId,
  requirementDescription,
  amount,
  onSuccess,
  onError,
  onAmountReceived,
  onBeforePayment,
  className,
  variant = "default",
  children,
}: CashfreeCheckoutProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isBooking = !!bookingId || !!cartId;
  const isRequirement = !!requirementId;

  // Lazy-load Cashfree JS SDK from CDN when needed
  const loadCashfree = async (): Promise<any> => {
    if (typeof window === "undefined") return null;

    const existingFn = window.Cashfree;
    if (existingFn && typeof existingFn === "function") {
      return existingFn({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") || "sandbox",
      });
    }

    return new Promise((resolve, reject) => {
      const scriptId = "cashfree-js-sdk";
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (existingScript) {
        const cf = window.Cashfree;
        if (cf && typeof cf === "function") {
          resolve(
            cf({
              mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") || "sandbox",
            })
          );
          return;
        }
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        const cf = window.Cashfree;
        if (!cf || typeof cf !== "function") {
          reject(new Error("Cashfree SDK failed to initialize"));
          return;
        }
        resolve(
          cf({
            mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") || "sandbox",
          })
        );
      };
      script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!isBooking && !isRequirement) {
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

      // 1. Create Cashfree order on backend
      let orderResponse;
      if (isRequirement) {
        if (!requirementId) {
          throw new Error("Requirement ID is required");
        }
        orderResponse = await api.payments.createRequirementOrder({
          requirementId,
          gateway: "cashfree",
        });
      } else if (bookingPaymentStage === "balance") {
        if (!bookingId) {
          throw new Error("Booking ID is required for balance payment");
        }
        orderResponse = await api.payments.createBookingBalanceOrder({
          bookingId,
          gateway: "cashfree",
        });
      } else {
        orderResponse = await api.payments.createBookingOrder({
          bookingId,
          cartId,
          couponUsageId,
          ...(bookingPayload || {}),
          gateway: "cashfree",
        });
      }

      if (!orderResponse.success || !orderResponse.data) {
        const errorMessage =
          orderResponse.error?.message || "Failed to create payment order";
        const lower = errorMessage.toLowerCase();
        if (
          bookingPaymentStage === "balance" &&
          lower.includes("no outstanding balance")
        ) {
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
            description:
              "You need to be logged in to complete payment. Please sign in and try again.",
            variant: "destructive",
          });
          onError?.("Please log in to continue");
          return;
        }
        throw new Error(errorMessage);
      }

      const orderData = orderResponse.data as Record<string, unknown>;
      const orderId = orderData.orderId as string;
      const paymentSessionId = (orderData.paymentSessionId ?? orderData.key) as string;
      const orderAmount = orderData.amount as number;
      const currency = orderData.currency as string;
      const paymentId = orderData.paymentId as string;

      // Notify parent component of the actual amount from backend (already in rupees)
      if (onAmountReceived && orderAmount) {
        onAmountReceived(orderAmount);
      }

      // 2. Load Cashfree SDK
      const cashfree = await loadCashfree();
      if (!cashfree) {
        throw new Error(
          "Payment gateway is not available. Please refresh and try again."
        );
      }

      // 3. Open Cashfree checkout (popup/modal)
      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result?.error) {
        console.error("Cashfree checkout error:", result.error);
        throw new Error(
          result.error?.message ||
            "Payment cancelled or failed. Please try again."
        );
      }

      // 4. Verify payment on backend
      const verifyResponse = isRequirement
        ? await api.payments.verifyCashfreeRequirement({
            orderId,
            paymentId,
          })
        : await api.payments.verifyCashfreeBooking({
            orderId,
            paymentId,
          });

      if (verifyResponse.success) {
        const bookingIdResp = (verifyResponse as any)?.data?.booking?.id;
        const bookingStatus = (verifyResponse as any)?.data?.booking?.status;
        if (bookingIdResp) {
          localStorage.setItem("lastBookingId", bookingIdResp);
        }
        const bookingMessage =
          bookingPaymentStage === "balance"
            ? "Your booking balance has been paid successfully."
            : bookingStatus === "PENDING_PROVIDER"
            ? "Your booking is pending provider acceptance."
            : "Your booking has been confirmed successfully!";

        toast({
          title: "Payment Successful",
          description: isRequirement
            ? requirementDescription || "Requirement payment completed successfully."
            : bookingDescription || bookingMessage,
          variant: "default",
        });
        onSuccess?.();
      } else {
        throw new Error(
          verifyResponse.error?.message || "Payment verification failed"
        );
      }
    } catch (error: any) {
      console.error("Cashfree payment error:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to complete payment. Please try again.",
        variant: "destructive",
      });
      onError?.(error.message || "Failed to complete payment");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
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

