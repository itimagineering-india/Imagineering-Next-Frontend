"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { billingHistoryMock } from "@/data/subscription";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export async function getServerSideProps() { return { props: {} }; }

interface MySubscriptionResponse {
  subscription?: {
    _id: string;
    name: string;
    type: "buyer" | "provider";
    price: number;
    billingCycle: "monthly" | "yearly";
  };
  status: "active" | "inactive" | "expired" | "cancelled";
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  isDefault?: boolean;
  isExpired?: boolean;
}

const DashboardSubscription = () => {
  const { toast } = useToast();
  const [buyerSub, setBuyerSub] = useState<MySubscriptionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMySub = async () => {
      try {
        const res = await api.subscriptions.getMy("buyer");
        if (!isMounted) return;
        if (res.success && res.data) {
          setBuyerSub((res.data as any) as MySubscriptionResponse);
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Failed to load subscription:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load your subscription.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchMySub();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const currentPlanName =
    buyerSub?.subscription?.name || "FREE (Buyer)";
  const currentStatus =
    buyerSub?.status ? buyerSub.status.charAt(0).toUpperCase() + buyerSub.status.slice(1) : "Inactive";
  const renewalDate = buyerSub?.endDate
    ? new Date(buyerSub.endDate).toISOString().split("T")[0]
    : "—";
  const monthlyPrice = buyerSub?.subscription?.price || 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <section className="py-12 bg-gradient-to-br from-primary/5 via-background to-primary/5">
          <div className="container space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Subscription</p>
                <h1 className="text-3xl font-bold text-foreground">Your Plan</h1>
              </div>
              <Badge variant="secondary" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {currentStatus}
              </Badge>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">
                    {currentPlanName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Renews on {renewalDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Downgrade to Free</Button>
                  <Button>View Buyer Plans</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl border bg-muted/40">
                    <p className="text-xs text-muted-foreground">Monthly Price</p>
                    <p className="text-lg font-semibold">
                      {isLoading ? "—" : `₹${monthlyPrice}`}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-muted/40">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-primary">
                      {isLoading ? "Loading..." : currentStatus}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border bg-muted/40">
                    <p className="text-xs text-muted-foreground">Next Renewal</p>
                    <p className="text-lg font-semibold">{renewalDate}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border bg-primary/5">
                    <p className="text-sm font-semibold text-foreground mb-2">Premium feature status</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Direct contact unlocked
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Unlimited unlocks
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" /> Premium providers shown first
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border bg-amber-50">
                    <p className="text-sm font-semibold text-amber-900 mb-2">Want Supplier Premium?</p>
                    <p className="text-sm text-amber-900/80">
                      Get gold marker, featured placement, and direct leads from premium buyers.
                    </p>
                    <Button className="mt-3 w-full">Upgrade to Supplier Premium</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="py-12">
          <div className="container grid lg:grid-cols-2 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Billing History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {billingHistoryMock.map((bill) => (
                  <div key={bill.id} className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{bill.plan}</p>
                      <p className="text-xs text-muted-foreground">{bill.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{bill.amount}</p>
                      <Badge variant="secondary" className="mt-1">Paid</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Usage & Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Contact unlocks this month</span>
                    <span>18 / Unlimited</span>
                  </div>
                  <Progress value={70} />
                </div>
                <div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Premium provider views</span>
                    <span>42</span>
                  </div>
                  <Progress value={42} />
                </div>
                <div className="p-3 rounded-lg border bg-muted/40 text-sm text-muted-foreground flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-1" />
                  Tip: Premium providers are shown first; try contacting the top 3 for faster responses.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardSubscription;

