"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { REDEEM_STEPS } from "@/lib/rewards-guide";
import {
  ArrowDownLeft,
  ArrowUpRight,
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

const SOURCE_LABELS: Record<string, string> = {
  referral: "Referral reward",
  admin: "Admin credit",
  daily_goal: "Daily goal",
  achievement: "Achievement",
  booking_redeem: "Checkout redemption",
  booking_refund: "Booking refund",
  adjustment: "Adjustment",
};

type WalletTxn = {
  id: string;
  entryType: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  sourceType: string;
  description?: string;
  occurredAt: string;
};

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
  const layoutType = user?.role === "provider" ? "provider" : "buyer";
  const isProvider = user?.role === "provider";

  const [balance, setBalance] = useState(0);
  const [creditInrValue, setCreditInrValue] = useState(1);
  const [maxRedeemPercent, setMaxRedeemPercent] = useState(20);
  const [minRedeem, setMinRedeem] = useState(10);
  const [program, setProgram] = useState<RewardsProgram | null>(null);
  const [programLoading, setProgramLoading] = useState(true);
  const [transactions, setTransactions] = useState<WalletTxn[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [referralLink, setReferralLink] = useState("");

  const creditsBalance = (user as { creditsBalance?: number })?.creditsBalance ?? balance;
  const referralCode = (user as { referralCode?: string })?.referralCode ?? "";
  const referralStats = (user as { referralStats?: { totalReferred?: number; successfulReferrals?: number; totalCreditsEarned?: number } })?.referralStats;

  const loadWallet = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        pageNum === 1 ? api.wallet.getMe() : Promise.resolve({ success: true, data: null }),
        api.wallet.getTransactions({ page: pageNum, limit: 20 }),
      ]);
      if (walletRes.success && walletRes.data) {
        const w = (walletRes.data as { wallet?: { balance?: number; maxRedeemOrderPercent?: number; minRedeemCredits?: number } }).wallet;
        setBalance(w?.balance ?? 0);
        setCreditInrValue((w as { creditInrValue?: number })?.creditInrValue ?? 1);
        setMaxRedeemPercent(w?.maxRedeemOrderPercent ?? 20);
        setMinRedeem(w?.minRedeemCredits ?? 10);
      }
      if (txRes.success && txRes.data) {
        const data = txRes.data as { transactions?: WalletTxn[]; pagination?: { pages?: number } };
        setTransactions((prev) =>
          append ? [...prev, ...(data.transactions ?? [])] : data.transactions ?? []
        );
        setTotalPages(data.pagination?.pages ?? 1);
        setPage(pageNum);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet(1);
  }, [loadWallet]);

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

  const displayBalance = loading ? null : Math.max(balance, creditsBalance);
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
    <DashboardLayout type={layoutType}>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rewards & Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Imagineering India reward points — earn by growing on the platform, redeem at checkout.
          </p>
        </div>

        {/* Balance */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-emerald-50/40 dark:to-emerald-950/20">
          <CardHeader className="pb-2">
            <CardDescription>Your balance</CardDescription>
            <CardTitle className="flex flex-wrap items-center gap-2 text-3xl">
              <WalletIcon className="h-7 w-7 text-primary" />
              {loading ? "—" : displayBalance?.toLocaleString("en-IN")}
              <span className="text-base font-normal text-muted-foreground">credits</span>
              {!loading && displayBalance != null && displayBalance > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  ≈ ₹{displayBalance.toLocaleString("en-IN")} at checkout
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">1 credit = ₹{displayCreditValue}</strong> toward service
              bookings. Credits are not cash and cannot be withdrawn — they reduce your order total at
              checkout.
            </p>
            <div className="flex flex-wrap gap-2">
              {isProvider && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/provider/trust">
                    <Target className="mr-1.5 h-4 w-4" />
                    Earn more (Trust & Growth)
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={isProvider ? "/dashboard/provider/bookings" : "/services"}>
                  <ShoppingBag className="mr-1.5 h-4 w-4" />
                  {isProvider ? "View bookings" : "Browse services to redeem"}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* What are credits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              What are Imagineering Credits?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Imagineering Credits are reward points you earn for trusted activity on Imagineering India —
              referrals, daily goals, achievements, and platform milestones. They sit in your Rewards Wallet
              and can be used as a discount when you book services.
            </p>
            <ul className="list-disc space-y-1.5 pl-5">
              <li>1 credit = ₹{displayCreditValue} off your booking total</li>
              <li>Earned automatically when you qualify — no manual claim needed</li>
              <li>Shown in your wallet balance and transaction history below</li>
              <li>If a booking is refunded, redeemed credits are returned to your wallet</li>
            </ul>
          </CardContent>
        </Card>

        {/* How to earn */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="h-5 w-5 text-primary" />
              How to earn credits
            </CardTitle>
            <CardDescription>Ways to grow your balance on Imagineering India</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {programLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !program?.isActive ? (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-4">
                The rewards program is temporarily paused. Check back soon.
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
                    Share your referral link. When someone signs up and completes their{" "}
                    <strong className="text-foreground">first booking</strong>, you both earn credits.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">You get {referralCfg.referrerCredits} credits</Badge>
                    <Badge variant="outline">They get {referralCfg.refereeCredits} credits</Badge>
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
                        <h3 className="font-semibold">Today&apos;s goals</h3>
                        <Button variant="link" className="h-auto p-0 text-xs" asChild>
                          <Link href="/dashboard/provider/trust">Open Trust & Growth →</Link>
                        </Button>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Complete daily supplier goals — credits are added the same day.
                      </p>
                      <ul className="mt-3 space-y-2">
                        {dailyGoals.map((g) => (
                          <li
                            key={g.id}
                            className="flex items-center justify-between gap-2 text-sm border-b border-dashed pb-2 last:border-0 last:pb-0"
                          >
                            <span>
                              {g.label}
                              {g.description && (
                                <span className="ml-1 text-xs text-muted-foreground">({g.description})</span>
                              )}
                            </span>
                            <Badge className="shrink-0">+{g.credits}</Badge>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Up to {dailyGoals.reduce((sum, g) => sum + g.credits, 0)} credits possible per day
                        from goals.
                      </p>
                    </div>
                  </div>
                </div>

                {achievements.length > 0 && (
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Award className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">Achievements</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Unlock badges for milestones — KYC, order counts, trust rank, and more. Credits are
                        added once per achievement.
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {achievements.map((a) => (
                          <div
                            key={a.slug}
                            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                          >
                            <span className="truncate pr-2">{a.title}</span>
                            <span className="shrink-0 font-medium text-emerald-600">+{a.credits}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </>
            )}

            {!isProvider && !showReferralEarn && (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
                No earn methods are active right now. Check back when the program is enabled.
              </p>
            )}

            {!isProvider && showReferralEarn && (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed p-3">
                As a buyer, referrals are the main way to earn credits. Providers can also earn from daily
                goals and achievements on the Trust & Growth hub.
              </p>
            )}
              </>
            )}
          </CardContent>
        </Card>

        {/* How to redeem */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Where & how to redeem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redeem credits when booking any service on Imagineering India — single service checkout or
              cart checkout. Look for the <strong className="text-foreground">“Apply Imagineering Credits”</strong>{" "}
              toggle before payment.
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
                <p className="mt-2 text-muted-foreground">Checkout redemption is currently disabled.</p>
              ) : (
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>Minimum {displayMinRedeem} credits required to apply at checkout</li>
                <li>Maximum {displayMaxPercent}% of the order total can be paid with credits</li>
                <li>
                  Example: ₹1,000 order → up to ₹
                  {Math.floor((1000 * displayMaxPercent) / 100).toLocaleString("en-IN")} (
                  {Math.floor((1000 * displayMaxPercent) / 100)} credits) if you have enough balance
                </li>
                <li>Credits are debited only after successful payment</li>
              </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Referral */}
        {referralCode && (
          <Card className="border-dashed border-emerald-200">
            <CardHeader>
              <CardTitle className="text-lg">Your referral link</CardTitle>
              <CardDescription>
                Share with buyers or suppliers — both earn on the first completed booking.
              </CardDescription>
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
                  {referralStats.successfulReferrals ?? 0} · Total earned{" "}
                  {referralStats.totalCreditsEarned ?? 0} credits
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction history */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction history</CardTitle>
            <CardDescription>All credits earned and redeemed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions yet.{" "}
                {isProvider
                  ? "Complete daily goals or share your referral link to start earning."
                  : "Share your referral link or complete a referred friend's first booking."}
              </p>
            ) : (
              <>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex items-start gap-3">
                      {tx.entryType === "credit" ? (
                        <ArrowDownLeft className="mt-0.5 h-4 w-4 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="mt-0.5 h-4 w-4 text-amber-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {tx.description || SOURCE_LABELS[tx.sourceType] || tx.sourceType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.occurredAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={
                          tx.entryType === "credit"
                            ? "font-semibold text-emerald-600"
                            : "font-semibold text-amber-600"
                        }
                      >
                        {tx.entryType === "credit" ? "+" : "−"}
                        {tx.amount}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        Bal {tx.balanceAfter}
                      </Badge>
                    </div>
                  </div>
                ))}
                {page < totalPages && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={loadingMore}
                    onClick={() => void loadWallet(page + 1, true)}
                  >
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
