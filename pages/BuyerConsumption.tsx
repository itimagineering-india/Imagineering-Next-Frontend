"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Minus, BarChart3 } from "lucide-react";
import api from "@/lib/api-client";

export async function getServerSideProps() {
  return { props: {} };
}

export default function BuyerConsumptionPage() {
  const [insights, setInsights] = useState<{
    periodDays: number;
    totalSpendInr: number;
    completedOrders: number;
    avgOrderValueInr: number;
    spendByMonth: Array<{ month: string; spendInr: number; orders: number }>;
    topCategories: Array<{ category: string; spendInr: number; orders: number }>;
    topCities: Array<{ city: string; spendInr: number; orders: number }>;
    recentTrend: "up" | "down" | "stable";
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api.finance.getConsumptionInsights().then((res) => {
      if (res.success && res.data) {
        setInsights((res.data as { insights: typeof insights }).insights);
      }
      setLoading(false);
    });
  }, []);

  const TrendIcon =
    insights?.recentTrend === "up"
      ? TrendingUp
      : insights?.recentTrend === "down"
        ? TrendingDown
        : Minus;

  return (
    <DashboardLayout type="buyer">
      <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Consumption Insights</h1>
          <p className="text-sm text-muted-foreground">
            Your construction spend patterns on Imagineering India (last 90 days).
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !insights || insights.completedOrders === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Complete orders to see your consumption insights and category breakdown.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total spend</CardDescription>
                  <CardTitle className="text-2xl">
                    ₹{insights.totalSpendInr.toLocaleString("en-IN")}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Completed orders</CardDescription>
                  <CardTitle className="text-2xl">{insights.completedOrders}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Avg order value</CardDescription>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    ₹{insights.avgOrderValueInr.toLocaleString("en-IN")}
                    <TrendIcon className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Spend by category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.topCategories.map((c) => (
                  <div key={c.category} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{c.category}</p>
                      <p className="text-xs text-muted-foreground">{c.orders} orders</p>
                    </div>
                    <Badge variant="secondary">₹{c.spendInr.toLocaleString("en-IN")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {insights.topCities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Spend by city</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {insights.topCities.map((c) => (
                    <div key={c.city} className="flex justify-between text-sm">
                      <span>{c.city}</span>
                      <span className="font-medium">₹{c.spendInr.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
