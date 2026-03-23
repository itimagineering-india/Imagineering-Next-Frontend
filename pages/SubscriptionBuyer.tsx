"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FeatureList from "@/components/subscriptions/FeatureList";
import FAQ from "@/components/subscriptions/FAQ";
import { buyerFaq, buyerFeatures } from "@/data/subscription";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Phone, Sparkles } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";

export async function getServerSideProps() { return { props: {} }; }

interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  description?: string;
}

const beforeAfter = [
  { label: "Contact details", before: "Blurred", after: "Fully visible" },
  { label: "Calls & WhatsApp", before: "Locked", after: "Unlimited" },
  { label: "Profiles", before: "Limited view", after: "Full profiles" },
  { label: "Commission", before: "Platform-only deals", after: "No commission on direct deals" },
  { label: "Provider priority", before: "Standard", after: "Premium providers first" },
];

export default function SubscriptionBuyer() {
  const { toast } = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      try {
        const res = await api.subscriptions.getAvailable("buyer");
        if (!isMounted) return;
        if (res.success && res.data) {
          const subs = (res.data as any).subscriptions || [];
          setPlans(subs);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Failed to load buyer subscriptions:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load buyer plans.",
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
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container max-w-4xl text-center space-y-4">
            <Badge variant="secondary" className="inline-flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Buyer Premium
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Unlock Direct Access to Providers
            </h1>
            <p className="text-lg text-muted-foreground">
              Platform billing is default, but Premium lets you contact providers directly. No commission on direct deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {monthly && monthly.price > 0 && (
                <RazorpayCheckout
                  subscriptionId={monthly._id}
                  subscriptionType="buyer"
                  amount={monthly.price}
                  subscriptionName={monthly.name}
                  onSuccess={() => {
                    router.push("/profile");
                  }}
                  className="size-lg"
                >
                  Subscribe Monthly
                </RazorpayCheckout>
              )}
              <Button size="lg" variant="outline" onClick={() => router.push("/subscriptions/supplier")}>
                View Supplier Premium
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
                <FeatureList items={buyerFeatures} />
                <div className="mt-6 p-4 rounded-xl bg-muted/40 border text-sm text-muted-foreground flex items-center gap-3">
                  <Lock className="h-4 w-4 text-primary" />
                  Contact details remain blurred on Free. Upgrade to view and call directly.
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm font-semibold">Pricing</span>
                </div>
                <CardTitle className="text-xl">Buyer Premium Pricing</CardTitle>
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
                              subscriptionType="buyer"
                              amount={monthly.price}
                              subscriptionName={monthly.name}
                              onSuccess={() => {
                                toast({
                                  title: "Success",
                                  description: "Subscription activated successfully!",
                                });
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
                                    type: "buyer",
                                  });
                                  if (res.success) {
                                    toast({
                                      title: "Success",
                                      description: "Free subscription activated!",
                                    });
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
                              subscriptionType="buyer"
                              amount={yearly.price}
                              subscriptionName={yearly.name}
                              onSuccess={() => {
                                toast({
                                  title: "Success",
                                  description: "Subscription activated successfully!",
                                });
                                window.location.reload();
                              }}
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
                                    type: "buyer",
                                  });
                                  if (res.success) {
                                    toast({
                                      title: "Success",
                                      description: "Free subscription activated!",
                                    });
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
                      <p className="text-sm text-muted-foreground">No buyer plans configured yet.</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-14 bg-muted/30">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground">Before vs After Premium</h2>
                <p className="text-muted-foreground">
                  Premium removes friction so you can reach the right provider faster.
                </p>
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left px-4 py-3">Feature</th>
                        <th className="text-center px-4 py-3">Before</th>
                        <th className="text-center px-4 py-3">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beforeAfter.map((row) => (
                        <tr key={row.label} className="border-t">
                          <td className="px-4 py-3">{row.label}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{row.before}</td>
                          <td className="px-4 py-3 text-center text-primary font-semibold">{row.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Card className="border-0 shadow-sm">
                <CardHeader className="space-y-2">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    <span className="text-sm font-semibold">Contact Preview</span>
                  </div>
                  <CardTitle className="text-xl">Blurred → Visible</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 rounded-xl border bg-muted/30">
                    <p className="text-sm text-muted-foreground line-through">+91 98XX-XX-4321</p>
                    <p className="text-xs text-muted-foreground">Free tier (blurred)</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-primary/5">
                    <p className="text-lg font-semibold text-foreground">+91 98765 43210</p>
                    <p className="text-xs text-muted-foreground">Visible with Buyer Premium</p>
                  </div>
                  {monthly && monthly.price > 0 ? (
                    <RazorpayCheckout
                      subscriptionId={monthly._id}
                      subscriptionType="buyer"
                      amount={monthly.price}
                      subscriptionName={monthly.name}
                      onSuccess={() => {
                        toast({
                          title: "Success",
                          description: "Subscription activated successfully!",
                        });
                        window.location.reload();
                      }}
                      className="w-full"
                    >
                      Unlock Contact – Go Premium
                    </RazorpayCheckout>
                  ) : (
                    <Button className="w-full" disabled>
                      No Premium Plan Available
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container max-w-3xl space-y-6">
            <h2 className="text-2xl font-bold text-foreground text-center">FAQ</h2>
            <FAQ items={buyerFaq} />
          </div>
        </section>
      </main>
    </div>
  );
}

