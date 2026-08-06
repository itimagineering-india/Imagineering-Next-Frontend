"use client";

import Link from "next/link";
import { IMAGINEERING_CREDIT } from "@/lib/imagineering-product-labels";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

const HIGHLIGHTS = [
  { icon: ShoppingBag, text: "Pay full order at checkout — materials, manpower & more" },
  { icon: Clock, text: "Repay later within your due date" },
  { icon: ShieldCheck, text: "Unlock after orders + KYC verification" },
] as const;

const TIERS = [
  { label: "Bronze", limit: "₹5K" },
  { label: "Gold", limit: "₹50K" },
  { label: "Diamond", limit: "₹5L" },
] as const;

export function ImagineeringCreditHomeSection() {
  return (
    <section className="py-8 md:py-12" aria-label={IMAGINEERING_CREDIT.name}>
      <div className="home-shell">
        <div className="overflow-hidden rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 shadow-lg dark:border-indigo-500/30">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Copy */}
            <div className="relative p-6 text-white sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  <CreditCard className="h-3.5 w-3.5" />
                  {IMAGINEERING_CREDIT.tagline}
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {IMAGINEERING_CREDIT.name}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
                  {IMAGINEERING_CREDIT.oneLiner} Built for construction and project buyers on Imagineering India.
                </p>

                <ul className="mt-6 space-y-3">
                  {HIGHLIGHTS.map((item) => (
                    <li key={item.text} className="flex items-start gap-2.5 text-sm text-white/95">
                      <item.icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-indigo-700 hover:bg-white/90 shadow-md"
                  >
                    <Link href={IMAGINEERING_CREDIT.href}>
                      Explore {IMAGINEERING_CREDIT.name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="border-0 bg-white/15 text-white hover:bg-white/25"
                  >
                    <Link href={`${IMAGINEERING_CREDIT.href}#how-it-works`}>How it works</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Visual panel */}
            <div className="flex flex-col justify-center border-t border-white/10 bg-white/10 p-6 backdrop-blur-sm sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/75">Credit limits</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {TIERS.map((tier) => (
                  <div
                    key={tier.label}
                    className="rounded-xl border border-white/20 bg-white/10 px-3 py-4 text-center"
                  >
                    <p className="text-xs text-white/80">{tier.label}</p>
                    <p className="mt-1 text-lg font-bold text-white">{tier.limit}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-white/90">
                {[
                  "Use at cart, manpower & quote checkout",
                  "Separate from Imagineering Wallet rewards",
                  "Pay on time to unlock higher tiers",
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={IMAGINEERING_CREDIT.href}
                className="group mt-6 inline-flex items-center gap-1 text-sm font-semibold text-white hover:text-white/90"
              >
                Learn more & apply
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
