"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import {
  IMAGINEERING_CREDIT,
  IMAGINEERING_WALLET,
} from "@/lib/imagineering-product-labels";
import { CreditKycDocumentUpload } from "@/components/imagineering-credit/CreditKycDocumentUpload";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Crown,
  HelpCircle,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";

export async function getServerSideProps() {
  return { props: {} };
}

type CreditAccount = {
  id: string;
  creditLimit: number;
  creditUsed: number;
  availableCredit: number;
  outstanding: number;
  tier: string;
  status: string;
  nextDueDate?: string;
  activatedAt?: string;
  invitedAt?: string;
  validityType: string;
  riskScore: number;
};

type UnderwritingSignal = {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  value?: unknown;
};

type Underwriting = {
  eligible: boolean;
  score: number;
  recommendedTier: string;
  recommendedLimit: number;
  signals: UnderwritingSignal[];
  reasons: string[];
};

type RepaymentRequestRow = {
  _id: string;
  amount: number;
  status: string;
  paymentReference?: string;
  createdAt: string;
};

type CreditTxn = {
  id: string;
  entryType: string;
  amount: number;
  availableAfter: number;
  description?: string;
  occurredAt: string;
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "bg-amber-700/10 text-amber-800" },
  silver: { label: "Silver", color: "bg-slate-500/10 text-slate-700" },
  gold: { label: "Gold", color: "bg-yellow-500/10 text-yellow-800" },
  platinum: { label: "Platinum", color: "bg-indigo-500/10 text-indigo-800" },
  diamond: { label: "Diamond", color: "bg-violet-500/10 text-violet-800" },
};

const LEDGER_LABELS: Record<string, string> = {
  credit_granted: "Credit granted",
  credit_used: "Purchase",
  credit_repaid: "Repayment",
  credit_reversed: "Reversed",
  credit_expired: "Expired",
  credit_increased: "Limit increased",
  credit_reduced: "Limit reduced",
};

const IMAGINEERING_CREDIT_FAQ = [
  {
    id: "what-is",
    q: `What is ${IMAGINEERING_CREDIT.name}?`,
    a: `${IMAGINEERING_CREDIT.formalName} is Imagineering India’s “Build Now. Pay Later” credit line. You pay the full order at checkout using your approved limit, then repay Imagineering India by the due date. It is separate from ${IMAGINEERING_WALLET.name}.`,
  },
  {
    id: "how-apply",
    q: "How do I apply?",
    a: "Complete at least 3 successful orders. Our team reviews your history and enables your application. Once approved, fill in your details, upload PAN (required) and Aadhaar (optional), and submit KYC for verification.",
  },
  {
    id: "trust-score",
    q: "What is the trust score?",
    a: "A score from 0–100 based on your platform activity: completed orders, monthly spend, GST/PAN on profile, payment history, referrals, and account tenure. It helps estimate your credit limit when KYC is approved. A low score today usually means you are new — it improves as you shop and verify your profile.",
  },
  {
    id: "where-use",
    q: "Where can I use it?",
    a: `At checkout across Imagineering India — cart, manpower, quote orders, dynamic booking, and more — wherever “${IMAGINEERING_CREDIT.name}” appears as a payment option and your available limit covers the order total.`,
  },
  {
    id: "repay",
    q: "How do repayments work?",
    a: "After you use credit, the amount is added to your outstanding balance with a due date (typically 30 days). Repay via bank transfer to Imagineering India and submit a repayment request on this page with your UTR/reference. Our team verifies and updates your balance.",
  },
  {
    id: "limits",
    q: "What credit limits are available?",
    a: "Limits start from ₹5,000 (Bronze) and can go up to ₹5,00,000 (Diamond) based on your trust score and profile. Pay on time to unlock higher tiers over time.",
  },
  {
    id: "vs-rewards",
    q: `${IMAGINEERING_CREDIT.name} vs ${IMAGINEERING_WALLET.name}?`,
    a: `${IMAGINEERING_WALLET.name} is your rewards balance — it only reduces part of your bill (like a coupon). ${IMAGINEERING_CREDIT.name} is a full payment method: the entire order can be paid from your credit line and you repay later. You can use both on different orders, but they work differently at checkout.`,
  },
  {
    id: "kyc-reject",
    q: "What if my KYC is rejected?",
    a: "You will see feedback on this page. Correct your details and submit KYC again, or contact support if you need help.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Shop on Imagineering India",
    description: "Book materials, manpower, rentals, and services like any other order.",
    icon: ShoppingBag,
  },
  {
    step: 2,
    title: "Get approved & verify KYC",
    description: "Complete 3+ orders, get team approval, then submit PAN and details for your credit line.",
    icon: ShieldCheck,
  },
  {
    step: 3,
    title: "Pay with Imagineering Credit",
    description: "At checkout, select Imagineering Credit to pay the full order from your approved limit.",
    icon: CreditCard,
  },
  {
    step: 4,
    title: "Repay on time",
    description: "Repay within the due date (typically 30 days) to keep your limit active and unlock higher tiers.",
    icon: Clock,
  },
] as const;

