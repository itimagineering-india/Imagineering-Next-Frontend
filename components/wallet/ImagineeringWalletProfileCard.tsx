"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Loader2, Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api-client";
import { IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";
import { cn } from "@/lib/utils";

export function ImagineeringWalletProfileCard() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [creditInrValue, setCreditInrValue] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await api.wallet.getMe();
        if (!cancelled && res.success && res.data?.wallet) {
          setBalance(res.data.wallet.balance ?? 0);
          setCreditInrValue(res.data.wallet.creditInrValue ?? 1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <Link
      id="wallet"
      href={IMAGINEERING_WALLET.href}
      className={cn(
        "group block overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-4 text-white shadow-lg transition-transform hover:scale-[1.01] dark:border-emerald-500/30 sm:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/80">
              Rewards wallet
            </p>
            <h2 className="text-lg font-bold leading-tight sm:text-xl">{IMAGINEERING_WALLET.name}</h2>
            <p className="mt-1 max-w-md text-sm text-white/85">
              Earn points · redeem as checkout discount · view full statement
            </p>
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5" />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-white/15 pt-4">
        <div>
          <p className="text-xs text-white/75">Available balance</p>
          {loading ? (
            <Loader2 className="mt-1 h-5 w-5 animate-spin text-white/80" />
          ) : (
            <p className="text-2xl font-bold tabular-nums sm:text-3xl">
              {balance.toLocaleString("en-IN")}
              <span className="ml-1.5 text-sm font-normal text-white/80">pts</span>
            </p>
          )}
        </div>
        {!loading && balance > 0 && (
          <p className="text-sm text-white/90">
            ≈ ₹{(balance * creditInrValue).toLocaleString("en-IN")} off at checkout
          </p>
        )}
      </div>
    </Link>
  );
}
