"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Activity } from "lucide-react";
import api from "@/lib/api-client";

type MarketPulse = {
  city: string;
  cityDisplay: string;
  healthScore: number;
  metrics: {
    completedTransactions7d: number;
    cancellationRatePct: number;
    avgTrustScore: number;
    activeSuppliers: number;
    verifiedSuppliers: number;
    gmv7dInr: number;
  };
  periodComparison: { gmvChangePct: number | null; completedChangePct: number | null };
  yourPosition?: {
    trustScore: number;
    imagineScore: number;
    rank: string;
    cityPercentile: number;
    isImagineeringVerified: boolean;
  };
  alerts: Array<{ type: string; message: string }>;
};

export function MarketPulseCard() {
  const [pulse, setPulse] = useState<MarketPulse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.finance.getMarketPulse();
        if (!cancelled && res.success && res.data) {
          setPulse((res.data as { marketPulse: MarketPulse }).marketPulse);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading market pulse…
        </CardContent>
      </Card>
    );
  }

  if (!pulse) return null;

  const gmvTrend = pulse.periodComparison.gmvChangePct;

  return (
    <Card className="border-blue-200/60 bg-gradient-to-br from-sky-50/80 to-white dark:from-slate-900 dark:to-slate-950">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-600" />
              Market Pulse
            </CardTitle>
            <CardDescription>{pulse.cityDisplay} · last 7 days</CardDescription>
          </div>
          <Badge variant="outline" className="text-sm font-semibold">
            Health {pulse.healthScore}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">GMV (7d)</p>
            <p className="text-base font-semibold">₹{pulse.metrics.gmv7dInr.toLocaleString("en-IN")}</p>
            {gmvTrend != null && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                {gmvTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-amber-600" />
                )}
                {gmvTrend >= 0 ? "+" : ""}
                {gmvTrend}% vs prior week
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
            <p className="text-base font-semibold">{pulse.metrics.completedTransactions7d}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg trust</p>
            <p className="text-base font-semibold">{pulse.metrics.avgTrustScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Verified suppliers</p>
            <p className="text-base font-semibold">{pulse.metrics.verifiedSuppliers}</p>
          </div>
        </div>

        {pulse.yourPosition && (
          <div className="rounded-lg border bg-background/80 p-3 text-sm">
            <p className="font-medium">Your position in {pulse.cityDisplay}</p>
            <p className="mt-1 text-muted-foreground">
              Trust {pulse.yourPosition.trustScore} · Top {pulse.yourPosition.cityPercentile}% in city ·{" "}
              {pulse.yourPosition.rank}
            </p>
          </div>
        )}

        {pulse.alerts.length > 0 && (
          <div className="space-y-1">
            {pulse.alerts.slice(0, 2).map((a) => (
              <p key={a.type} className="text-xs text-amber-700 dark:text-amber-400">
                {a.message}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
