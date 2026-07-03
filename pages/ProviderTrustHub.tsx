"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ImagineScorePanel,
  ImagineVerifiedBadge,
  type ImagineScoreData,
} from "@/components/trust/ImagineScorePanel";
import { AchievementBadges, type ProviderAchievement } from "@/components/trust/AchievementBadges";
import { DailyGoalsWidget, type DailyGoalsData } from "@/components/trust/DailyGoalsWidget";
import { MarketPulseCard } from "@/components/finance/MarketPulseCard";

export async function getServerSideProps() {
  return { props: {} };
}

export default function ProviderTrustHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [imagineScore, setImagineScore] = useState<ImagineScoreData | null>(null);
  const [achievements, setAchievements] = useState<ProviderAchievement[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoalsData | null>(null);
  const [trustShare, setTrustShare] = useState<null | {
    shareText: string;
    verifiedUrl: string;
    providerUrl: string;
    whatsappUrl: string;
    linkedInUrl: string;
  }>(null);
  const [loading, setLoading] = useState(true);

  const creditsBalance = (user as { creditsBalance?: number })?.creditsBalance ?? 0;
  const referralCode = (user as { referralCode?: string })?.referralCode ?? "";
  const referralStats = (user as { referralStats?: { totalReferred?: number; successfulReferrals?: number; totalCreditsEarned?: number } })?.referralStats;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [scoreRes, achievementsRes, goalsRes, shareRes] = await Promise.all([
          api.trust.getMyScore().catch(() => ({ success: false })),
          api.trust.getMyAchievements().catch(() => ({ success: false })),
          api.trust.getMyDailyGoals().catch(() => ({ success: false })),
          api.trust.getMyShare().catch(() => ({ success: false })),
        ]);
        if (cancelled) return;
        if (scoreRes.success && (scoreRes as { data?: { score?: ImagineScoreData } }).data?.score) {
          setImagineScore((scoreRes as { data: { score: ImagineScoreData } }).data.score);
        }
        if (achievementsRes.success && (achievementsRes as { data?: { achievements?: ProviderAchievement[] } }).data?.achievements) {
          setAchievements((achievementsRes as { data: { achievements: ProviderAchievement[] } }).data.achievements);
        }
        if (goalsRes.success && (goalsRes as { data?: { dailyGoals?: DailyGoalsData } }).data?.dailyGoals) {
          setDailyGoals((goalsRes as { data: { dailyGoals: DailyGoalsData } }).data.dailyGoals);
        }
        if (shareRes.success && (shareRes as { data?: { share?: typeof trustShare } }).data?.share) {
          setTrustShare((shareRes as { data: { share: NonNullable<typeof trustShare> } }).data.share);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 md:p-6 space-y-5 sm:space-y-6 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-2 h-8" asChild>
            <Link href="/dashboard/provider">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Trust & Growth</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Imagine Score, daily goals, market insights, achievements, and referral rewards.
          </p>
        </div>
        {imagineScore && <ImagineVerifiedBadge score={imagineScore} />}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading your trust data…</p>
      ) : (
        <>
          {imagineScore && <ImagineScorePanel score={imagineScore} variant="dashboard" />}

          {trustShare && (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 dark:from-emerald-950/20">
              <CardContent className="p-4 sm:p-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2 min-w-0">
                  <h3 className="text-base font-semibold">Imagineering Verified Network</h3>
                  <p className="text-sm text-muted-foreground">
                    Share your public trust profile to build buyer confidence faster.
                  </p>
                  <p className="text-xs text-muted-foreground break-all">
                    {trustShare.verifiedUrl || trustShare.providerUrl}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          trustShare.verifiedUrl || trustShare.providerUrl
                        );
                        toast({ title: "Verified profile copied" });
                      } catch {
                        toast({ title: "Could not copy link", variant: "destructive" });
                      }
                    }}
                  >
                    Copy link
                  </Button>
                  <Button size="sm" asChild>
                    <a href={trustShare.whatsappUrl} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <MarketPulseCard />
          <DailyGoalsWidget data={dailyGoals} />

          {achievements.length > 0 && (
            <AchievementBadges achievements={achievements} variant="grid" showShare />
          )}

          {referralCode && (
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">Invite & Earn Credits</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Share your referral link — you both earn credits on their first booking.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-semibold">{creditsBalance}</p>
                    <Link href="/dashboard/wallet" className="text-xs text-primary hover:underline">
                      Rewards guide
                    </Link>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input value={referralCode} readOnly className="text-sm" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const origin = typeof window !== "undefined" ? window.location.origin : "";
                      const link = `${origin}/signup?ref=${encodeURIComponent(referralCode)}`;
                      try {
                        await navigator.clipboard.writeText(link);
                        toast({ title: "Referral link copied" });
                      } catch {
                        toast({ title: "Could not copy", variant: "destructive" });
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
                {referralStats && (
                  <p className="text-xs text-muted-foreground">
                    Invited {referralStats.totalReferred ?? 0} · Successful{" "}
                    {referralStats.successfulReferrals ?? 0} · Earned{" "}
                    {referralStats.totalCreditsEarned ?? creditsBalance} credits
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
