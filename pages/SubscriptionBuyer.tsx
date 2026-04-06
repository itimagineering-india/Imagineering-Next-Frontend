"use client";
import { useEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FeatureList from "@/components/subscriptions/FeatureList";
import FAQ from "@/components/subscriptions/FAQ";
import { buyerFaq, buyerFeatures } from "@/data/subscription";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Lock,
  Phone,
  Sparkles,
  CheckCircle2,
  Crown,
  ArrowRight,
} from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { RazorpayCheckout } from "@/components/payments/RazorpayCheckout";
import { useAuth } from "@/contexts/AuthContext";
import { useBuyerPremium } from "@/hooks/useBuyerPremium";

export async function getServerSideProps() {
  return { props: {} };
}

interface SubscriptionPlan {
  _id: string;
  name: string;
  price: number;
  discountedPrice?: number | null;
  billingCycle: "monthly" | "yearly";
  description?: string;
}

function effectiveBuyerPlanCharge(plan: { price: number; discountedPrice?: number | null }): number {
  const d = plan.discountedPrice;
  if (d !== undefined && d !== null && !Number.isNaN(Number(d))) {
    return Math.max(0, Number(d));
  }
  return Math.max(0, plan.price);
}

function planIdMatches(plan: SubscriptionPlan | undefined, activeId: string | null): boolean {
  if (!plan || !activeId) return false;
  return String(plan._id) === activeId;
}

