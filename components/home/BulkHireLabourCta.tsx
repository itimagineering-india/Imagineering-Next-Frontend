"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  HardHat,
  ListChecks,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/** Local asset in `public/images/` — replace with your own site photography anytime. */
const LABOUR_BG = "/images/bulk-hire-labour-cta.jpg";

const highlights = [
  {
    icon: ListChecks,
    label: "Browse & shortlist skilled and general labour",
  },
  {
    icon: HardHat,
    label: "Send one crew request instead of many back-and-forths",
  },
  {
    icon: Bell,
    label: "Get notified when workers respond from your dashboard",
  },
];

/**
 * Public CTA for contractors — links to provider bulk hire labour flow (requires provider account).
 */
export function BulkHireLabourCta() {
  return (
    <section
      className="relative border-y border-border/80 bg-muted/30"
      aria-labelledby="bulk-hire-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-14 md:px-8 md:py-16">
        <div className="relative min-h-[min(22rem,70vw)] overflow-hidden rounded-2xl border border-border/70 shadow-lg shadow-primary/[0.06] ring-1 ring-black/[0.04] dark:ring-white/[0.06] sm:min-h-[20rem] lg:min-h-[19rem]">
          <span className="sr-only">
            Decorative background photograph of workers at a construction site.
          </span>
          <div
            className="absolute inset-0 scale-105 bg-cover bg-[center_35%] sm:bg-center"
            style={{ backgroundImage: `url(${LABOUR_BG})` }}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-background from-45% via-background/88 to-background/25 dark:from-background dark:from-40% dark:via-background/92 dark:to-background/35"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/20 dark:from-background/80 md:from-background/40 md:to-transparent"
            aria-hidden
          />

          <div className="relative grid gap-10 p-8 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12 lg:p-12">
            <div className="min-w-0 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary shadow-sm backdrop-blur-sm dark:bg-primary/20">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
                For contractors & builders
              </div>

              <div className="space-y-3">
                <h2
                  id="bulk-hire-heading"
                  className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[1.75rem] lg:leading-tight"
                >
                  Bulk hire labour{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/75 bg-clip-text text-transparent">
                    in one go
                  </span>
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Manpower and technical workers in one place — shortlist who you need, send a single crew request,
                  and track replies from your provider dashboard.
                </p>
              </div>

              <ul className="grid gap-3 sm:gap-3.5">
                {highlights.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className="flex gap-3 text-sm text-foreground/95 sm:text-[0.9375rem]"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/75 text-primary shadow-sm backdrop-blur-sm dark:bg-background/55">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="leading-snug pt-1">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:min-w-[220px]">
              <Button variant="default" size="lg" className="gap-2 shadow-md" asChild>
                <Link href="/dashboard/provider/manpower-crew">
                  Hire labour
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-border/80 bg-background/80 backdrop-blur-sm dark:bg-background/60"
                asChild
              >
                <Link href="/signup?type=provider">Register as provider</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
