"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { IMAGINEERING_CREDIT } from "@/lib/imagineering-product-labels";
import api from "@/lib/api-client";
import { CreditCard, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function ImagineeringCreditHomeCard({ alwaysShow = false }: { alwaysShow?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [canApply, setCanApply] = useState(false);
  const [canSubmitKyc, setCanSubmitKyc] = useState(false);
  const [awaitingKyc, setAwaitingKyc] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [meRes, eligibilityRes] = await Promise.all([
          api.imagineeringCredit.getMe(),
          alwaysShow ? api.imagineeringCredit.getEligibility() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        if (meRes.success) {
          const data = meRes.data as {
            hasAccount?: boolean;
            account?: { availableCredit?: number; status?: string; creditLimit?: number };
          };
          setHasAccount(Boolean(data?.hasAccount));
          setAvailable(data?.account?.availableCredit ?? data?.account?.creditLimit ?? null);
          setStatus(data?.account?.status ?? null);
        }
        if (eligibilityRes?.success && eligibilityRes.data) {
          const d = eligibilityRes.data as {
            canApply?: boolean;
            canSubmitKyc?: boolean;
            awaitingKycReview?: boolean;
            application?: { phase?: string };
          };
          setCanApply(Boolean(d.canApply));
          setCanSubmitKyc(Boolean(d.canSubmitKyc));
          setAwaitingKyc(Boolean(d.awaitingKycReview));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, alwaysShow]);

  if (!isAuthenticated) return null;
  if (loading) {
    return alwaysShow ? <ImagineeringCreditHomeCardSkeleton /> : null;
  }
  if (!alwaysShow && !hasAccount) return null;
  if (status === "blocked" || status === "frozen") return null;

  const isInvited = status === "invited";

  return (
    <Link
      href={IMAGINEERING_CREDIT.href}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-4 text-white shadow-lg transition-transform hover:scale-[1.01] dark:border-indigo-500/30 sm:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 opacity-90" />
            <p className="text-sm font-medium opacity-90">{IMAGINEERING_CREDIT.name}</p>
            <p className="text-xs opacity-75">{IMAGINEERING_CREDIT.tagline}</p>
          </div>
          <p className="mt-1 text-xs opacity-80">Build Now. Pay Later.</p>
          {hasAccount ? (
            isInvited ? (
              <p className="mt-3 text-lg font-bold">Tap to activate your credit</p>
            ) : (
              <>
                <p className="mt-3 text-xs uppercase tracking-wide opacity-80">Available</p>
                <p className="text-2xl font-bold sm:text-3xl">{formatInr(available ?? 0)}</p>
              </>
            )
          ) : canApply || canSubmitKyc ? (
            <>
              <p className="mt-3 text-lg font-bold">
                {canApply ? "Approved — submit your application" : "Complete your KYC"}
              </p>
              <p className="mt-1 text-xs opacity-90">Upload documents & details on the credit page</p>
            </>
          ) : awaitingKyc ? (
            <>
              <p className="mt-3 text-base font-semibold">KYC under review</p>
              <p className="mt-1 text-xs opacity-90">Credit line coming soon</p>
            </>
          ) : (
            <>
              <p className="mt-3 text-base font-semibold">Unlock Build Now. Pay Later.</p>
              <p className="mt-1 text-xs opacity-90">Complete orders — admin enables apply after review</p>
            </>
          )}
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition group-hover:bg-white/25">
          <ChevronRight className="h-5 w-5" />
        </span>
      </div>
      {hasAccount && !isInvited ? (
        <p className="mt-3 text-xs font-medium text-white/90">Tap to manage credit & repayments →</p>
      ) : (
        <p className="mt-3 text-xs font-medium text-white/90">View {IMAGINEERING_CREDIT.name} →</p>
      )}
    </Link>
  );
}

export function ImagineeringCreditHomeCardSkeleton() {
  return (
    <div className="flex h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
    </div>
  );
}