function CurrentPlanSubscribed({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      <div
        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
        role="status"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
        Subscribed
      </div>
      <p className="text-center text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

const beforeAfter = [
  { label: "Contact details", before: "Blurred", after: "Fully visible" },
  { label: "Calls & WhatsApp", before: "Locked", after: "Unlimited" },
  { label: "Profiles", before: "Limited view", after: "Full profiles" },
  { label: "Commission", before: "Platform-only deals", after: "No commission on direct deals" },
  { label: "Provider priority", before: "Standard", after: "Premium providers first" },
];

const BUYER_SUBSCRIBE_RETURN = "/subscriptions/buyer#pricing-plans";
const loginHrefBuyerSubscribe = `/login?redirect=${encodeURIComponent(BUYER_SUBSCRIBE_RETURN)}`;

function SubscribeOrLogin({ children, loginLabel }: { children: ReactNode; loginLabel: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <Skeleton className="h-11 w-full rounded-md" />;
  }
  if (!isAuthenticated) {
    return (
      <Button asChild className="w-full min-h-[44px]">
        <Link href={loginHrefBuyerSubscribe}>{loginLabel}</Link>
      </Button>
    );
  }
  return <>{children}</>;
}

export default function SubscriptionBuyer() {
  const { toast } = useToast();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { loading: buyerSubLoading, isPremium, data: myBuyerSub } = useBuyerPremium();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeSubId = useMemo(() => {
    if (!isPremium || !myBuyerSub?.subscription) return null;
    const sub = myBuyerSub.subscription as { _id?: string };
    return sub._id ? String(sub._id) : null;
  }, [isPremium, myBuyerSub]);

  const ctaStatusLoading = authLoading || (isAuthenticated && buyerSubLoading);

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

  const handlePaymentSuccess = useCallback(() => {
    toast({
      title: "Success",
      description: "Subscription activated successfully!",
    });
    window.location.reload();
  }, [toast]);

  const activateFree = useCallback(
    async (subscriptionId: string) => {
      try {
        const res = await api.subscriptions.activate({
          subscriptionId,
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
    },
    [toast]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-primary/5 py-12 sm:py-16 md:py-20">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Shield className="h-4 w-4 shrink-0" aria-hidden />
                Buyer Premium
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl md:leading-tight">
                Unlock direct access to providers
              </h1>
              <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
                Platform billing stays the default. Premium lets you chat, call, and see full contact
                details—no commission on deals you close directly.
              </p>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:justify-center">
                <Button asChild size="lg" className="w-full sm:w-auto min-h-[44px]">
                  <a href="#pricing-plans">See plans &amp; pricing</a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto min-h-[44px]"
                  onClick={() => router.push("/subscriptions/supplier")}
                >
                  View Supplier Premium
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing-plans" className="scroll-mt-20 py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
              <div className="text-center space-y-2 px-1">
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Choose your plan</h2>
                <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Pick monthly flexibility or yearly savings. Both include the same Buyer Premium
                  benefits.
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8">
                  <Skeleton className="min-h-[380px] w-full rounded-xl" />
                  <Skeleton className="min-h-[380px] w-full rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:gap-8 items-stretch">
                  {monthly && (
                    <Card className="flex flex-col border-2 shadow-sm transition-shadow hover:shadow-md">
                      <CardHeader className="space-y-1 p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg sm:text-xl">{monthly.name || "Monthly"}</CardTitle>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Flexible
                          </Badge>
                        </div>
                        {monthly.description && (
                          <CardDescription className="text-sm">{monthly.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
                        <div>
                          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                            ₹{effectiveBuyerPlanCharge(monthly).toLocaleString("en-IN")}
                          </p>
                          {monthly.discountedPrice != null &&
                            monthly.discountedPrice !== monthly.price && (
                              <p className="text-sm text-muted-foreground line-through">
                                ₹{monthly.price.toLocaleString("en-IN")}
                              </p>
                            )}
                          <p className="text-sm text-muted-foreground">per month</p>
                        </div>
                        <Separator />
                        <ul className="flex-1 space-y-2.5 text-sm text-muted-foreground">
                          {buyerFeatures.slice(0, 6).map((f) => (
                            <li key={f} className="flex gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {ctaStatusLoading ? (
                          <Skeleton className="h-11 w-full rounded-md" />
                        ) : activeSubId && planIdMatches(monthly, activeSubId) ? (
                          <CurrentPlanSubscribed subtitle="Your current monthly plan" />
                        ) : effectiveBuyerPlanCharge(monthly) > 0 ? (
                          <SubscribeOrLogin
                            loginLabel={
                              <>
                                Subscribe monthly
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            }
                          >
                            <RazorpayCheckout
                              subscriptionId={monthly._id}
                              subscriptionType="buyer"
                              amount={effectiveBuyerPlanCharge(monthly)}
                              subscriptionName={monthly.name}
                              onSuccess={handlePaymentSuccess}
                              className="w-full min-h-[44px]"
                            >
                              Subscribe monthly
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </RazorpayCheckout>
                          </SubscribeOrLogin>
                        ) : (
                          <SubscribeOrLogin loginLabel="Activate free">
                            <Button className="w-full min-h-[44px]" onClick={() => activateFree(monthly._id)}>
                              Activate free
                            </Button>
                          </SubscribeOrLogin>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {yearly && (
                    <Card className="relative flex flex-col border-2 border-primary/35 bg-primary/5 shadow-md transition-shadow hover:shadow-lg ring-1 ring-primary/10">
                      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 sm:-top-3.5">
                        <Badge className="gap-1 bg-primary px-3 py-1 text-primary-foreground shadow-sm">
                          <Crown className="h-3.5 w-3.5" />
                          Best value
                        </Badge>
                      </div>
                      <CardHeader className="space-y-1 p-5 pt-8 sm:p-6 sm:pt-9">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg sm:text-xl">{yearly.name || "Yearly"}</CardTitle>
                          <Badge variant="outline" className="shrink-0 border-primary/40 text-xs text-primary">
                            Save more
                          </Badge>
                        </div>
                        {yearly.description && (
                          <CardDescription className="text-sm">{yearly.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="flex flex-1 flex-col space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
                        <div>
                          <p className="text-3xl font-bold tracking-tight sm:text-4xl">
                            ₹{effectiveBuyerPlanCharge(yearly).toLocaleString("en-IN")}
                          </p>
                          {yearly.discountedPrice != null && yearly.discountedPrice !== yearly.price && (
                            <p className="text-sm text-muted-foreground line-through">
                              ₹{yearly.price.toLocaleString("en-IN")}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">per year</p>
                        </div>
                        <Separator />
                        <ul className="flex-1 space-y-2.5 text-sm text-muted-foreground">
                          {buyerFeatures.map((f) => (
                            <li key={f} className="flex gap-2">
                              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                        {ctaStatusLoading ? (
                          <Skeleton className="h-11 w-full rounded-md" />
                        ) : activeSubId && planIdMatches(yearly, activeSubId) ? (
                          <CurrentPlanSubscribed subtitle="Your current yearly plan" />
                        ) : effectiveBuyerPlanCharge(yearly) > 0 ? (
                          <SubscribeOrLogin
                            loginLabel={
                              <>
                                <Crown className="mr-2 h-4 w-4" />
                                Subscribe yearly
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            }
                          >
                            <RazorpayCheckout
                              subscriptionId={yearly._id}
                              subscriptionType="buyer"
                              amount={effectiveBuyerPlanCharge(yearly)}
                              subscriptionName={yearly.name}
                              onSuccess={handlePaymentSuccess}
                              className="w-full min-h-[44px]"
                            >
                              <Crown className="mr-2 h-4 w-4" />
                              Subscribe yearly
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </RazorpayCheckout>
                          </SubscribeOrLogin>
                        ) : (
                          <SubscribeOrLogin loginLabel="Activate free">
                            <Button
                              variant="outline"
                              className="w-full min-h-[44px] border-primary/40 bg-background"
                              onClick={() => activateFree(yearly._id)}
                            >
                              Activate free
                            </Button>
                          </SubscribeOrLogin>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {!monthly && !yearly && (
                    <p className="col-span-full text-center text-sm text-muted-foreground">
                      No buyer plans configured yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/20 py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <Card className="border shadow-sm">
                <CardHeader className="p-5 sm:p-6">
                  <CardTitle className="text-xl sm:text-2xl">Everything included</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Full Buyer Premium feature list for every paid plan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 p-5 pt-0 sm:p-6 sm:pt-0">
                  <FeatureList items={buyerFeatures} />
                  <div className="flex gap-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <p>
                      On the free tier, contact details stay blurred. Upgrade to view numbers, call, and
                      chat with providers directly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Before vs after Premium</h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Premium removes friction so you can reach the right provider faster.
                </p>

                <div className="space-y-3 md:hidden">
                  {beforeAfter.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <p className="font-medium text-foreground">{row.label}</p>
                      <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">{row.before}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="font-semibold text-primary">{row.after}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/80">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Feature</th>
                        <th className="px-4 py-3 text-center font-semibold">Before</th>
                        <th className="px-4 py-3 text-center font-semibold">After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beforeAfter.map((row) => (
                        <tr key={row.label} className="border-t border-border/60">
                          <td className="px-4 py-3">{row.label}</td>
                          <td className="px-4 py-3 text-center text-muted-foreground">{row.before}</td>
                          <td className="px-4 py-3 text-center font-semibold text-primary">{row.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Card className="border-2 border-primary/15 shadow-md">
                <CardHeader className="space-y-2 p-5 sm:p-6">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5 shrink-0" aria-hidden />
                    <span className="text-sm font-semibold">Contact preview</span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">Blurred → visible</CardTitle>
                  <CardDescription>What you see on Free vs Buyer Premium.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
                  <div className="space-y-2 rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground line-through">+91 98XX-XX-4321</p>
                    <p className="text-xs text-muted-foreground">Free tier (blurred)</p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-lg font-semibold text-foreground">+91 98765 43210</p>
                    <p className="text-xs text-muted-foreground">Visible with Buyer Premium</p>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-11 w-full rounded-md" />
                  ) : ctaStatusLoading ? (
                    <Skeleton className="h-11 w-full rounded-md" />
                  ) : activeSubId &&
                    ((monthly && planIdMatches(monthly, activeSubId)) ||
                      (yearly && planIdMatches(yearly, activeSubId))) ? (
                    <CurrentPlanSubscribed subtitle="You're subscribed — contacts unlocked" />
                  ) : monthly && effectiveBuyerPlanCharge(monthly) > 0 ? (
                    <SubscribeOrLogin loginLabel="Unlock contact — Go Premium">
                      <RazorpayCheckout
                        subscriptionId={monthly._id}
                        subscriptionType="buyer"
                        amount={effectiveBuyerPlanCharge(monthly)}
                        subscriptionName={monthly.name}
                        onSuccess={handlePaymentSuccess}
                        className="w-full min-h-[44px]"
                      >
                        Unlock contact — Go Premium
                      </RazorpayCheckout>
                    </SubscribeOrLogin>
                  ) : (
                    <Button className="w-full min-h-[44px]" disabled>
                      No paid plan available
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/15 py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-6 md:space-y-8">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center gap-2 text-primary">
                  <Phone className="h-5 w-5" aria-hidden />
                  <span className="text-sm font-semibold uppercase tracking-wide">FAQ</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Common questions</h2>
                <p className="text-sm text-muted-foreground sm:text-base">
                  Billing, contact access, and how Premium works on Imagineering India.
                </p>
              </div>
              <FAQ items={buyerFaq} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
