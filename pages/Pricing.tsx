"use client";
import { useEffect, useState } from "react";
import { PricingCard } from "@/components/PricingCard";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, Phone, Mail, MessageSquare } from "lucide-react";
import { faqItems } from "@/data/mockData";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export async function getServerSideProps() { return { props: {} }; }

const premiumBenefits = [
  {
    icon: Phone,
    title: "Direct Contact (with subscription)",
    description: "Unlock phone, email, and direct messaging when you subscribe.",
  },
  {
    icon: Mail,
    title: "Platform Billing by Default",
    description: "All service billing stays secure on the platform unless you opt into direct contact.",
  },
  {
    icon: MessageSquare,
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

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-10 sm:py-12 md:py-16 lg:py-24 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container px-4 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-3 sm:mb-4 text-xs sm:text-sm" variant="secondary">
                Simple, Transparent Pricing
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                Choose the Plan That's Right for You
              </h1>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted-foreground">
                Start free and upgrade anytime. Billing runs on-platform by default; subscriptions unlock direct contact, featured visibility, and advanced tools.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards - dynamic from backend subscriptions */}
        <section className="py-8 sm:py-10 md:py-12 lg:py-16 -mt-4 sm:-mt-6 md:-mt-8">
          <div className="container px-4 sm:px-6">
            {isLoading ? (
              <p className="text-center text-muted-foreground text-sm">Loading plans...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-5xl mx-auto items-start">
                {/* Decide which plans to show based on role */}
                {/*
                  - Logged-out users: see both buyer and provider plans
                  - Buyers: only buyer plans
                  - Providers: only provider plans
                  - Admins: see both
                */}
                {/* Buyer plans */}
                {(!userRole || userRole === "buyer" || userRole === "admin") &&
                  buyerPlans.map((plan, index) => (
                  <div
                    key={plan._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <PricingCard
                      name={plan.name}
                      price={formatPrice(plan.price)}
                      billing={plan.billingCycle === "yearly" ? "per year" : "per month"}
                      description={
                        plan.description ||
                        (plan.price === 0
                          ? "Free buyer plan with standard platform fees"
                          : "Buyer subscription with extra benefits")
                      }
                      features={[
                        "Reduced platform fees on bookings (depending on plan)",
                        "Priority booking experience where available",
                        "Access to exclusive discounts on selected services",
                        "Premium support for issues and disputes",
                        "Access to featured providers and verified pros",
                      ]}
                      limitations={plan.price === 0 ? ["Advanced benefits may require paid plans"] : []}
                      cta={
                        plan.price === 0
                          ? "Activate Free Plan"
                          : "Upgrade Buyer Plan"
                      }
                      popular={plan.price > 0 && plan.billingCycle === "monthly"}
                      subscriptionId={plan._id}
                      subscriptionType="buyer"
                      onActivate={async () => {
                        if (plan.price === 0) {
                          try {
                            const res = await api.subscriptions.activate({
                              subscriptionId: plan._id,
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
                        }
                      }}
                    />
                  </div>
                ))}

                {/* Provider plans */}
                {(!userRole || userRole === "provider" || userRole === "admin") &&
                  providerPlans.map((plan, index) => (
                  <div
                    key={plan._id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${(buyerPlans.length + index) * 80}ms` }}
                  >
                    <PricingCard
                      name={plan.name}
                      price={formatPrice(plan.price)}
                      billing={plan.billingCycle === "yearly" ? "per year" : "per month"}
                      description={
                        plan.description ||
                        (plan.price === 0
                          ? "Free provider plan with standard commission"
                          : "Provider subscription with better commission & visibility")
                      }
                      features={[
                        "Commission discounts on bookings (depending on plan)",
                        "Higher visibility in search & map views",
                        "Higher or unlimited active listing limits",
                        "Featured / gold badge eligibility for services",
                        "Access to basic analytics and buyer insights",
                      ]}
                      limitations={plan.price === 0 ? ["Advanced visibility & analytics require paid plans"] : []}
                      cta={
                        plan.price === 0
                          ? "Activate Free Plan"
                          : "Upgrade Provider Plan"
                      }
                      popular={plan.price > 0 && plan.billingCycle === "monthly"}
                      subscriptionId={plan._id}
                      subscriptionType="provider"
                      onActivate={async () => {
                        if (plan.price === 0) {
                          try {
                            const res = await api.subscriptions.activate({
                              subscriptionId: plan._id,
                              type: "provider",
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
                        }
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Billing & Subscription Rules */}
        <section className="py-10 sm:py-12 md:py-16 bg-background">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Billing & Subscriptions</h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-3xl mx-auto">
                Platform billing is the default for safety and compliance. Subscriptions enable direct contact and extra visibility.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {subscriptionRules.map((rule) => (
                <div key={rule.title} className="rounded-xl sm:rounded-2xl border bg-muted/30 p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3 shadow-sm">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">{rule.title}</h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    {rule.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary mt-[2px] flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Benefits */}
        <section className="py-10 sm:py-12 md:py-16 bg-secondary/30">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Why Upgrade to Premium?
              </h2>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                Unlock powerful features to connect with providers faster
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
              {premiumBenefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="text-center p-4 sm:p-5 md:p-6 rounded-xl bg-card border animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <benefit.icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-10 sm:py-12 md:py-16">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Feature Comparison
              </h2>
            </div>
            <div className="max-w-4xl mx-auto overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 sm:py-4 px-3 sm:px-4 font-medium text-xs sm:text-sm">Feature</th>
                      <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-medium text-xs sm:text-sm">Basic</th>
                      <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-medium bg-primary/5 text-xs sm:text-sm">
                        Pro
                      </th>
                      <th className="text-center py-3 sm:py-4 px-3 sm:px-4 font-medium text-xs sm:text-sm">Business</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "Browse Services", basic: true, pro: true, business: true },
                      { feature: "View Provider Profiles", basic: true, pro: true, business: true },
                      { feature: "Request Quotes", basic: true, pro: true, business: true },
                      { feature: "Platform Billing (default)", basic: true, pro: true, business: true },
                      { feature: "Direct Contact (messages/phone/email)", basic: false, pro: true, business: true },
                      { feature: "Featured Visibility", basic: false, pro: true, business: true },
                      { feature: "Unlimited Listings (providers)", basic: false, pro: true, business: true },
                      { feature: "Priority Search", basic: false, pro: true, business: true },
                      { feature: "Saved Searches", basic: false, pro: true, business: true },
                      { feature: "Team Collaboration", basic: false, pro: false, business: true },
                      { feature: "Dedicated Account Manager", basic: false, pro: false, business: true },
                      { feature: "API Access", basic: false, pro: false, business: true },
                      { feature: "Analytics Dashboard", basic: false, pro: false, business: true },
                    ].map((row) => (
                      <tr key={row.feature} className="border-b">
                        <td className="py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm">{row.feature}</td>
                        <td className="text-center py-3 sm:py-4 px-3 sm:px-4">
                          {row.basic ? (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-center py-3 sm:py-4 px-3 sm:px-4 bg-primary/5">
                          {row.pro ? (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="text-center py-3 sm:py-4 px-3 sm:px-4">
                          {row.business ? (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-success mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-10 sm:py-12 md:py-16 bg-secondary/30">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-card border rounded-lg px-3 sm:px-4 md:px-6"
                  >
                    <AccordionTrigger className="text-left hover:no-underline text-sm sm:text-base pr-4">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm text-muted-foreground pr-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