const CREDIT_TIERS = [
  { tier: "Bronze", limit: "₹5,000" },
  { tier: "Silver", limit: "₹25,000" },
  { tier: "Gold", limit: "₹50,000" },
  { tier: "Platinum", limit: "₹1,00,000" },
  { tier: "Diamond", limit: "₹5,00,000" },
] as const;

const USE_CASES = [
  "Construction Materials",
  "Machine Rental",
  "Manpower Booking",
  "Contractor Payment",
  "Interior Products",
  "Electrical",
  "Plumbing",
  "Hardware",
] as const;

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ImagineeringCreditFaq() {
  return (
    <Card className="border-indigo-100/80 shadow-sm dark:border-indigo-900/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HelpCircle className="h-5 w-5 text-indigo-600" />
          Frequently asked questions
        </CardTitle>
        <CardDescription>Everything you need to know about Build Now. Pay Later.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {IMAGINEERING_CREDIT_FAQ.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left text-sm font-medium hover:text-indigo-700">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-4 text-xs text-muted-foreground">
          Still have questions?{" "}
          <Link href="/help" className="font-medium text-indigo-600 underline-offset-2 hover:underline">
            Visit Help Center
          </Link>{" "}
          or contact Imagineering India support.
        </p>
      </CardContent>
    </Card>
  );
}

const JOURNEY_STEPS = [
  { key: "orders", label: "3+ orders", hint: "Complete successful orders" },
  { key: "eligible", label: "Approved", hint: "Team enables application" },
  { key: "kyc", label: "KYC", hint: "Verify PAN & details" },
  { key: "credit", label: "Credit line", hint: "Limit assigned" },
  { key: "active", label: "Activate", hint: "Use at checkout" },
] as const;

function journeyStepIndex(params: {
  completedOrders: number;
  minOrdersRequired: number;
  canApply: boolean;
  canSubmitKyc: boolean;
  awaitingKycReview: boolean;
  hasAccount: boolean;
  accountStatus?: string;
}): number {
  if (params.hasAccount && params.accountStatus === "active") return 4;
  if (params.hasAccount) return 3;
  if (params.awaitingKycReview) return 3;
  if (params.canSubmitKyc) return 2;
  if (params.canApply) return 1;
  if (params.completedOrders >= params.minOrdersRequired) return 1;
  return 0;
}

function JourneySteps({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-5">
      {JOURNEY_STEPS.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        return (
          <li
            key={step.key}
            className={`rounded-xl border p-3 transition-colors ${
              active
                ? "border-indigo-300 bg-indigo-50/80 dark:border-indigo-800 dark:bg-indigo-950/30"
                : done
                  ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                  : "border-border bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : active ? (
                <CreditCard className="h-4 w-4 shrink-0 text-indigo-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className={`text-xs font-semibold ${active ? "text-indigo-900 dark:text-indigo-100" : ""}`}>
                {step.label}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{step.hint}</p>
          </li>
        );
      })}
    </ol>
  );
}

function ImagineeringCreditPublicPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-shell space-y-8 pb-12 sm:space-y-10 sm:pb-14">
        <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
          <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-5 py-8 text-white shadow-lg sm:px-8 sm:py-10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/90">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Imagineering India</span>
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-4xl">{IMAGINEERING_CREDIT.name}</h1>
              <p className="mt-2 text-base text-white/90 sm:text-lg">{IMAGINEERING_CREDIT.tagline}</p>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">{IMAGINEERING_CREDIT.oneLiner}</p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="bg-white text-indigo-700 hover:bg-white/90">
                  <Link href="/login?redirect=/imagineering-credit">Sign in to apply</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="border-0 bg-white/15 text-white hover:bg-white/25"
                >
                  <Link href="/signup">Create free account</Link>
                </Button>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What is {IMAGINEERING_CREDIT.name}?</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                A repayable credit line for buyers on Imagineering India — not a wallet discount.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                {IMAGINEERING_CREDIT.name} lets you <strong className="text-foreground">pay the full order at checkout</strong>{" "}
                using your approved limit, then repay Imagineering India by the due date. It is designed for construction
                and project buyers who need flexibility without delaying work.
              </p>
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                <strong className="font-medium">{IMAGINEERING_CREDIT.name}</strong> is separate from{" "}
                <strong className="font-medium">{IMAGINEERING_WALLET.name}</strong> — wallet balance only gives a partial
                discount; credit pays the entire order and must be repaid later.
              </div>
            </CardContent>
          </Card>

          <section id="how-it-works" className="space-y-4 scroll-mt-24">
            <h2 className="text-lg font-semibold">How it works</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {HOW_IT_WORKS.map((item) => (
                <Card key={item.step} className="border-indigo-100/80 dark:border-indigo-900/40">
                  <CardContent className="flex gap-4 pt-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Step {item.step}</p>
                      <p className="mt-1 font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Application journey</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to track your personal progress. New buyers typically follow these steps:
            </p>
            <JourneySteps currentStep={0} />
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Credit limit tiers</CardTitle>
                <CardDescription>Based on trust score & profile after KYC approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {CREDIT_TIERS.map((t) => (
                  <div key={t.tier} className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.tier}
                    </span>
                    <span className="font-medium">{t.limit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Use across Imagineering India</CardTitle>
                <CardDescription>Wherever {IMAGINEERING_CREDIT.name} appears at checkout</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {USE_CASES.map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
                <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
                  <Link href="/services">Browse services</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-indigo-100/80 dark:border-indigo-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Why use {IMAGINEERING_CREDIT.name}?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2 text-sm text-muted-foreground">
                {[
                  "Keep projects moving — pay now, settle later",
                  "Full order payment from your credit line",
                  "Higher limits as you build trust on the platform",
                  "Works on cart, manpower, quotes & dynamic booking",
                  "Timely repayment unlocks tier upgrades",
                  "Separate from wallet rewards — clear at checkout",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-indigo-200 dark:border-indigo-900/50">
            <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:py-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50">
                <User className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="max-w-md space-y-2">
                <p className="text-lg font-semibold">Ready to check your eligibility?</p>
                <p className="text-sm text-muted-foreground">
                  Sign in to see your order progress, apply for credit, submit KYC, and manage repayments — all in one
                  place.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  <Link href="/login?redirect=/imagineering-credit">Sign in</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/signup">Create account</Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Already earning rewards?{" "}
                <Link href={IMAGINEERING_WALLET.href} className="inline-flex items-center gap-1 font-medium text-indigo-600 underline-offset-2 hover:underline">
                  <Wallet className="h-3 w-3" />
                  {IMAGINEERING_WALLET.name}
                </Link>
              </p>
            </CardContent>
          </Card>

          <ImagineeringCreditFaq />
        </div>
      </main>
    </div>
  );
}

export default function ImagineeringCreditPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [account, setAccount] = useState<CreditAccount | null>(null);
  const [tagline, setTagline] = useState<string>(IMAGINEERING_CREDIT.tagline);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [transactions, setTransactions] = useState<CreditTxn[]>([]);
  const [statement, setStatement] = useState<{
    label: string;
    purchased: number;
    paid: number;
    outstanding: number;
  } | null>(null);
  const [underwriting, setUnderwriting] = useState<Underwriting | null>(null);
  const [canApply, setCanApply] = useState(false);
  const [canSubmitKyc, setCanSubmitKyc] = useState(false);
  const [awaitingKycReview, setAwaitingKycReview] = useState(false);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [minOrdersRequired, setMinOrdersRequired] = useState(3);
  const [applicationPhase, setApplicationPhase] = useState("not_eligible");
  const [kycRejectionReason, setKycRejectionReason] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [kycForm, setKycForm] = useState({
    fullName: "",
    panNumber: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
  });
  const [kycDocuments, setKycDocuments] = useState<{
    panCardUrl: string | null;
    panCardFilename: string | null;
    aadhaarUrl: string | null;
    aadhaarFilename: string | null;
  }>({
    panCardUrl: null,
    panCardFilename: null,
    aadhaarUrl: null,
    aadhaarFilename: null,
  });
  const [repayAmount, setRepayAmount] = useState("");
  const [repayReference, setRepayReference] = useState("");
  const [repayNotes, setRepayNotes] = useState("");
  const [submittingRepay, setSubmittingRepay] = useState(false);
  const [repaymentRequests, setRepaymentRequests] = useState<RepaymentRequestRow[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, txnRes, stmtRes, eligibilityRes, repayRes] = await Promise.all([
        api.imagineeringCredit.getMe(),
        api.imagineeringCredit.getTransactions({ limit: 10 }),
        api.imagineeringCredit.getStatement(),
        api.imagineeringCredit.getEligibility(),
        api.imagineeringCredit.getRepaymentRequests(),
      ]);
      if (meRes.success && meRes.data) {
        const d = meRes.data as { account?: CreditAccount; tagline?: string };
        setAccount(d.account ?? null);
        setTagline(d.tagline ?? "Build Now. Pay Later.");
      }
      if (txnRes.success && txnRes.data) {
        setTransactions((txnRes.data as { transactions: CreditTxn[] }).transactions ?? []);
      }
      if (stmtRes.success && stmtRes.data) {
        const s = (stmtRes.data as { statement: typeof statement }).statement;
        if (s) setStatement(s);
      }
      if (eligibilityRes.success && eligibilityRes.data) {
        const d = eligibilityRes.data as {
          underwriting?: Underwriting;
          canApply?: boolean;
          canSubmitKyc?: boolean;
          awaitingKycReview?: boolean;
          completedOrders?: number;
          minOrdersRequired?: number;
          application?: { phase?: string; rejectionReason?: string; kycAdminComment?: string };
        };
        setUnderwriting(d.underwriting ?? null);
        setCanApply(Boolean(d.canApply));
        setCanSubmitKyc(Boolean(d.canSubmitKyc));
        setAwaitingKycReview(Boolean(d.awaitingKycReview));
        setCompletedOrders(d.completedOrders ?? 0);
        setMinOrdersRequired(d.minOrdersRequired ?? 1);
        setApplicationPhase(d.application?.phase ?? "not_eligible");
        setKycRejectionReason(
          d.application?.rejectionReason || d.application?.kycAdminComment || null
        );
      }
      if (repayRes.success && repayRes.data) {
        setRepaymentRequests((repayRes.data as { requests: RepaymentRequestRow[] }).requests ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.name && !kycForm.fullName) {
      setKycForm((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        panNumber: (user as { panNumber?: string }).panNumber || prev.panNumber,
        gstNumber: (user as { gstNumber?: string }).gstNumber || prev.gstNumber,
      }));
    }
  }, [user, kycForm.fullName]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    void loadData();
  }, [isAuthenticated, loadData]);

  const handleActivate = async () => {
    setActivating(true);
    try {
      const res = await api.imagineeringCredit.activate();
      if (!res.success) throw new Error(res.error?.message || "Activation failed");
      toast({ title: "Credit activated!", description: `You can now use ${IMAGINEERING_CREDIT.name} at checkout.` });
      await loadData();
    } catch (err: unknown) {
      toast({
        title: "Activation failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setActivating(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await api.imagineeringCredit.apply();
      if (!res.success) throw new Error(res.error?.message || "Application failed");
      return true;
    } catch (err: unknown) {
      toast({
        title: "Application failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      return false;
    } finally {
      setApplying(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!kycForm.fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kycForm.panNumber.trim().toUpperCase())) {
      toast({ title: "Enter a valid PAN number", variant: "destructive" });
      return;
    }
    if (!kycDocuments.panCardUrl) {
      toast({ title: "Upload your PAN card", description: "PAN document is required for KYC.", variant: "destructive" });
      return;
    }

    setSubmittingKyc(true);
    try {
      if (canApply) {
        const started = await handleApply();
        if (!started) return;
      }

      const res = await api.imagineeringCredit.submitKyc({
        ...kycForm,
        panNumber: kycForm.panNumber.trim().toUpperCase(),
        gstNumber: kycForm.gstNumber.trim().toUpperCase() || undefined,
        documents: {
          panCard: { url: kycDocuments.panCardUrl },
          ...(kycDocuments.aadhaarUrl ? { aadhaar: { url: kycDocuments.aadhaarUrl } } : {}),
        },
      });
      if (!res.success) throw new Error(res.error?.message || "KYC submission failed");
      toast({
        title: "Application submitted",
        description: "Imagineering India will verify your KYC and assign your credit line.",
      });
      setKycDocuments({
        panCardUrl: null,
        panCardFilename: null,
        aadhaarUrl: null,
        aadhaarFilename: null,
      });
      await loadData();
    } catch (err: unknown) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmittingKyc(false);
      setApplying(false);
    }
  };

  const handleRepaymentRequest = async () => {
    const amount = Number(repayAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setSubmittingRepay(true);
    try {
      const res = await api.imagineeringCredit.submitRepaymentRequest({
        amount,
        paymentReference: repayReference.trim() || undefined,
        notes: repayNotes.trim() || undefined,
      });
      if (!res.success) throw new Error(res.error?.message || "Request failed");
      toast({
        title: "Repayment submitted",
        description: "Our team will verify your payment and update your balance.",
      });
      setRepayAmount("");
      setRepayReference("");
      setRepayNotes("");
      await loadData();
    } catch (err: unknown) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmittingRepay(false);
    }
  };

  const tierInfo = account ? TIER_LABELS[account.tier] ?? TIER_LABELS.bronze : null;
  const orderProgress = Math.min(100, Math.round((completedOrders / minOrdersRequired) * 100));
  const currentJourneyStep = journeyStepIndex({
    completedOrders,
    minOrdersRequired,
    canApply,
    canSubmitKyc,
    awaitingKycReview,
    hasAccount: Boolean(account),
    accountStatus: account?.status,
  });
  const showApplicationForm = canApply || canSubmitKyc;
  const awaitingAdminApproval =
    !showApplicationForm &&
    !awaitingKycReview &&
    completedOrders >= minOrdersRequired &&
    (applicationPhase === "not_eligible" || applicationPhase === "revoked");
  const isSubmittingApplication = applying || submittingKyc;

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ImagineeringCreditPublicPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 page-shell space-y-6 sm:space-y-8 pb-10">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 px-5 py-8 text-white shadow-lg sm:px-8 sm:py-10">
          <div className="relative z-10 mx-auto max-w-4xl">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="mb-5 bg-white/15 text-white hover:bg-white/25 border-0"
            >
              <Link href="/profile">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Back to profile
              </Link>
            </Button>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-white/90">
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm font-medium">Imagineering India</span>
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{IMAGINEERING_CREDIT.name}</h1>
                <p className="mt-1 text-base text-white/90 sm:text-lg">{tagline}</p>
                <p className="mt-1 text-sm text-white/75">Not {IMAGINEERING_WALLET.name.toLowerCase()} — a repayable credit line for full orders</p>
              </div>
              {account && tierInfo && (
                <Badge className={`${tierInfo.color} border-0 shrink-0`}>
                  <Crown className="mr-1 h-3 w-3" />
                  {tierInfo.label} tier
                </Badge>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
          {!loading && !account && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Your journey</h2>
              <JourneySteps currentStep={currentJourneyStep} />
            </section>
          )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !account ? (
          <Card className="overflow-hidden border-indigo-100 shadow-sm dark:border-indigo-900/40">
            <CardHeader className="border-b bg-muted/30 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                {canApply
                  ? "You're approved — submit your application"
                  : awaitingKycReview
                    ? "KYC under review"
                    : canSubmitKyc
                      ? "Complete your KYC application"
                      : awaitingAdminApproval
                        ? "Waiting for admin approval"
                        : `Unlock ${IMAGINEERING_CREDIT.name}`}
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Complete orders, get admin approval, verify KYC — then receive your personal credit line for checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 dark:from-slate-900/40 dark:to-indigo-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ShoppingBag className="h-4 w-4 text-indigo-600" />
                    Completed orders
                  </div>
                  <span className="text-sm font-semibold">
                    {completedOrders} / {minOrdersRequired}
                  </span>
                </div>
                <Progress value={orderProgress} className="mt-3 h-2" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {completedOrders >= minOrdersRequired
                    ? "You meet the order requirement. Our team will review and enable your application."
                    : `Complete ${minOrdersRequired - completedOrders} more successful order(s) to become eligible for review.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  Status: {applicationPhase.replace(/_/g, " ")}
                </Badge>
                {underwriting && underwriting.recommendedLimit > 0 && (
                  <Badge className="bg-indigo-600 hover:bg-indigo-600">
                    Est. limit {formatInr(underwriting.recommendedLimit)}
                  </Badge>
                )}
              </div>

              {underwriting && (
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Trust score</p>
                    <span className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
                      {underwriting.score}
                      <span className="text-sm font-normal text-muted-foreground">/100</span>
                    </span>
                  </div>
                  <Progress value={underwriting.score} className="h-2" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {underwriting.signals.slice(0, 6).map((signal) => (
                      <div key={signal.key} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-muted-foreground truncate pr-2">{signal.label}</span>
                        <span className="shrink-0 font-medium">
                          {signal.points}/{signal.maxPoints}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {kycRejectionReason && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-medium">KYC feedback</p>
                  <p className="mt-1">{kycRejectionReason}</p>
                </div>
              )}

              {canApply && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
                  Imagineering India has enabled your application. Fill in your details, upload KYC documents, and
                  submit below.
                </div>
              )}

              {awaitingAdminApproval && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                  You&apos;ve completed the required orders. Our team will review your account and enable the apply
                  option — you&apos;ll be able to submit KYC here once approved.
                </div>
              )}

              {showApplicationForm && (
                <div className="space-y-4 rounded-xl border border-dashed p-4 sm:p-5">
                  <div>
                    <p className="font-semibold">Application & KYC</p>
                    <p className="text-sm text-muted-foreground">
                      Details must match your PAN. Upload clear photos or PDFs of your documents.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="kyc-name">Full name (as on PAN)</Label>
                      <Input
                        id="kyc-name"
                        value={kycForm.fullName}
                        onChange={(e) => setKycForm({ ...kycForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kyc-pan">PAN *</Label>
                      <Input
                        id="kyc-pan"
                        value={kycForm.panNumber}
                        onChange={(e) =>
                          setKycForm({
                            ...kycForm,
                            panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
                          })
                        }
                        className="font-mono uppercase"
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kyc-gst">GST (optional)</Label>
                      <Input
                        id="kyc-gst"
                        value={kycForm.gstNumber}
                        onChange={(e) =>
                          setKycForm({
                            ...kycForm,
                            gstNumber: e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 15),
                          })
                        }
                        className="font-mono uppercase"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="kyc-address">Address</Label>
                      <Input
                        id="kyc-address"
                        value={kycForm.address}
                        onChange={(e) => setKycForm({ ...kycForm, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kyc-city">City</Label>
                      <Input
                        id="kyc-city"
                        value={kycForm.city}
                        onChange={(e) => setKycForm({ ...kycForm, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kyc-state">State</Label>
                      <Input
                        id="kyc-state"
                        value={kycForm.state}
                        onChange={(e) => setKycForm({ ...kycForm, state: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <CreditKycDocumentUpload
                        label="PAN card"
                        required
                        documentType="panCard"
                        url={kycDocuments.panCardUrl}
                        filename={kycDocuments.panCardFilename}
                        disabled={isSubmittingApplication}
                        onUploaded={(url, name) =>
                          setKycDocuments((prev) => ({ ...prev, panCardUrl: url, panCardFilename: name }))
                        }
                        onClear={() =>
                          setKycDocuments((prev) => ({ ...prev, panCardUrl: null, panCardFilename: null }))
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <CreditKycDocumentUpload
                        label="Aadhaar (front)"
                        documentType="aadhaar"
                        url={kycDocuments.aadhaarUrl}
                        filename={kycDocuments.aadhaarFilename}
                        disabled={isSubmittingApplication}
                        onUploaded={(url, name) =>
                          setKycDocuments((prev) => ({ ...prev, aadhaarUrl: url, aadhaarFilename: name }))
                        }
                        onClear={() =>
                          setKycDocuments((prev) => ({ ...prev, aadhaarUrl: null, aadhaarFilename: null }))
                        }
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleSubmitApplication()}
                    disabled={isSubmittingApplication}
                    size="lg"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 sm:w-auto"
                  >
                    {isSubmittingApplication ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : canApply ? (
                      "Submit application & KYC"
                    ) : (
                      "Resubmit KYC"
                    )}
                  </Button>
                </div>
              )}

              {awaitingKycReview && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-100">
                  Your KYC is with Imagineering India. We typically review within 1–2 business days and assign your credit limit.
                </div>
              )}

              {!showApplicationForm && !awaitingKycReview && !awaitingAdminApproval && (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Shop on Imagineering India and complete at least {minOrdersRequired} orders. After successful delivery, our team
                  will enable your application. You&apos;ll then submit KYC to receive your credit limit.
                </p>
              )}

              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button asChild variant="outline">
                  <Link href="/services">Browse services</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/dashboard/buyer/orders">View my orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : account.status === "invited" ? (
          <Card className="overflow-hidden border-indigo-200 dark:border-indigo-900/50">
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-6 text-white sm:p-8">
              <div className="flex items-center gap-2 text-white/90">
                <CreditCard className="h-5 w-5" />
                <span className="text-sm font-medium">Congratulations!</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">You&apos;ve unlocked</h2>
              <p className="mt-1 text-3xl font-bold sm:text-4xl">{formatInr(account.creditLimit)}</p>
              <p className="mt-1 text-lg font-medium">{IMAGINEERING_CREDIT.name}</p>
              <div className="mt-4 space-y-1 text-sm text-white/85">
                <p>Available Limit: {formatInr(account.creditLimit)}</p>
                <p>Validity: {account.validityType === "lifetime" ? "Lifetime" : "Limited"}</p>
              </div>
              <Button
                onClick={handleActivate}
                disabled={activating}
                className="mt-6 bg-white text-indigo-700 hover:bg-white/90"
                size="lg"
              >
                {activating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating…
                  </>
                ) : (
                  "Activate Now"
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-6 text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/80">Credit Limit</p>
                    <p className="text-3xl font-bold">{formatInr(account.creditLimit)}</p>
                  </div>
                  {tierInfo && (
                    <Badge className={`${tierInfo.color} border-0`}>
                      <Crown className="mr-1 h-3 w-3" />
                      {tierInfo.label}
                    </Badge>
                  )}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <p className="text-xs text-white/70">Available</p>
                    <p className="text-xl font-semibold">{formatInr(account.availableCredit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Used</p>
                    <p className="text-xl font-semibold">{formatInr(account.creditUsed)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Outstanding</p>
                    <p className="text-xl font-semibold">{formatInr(account.outstanding)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Next Due</p>
                    <p className="text-xl font-semibold">
                      {account.nextDueDate ? formatDate(account.nextDueDate) : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {account.status !== "active" && (
              <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
                <CardContent className="pt-6 text-sm text-amber-900 dark:text-amber-200">
                  Your {IMAGINEERING_CREDIT.name} is currently <strong>{account.status}</strong>. Contact support for assistance.
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Credit Score Tiers</CardTitle>
                  <CardDescription>Unlock higher limits based on trust</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {[
                    { tier: "Bronze", limit: "₹5,000" },
                    { tier: "Silver", limit: "₹25,000" },
                    { tier: "Gold", limit: "₹50,000" },
                    { tier: "Platinum", limit: "₹1,00,000" },
                    { tier: "Diamond", limit: "₹5,00,000" },
                  ].map((t) => (
                    <div
                      key={t.tier}
                      className={`flex justify-between rounded-lg px-3 py-2 ${
                        tierInfo?.label === t.tier ? "bg-indigo-50 font-medium dark:bg-indigo-950/30" : "bg-muted/40"
                      }`}
                    >
                      <span>{t.tier}</span>
                      <span>{t.limit}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Pay on time — earn rewards
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>+ Imagineering Points on timely repayment</p>
                  <p>+ Automatic credit limit increases</p>
                  <p>+ Lower processing fees</p>
                  <p>+ Priority support</p>
                  <p className="pt-2 text-xs">
                    Submit a repayment request below after transferring to Imagineering India. Our team verifies and
                    updates your balance.
                  </p>
                </CardContent>
              </Card>
            </div>

            {account.outstanding > 0 && account.status === "active" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submit repayment</CardTitle>
                  <CardDescription>
                    Outstanding: {formatInr(account.outstanding)} — include UTR/reference for faster verification
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="repay-amount">Amount (₹)</Label>
                      <Input
                        id="repay-amount"
                        type="number"
                        value={repayAmount}
                        onChange={(e) => setRepayAmount(e.target.value)}
                        placeholder={String(account.outstanding)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repay-ref">Payment reference / UTR</Label>
                      <Input
                        id="repay-ref"
                        value={repayReference}
                        onChange={(e) => setRepayReference(e.target.value)}
                        placeholder="NEFT/IMPS UTR"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repay-notes">Notes (optional)</Label>
                    <Input
                      id="repay-notes"
                      value={repayNotes}
                      onChange={(e) => setRepayNotes(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => void handleRepaymentRequest()} disabled={submittingRepay}>
                    {submittingRepay ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit repayment request
                  </Button>
                  {repaymentRequests.length > 0 && (
                    <ul className="divide-y text-sm">
                      {repaymentRequests.map((req) => (
                        <li key={req._id} className="flex justify-between py-2">
                          <span>
                            {formatInr(req.amount)}
                            {req.paymentReference ? ` · ${req.paymentReference}` : ""}
                          </span>
                          <Badge variant="secondary">{req.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {statement && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{statement.label} Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Purchased</p>
                      <p className="font-semibold">{formatInr(statement.purchased)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="font-semibold text-emerald-600">{formatInr(statement.paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Outstanding</p>
                      <p className="font-semibold">{formatInr(statement.outstanding)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent activity</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                  <ul className="divide-y">
                    {transactions.map((txn) => {
                      const isCredit =
                        txn.entryType === "credit_granted" ||
                        txn.entryType === "credit_increased" ||
                        txn.entryType === "credit_repaid" ||
                        txn.entryType === "credit_reversed";
                      return (
                        <li key={txn.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                isCredit ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {isCredit ? (
                                <ArrowDownLeft className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                            </span>
                            <div>
                              <p className="text-sm font-medium">
                                {txn.description || LEDGER_LABELS[txn.entryType] || txn.entryType}
                              </p>
                              <p className="text-xs text-muted-foreground">{formatDate(txn.occurredAt)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${isCredit ? "text-emerald-700" : "text-rose-700"}`}>
                              {isCredit ? "+" : "−"}
                              {formatInr(txn.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Avl {formatInr(txn.availableAfter)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Use across Imagineering India</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Construction Materials",
                    "Machine Rental",
                    "Manpower Booking",
                    "Contractor Payment",
                    "Interior Products",
                    "Electrical",
                    "Plumbing",
                    "Hardware",
                  ].map((item) => (
                    <Badge key={item} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
                <Button asChild className="mt-4">
                  <Link href="/services">Shop with {IMAGINEERING_CREDIT.name}</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}

          {!loading && (
            <ImagineeringCreditFaq />
          )}
        </div>
      </main>
    </div>
  );
}
