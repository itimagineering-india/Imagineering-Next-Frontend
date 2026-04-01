"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PricingCard } from "@/components/PricingCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  CheckCircle2,
  X,
  Phone,
  ShoppingBag,
  Briefcase,
  Smile,
  Star,
  ChevronRight,
  FileText,
  BarChart2,
  FilePenLine,
  CreditCard,
  MessageCircleWarning,
  Calendar,
  Headphones,
} from "lucide-react";
import { faqItems, type FaqIconId } from "@/data/mockData";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export async function getServerSideProps() { return { props: {} }; }

const premiumBenefits = [
  {
    title: "Direct Contact (with subscription)",
    description: "Unlock phone, email, and direct messaging when you subscribe.",
  },
  {
    title: "Platform Billing by Default",
    description: "All service billing stays secure on the platform unless you opt into direct contact.",
  },
  {
    title: "Priority Messaging & Visibility",
    description: "Subscribers get boosted placement and priority response in the inbox.",
  },
];

const subscriptionRules = [
  {
    title: "Customers",
    points: [
      "All service billing is handled through our platform by default.",
      "To contact providers directly (phone/email/messages), purchase a subscription.",
      "You can still browse, request quotes, and book safely without subscribing.",
    ],
  },
  {
    title: "Suppliers / Providers",
    points: [
      "Subscribe to get featured visibility and unlimited listings.",
      "Direct leads and contact requests from customers who subscribe.",
      "Platform billing by default keeps transactions secure and trackable.",
    ],
  },
];

const featureComparisonHighlightRows: {
  key: string;
  label: string;
  sublabel?: string;
  Icon: LucideIcon;
  iconWrapClass: string;
  basic: boolean;
  pro: boolean;
  business: boolean;
}[] = [
  {
    key: "direct",
    label: "Direct Contact",
    sublabel: "(phone/email/messages)",
    Icon: Phone,
    iconWrapClass: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
    basic: false,
    pro: true,
    business: true,
  },
  {
    key: "featured",
    label: "Featured Visibility",
    sublabel: "Unlimited Listings (providers)",
    Icon: Star,
    iconWrapClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    basic: false,
    pro: true,
    business: true,
  },
  {
    key: "priority",
    label: "Priority Search",
    Icon: FileText,
    iconWrapClass: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    basic: false,
    pro: true,
    business: true,
  },
  {
    key: "analytics",
    label: "Analytics Dashboard",
    Icon: BarChart2,
    iconWrapClass: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    basic: false,
    pro: false,
    business: true,
  },
];

const FAQ_ICON_MAP: Record<FaqIconId, LucideIcon> = {
  filePen: FilePenLine,
  star: Star,
  creditCard: CreditCard,
  briefcase: Briefcase,
  alert: MessageCircleWarning,
  calendar: Calendar,
};

const FAQ_ICON_WRAP: Record<FaqIconId, string> = {
  filePen: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  star: "bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300",
  creditCard: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
  briefcase: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300",
  alert: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  calendar: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
};

const featureComparisonExtraRows: {
  feature: string;
  basic: boolean;
  pro: boolean;
  business: boolean;
}[] = [
  { feature: "Browse Services", basic: true, pro: true, business: true },
  { feature: "View Provider Profiles", basic: true, pro: true, business: true },
  { feature: "Request Quotes", basic: true, pro: true, business: true },
  { feature: "Platform Billing (default)", basic: true, pro: true, business: true },
  { feature: "Saved Searches", basic: false, pro: true, business: true },
  { feature: "Team Collaboration", basic: false, pro: false, business: true },
  { feature: "Dedicated Account Manager", basic: false, pro: false, business: true },
  { feature: "API Access", basic: false, pro: false, business: true },
];

interface SubscriptionPlan {
  _id: string;
  name: string;
  type: "buyer" | "provider";
  price: number;
  billingCycle: "monthly" | "yearly";
  description?: string;
}

