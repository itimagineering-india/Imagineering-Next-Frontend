"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { REDEEM_STEPS } from "@/lib/rewards-guide";
import { IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";
import { WalletStatement } from "@/components/wallet/WalletStatement";
import {
  ArrowLeft,
  Award,
  Gift,
  HelpCircle,
  Loader2,
  ShoppingBag,
  Target,
  Users,
  Wallet as WalletIcon,
} from "lucide-react";

export async function getServerSideProps() {
  return { props: {} };
}

type RewardsProgram = {
  isActive: boolean;
  redemption: {
    enabled: boolean;
    creditInrValue: number;
    maxRedeemOrderPercent: number;
    minRedeemCredits: number;
  };
  referral: {
    isActive: boolean;
    buyer: { enabled: boolean; referrerCredits: number; refereeCredits: number };
    provider: { enabled: boolean; referrerCredits: number; refereeCredits: number };
  };
  dailyGoals: Array<{ id: string; label: string; description: string; credits: number }>;
  achievements: Array<{ slug: string; title: string; credits: number }>;
};

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isProvider = user?.role === "provider";

  const [balance, setBalance] = useState(0);
  const [creditInrValue, setCreditInrValue] = useState(1);
  const [maxRedeemPercent, setMaxRedeemPercent] = useState(20);
  const [minRedeem, setMinRedeem] = useState(10);
  const [program, setProgram] = useState<RewardsProgram | null>(null);
  const [programLoading, setProgramLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [referralLink, setReferralLink] = useState("");

  const creditsBalance = (user as { creditsBalance?: number })?.creditsBalance ?? balance;
  const referralCode = (user as { referralCode?: string })?.referralCode ?? "";
  const referralStats = (user as {
    referralStats?: {
      totalReferred?: number;
      successfulReferrals?: number;
      totalCreditsEarned?: number;
    };
  })?.referralStats;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBalanceLoading(true);
      try {
        const res = await api.wallet.getMe();
        if (!cancelled && res.success && res.data) {
          const w = res.data.wallet;
          setBalance(w?.balance ?? 0);
          setCreditInrValue(w?.creditInrValue ?? 1);
          setMaxRedeemPercent(w?.maxRedeemOrderPercent ?? 20);
          setMinRedeem(w?.minRedeemCredits ?? 10);
        }
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.wallet.getRewardsProgram();
        if (!cancelled && res.success && res.data?.program) {
          setProgram(res.data.program);
        }
      } finally {
        if (!cancelled) setProgramLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (referralCode && typeof window !== "undefined") {
      setReferralLink(`${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`);
    }
  }, [referralCode]);

  const copyReferralLink = async () => {
    const link =
      referralLink ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
        : referralCode);
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Referral link copied" });
    } catch {
      toast({ title: "Could not copy link", variant: "destructive" });
    }
  };

  const displayBalance = balanceLoading ? null : Math.max(balance, creditsBalance);
  const referralRole = isProvider ? "provider" : "buyer";
  const referralCfg = program?.referral?.[referralRole];
  const showReferralEarn =
    program?.referral?.isActive && referralCfg?.enabled && program.isActive;
  const dailyGoals = program?.dailyGoals ?? [];
  const achievements = program?.achievements ?? [];
  const displayCreditValue = program?.redemption?.creditInrValue ?? creditInrValue;
  const displayMaxPercent = program?.redemption?.maxRedeemOrderPercent ?? maxRedeemPercent;
  const displayMinRedeem = program?.redemption?.minRedeemCredits ?? minRedeem;
  const redemptionEnabled = program?.redemption?.enabled !== false && program?.isActive !== false;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-shell mx-auto w-full max-w-5xl space-y-6 py-6 sm:py-8">
        <Button variant="ghost" size="sm" className="-ml-2 w-fit gap-1" asChild>
          <Link href="/profile">
            <ArrowLeft className="h-4 w-4" />
            Back to profile
          </Link>
        </Button>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">{IMAGINEERING_WALLET.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{IMAGINEERING_WALLET.oneLiner}</p>
        </div>

        {/* Balance hero */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-50/40 dark:to-emerald-950/20">
          <CardHeader className="pb-2">
            <CardDescription>Available balance</CardDescription>
            <CardTitle className="flex flex-wrap items-center gap-2 text-3xl">
              <WalletIcon className="h-7 w-7 text-primary" />
              {balanceLoading ? "—" : displayBalance?.toLocaleString("en-IN")}
              <span className="text-base font-normal text-muted-foreground">points</span>
              {!balanceLoading && displayBalance != null && displayBalance > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  ≈ ₹{displayBalance.toLocaleString("en-IN")} off at checkout
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {isProvider && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/provider/trust">
                    <Target className="mr-1.5 h-4 w-4" />
                    Earn more
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={isProvider ? "/dashboard/provider/bookings" : "/services"}>
                  <ShoppingBag className="mr-1.5 h-4 w-4" />
                  {isProvider ? "View bookings" : "Book & redeem"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="statement" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="statement">Statement</TabsTrigger>
            <TabsTrigger value="guide">How it works</TabsTrigger>
          </TabsList>

          <TabsContent value="statement" className="mt-4 space-y-4">
            <WalletStatement
              creditInrValue={displayCreditValue}
              isProvider={isProvider}
            />
          </TabsContent>

          <TabsContent value="guide" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  What is {IMAGINEERING_WALLET.name}?
                </CardTitle>
                <CardDescription>
                  Your rewards wallet on Imagineering India
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  {IMAGINEERING_WALLET.name} is a points balance you earn on Imagineering India and use
                  as a <strong className="text-foreground">partial discount</strong> when booking
                  services. It is not cash — points reduce your order total at checkout, up to the
                  platform limit.
                </p>
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>
                    <strong className="text-foreground">1 point = ₹{displayCreditValue}</strong> off your
                    booking total
                  </li>
                  <li>Earned automatically when you qualify (referrals, goals, achievements)</li>
                  <li>Shown in your wallet balance and account statement</li>
                  <li>Redeemed at checkout — debited only after successful payment</li>
                  <li>If a booking is cancelled or refunded, redeemed points are returned</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="h-5 w-5 text-primary" />
                  How to earn credits
                </CardTitle>
                <CardDescription>Ways to grow your balance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {programLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !program?.isActive ? (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    The rewards program is temporarily paused.
                  </p>
                ) : (
                  <>
                    {showReferralEarn && referralCfg && (
                      <div className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <Users className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold">Invite friends (Referrals)</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              When someone signs up via your link and completes their first booking,
                              you both earn credits — shown as a credit entry in your statement.
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline">You get {referralCfg.referrerCredits} pts</Badge>
                              <Badge variant="outline">They get {referralCfg.refereeCredits} pts</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isProvider && dailyGoals.length > 0 && (
                      <>
                        <div className="rounded-lg border p-4">
                          <div className="flex items-start gap-3">
                            <Target className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="font-semibold">Daily goals</h3>
                                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                                  <Link href="/dashboard/provider/trust">Trust & Growth →</Link>
                                </Button>
                              </div>
                              <ul className="mt-3 space-y-2">
                                {dailyGoals.map((g) => (
                                  <li
                                    key={g.id}
                                    className="flex items-center justify-between gap-2 border-b border-dashed pb-2 text-sm last:border-0 last:pb-0"
                                  >
                                    <span>{g.label}</span>
                                    <Badge className="shrink-0">+{g.credits}</Badge>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {achievements.length > 0 && (
                          <div className="rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <Award className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold">Achievements</h3>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {achievements.map((a) => (
                                    <div
                                      key={a.slug}
                                      className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                                    >
                                      <span className="truncate pr-2">{a.title}</span>
                                      <span className="shrink-0 font-medium text-emerald-600">
                                        +{a.credits}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  How to use {IMAGINEERING_WALLET.name}
                </CardTitle>
                <CardDescription>Redeem points when you book a service</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Toggle <strong className="text-foreground">“{IMAGINEERING_WALLET.applyToggleLabel}”</strong>{" "}
                  at checkout (service, cart, manpower, or quote). Redemption appears as a debit in
                  your statement.
                </p>
                <ol className="space-y-2">
                  {REDEEM_STEPS.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="pt-0.5 text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
                <div className="rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium text-foreground">Redemption rules</p>
                  {!redemptionEnabled ? (
                    <p className="mt-2 text-muted-foreground">Checkout redemption is disabled.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>Minimum {displayMinRedeem} points to apply</li>
                      <li>Maximum {displayMaxPercent}% of wallet points per booking</li>
                      <li>Debited only after payment succeeds</li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            {referralCode && (
              <Card className="border-dashed border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-lg">Your referral link</CardTitle>
                  <CardDescription>Share to earn — credits appear in your statement.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input readOnly value={referralLink || referralCode} className="text-sm" />
                    <Button type="button" variant="outline" onClick={() => void copyReferralLink()}>
                      Copy link
                    </Button>
                  </div>
                  {referralStats && (
                    <p className="text-xs text-muted-foreground">
                      Invited {referralStats.totalReferred ?? 0} · Successful{" "}
                      {referralStats.successfulReferrals ?? 0} · Earned{" "}
                      {referralStats.totalCreditsEarned ?? 0} pts
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
