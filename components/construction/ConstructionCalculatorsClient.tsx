"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Calculator,
  Fence,
  HardHat,
  Home,
  Loader2,
  Paintbrush,
  Route,
  Store,
  Warehouse,
} from "lucide-react";
import api from "@/lib/api-client";

interface ConstructionTypeOption {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

const TYPE_ICONS: Record<string, typeof Home> = {
  house: Home,
  villa: Home,
  apartment: Building2,
  "commercial-building": Building2,
  warehouse: Warehouse,
  shop: Store,
  "boundary-wall": Fence,
  road: Route,
  shed: Warehouse,
};

const TYPE_HINTS: Record<string, string> = {
  house: "Independent house — material, labour & timeline estimate",
  villa: "Premium villa construction cost breakdown",
  apartment: "Multi-unit residential building estimate",
  "commercial-building": "Office or commercial built-up cost",
  warehouse: "Industrial warehouse shell & finish estimate",
  shop: "Retail shop construction budget",
  "boundary-wall": "Perimeter wall quantity & cost",
  road: "Road work material & labour estimate",
  shed: "Industrial shed construction estimate",
};

export default function ConstructionCalculatorsClient() {
  const [types, setTypes] = useState<ConstructionTypeOption[]>([]);
  const [boqTemplates, setBoqTemplates] = useState<Array<{ slug: string; name: string; description?: string }>>([]);
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

  return (
    <div className="min-w-0">
      <section className="border-b bg-gradient-to-b from-primary/5 via-background to-background">
            <div className="container max-w-6xl px-4 py-12 md:py-16">
              <div className="mx-auto max-w-3xl text-center">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  <Calculator className="h-4 w-4" />
                  Rule-driven estimates
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                  Construction Cost Calculators
                </h1>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  Plan your budget with city-wise material quantities, labour requirements, stage-wise
                  costs, and project timelines — powered by Imagineering India&apos;s estimation engine.
                </p>
              </div>
            </div>
          </section>

          <section className="container max-w-6xl px-4 py-10 md:py-14">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : types.length === 0 ? (
              <Card className="mx-auto max-w-xl text-center">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <HardHat className="h-5 w-5" />
                    Calculators coming soon
                  </CardTitle>
                  <CardDescription>
                    Construction types are being configured. Please check back shortly or contact us for
                    a custom estimate.
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
                {types.map((type) => {
                  const Icon = TYPE_ICONS[type.slug] || Building2;
                  return (
                    <Card
                      key={type._id}
                      className="group flex flex-col transition-shadow hover:shadow-lg"
                    >
                      <CardHeader>
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <CardDescription>
                          {TYPE_HINTS[type.slug] || type.description || `${type.name} cost calculator`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto pt-0">
                        <Button asChild className="w-full">
                          <Link href={`/construction-calculator/${type.slug}`}>
                            Calculate cost
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {boqTemplates.length > 0 && (
              <div className="mt-14">
                <h2 className="text-xl font-bold mb-1">BOQ project templates</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pre-configured layouts with building configuration, foundation type, and downloadable BOQ PDF.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {boqTemplates.map((tpl) => (
                    <Card key={tpl.slug} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{tpl.name}</CardTitle>
                        <CardDescription>{tpl.description || "Ready-to-use BOQ template"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/construction-calculator/${tpl.slug}`}>
                            Use template
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Material quantities",
                  desc: "Cement, steel, bricks, tiles and more — scaled to your built-up area.",
                },
                {
                  title: "Labour person-days",
                  desc: "Trade-wise productivity rules converted into labour cost.",
                },
                {
                  title: "Stage-wise BOQ-ready",
                  desc: "Foundation to finishing — confidence score, marketplace prices, and PDF export.",
                },
              ].map((item) => (
                <Card key={item.title} className="border-dashed bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-10 overflow-hidden border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="font-semibold text-foreground">Need painting, flooring or borewell only?</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    More specialised calculators are being added on the same engine. Submit a requirement for
                    a detailed quote today.
                  </p>
                </div>
                <Button variant="secondary" asChild>
                  <Link href="/requirement/submit">
                    <Paintbrush className="mr-2 h-4 w-4" />
                    Get expert quote
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </section>
    </div>
  );
}