export default function Pricing() {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [buyerPlans, setBuyerPlans] = useState<SubscriptionPlan[]>([]);
  const [providerPlans, setProviderPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<"buyer" | "provider" | "admin" | null>(null);
  const [featureComparisonExpanded, setFeatureComparisonExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      try {
        const [buyerRes, providerRes] = await Promise.all([
          api.subscriptions.getAvailable("buyer"),
          api.subscriptions.getAvailable("provider"),
        ]);

        if (!isMounted) return;

        if (buyerRes.success && buyerRes.data) {
          const subs = (buyerRes.data as any).subscriptions || [];
          setBuyerPlans(subs);
        }
        if (providerRes.success && providerRes.data) {
          const subs = (providerRes.data as any).subscriptions || [];
          setProviderPlans(subs);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Failed to load subscription plans:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load pricing plans.",
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

  // Detect logged-in user role (auth handled globally)
  useEffect(() => {
    if (isAuthLoading) return;
    setUserRole(((user as any)?.role as "buyer" | "provider" | "admin") || null);
  }, [user, isAuthLoading]);

  const formatPrice = (price: number) => {
    if (!price) return 0;
    return price;
  };

  const planSubtitle = (plan: SubscriptionPlan, role: "buyer" | "provider") => {
    if (plan.description?.trim()) return plan.description.trim();
    if (plan.price === 0) {
      return role === "buyer"
        ? "Free plan with standard platform fees"
        : "Free provider plan with standard commission";
    }
    return "Lower platform fee, priority support";
  };

  const showBuyerSection =
    !userRole || userRole === "buyer" || userRole === "admin";
  const showProviderSection =
    !userRole || userRole === "provider" || userRole === "admin";

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden">

      <main className="flex-1 min-w-0 overflow-x-hidden">
        <section className="relative overflow-hidden pb-10 pt-8 sm:pb-16 sm:pt-12 md:pb-20 md:pt-16">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-100/50 via-white to-blue-50/40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-white/60 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-16 top-40 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute bottom-20 left-1/3 h-48 w-48 rounded-full bg-blue-100/40 blur-3xl"
            aria-hidden
          />
          <div className="container relative z-10 px-3 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <Badge
                variant="secondary"
                className="mb-3 border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm sm:mb-4 sm:text-sm"
              >
                Simple, Transparent Pricing
              </Badge>
              <h1 className="text-balance break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                Choose the Plan That&apos;s Right for You
              </h1>
            </div>

            <div
              id="pricing-plan-sections"
              className="mx-auto mt-8 max-w-6xl space-y-12 scroll-mt-20 sm:mt-14 sm:space-y-16 md:mt-20 md:scroll-mt-24 md:space-y-20"
            >
            {isLoading ? (
              <>
                {showBuyerSection && (
                  <div className="space-y-6">
                    <div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-slate-200/80" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-[420px] animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {showProviderSection && (
                  <div className="space-y-6 border-t border-slate-200/80 pt-16">
                    <div className="h-10 w-72 max-w-full animate-pulse rounded-lg bg-slate-200/80" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {[4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="h-[420px] animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 shadow-sm"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {showBuyerSection && (
                  <section
                    aria-labelledby="pricing-buyer-heading"
                    className="scroll-mt-8"
                  >
                    <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/90 pb-6 text-center sm:mb-8 sm:pb-8 sm:text-left">
                      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 sm:mx-0 sm:justify-start">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                          <ShoppingBag className="h-5 w-5" aria-hidden />
                        </span>
                        <Badge
                          variant="outline"
                          className="border-sky-200 bg-sky-50/80 text-sky-900"
                        >
                          Buyers / Customers
                        </Badge>
                      </div>
                      <h2
                        id="pricing-buyer-heading"
                        className="text-balance break-words text-xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                      >
                        Buyer plans
                      </h2>
                      <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:mx-0 sm:max-w-3xl sm:text-base">
                        For people booking services on Imagineering India — lower
                        platform fees, priority support, and premium perks when you
                        subscribe.
                      </p>
                    </div>
                    {buyerPlans.length === 0 ? (
                      <p className="text-center text-sm text-slate-500 sm:text-left">
                        No buyer plans are available right now. Please check back
                        soon.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-6">
                        {buyerPlans.map((plan, index) => (
                          <div
                            key={plan._id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 80}ms` }}
                          >
                            <PricingCard
                              name={plan.name}
                              price={formatPrice(plan.price)}
                              billing={
                                plan.billingCycle === "yearly"
                                  ? "per year"
                                  : "per month"
                              }
                              description={planSubtitle(plan, "buyer")}
                              features={[
                                "Reduced platform fees on bookings (depending on plan)",
                                "Priority booking experience where available",
                                "Access to exclusive discounts on selected services",
                                "Premium support for issues and disputes",
                                "Access to featured providers and verified pros",
                              ]}
                              limitations={
                                plan.price === 0
                                  ? ["Advanced benefits may require paid plans"]
                                  : []
                              }
                              cta={
                                plan.price === 0
                                  ? "Get Started"
                                  : "Upgrade Buyer Plan"
                              }
                              popular={
                                plan.price > 0 &&
                                plan.billingCycle === "yearly"
                              }
                              savingsBadge={
                                plan.price > 0 &&
                                plan.billingCycle === "yearly"
                                  ? "Save 20%"
                                  : undefined
                              }
                              subscriptionId={plan._id}
                              subscriptionType="buyer"
                              onActivate={async () => {
                                if (plan.price === 0) {
                                  try {
                                    const res =
                                      await api.subscriptions.activate({
                                        subscriptionId: plan._id,
                                        type: "buyer",
                                      });
                                    if (res.success) {
                                      toast({
                                        title: "Success",
                                        description:
                                          "Free subscription activated!",
                                      });
                                      window.location.reload();
                                    }
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description:
                                        error.message ||
                                        "Failed to activate subscription",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {showProviderSection && (
                  <section
                    aria-labelledby="pricing-provider-heading"
                    className={`scroll-mt-8 ${showBuyerSection ? "border-t border-slate-200/90 pt-12 sm:pt-16 md:pt-20" : ""}`}
                  >
                    <div className="mb-6 flex flex-col gap-3 border-b border-slate-200/90 pb-6 text-center sm:mb-8 sm:pb-8 sm:text-left">
                      <div className="mx-auto flex flex-wrap items-center justify-center gap-2 sm:mx-0 sm:justify-start">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                          <Briefcase className="h-5 w-5" aria-hidden />
                        </span>
                        <Badge
                          variant="outline"
                          className="border-violet-200 bg-violet-50/80 text-violet-900"
                        >
                          Service providers
                        </Badge>
                      </div>
                      <h2
                        id="pricing-provider-heading"
                        className="text-balance break-words text-xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                      >
                        Provider plans
                      </h2>
                      <p className="mx-auto max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:mx-0 sm:max-w-3xl sm:text-base">
                        For businesses and professionals listing services — better
                        visibility, listing limits, and commission benefits when you
                        subscribe.
                      </p>
                    </div>
                    {providerPlans.length === 0 ? (
                      <p className="text-center text-sm text-slate-500 sm:text-left">
                        No provider plans are available right now. Please check back
                        soon.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3 lg:gap-6">
                        {providerPlans.map((plan, index) => (
                          <div
                            key={plan._id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 80}ms` }}
                          >
                            <PricingCard
                              name={plan.name}
                              price={formatPrice(plan.price)}
                              billing={
                                plan.billingCycle === "yearly"
                                  ? "per year"
                                  : "per month"
                              }
                              description={planSubtitle(plan, "provider")}
                              features={[
                                "Commission discounts on bookings (depending on plan)",
                                "Higher visibility in search & map views",
                                "Higher or unlimited active listing limits",
                                "Featured / gold badge eligibility for services",
                                "Access to basic analytics and buyer insights",
                              ]}
                              limitations={
                                plan.price === 0
                                  ? [
                                      "Advanced visibility & analytics require paid plans",
                                    ]
                                  : []
                              }
                              cta={
                                plan.price === 0
                                  ? "Get Started"
                                  : "Upgrade Provider Plan"
                              }
                              popular={
                                plan.price > 0 &&
                                plan.billingCycle === "yearly"
                              }
                              savingsBadge={
                                plan.price > 0 &&
                                plan.billingCycle === "yearly"
                                  ? "Save 20%"
                                  : undefined
                              }
                              subscriptionId={plan._id}
                              subscriptionType="provider"
                              onActivate={async () => {
                                if (plan.price === 0) {
                                  try {
                                    const res =
                                      await api.subscriptions.activate({
                                        subscriptionId: plan._id,
                                        type: "provider",
                                      });
                                    if (res.success) {
                                      toast({
                                        title: "Success",
                                        description:
                                          "Free subscription activated!",
                                      });
                                      window.location.reload();
                                    }
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description:
                                        error.message ||
                                        "Failed to activate subscription",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
            </div>
          </div>
        </section>

        {/* Billing & Subscriptions — comparison cards + VS */}
        <section className="bg-background py-8 sm:py-12 md:py-16">
          <div className="container min-w-0 px-3 sm:px-6">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-sky-50/90 via-background to-background p-4 shadow-lg shadow-primary/5 sm:rounded-[2rem] sm:p-8 md:p-10 dark:from-sky-950/30 dark:via-background">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.2) 0%, transparent 45%),
                    radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.15) 0%, transparent 40%),
                    radial-gradient(circle at 50% 100%, rgba(14, 165, 233, 0.08) 0%, transparent 50%)`,
                }}
                aria-hidden
              />
              <div className="relative">
                <h2 className="text-balance px-1 text-center text-xl font-bold text-[#0f172a] dark:text-foreground sm:text-3xl">
                  Billing & Subscriptions
                </h2>
                <p className="mx-auto mt-2 max-w-2xl px-1 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Platform billing is the default for safety and compliance. Subscriptions enable direct contact and extra visibility.
                </p>
                <div className="relative mt-8 flex flex-col items-stretch gap-4 sm:mt-10 sm:gap-6 lg:flex-row lg:items-stretch lg:justify-center lg:gap-0">
                  <div className="relative z-[1] min-w-0 flex-1 rounded-2xl border border-sky-200/80 bg-white/90 p-4 shadow-md backdrop-blur-sm dark:border-sky-800/50 dark:bg-card/90 sm:p-8 lg:rounded-r-none lg:border-r-0 lg:pr-10">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">No Subscription</p>
                    <div className="mt-3 flex items-start gap-3 sm:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600 sm:h-12 sm:w-12 dark:bg-sky-950/50 dark:text-sky-400">
                        <Smile className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h3 className="min-w-0 flex-1 text-lg font-bold leading-snug text-[#0f172a] dark:text-foreground sm:text-2xl">
                        {subscriptionRules[0]?.title ?? "Customers"}
                      </h3>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {(subscriptionRules[0]?.points ?? []).map((point) => (
                        <li key={point} className="flex gap-3 text-sm text-muted-foreground sm:text-base">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="mt-8 w-full rounded-xl border border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100 dark:hover:bg-sky-900/50"
                      variant="outline"
                      size="lg"
                    >
                      <Link href="/services">Get Started</Link>
                    </Button>
                  </div>
                  <div className="relative z-10 flex shrink-0 items-center justify-center py-1 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:py-0">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-bold text-foreground shadow-md ring-4 ring-sky-100/80 dark:ring-sky-900/40 sm:h-14 sm:w-14 sm:text-sm">
                      VS
                    </span>
                  </div>
                  <div className="relative z-[1] min-w-0 flex-1 rounded-2xl border-2 border-red-200/90 bg-white/95 p-4 shadow-md backdrop-blur-sm dark:border-red-900/60 dark:bg-card/90 sm:p-8 lg:rounded-l-none lg:border-l-0 lg:pl-10">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                        With Subscription
                      </p>
                      <Badge className="shrink-0 border-0 bg-red-600 text-white hover:bg-red-600">Earn More</Badge>
                    </div>
                    <div className="mt-3 flex items-start gap-3 sm:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 sm:h-12 sm:w-12 dark:bg-red-950/50 dark:text-red-400">
                        <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h3 className="min-w-0 flex-1 text-lg font-bold leading-snug text-[#0f172a] dark:text-foreground sm:text-2xl">
                        {subscriptionRules[1]?.title ?? "Suppliers / Providers"}
                      </h3>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {(subscriptionRules[1]?.points ?? []).map((point) => (
                        <li key={point} className="flex gap-3 text-sm text-muted-foreground sm:text-base">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="mt-8 w-full rounded-xl bg-red-600 text-white shadow-md hover:bg-red-700"
                      size="lg"
                    >
                      <a href="#pricing-provider-heading">
                        Upgrade Now <ChevronRight className="ml-1 inline h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Upgrade to Premium — 3-column + center CTA */}
        <section className="bg-secondary/20 py-8 sm:py-12 md:py-16">
          <div className="container min-w-0 px-3 sm:px-6">
            <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-b from-sky-50/80 via-background to-background p-4 shadow-lg sm:rounded-[2rem] sm:p-8 md:p-10 dark:from-sky-950/25">
              <div
                className="pointer-events-none absolute inset-0 opacity-30 dark:opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle at 15% 40%, rgba(14, 165, 233, 0.18) 0%, transparent 50%),
                    radial-gradient(circle at 85% 60%, rgba(251, 191, 36, 0.12) 0%, transparent 45%)`,
                }}
                aria-hidden
              />
              <div className="relative">
                <h2 className="text-balance px-1 text-center text-xl font-bold text-[#0f172a] dark:text-foreground sm:text-3xl">
                  Why Upgrade to Premium?
                </h2>
                <p className="mx-auto mt-2 max-w-2xl px-1 text-center text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Unlock powerful features to connect with providers faster.
                </p>
                <div className="mt-8 grid items-stretch gap-4 sm:mt-10 sm:gap-6 md:grid-cols-3 md:gap-4">
                  <div className="order-1 flex min-w-0 flex-col justify-center rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-6 md:order-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold leading-snug text-foreground sm:text-lg">
                      {premiumBenefits[0]?.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {premiumBenefits[0]?.description}
                    </p>
                  </div>
                  <div className="order-2 flex flex-col items-center justify-center gap-4 py-2 md:order-none md:py-4">
                    <Button
                      asChild
                      className="w-full max-w-sm rounded-xl bg-red-600 px-6 text-white shadow-md hover:bg-red-700 sm:w-auto sm:max-w-xs sm:px-8"
                      size="lg"
                    >
                      <a href="#pricing-buyer-heading">
                        Upgrade Now <ChevronRight className="ml-1 inline h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <div className="order-3 flex min-w-0 flex-col justify-center rounded-2xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-sm sm:p-6 md:order-none">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Star className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold leading-snug text-foreground sm:text-lg">
                      {premiumBenefits[2]?.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {premiumBenefits[2]?.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison — card table, Pro highlight, expandable full list */}
        <section className="relative overflow-hidden py-8 sm:py-12 md:py-16">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-100/60 via-white to-sky-50/40 dark:from-sky-950/20 dark:via-background dark:to-sky-950/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-200/25 blur-3xl dark:bg-sky-800/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-20 bottom-20 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl dark:bg-blue-900/15"
            aria-hidden
          />
          <div className="container relative z-10 min-w-0 px-3 sm:px-6">
            <div className="mx-auto mb-6 max-w-2xl text-center sm:mb-10 md:mb-12">
              <h2 className="text-balance px-1 text-xl font-bold text-[#0f172a] dark:text-foreground sm:text-3xl">
                Feature Comparison
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Compare the features included in each plan.
              </p>
            </div>
            <div className="mx-auto max-w-5xl overflow-x-auto overscroll-x-contain rounded-2xl bg-white/90 p-3 shadow-xl shadow-sky-200/20 ring-1 ring-slate-200/60 [-webkit-overflow-scrolling:touch] backdrop-blur-sm dark:bg-card/95 dark:ring-border sm:rounded-3xl sm:p-6 md:p-8">
              <table className="w-full min-w-[480px] border-collapse text-left sm:min-w-[560px]">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-border">
                    <th className="w-[34%] pb-4 pr-1 align-bottom text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:w-[36%] sm:pb-8 sm:pr-4 sm:text-xs">
                      Features
                    </th>
                    <th className="w-[22%] px-0.5 pb-4 align-bottom sm:px-2 sm:pb-6">
                      <div className="flex flex-col items-center gap-1.5 text-center sm:gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600 sm:h-11 sm:w-11 dark:bg-sky-950/50 dark:text-sky-400">
                          <Smile className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                        </span>
                        <span className="text-xs font-bold text-[#0f172a] dark:text-foreground sm:text-base">
                          Basic
                        </span>
                      </div>
                    </th>
                    <th className="relative w-[22%] border-x border-rose-200/90 bg-rose-50/60 px-0.5 pb-4 align-bottom dark:border-rose-900/50 dark:bg-rose-950/20 sm:px-2 sm:pb-6">
                      <Badge className="absolute left-1/2 top-0 z-10 max-w-[calc(100%-8px)] -translate-x-1/2 -translate-y-1/2 truncate border-0 bg-rose-600 px-1.5 py-0.5 text-[9px] font-semibold text-white shadow-sm hover:bg-rose-600 sm:max-w-none sm:px-2.5 sm:text-xs">
                        Most Popular
                      </Badge>
                      <div className="flex flex-col items-center gap-1.5 pt-3 text-center sm:gap-2 sm:pt-4">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 sm:h-11 sm:w-11 dark:bg-rose-950/50 dark:text-rose-400">
                          <Star className="h-4 w-4 fill-rose-500/25 sm:h-5 sm:w-5" aria-hidden />
                        </span>
                        <span className="text-xs font-bold text-[#0f172a] dark:text-foreground sm:text-base">
                          Pro
                        </span>
                      </div>
                    </th>
                    <th className="w-[22%] px-0.5 pb-4 align-bottom sm:px-2 sm:pb-6">
                      <div className="flex flex-col items-center gap-1.5 text-center sm:gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600 sm:h-11 sm:w-11 dark:bg-orange-950/40 dark:text-orange-400">
                          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                        </span>
                        <span className="text-xs font-bold text-[#0f172a] dark:text-foreground sm:text-base">
                          Business
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {featureComparisonHighlightRows.map((row) => {
                    const Icon = row.Icon;
                    return (
                      <tr
                        key={row.key}
                        className="border-b border-slate-100 last:border-0 dark:border-border/60"
                      >
                        <td className="py-3 pr-1 align-middle sm:py-5 sm:pr-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${row.iconWrapClass}`}
                            >
                              <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold leading-snug text-[#0f172a] dark:text-foreground sm:text-base">
                                {row.label}
                              </p>
                              {row.sublabel ? (
                                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground sm:text-sm">
                                  {row.sublabel}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-0.5 py-3 text-center align-middle sm:px-2 sm:py-5">
                          {row.basic ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 sm:h-9 sm:w-9 dark:bg-emerald-950/30">
                              <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 sm:h-4 sm:w-4 dark:text-emerald-400" />
                            </span>
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 sm:h-9 sm:w-9 dark:bg-slate-800">
                              <X className="h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4 dark:text-slate-500" />
                            </span>
                          )}
                        </td>
                        <td className="border-x border-rose-200/90 bg-rose-50/40 px-0.5 py-3 text-center align-middle dark:border-rose-900/50 dark:bg-rose-950/15 sm:px-2 sm:py-5">
                          {row.pro ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 sm:h-9 sm:w-9 dark:bg-emerald-950/30">
                              <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 sm:h-4 sm:w-4 dark:text-emerald-400" />
                            </span>
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100/80 sm:h-9 sm:w-9 dark:bg-rose-950/40">
                              <X className="h-3.5 w-3.5 text-rose-400/90 sm:h-4 sm:w-4 dark:text-rose-500" />
                            </span>
                          )}
                        </td>
                        <td className="px-0.5 py-3 text-center align-middle sm:px-2 sm:py-5">
                          {row.business ? (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 sm:h-9 sm:w-9 dark:bg-emerald-950/30">
                              <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 sm:h-4 sm:w-4 dark:text-emerald-400" />
                            </span>
                          ) : (
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 sm:h-9 sm:w-9 dark:bg-slate-800">
                              <X className="h-3.5 w-3.5 text-slate-400 sm:h-4 sm:w-4 dark:text-slate-500" />
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {featureComparisonExpanded
                    ? featureComparisonExtraRows.map((row) => (
                        <tr
                          key={row.feature}
                          className="border-b border-slate-100 dark:border-border/60"
                        >
                          <td className="py-3 pr-2 text-sm text-foreground sm:py-4 sm:pr-4">
                            {row.feature}
                          </td>
                          <td className="px-1 py-3 text-center sm:px-2 sm:py-4">
                            {row.basic ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                                <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                              </span>
                            ) : (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <X className="h-3.5 w-3.5 text-slate-400" />
                              </span>
                            )}
                          </td>
                          <td className="border-x border-rose-200/90 bg-rose-50/40 px-1 py-3 text-center dark:border-rose-900/50 dark:bg-rose-950/15 sm:px-2 sm:py-4">
                            {row.pro ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                                <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                              </span>
                            ) : (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100/80 dark:bg-rose-950/40">
                                <X className="h-3.5 w-3.5 text-rose-400/90" />
                              </span>
                            )}
                          </td>
                          <td className="px-1 py-3 text-center sm:px-2 sm:py-4">
                            {row.business ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                                <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                              </span>
                            ) : (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                <X className="h-3.5 w-3.5 text-slate-400" />
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
              <div className="mt-4 flex flex-col items-stretch gap-4 border-t border-slate-100 pt-4 dark:border-border sm:mt-6 sm:items-center sm:gap-6 sm:pt-6">
                <button
                  type="button"
                  onClick={() => setFeatureComparisonExpanded((v) => !v)}
                  className="w-full px-2 text-center text-sm font-medium text-sky-700 underline-offset-4 transition hover:text-sky-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300 sm:w-auto"
                >
                  {featureComparisonExpanded ? "Show less" : "View Full Comparison"}{" "}
                  <ChevronRight
                    className={`ml-0.5 inline h-4 w-4 transition ${featureComparisonExpanded ? "rotate-90" : ""}`}
                    aria-hidden
                  />
                </button>
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-6 text-base font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:from-rose-700 hover:to-rose-800 sm:w-auto sm:px-10"
                >
                  <a href="#pricing-buyer-heading">
                    Choose Pro Plan <ChevronRight className="ml-1 inline h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="relative overflow-hidden py-10 pb-12 sm:py-14 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-100/70 via-white to-sky-50/50 dark:from-sky-950/25 dark:via-background dark:to-sky-950/15"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-sky-200/30 blur-3xl dark:bg-sky-800/15"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-blue-200/25 blur-3xl dark:bg-blue-900/10"
            aria-hidden
          />
          <div className="container relative z-10 min-w-0 px-3 sm:px-6">
            <h2 className="mb-6 text-balance px-1 text-center text-xl font-bold text-[#0f172a] dark:text-foreground sm:mb-10 sm:text-3xl md:mb-12">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl shadow-sky-200/15 ring-1 ring-slate-100/80 backdrop-blur-sm dark:border-border dark:bg-card/90 dark:shadow-none sm:rounded-3xl sm:p-3 md:p-4">
                <Accordion
                  type="single"
                  collapsible
                  defaultValue="item-0"
                  className="divide-y divide-slate-100 dark:divide-border"
                >
                  {faqItems.map((item, index) => {
                    const Icon = FAQ_ICON_MAP[item.icon];
                    const wrap = FAQ_ICON_WRAP[item.icon];
                    return (
                      <AccordionItem
                        key={index}
                        value={`item-${index}`}
                        className="border-0 px-1 data-[state=open]:my-0.5 data-[state=open]:rounded-xl data-[state=open]:border data-[state=open]:border-rose-200/90 data-[state=open]:bg-rose-50/50 data-[state=open]:shadow-sm dark:data-[state=open]:border-rose-900/50 dark:data-[state=open]:bg-rose-950/25 sm:px-4 sm:data-[state=open]:my-1 sm:data-[state=open]:rounded-2xl"
                      >
                        <AccordionTrigger className="items-start gap-2 py-3 text-left hover:no-underline sm:gap-3 sm:py-4 [&>svg]:mt-1 [&>svg]:shrink-0 [&>svg]:text-slate-500">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 ${wrap}`}
                            aria-hidden
                          >
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </span>
                          <span className="min-w-0 flex-1 text-left text-sm font-medium leading-snug text-slate-800 dark:text-foreground sm:text-base">
                            {item.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4 pl-10 pr-2 pt-0 sm:pb-5 sm:pl-14">
                          {item.bullets?.length ? (
                            <div>
                              {item.answerIntro ? (
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {item.answerIntro}
                                </p>
                              ) : null}
                              <ul className="mt-3 space-y-2.5">
                                {item.bullets.map((line) => (
                                  <li
                                    key={line}
                                    className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                                  >
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
                                    <span>{line}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
              <div className="mt-8 flex flex-col items-stretch gap-4 px-1 text-center sm:mt-12 sm:items-center">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200 sm:h-11 sm:w-11">
                    <Headphones className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-[#0f172a] dark:text-foreground sm:text-base">
                    Still have questions?
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-full bg-gradient-to-r from-rose-600 to-rose-800 px-6 py-6 text-base font-semibold text-white shadow-lg shadow-rose-500/20 hover:from-rose-700 hover:to-rose-900 sm:w-auto sm:px-8"
                >
                  <Link href="/contact">
                    Contact Support <ChevronRight className="ml-1 inline h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
