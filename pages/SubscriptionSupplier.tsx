"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FeatureList from "@/components/subscriptions/FeatureList";
import FAQ from "@/components/subscriptions/FAQ";
import { supplierFaq, supplierFeatures } from "@/data/subscription";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, ShieldCheck } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  description?: string;
}

export default function SubscriptionSupplier() {
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      try {
        const res = await api.subscriptions.getAvailable("provider");
        if (!isMounted) return;
        if (res.success && res.data) {
          const subs = (res.data as any).subscriptions || [];
          setPlans(subs);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Failed to load provider subscriptions:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load supplier plans.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const monthly =
    plans.find((p) => p.billingCycle === "monthly" && p.price > 0) ||
    plans.find((p) => p.billingCycle === "monthly");
  const yearly =
    plans.find((p) => p.billingCycle === "yearly" && p.price > 0) ||
    plans.find((p) => p.billingCycle === "yearly");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="py-16 md:py-20 bg-gradient-to-br from-amber-50 via-background to-amber-100">
          <div className="container max-w-4xl text-center space-y-4">
            <Badge className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 border-amber-200">
              <Sparkles className="h-4 w-4" />
              Supplier Premium
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Grow Faster with Supplier Premium
            </h1>
            <p className="text-lg text-muted-foreground">
              Get more visibility, more leads, and higher conversions with gold markers, featured placement, and unlimited listings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {monthly && monthly.price > 0 && (
                <RazorpayCheckout
                  subscriptionId={monthly._id}
                  subscriptionType="provider"
                  amount={monthly.price}
                  subscriptionName={monthly.name}
                  onSuccess={() => router.push("/profile")}
                  className="h-11 px-8 text-base"
                >
                  Subscribe via Razorpay
                </RazorpayCheckout>
              )}
              {monthly && monthly.price === 0 && (
                <Button
                  size="lg"
                  onClick={async () => {
                    try {
                      const res = await api.subscriptions.activate({
                        subscriptionId: monthly._id,
                        type: "provider",
                      });
                      if (res.success) {
                        toast({ title: "Success", description: "Free subscription activated!" });
                        router.push("/profile");
                      }
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to activate subscription",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Activate Free Plan
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => router.push("/subscriptions/buyer")}>
                View Buyer Premium
              </Button>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container grid lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">What you get</CardTitle>
              </CardHeader>
              <CardContent>
                <FeatureList items={supplierFeatures} />
                <div className="mt-6 p-4 rounded-xl bg-amber-50 border text-sm text-amber-900 flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4" />
                  Gold badge + verified badge help buyers trust you faster.
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-semibold">Pricing</span>
                </div>
                <CardTitle className="text-xl">Supplier Premium Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading plans...</p>
                ) : (
                  <>
                    {monthly && (
                      <div className="p-4 rounded-xl border bg-primary/5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly</p>
                            <p className="text-3xl font-bold">₹{monthly.price}</p>
                          </div>
                          {monthly.price > 0 ? (
                            <RazorpayCheckout
                              subscriptionId={monthly._id}
                              subscriptionType="provider"
                              amount={monthly.price}
                              subscriptionName={monthly.name}
                              onSuccess={() => {
                                toast({ title: "Success", description: "Subscription activated successfully!" });
                                window.location.reload();
                              }}
                            >
                              Upgrade Monthly
                            </RazorpayCheckout>
                          ) : (
                            <Button
                              onClick={async () => {
                                try {
                                  const res = await api.subscriptions.activate({
                                    subscriptionId: monthly._id,
                                    type: "provider",
                                  });
                                  if (res.success) {
                                    toast({ title: "Success", description: "Free subscription activated!" });
                                    window.location.reload();
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to activate subscription",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Activate Free
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {yearly && (
                      <div className="p-4 rounded-xl border bg-amber-50">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Yearly (best value)</p>
                            <p className="text-3xl font-bold">₹{yearly.price}</p>
                          </div>
                          {yearly.price > 0 ? (
                            <RazorpayCheckout
                              subscriptionId={yearly._id}
                              subscriptionType="provider"
                              amount={yearly.price}
                              subscriptionName={yearly.name}
                              onSuccess={() => {
                                toast({ title: "Success", description: "Subscription activated successfully!" });
                                window.location.reload();
                              }}
                              variant="outline"
                            >
                              Upgrade Yearly
                            </RazorpayCheckout>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const res = await api.subscriptions.activate({
                                    subscriptionId: yearly._id,
                                    type: "provider",
                                  });
                                  if (res.success) {
                                    toast({ title: "Success", description: "Free subscription activated!" });
                                    window.location.reload();
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to activate subscription",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              Activate Free
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {!monthly && !yearly && (
                      <p className="text-sm text-muted-foreground">No supplier plans configured yet.</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-14 bg-muted/30">
          <div className="container grid lg:grid-cols-2 gap-8 items-start">
            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-semibold">Map Preview</span>
                </div>
                <CardTitle className="text-xl">Normal vs Gold Marker</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border bg-muted/30 text-center text-sm text-muted-foreground">
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-slate-300" />
                    Normal marker
                  </div>
                  <div className="p-4 rounded-xl border bg-amber-50 text-center text-sm text-amber-900">
                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-amber-400" />
                    Gold premium marker
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Premium suppliers are highlighted with gold markers on map and elevated in search ranking.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-semibold">Featured Provider Preview</span>
                </div>
                <CardTitle className="text-xl">Gold badge & featured card</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-4 rounded-xl border bg-amber-50">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-amber-200" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Premium Electric Co.</span>
                        <Badge className="bg-amber-400 text-amber-900">Gold</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Electrician • Featured</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Featured placement boosts clicks and lead volume from premium buyers.
                  </p>
                  <Button className="mt-3 w-full">Get Featured</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-14">
          <div className="container max-w-3xl space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">FAQ</h2>
            <FAQ items={supplierFaq} />
          </div>
        </section>
      </main>
    </div>
  );
}
