"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight, Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  ESTIMATE_OUTPUTS,
  FAQ_ITEMS,
  HERO_HIGHLIGHTS,
  HOW_IT_WORKS_STEPS,
  TYPE_HINTS,
  USE_CASES,
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

function SectionHeader({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 md:mb-8 max-w-2xl", className)}>
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">{description}</p>
    </div>
  );
}

function CalculatorTypeCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-foreground/15 hover:shadow-md"
    >
      <h3 className="font-semibold text-foreground transition-colors group-hover:text-[hsl(var(--red-accent))]">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span className="mt-4 inline-flex items-center text-sm font-medium text-foreground">
        Open calculator
        <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function BoqTemplateRow({
  href,
  title,
  description,
  meta,
}: {
  href: string;
  title: string;
  description?: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5"
    >
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {description}
          {description && meta ? " · " : ""}
          {meta}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
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
      <section className="border-b bg-muted/20">
        <div className="container max-w-6xl px-4 py-10 md:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-[hsl(var(--red-accent))]">Imagineering India</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-tight">
              Construction cost calculators
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              Rule-based estimates for material quantities, labour, stage-wise cost, and project timeline —
              built for Indian construction projects and updated with city price data.
            </p>
          </div>
          <dl className="mt-8 grid gap-3 sm:grid-cols-3">
            {HERO_HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-lg border bg-card px-4 py-3 shadow-sm">
                <dt className="text-sm font-semibold">{item.label}</dt>
                <dd className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{item.detail}</dd>
              </div>
            ))}
          </dl>
          {!loading && firstTypeSlug && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/construction-calculator/${firstTypeSlug}`}>Start an estimate</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Calculator picker */}
      <section className="container max-w-6xl px-4 py-12 md:py-16" id="calculators">
        <SectionHeader
          title="Choose a calculator"
          description="Select the building or work type that matches your project. Each opens a short step-by-step form — city, area, layout, and finish standard."
        />
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : types.length === 0 ? (
          <Card className="max-w-lg border-dashed">
            <CardHeader>
              <CardTitle>Calculators not available yet</CardTitle>
              <CardDescription>
                Construction types are being configured. Contact us for a manual estimate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/contact">Contact Imagineering India</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((type) => (
              <CalculatorTypeCard
                key={type._id}
                href={`/construction-calculator/${type.slug}`}
                title={type.name}
                description={
                  TYPE_HINTS[type.slug] || type.description || `${type.name} cost estimate`
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y bg-background" id="how-it-works">
        <div className="container max-w-6xl px-4 py-12 md:py-16">
          <SectionHeader
            title="How the calculator works"
            description="Four steps from project details to a downloadable BOQ — powered by consumption rules, not generic per-sqft multipliers."
            className="mx-auto text-center max-w-3xl"
          />
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.step} className="relative text-center lg:text-left">
                  <div className="mx-auto lg:mx-0 mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--red-accent))]/10 text-[hsl(var(--red-accent))]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Step {item.step}
                  </p>
                  <h3 className="mt-1 text-base font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* BOQ templates */}
      {!loading && boqTemplates.length > 0 && (
        <section className="bg-muted/20">
          <div className="container max-w-6xl px-4 py-12 md:py-16">
            <SectionHeader
              title="BOQ project templates"
              description="Ready-made profiles for common builds — pre-filled area, floors, room layout, and foundation. Best when your project matches a standard typology."
            />
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm divide-y">
              {boqTemplates.map((tpl) => (
                <BoqTemplateRow
                  key={tpl.slug}
                  href={`/construction-calculator/${tpl.slug}`}
                  title={tpl.name}
                  description={tpl.description || "Pre-configured BOQ template"}
                  meta={
                    tpl.defaultBuiltUpArea
                      ? `${tpl.defaultBuiltUpArea.toLocaleString("en-IN")} sqft${
                          tpl.defaultFloors ? `, ${tpl.defaultFloors} floor(s)` : ""
                        }`
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Who it's useful for */}
      <section className="container max-w-6xl px-4 py-12 md:py-16">
        <SectionHeader
          title="Who is this useful for?"
          description="Whether you are building your first home or preparing a client BOQ, the calculator gives a structured starting point — not a replacement for site inspection."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {USE_CASES.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-foreground" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {item.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="text-[hsl(var(--red-accent))]" aria-hidden>
                          —
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* What you get */}
      <section className="border-y bg-muted/20">
        <div className="container max-w-6xl px-4 py-12 md:py-16">
          <SectionHeader
            title="What you get in every estimate"
            description="Each calculation returns a full breakdown you can review on screen or export for procurement and planning."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {ESTIMATE_OUTPUTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--red-accent))]/10">
                    <Icon className="h-5 w-5 text-[hsl(var(--red-accent))]" aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-6xl px-4 py-12 md:py-16">
        <SectionHeader
          title="Common questions"
          description="Quick answers about accuracy, supported cities, BOQ templates, and how to use the results."
        />
        <Accordion type="single" collapsible defaultValue="faq-0" className="rounded-xl border bg-card px-2 shadow-sm">
          {FAQ_ITEMS.map((item, idx) => (
            <AccordionItem key={item.question} value={`faq-${idx}`}>
              <AccordionTrigger className="px-3 text-left text-sm font-medium hover:no-underline sm:text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-3 text-sm leading-relaxed text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="border-t bg-background">
        <div className="container max-w-6xl px-4 py-12 md:py-14">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
            <div className="max-w-xl">
              <h2 className="text-xl font-bold sm:text-2xl">Need a site-specific quote?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                For painting, flooring, borewell, renovation, or non-standard scope — submit your requirement
                and connect with verified construction professionals on Imagineering India.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/requirement/submit">Submit requirement</Link>
              </Button>
              <Button variant="outline" asChild size="lg" className="w-full sm:w-auto">
                <Link href="/services?category=construction">Find contractors</Link>
              </Button>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            All calculator outputs are indicative estimates. Final contract prices depend on site conditions,
            specifications, and contractor quotes.
          </p>
        </div>
      </section>
    </div>
  );
}
