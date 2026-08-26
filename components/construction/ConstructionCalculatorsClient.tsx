"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, ChevronRight, Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  FAQ_ITEMS,
  HERO_HIGHLIGHTS,
  HOW_IT_WORKS_STEPS,
  TYPE_HINTS,
} from "@/components/construction/construction-calculator-hub-data";

interface ConstructionTypeOption {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface BoqTemplateListItem {
  slug: string;
  name: string;
  description?: string;
  defaultBuiltUpArea?: number;
  defaultFloors?: number;
}

export default function ConstructionCalculatorsClient() {
  const [types, setTypes] = useState<ConstructionTypeOption[]>([]);
  const [boqTemplates, setBoqTemplates] = useState<BoqTemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.estimation.getOptions();
        if (!cancelled && res.success && res.data) {
          setTypes(res.data.constructionTypes || []);
          setBoqTemplates(res.data.boqTemplates || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstTypeSlug = types[0]?.slug;

  return (
    <div className="min-w-0">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-[linear-gradient(165deg,#fafafa_0%,#ffffff_45%,#fff5f0_100%)]">
        <div className="container max-w-5xl px-4 py-10 sm:py-12 md:py-14">
          <p className="text-sm font-semibold tracking-wide text-[hsl(var(--red-accent))]">
            Imagineering India
          </p>
          <h1 className="mt-2 max-w-xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-[2.5rem] md:leading-[1.15]">
            Construction cost calculator
          </h1>
          <p className="mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
            Material, labour, and timeline estimates by city — ready in minutes.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {HERO_HIGHLIGHTS.map((item) => (
              <li key={item.label} className="flex items-baseline gap-1.5">
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="text-muted-foreground">· {item.detail}</span>
              </li>
            ))}
          </ul>

          {!loading && firstTypeSlug && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/construction-calculator/${firstTypeSlug}`}>Start estimate</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#calculators">Browse types</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Calculator picker */}
      <section className="container max-w-5xl px-4 py-10 md:py-12" id="calculators">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Choose a type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a calculator that matches your project.
        </p>

        {loading ? (
          <div className="flex justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : types.length === 0 ? (
          <div className="mt-8 max-w-md rounded-xl border border-dashed p-6 text-center">
            <p className="font-medium">Calculators coming soon</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Contact us for a manual estimate.
            </p>
            <Button asChild className="mt-4">
              <Link href="/contact">Contact</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((type) => (
              <Link
                key={type._id}
                href={`/construction-calculator/${type.slug}`}
                className="group flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground transition group-hover:text-[hsl(var(--red-accent))]">
                    {type.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {TYPE_HINTS[type.slug] || type.description || "Cost estimate"}
                  </span>
                </span>
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y bg-muted/30" id="how-it-works">
        <div className="container max-w-5xl px-4 py-10 md:py-12">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">How it works</h2>
          <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.step} className="flex gap-3 sm:flex-col sm:gap-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--red-accent))]/10 text-[hsl(var(--red-accent))] sm:mb-3">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.step}
                    </p>
                    <h3 className="mt-0.5 text-sm font-semibold sm:text-base">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* BOQ templates */}
      {!loading && boqTemplates.length > 0 && (
        <section className="container max-w-5xl px-4 py-10 md:py-12">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Quick templates</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-filled area and layout for common builds.
          </p>
          <ul className="mt-5 divide-y overflow-hidden rounded-xl border bg-white">
            {boqTemplates.map((tpl) => {
              const meta = tpl.defaultBuiltUpArea
                ? `${tpl.defaultBuiltUpArea.toLocaleString("en-IN")} sqft${
                    tpl.defaultFloors ? ` · ${tpl.defaultFloors} floor(s)` : ""
                  }`
                : null;
              return (
                <li key={tpl.slug}>
                  <Link
                    href={`/construction-calculator/${tpl.slug}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-muted/40 sm:px-5"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{tpl.name}</span>
                      {meta && (
                        <span className="mt-0.5 block text-sm text-muted-foreground">{meta}</span>
                      )}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* FAQ */}
      <section className={cn("border-t", boqTemplates.length === 0 && "border-t-0")}>
        <div className="container max-w-5xl px-4 py-10 md:py-12">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">FAQ</h2>
          <Accordion
            type="single"
            collapsible
            className="mt-5 rounded-xl border bg-white px-2"
          >
            {FAQ_ITEMS.map((item, idx) => (
              <AccordionItem key={item.question} value={`faq-${idx}`}>
                <AccordionTrigger className="px-3 text-left text-sm font-medium hover:no-underline sm:text-base">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-3 text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container max-w-5xl px-4 py-8 md:py-10">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#7f1d1d_140%)] px-5 py-7 text-white sm:px-8 sm:py-8">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[hsl(var(--red-accent))]/25 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 left-1/4 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              aria-hidden
            />

            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-md">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                  Imagineering India
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                  Need a site quote?
                </h2>
                <p className="mt-1.5 text-sm text-white/70">
                  Verified contractors for your next build.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-[hsl(var(--red-accent))] text-[hsl(var(--red-accent-foreground))] hover:bg-[hsl(var(--red-accent))]/90"
                >
                  <Link href="/requirement/submit">
                    Submit requirement
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/services?category=construction">Find contractors</Link>
                </Button>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Estimates are indicative — final prices depend on site conditions and quotes.
          </p>
        </div>
      </section>
    </div>
  );
}
