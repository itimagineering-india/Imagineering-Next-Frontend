"use client";
import PricingGrid from "@/components/subscriptions/PricingGrid";
import ComparisonTable from "@/components/subscriptions/ComparisonTable";
import { buyerFeatures, supplierFeatures } from "@/data/subscription";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles } from "lucide-react";
import FeatureList from "@/components/subscriptions/FeatureList";

export async function getServerSideProps() { return { props: {} }; }

const SubscriptionsLanding = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                Premium Plans
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Choose the plan that fits how you work
              </h1>
              <p className="text-lg text-muted-foreground">
                Buyers unlock direct contact. Suppliers get featured visibility and gold markers across map and search.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button asChild>
                  <a href="/subscriptions/buyer">Upgrade to Buyer Premium</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/subscriptions/supplier">Upgrade to Supplier Premium</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container space-y-8">
            <PricingGrid />
          </div>
        </section>

        <section className="py-14 bg-muted/30">
          <div className="container grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-semibold">Buyer Premium</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlock Direct Contact</h3>
              <FeatureList items={buyerFeatures} />
              <Button className="mt-6 w-full" asChild>
                <a href="/subscriptions/buyer">See Buyer Premium details</a>
              </Button>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-amber-500">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold">Supplier Premium</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Featured Visibility</h3>
              <FeatureList items={supplierFeatures} />
              <Button className="mt-6 w-full" variant="outline" asChild>
                <a href="/subscriptions/supplier">See Supplier Premium details</a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container space-y-6">
            <h2 className="text-3xl font-bold text-foreground text-center">Compare plans</h2>
            <ComparisonTable />
          </div>
        </section>
      </main>
    </div>
  );
};

export default SubscriptionsLanding;

