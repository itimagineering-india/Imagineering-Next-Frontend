"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Crown,
  CheckCircle2,
  XCircle,
  Calendar,
  CreditCard,
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  MapPin,
  FileText,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { supplierFeatures, subscriptionPricing } from "@/data/subscription";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export async function getServerSideProps() { return { props: {} }; }

interface Subscription {
  plan: "free" | "premium" | "pro" | "business";
  status: "active" | "inactive" | "expired" | "cancelled";
  startDate?: string;
  endDate?: string;
  expiryDate?: string;
  autoRenew: boolean;
  paymentMethod?: string;
  razorpaySubscriptionId?: string;
  nextBillingDate?: string;
}

export default function ProviderSubscription() {
  const [subscription, setSubscription] = useState<Subscription>({
    plan: "free",
    status: "inactive",
    autoRenew: false,
  });
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayDialogOpen, setRazorpayDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedGateway, setSelectedGateway] = useState<"razorpay" | "cashfree">("razorpay");
  const { toast } = useToast();
  const { user, refresh } = useAuth();

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [mySubRes, availableRes] = await Promise.all([
        api.subscriptions.getMy('provider'),
        api.subscriptions.getAvailable('provider')
      ]);

      if (mySubRes.success && mySubRes.data) {
        const data = mySubRes.data as { subscription?: { name?: string; razorpaySubscriptionId?: string }; status?: string; startDate?: string; endDate?: string; autoRenew?: boolean };
        setSubscription({
          plan: ((data.subscription?.name?.toLowerCase() || "free") as Subscription["plan"]),
          status: ((data.status || "inactive") as Subscription["status"]),
          startDate: data.startDate,
          endDate: data.endDate,
          expiryDate: data.endDate,
          autoRenew: data.autoRenew || false,
          razorpaySubscriptionId: data.subscription?.razorpaySubscriptionId,
          nextBillingDate: data.endDate,
        });
      }

      if (availableRes.success && availableRes.data) {
        const availData = availableRes.data as { subscriptions?: any[] };
        if (availData.subscriptions) setAvailablePlans(availData.subscriptions);
      }
    } catch (error) {
      console.error("Failed to fetch subscription data:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (planOrBillingCycle: any) => {
    // Support both direct plan object and shorthand string like "monthly"/"yearly"
    let planToUse = planOrBillingCycle;

    if (!planOrBillingCycle || typeof planOrBillingCycle === "string") {
      const billingCycle = (planOrBillingCycle as string) || "monthly";
      planToUse =
        availablePlans.find(
          (p: any) => p.billingCycle === billingCycle && p.price > 0
        ) || availablePlans.find((p: any) => p.price > 0);
    }

    if (!planToUse) {
      toast({
        title: "Plan unavailable",
        description: "No subscription plan is available right now. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    setSelectedPlan(planToUse);
    setSelectedGateway("razorpay");
    setRazorpayDialogOpen(true);
  };

  // Lazy-load Cashfree JS SDK from CDN when needed
  const loadCashfree = async (): Promise<any> => {
    if (typeof window === "undefined") return null;
    const existing = (window as any).Cashfree;
    if (existing && typeof existing === "function") {
      return existing({
        mode: (process.env.NEXT_PUBLIC_CASHFREE_MODE as "sandbox" | "production") || "sandbox",
      });
    }

    return new Promise((resolve, reject) => {
      const scriptId = "cashfree-js-sdk";
      if (document.getElementById(scriptId)) {
        const cf = (window as any).Cashfree;
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
        const cf = (window as any).Cashfree;
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

  const handleRazorpayPayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      // 1. Create Razorpay order
      const orderRes = await api.payments.createOrder({
        subscriptionId: selectedPlan._id,
        subscriptionType: 'provider'
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error?.message || "Failed to create payment order");
      }

      const { orderId, amount, currency, key, paymentId } = orderRes.data;

      // 2. Open Razorpay Checkout
      const options = {
        key,
        amount,
        currency,
        name: "Imagineering India",
        description: `Subscription: ${selectedPlan.name}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            // 3. Verify payment
            const verifyRes = await api.payments.verify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId,
            });

            if (verifyRes.success) {
              toast({
                title: "Success",
                description: "Subscription activated successfully!",
              });
              setRazorpayDialogOpen(false);
              await refresh();
              await fetchSubscriptionData();
            } else {
              throw new Error(verifyRes.error?.message || "Payment verification failed");
            }
          } catch (err: any) {
            toast({
              title: "Payment Error",
              description: err.message,
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
        theme: {
          color: "#e74c3c",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashfreePayment = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    try {
      // 1. Create Cashfree order
      const orderRes = await api.payments.createCashfreeOrder({
        subscriptionId: selectedPlan._id,
        subscriptionType: "provider",
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error?.message || "Failed to create Cashfree payment order");
      }

      const { orderId, paymentSessionId, paymentId } = orderRes.data;

      // 2. Load Cashfree SDK
      const cashfree = await loadCashfree();
      if (!cashfree) {
        throw new Error("Payment gateway is not available. Please refresh and try again.");
      }

      // 3. Open Cashfree checkout (popup/modal)
      const result = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result?.error) {
        throw new Error(
          result.error?.message ||
            "Payment cancelled or failed. Please try again."
        );
      }

      // 4. Verify payment with backend
      const verifyRes = await api.payments.verifyCashfree({
        orderId,
        paymentId,
      });

      if (verifyRes.success) {
        toast({
          title: "Success",
          description: "Subscription activated successfully!",
        });
        setRazorpayDialogOpen(false);
        await refresh();
        await fetchSubscriptionData();
      } else {
        throw new Error(verifyRes.error?.message || "Payment verification failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.")) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.subscriptions.cancel({ type: 'provider' });
      if (res.success) {
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription will not renew after the current period.",
        });
        await refresh();
        await fetchSubscriptionData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoRenewToggle = async (enabled: boolean) => {
    // This would typically be a separate API call, but for now we'll use cancel/reactivate logic
    // or just update the local state if the backend doesn't support a direct toggle yet.
    toast({
      title: "Feature coming soon",
      description: "Please contact support to change auto-renewal settings.",
    });
  };

  const getPlanBadge = () => {
    if (subscription.plan === "free") {
      return <Badge variant="secondary" className="text-[10px] md:text-xs">Free Plan</Badge>;
    }
    return (
      <Badge className="bg-warning text-warning-foreground text-[10px] md:text-xs">
        <Crown className="h-3 w-3 mr-1" />
        Premium
      </Badge>
    );
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case "active":
        return (
          <Badge className="bg-success text-success-foreground text-[10px] md:text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive" className="text-[10px] md:text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary" className="text-[10px] md:text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary" className="text-[10px] md:text-xs">Inactive</Badge>;
    }
  };

  const daysUntilExpiry = subscription.expiryDate
    ? Math.ceil(
        (new Date(subscription.expiryDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const isPremium = subscription.plan !== "free" && subscription.status === "active";

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Subscription
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage your subscription and premium features
            </p>
          </div>
        </div>

        {/* Current Subscription Card */}
        <Card className={isPremium ? "border-warning border-2" : ""}>
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 md:gap-3">
                {isPremium && <Crown className="h-5 w-5 md:h-6 md:w-6 text-warning shrink-0" />}
                <div>
                  <CardTitle className="text-base md:text-xl">Current Plan</CardTitle>
                  <CardDescription className="text-xs md:text-sm">Your active subscription details</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {getPlanBadge()}
                {getStatusBadge()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
            {/* Plan Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground mb-1">Plan Type</p>
                <p className="text-base md:text-lg font-semibold capitalize">
                  {subscription.plan === "free" ? "Free" : "Supplier Premium"}
                </p>
              </div>
              {subscription.expiryDate && (
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Expiry Date</p>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                    <p className="text-base md:text-lg font-semibold">
                      {new Date(subscription.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  {daysUntilExpiry !== null && daysUntilExpiry > 0 && (
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                      {daysUntilExpiry} days remaining
                    </p>
                  )}
                </div>
              )}
              {subscription.nextBillingDate && (
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Next Billing</p>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                    <p className="text-base md:text-lg font-semibold">
                      {new Date(subscription.nextBillingDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Auto-Renew Toggle */}
            {isPremium && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 md:p-4 border rounded-lg">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <Label htmlFor="auto-renew" className="text-sm md:text-base font-medium">
                    Auto-Renew Subscription
                  </Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Automatically renew your subscription when it expires
                  </p>
                </div>
                <Switch
                  id="auto-renew"
                  checked={subscription.autoRenew}
                  onCheckedChange={handleAutoRenewToggle}
                />
              </div>
            )}

            {/* Upgrade Button for Free Users */}
            {subscription.plan === "free" && (
              <div className="p-3 md:p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm md:text-base mb-1">Upgrade to Premium</p>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Unlock premium features and grow your business faster
                    </p>
                  </div>
                  <Button onClick={() => handleUpgrade("monthly")} size="sm" className="text-xs md:text-sm w-full sm:w-auto">
                    <Crown className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Upgrade Now
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Benefits Unlocked */}
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-warning shrink-0" />
              Benefits {isPremium ? "Unlocked" : "Available"}
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              {isPremium
                ? "You have access to all premium features"
                : "Upgrade to unlock these premium features"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {supplierFeatures.map((feature, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 md:gap-3 p-2.5 md:p-3 rounded-lg border ${
                    isPremium ? "bg-warning/5 border-warning/20" : "bg-muted/30"
                  }`}
                >
                  {isPremium ? (
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-success mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`text-xs md:text-sm ${isPremium ? "font-medium" : "text-muted-foreground"}`}>
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Plans */}
        {subscription.plan === "free" && availablePlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {availablePlans.filter(p => p.price > 0).map((plan) => (
              <Card key={plan._id} className={plan.billingCycle === 'yearly' ? "border-warning border-2 bg-warning/5" : "border-2"}>
                <CardHeader className="p-4 md:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base md:text-lg">{plan.name}</CardTitle>
                    {plan.billingCycle === 'yearly' && (
                      <Badge className="bg-warning text-warning-foreground text-[10px] md:text-xs">Best Value</Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs md:text-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
                  <div>
                    <p className="text-2xl md:text-4xl font-bold">₹{plan.price}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">per {plan.billingCycle}</p>
                  </div>
                  <Separator />
                  <ul className="space-y-1.5 md:space-y-2">
                    {supplierFeatures.slice(0, plan.billingCycle === 'yearly' ? undefined : 4).map((feature, index) => (
                      <li key={index} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-success shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full text-xs md:text-sm ${plan.billingCycle === 'yearly' ? 'bg-warning text-warning-foreground hover:bg-warning/90' : ''}`} 
                    size="sm" 
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.billingCycle === 'yearly' && <Crown className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />}
                    Subscribe {plan.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                    <ArrowRight className="h-3 w-3 md:h-4 md:w-4 ml-1.5 md:ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Current Premium Plan Details Action Buttons */}
        {isPremium && (
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="text-base md:text-lg">Manage Subscription</CardTitle>
              <CardDescription className="text-xs md:text-sm">Update your subscription settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <Button variant="outline" className="w-full text-xs md:text-sm" size="sm" disabled>
                  <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline" className="w-full text-xs md:text-sm" size="sm" asChild>
                  <Link href="/dashboard/provider/earnings">
                    <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    View Billing History
                  </Link>
                </Button>
                <Button variant="outline" className="w-full text-xs md:text-sm" size="sm" disabled>
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  Change Plan
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive text-xs md:text-sm" 
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <XCircle className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />}
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Payment Dialog (Razorpay / Cashfree) */}
        <Dialog open={razorpayDialogOpen} onOpenChange={setRazorpayDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Complete Subscription Payment</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Choose a payment gateway and complete your subscription securely
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 md:space-y-4">
              <div className="p-3 md:p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground">Plan</span>
                  <span className="font-semibold text-xs md:text-sm text-right">
                    {selectedPlan?.name} - {selectedPlan?.billingCycle === 'monthly' ? "Monthly" : "Yearly"}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-xs md:text-sm text-muted-foreground">Amount</span>
                  <span className="text-lg md:text-xl lg:text-2xl font-bold">
                    ₹{selectedPlan?.price}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 md:space-y-2">
                <Label className="text-xs md:text-sm">Payment Method</Label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGateway("razorpay")}
                    className={`p-3 md:p-4 border rounded-lg text-left flex items-center gap-2 md:gap-3 ${
                      selectedGateway === "razorpay"
                        ? "border-primary bg-primary/5"
                        : "bg-muted/30"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs md:text-sm">Razorpay</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        Pay via UPI, cards, netbanking using Razorpay
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedGateway("cashfree")}
                    className={`p-3 md:p-4 border rounded-lg text-left flex items-center gap-2 md:gap-3 ${
                      selectedGateway === "cashfree"
                        ? "border-primary bg-primary/5"
                        : "bg-muted/30"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs md:text-sm">Cashfree</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        Pay via Cashfree Checkout (UPI, cards, wallets)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-xs md:text-sm"
                  size="sm"
                  onClick={() => setRazorpayDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 text-xs md:text-sm"
                  size="sm"
                  onClick={selectedGateway === "razorpay" ? handleRazorpayPayment : handleCashfreePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  )}
                  {selectedGateway === "razorpay" ? "Pay with Razorpay" : "Pay with Cashfree"}
                </Button>
              </div>

              <p className="text-[10px] md:text-xs text-center text-muted-foreground">
                By proceeding, you agree to our terms and conditions.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}




















