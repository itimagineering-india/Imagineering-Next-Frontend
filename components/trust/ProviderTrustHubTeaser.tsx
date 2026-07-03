"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, ArrowRight, Loader2, Target, Wallet } from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import type { ImagineScoreData } from "@/components/trust/ImagineScorePanel";
import type { DailyGoalsData } from "@/components/trust/DailyGoalsWidget";
import { ImagineVerifiedBadge } from "@/components/trust/ImagineScorePanel";

/** Compact dashboard entry point — full widgets live on /dashboard/provider/trust */
export function ProviderTrustHubTeaser() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<ImagineScoreData | null>(null);
  const [goals, setGoals] = useState<DailyGoalsData | null>(null);

  const creditsBalance = (user as { creditsBalance?: number })?.creditsBalance ?? 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [scoreRes, goalsRes] = await Promise.all([
          api.trust.getMyScore().catch(() => ({ success: false })),
          api.trust.getMyDailyGoals().catch(() => ({ success: false })),
        ]);
        if (cancelled) return;
        if (scoreRes.success && (scoreRes as { data?: { score?: ImagineScoreData } }).data?.score) {
          setScore((scoreRes as { data: { score: ImagineScoreData } }).data.score);
        }
        if (goalsRes.success && (goalsRes as { data?: { dailyGoals?: DailyGoalsData } }).data?.dailyGoals) {
          setGoals((goalsRes as { data: { dailyGoals: DailyGoalsData } }).data.dailyGoals);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const earned = goals?.totalEarned ?? 0;
  const earnable = goals?.totalEarnable ?? 0;
  const trust = score?.trustScore != null ? Math.round(score.trustScore) : null;

  return (
    <Card className="border-primary/15 bg-gradient-to-r from-primary/5 via-background to-sky-50/50 dark:to-slate-900/50">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold">Trust & Growth</h3>
                <ImagineVerifiedBadge score={score} className="text-[10px] h-5" />
              </div>
              {loading ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </p>
              ) : (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {trust != null && (
                    <span>
                      Trust <span className="font-medium text-foreground">{trust}</span>
                      {score?.rank && (
                        <span className="capitalize"> · {score.rank}</span>
                      )}
                    </span>
                  )}
                  {earnable > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Goals{" "}
                      <span className="font-medium text-foreground">
                        {earned}/{earnable}
                      </span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    <Link href="/dashboard/wallet" className="font-medium text-foreground hover:underline">
                      {creditsBalance}
                    </Link>{" "}
                    credits
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0 w-full sm:w-auto">
            <Link href="/dashboard/provider/trust">
              Open hub
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {!loading && earnable > 0 && earned < earnable && (
          <p className="mt-2 text-[11px] text-muted-foreground pl-[52px] sm:pl-0 sm:mt-3">
            Score, daily goals, market pulse, achievements & referrals — all in one place.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
