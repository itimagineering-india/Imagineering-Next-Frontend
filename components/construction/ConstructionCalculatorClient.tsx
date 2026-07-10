"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Clock,
  Download,
  HardHat,
  IndianRupee,
  Loader2,
  Pencil,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import api from "@/lib/api-client";
import { CITIES } from "@/constants/cities";
import { cn } from "@/lib/utils";
import ConstructionEstimateWizard from "@/components/construction/ConstructionEstimateWizard";
import {
  BoqTemplateOption,
  CONFIDENCE_STYLES,
  EstimateFormState,
  EstimateResult,
  WIZARD_STEPS,
} from "@/components/construction/estimate-types";

const DEFAULT_FORM: EstimateFormState = {
  city: "",
  constructionType: "",
  standard: "",
  boqTemplate: "",
  builtUpArea: "1500",
  floors: "1",
  bedrooms: "0",
  bathrooms: "0",
  kitchens: "0",
  balconies: "0",
  livingRooms: "0",
  structureType: "",
  soilType: "",
  foundationType: "",
  brandId: "",
};

export default function ConstructionCalculatorClient({ typeSlug }: { typeSlug?: string }) {
  const searchParams = useSearchParams();
  const startFromQuery = searchParams?.get("start") === "1";

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [cities, setCities] = useState<Array<{ name: string; slug: string }>>([]);
  const [types, setTypes] = useState<Array<{ name: string; slug: string }>>([]);
  const [standards, setStandards] = useState<Array<{ name: string; slug: string }>>([]);
  const [boqTemplates, setBoqTemplates] = useState<BoqTemplateOption[]>([]);
  const [structureTypes, setStructureTypes] = useState<string[]>([]);
  const [soilTypes, setSoilTypes] = useState<string[]>([]);
  const [foundationTypes, setFoundationTypes] = useState<string[]>([]);

  const [form, setForm] = useState<EstimateFormState>(DEFAULT_FORM);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = useCallback((
    tpl: BoqTemplateOption,
    standardsList?: Array<{ name: string; slug: string }>
  ) => {
    setForm((prev) => {
      const next = { ...prev, boqTemplate: tpl.slug };
      if (tpl.constructionTypeId?.name) next.constructionType = tpl.constructionTypeId.name;
      if (tpl.defaultBuiltUpArea) next.builtUpArea = String(tpl.defaultBuiltUpArea);
      if (tpl.defaultFloors) next.floors = String(tpl.defaultFloors);
      if (tpl.foundationType) next.foundationType = tpl.foundationType;
      const cfg = tpl.buildingConfiguration;
      if (cfg) {
        next.bedrooms = String(cfg.bedrooms ?? 0);
        next.bathrooms = String(cfg.bathrooms ?? 0);
        next.kitchens = String(cfg.kitchens ?? 0);
        next.balconies = String(cfg.balconies ?? 0);
        next.livingRooms = String(cfg.livingRooms ?? 0);
      }
      if (tpl.defaultStandardSlug && standardsList?.length) {
        const std =
          standardsList.find((s) => s.slug === tpl.defaultStandardSlug) ||
          standardsList.find((s) => s.slug === "standard");
        if (std) next.standard = std.name;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.estimation.getOptions();
        if (cancelled || !res.success || !res.data) return;
        const data = res.data;
        setCities(data.cities || []);
        setTypes(data.constructionTypes || []);
        setStandards(data.constructionStandards || []);
        setBoqTemplates(data.boqTemplates || []);
        setStructureTypes(data.structureTypes || []);
        setSoilTypes(data.soilTypes || []);
        setFoundationTypes(data.foundationTypes || []);

        setForm((prev) => {
          const next = { ...prev };
          if (typeSlug) {
            const matchTpl = data.boqTemplates?.find((t) => t.slug === typeSlug);
            const match = data.constructionTypes?.find((t) => t.slug === typeSlug);
            if (matchTpl) {
              next.boqTemplate = matchTpl.slug;
              if (matchTpl.constructionTypeId?.name) next.constructionType = matchTpl.constructionTypeId.name;
              if (matchTpl.defaultBuiltUpArea) next.builtUpArea = String(matchTpl.defaultBuiltUpArea);
              if (matchTpl.defaultFloors) next.floors = String(matchTpl.defaultFloors);
              if (matchTpl.foundationType) next.foundationType = matchTpl.foundationType;
              const cfg = matchTpl.buildingConfiguration;
              if (cfg) {
                next.bedrooms = String(cfg.bedrooms ?? 0);
                next.bathrooms = String(cfg.bathrooms ?? 0);
                next.kitchens = String(cfg.kitchens ?? 0);
                next.balconies = String(cfg.balconies ?? 0);
                next.livingRooms = String(cfg.livingRooms ?? 0);
              }
              if (matchTpl.defaultStandardSlug && data.constructionStandards?.length) {
                const std =
                  data.constructionStandards.find((s) => s.slug === matchTpl.defaultStandardSlug) ||
                  data.constructionStandards.find((s) => s.slug === "standard");
                if (std) next.standard = std.name;
              }
            } else if (match) {
              next.constructionType = match.name;
            }
          } else if (data.constructionTypes?.[0]) {
            next.constructionType = data.constructionTypes[0].name;
          }
          if (!next.standard && data.constructionStandards?.length) {
            const std =
              data.constructionStandards.find((s) => s.slug === "standard") ||
              data.constructionStandards[0];
            next.standard = std.name;
          }
          if (!next.city && data.cities?.length) {
            const bhopal = data.cities.find((c) => c.slug === "bhopal");
            next.city = bhopal?.name || data.cities[0].name;
          }
          return next;
        });
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [typeSlug]);

  useEffect(() => {
    if (!optionsLoading && (startFromQuery || typeSlug) && !result) {
      setWizardOpen(true);
    }
  }, [optionsLoading, startFromQuery, typeSlug, result]);

  const buildPayload = () => ({
    city: form.city.trim(),
    constructionType: form.constructionType,
    standard: form.standard,
    builtUpArea: Number(form.builtUpArea),
    floors: Math.max(1, Number(form.floors) || 1),
    structureType: form.structureType || null,
    soilType: form.soilType || null,
    foundationType: form.foundationType || null,
    buildingConfiguration: {
      bedrooms: Number(form.bedrooms) || 0,
      bathrooms: Number(form.bathrooms) || 0,
      kitchens: Number(form.kitchens) || 0,
      balconies: Number(form.balconies) || 0,
      livingRooms: Number(form.livingRooms) || 0,
    },
    boqTemplate: form.boqTemplate || undefined,
    brandId: form.brandId || null,
  });

  const selectedType = useMemo(
    () => types.find((t) => t.name === form.constructionType),
    [types, form.constructionType]
  );

  const pageTitle = selectedType
    ? `${selectedType.name} Construction Cost Calculator`
    : "Construction Cost Calculator";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    if (!form.city.trim() || !form.constructionType || !form.standard) {
      setError("Please select city, construction type, and standard.");
      return;
    }
    const area = Number(form.builtUpArea);
    if (!Number.isFinite(area) || area <= 0) {
      setError("Built-up area must be a positive number.");
      return;
    }

    setCalculating(true);
    try {
      const res = await api.estimation.calculate(buildPayload());
      if (res.success && res.data) {
        setResult(res.data as EstimateResult);
        setWizardOpen(false);
      } else {
        setError(res.error?.message || "Could not generate estimate. Try another city or type.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setCalculating(false);
    }
  };

  const handleDownloadBoq = async () => {
    if (!form.city.trim() || !form.constructionType || !form.standard) {
      setError("Please select city, construction type, and standard.");
      return;
    }
    setDownloadingPdf(true);
    setError(null);
    try {
      const res = await api.estimation.downloadBoqPdf(buildPayload());
      if (res.success && res.data?.pdfUrl) {
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
        const url = res.data.pdfUrl.startsWith("http")
          ? res.data.pdfUrl
          : `${base}${res.data.pdfUrl}`;
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        setError(res.error?.message || "Could not generate BOQ PDF.");
      }
    } catch {
      setError("PDF generation failed. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const cityDatalist = useMemo(() => {
    const fromApi = cities.map((c) => c.name);
    const fromConstants = CITIES.map((c) => c.name);
    return Array.from(new Set([...fromApi, ...fromConstants]));
  }, [cities]);

  return (
    <div className="min-w-0">
      <div className="border-b bg-background">
        <div className="container max-w-6xl px-4 py-8 md:py-10">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link href="/construction-calculator">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All calculators
            </Link>
          </Button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-[hsl(var(--red-accent))]">Imagineering India</p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                {pageTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Enter project details to get material quantities, labour cost, stage-wise breakdown, and
                indicative timeline. Final site quotes may differ.
              </p>
            </div>
            {result && (
              <Button variant="outline" className="shrink-0" onClick={() => setWizardOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                Change inputs
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-8 md:py-10">
        {!result && !calculating && (
          <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-lg">Project inputs</CardTitle>
                <CardDescription>
                  {WIZARD_STEPS.length} steps — type, city, layout, finish standard, then review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-2.5 text-sm text-muted-foreground">
                  {WIZARD_STEPS.map((s, i) => (
                    <li key={s.id} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground tabular-nums">
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">{s.title}</span>
                        <span className="text-muted-foreground"> — {s.hint}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <Button className="w-full" onClick={() => setWizardOpen(true)} disabled={optionsLoading}>
                  {optionsLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Enter project details
                </Button>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 border-dashed bg-muted/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How this estimate is built</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Your inputs are matched to <span className="font-medium text-foreground">consumption rules</span>{" "}
                  (cement per sqft, steel per stage, etc.) and multiplied by{" "}
                  <span className="font-medium text-foreground">city material & labour rates</span>.
                </p>
                <p>
                  The output includes material quantities, trade-wise labour, stage-wise cost, timeline, and
                  a confidence score based on price data coverage.
                </p>
                <Button variant="link" className="h-auto p-0 text-sm" asChild>
                  <Link href="/construction-calculator#how-it-works">Full explanation on calculator hub</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {calculating && !result && (
          <Card className="mx-auto mb-8 max-w-lg border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">Generating estimate</p>
            </CardContent>
          </Card>
        )}

        {error && !wizardOpen && (
          <p className="mx-auto mb-6 max-w-lg rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-6">
            {result.confidence && (
              <Card className={cn("rounded-2xl border", CONFIDENCE_STYLES[result.confidence.level])}>
                <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    <div>
                      <p className="font-semibold capitalize">
                        Estimation confidence: {result.confidence.level}
                      </p>
                      <p className="text-xs opacity-80">
                        Score {result.confidence.score}% · Price data {result.confidence.factors.priceCoveragePercent}% · Rules {result.confidence.factors.ruleCoveragePercent}%
                      </p>
                    </div>
                  </div>
                  {result.meta?.boqTemplateName && (
                    <span className="text-xs font-medium">Template: {result.meta.boqTemplateName}</span>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Material cost", value: fmt(result.materialCost), icon: HardHat },
                { label: "Labour cost", value: fmt(result.labourCost), icon: IndianRupee },
                { label: "Total project cost", value: fmt(result.estimatedProjectCost), icon: IndianRupee, highlight: true },
                { label: "Timeline", value: `${result.estimatedTimelineDays} days`, icon: Clock },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.label}
                    className={cn("rounded-2xl", item.highlight && "border-primary bg-primary/5")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                      <p className={cn("mt-2 text-xl font-bold", item.highlight && "text-primary")}>
                        {item.value}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Stage-wise breakdown</CardTitle>
                <CardDescription>
                  {result.meta?.cityName} · {result.meta?.constructionTypeName} ·{" "}
                  {result.meta?.standardName} · {result.meta?.builtUpArea?.toLocaleString("en-IN")} sqft
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead className="text-right">Material</TableHead>
                      <TableHead className="text-right">Labour</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Days</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.stageWiseCost
                      .filter((s) => s.totalCost > 0 || s.estimatedDays > 0)
                      .map((s) => (
                        <TableRow key={s.stageName}>
                          <TableCell className="font-medium">{s.stageName}</TableCell>
                          <TableCell className="text-right">{fmt(s.materialCost)}</TableCell>
                          <TableCell className="text-right">{fmt(s.labourCost)}</TableCell>
                          <TableCell className="text-right font-semibold">{fmt(s.totalCost)}</TableCell>
                          <TableCell className="text-right">{s.estimatedDays}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Materials</CardTitle>
                </CardHeader>
                <CardContent className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.materials.map((m, i) => (
                        <TableRow key={`${m.materialName}-${i}`}>
                          <TableCell>
                            <div className="font-medium">{m.materialName}</div>
                            <div className="text-xs text-muted-foreground">{m.stageName}</div>
                            {(m.lowestMarketPrice != null || m.averageCityPrice != null) && (
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {m.lowestMarketPrice != null && `Low: ${fmt(m.lowestMarketPrice)}`}
                                {m.averageCityPrice != null && ` · Avg: ${fmt(m.averageCityPrice)}`}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {m.quantity.toLocaleString("en-IN")} {m.unit}
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmt(m.totalCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Labour</CardTitle>
                </CardHeader>
                <CardContent className="max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Trade</TableHead>
                        <TableHead className="text-right">Days</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.labour.map((l, i) => (
                        <TableRow key={`${l.tradeName}-${i}`}>
                          <TableCell>
                            <div className="font-medium">{l.tradeName}</div>
                            <div className="text-xs text-muted-foreground">{l.stageName}</div>
                          </TableCell>
                          <TableCell className="text-right text-sm">{l.personDays}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(l.totalCost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {(result.marketplace?.contractors?.length ||
              result.marketplace?.materials?.some((m) => m.suppliers.length > 0)) ? (
              <div className="grid gap-4 md:grid-cols-2">
                {result.marketplace.materials?.some((m) => m.suppliers.length > 0) && (
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Store className="h-4 w-4 text-primary" />
                        Material suppliers
                      </CardTitle>
                      <CardDescription>Matched suppliers with lowest city prices</CardDescription>
                    </CardHeader>
                    <CardContent className="max-h-64 space-y-3 overflow-y-auto">
                      {result.marketplace.materials
                        .filter((m) => m.suppliers.length > 0)
                        .slice(0, 5)
                        .map((m) => (
                          <div key={m.materialId} className="rounded-lg border p-2 text-sm">
                            <p className="font-medium">
                              Lowest: {m.lowestPrice != null ? fmt(m.lowestPrice) : "—"}
                              {m.averageCityPrice != null && (
                                <span className="font-normal text-muted-foreground">
                                  {" "}
                                  · Avg city: {fmt(m.averageCityPrice)}
                                </span>
                              )}
                            </p>
                            <ul className="mt-1 text-xs text-muted-foreground">
                              {m.suppliers.slice(0, 2).map((s) => (
                                <li key={s.supplierName}>
                                  {s.supplierName} — {fmt(s.rate)}/{s.unit}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
                {result.marketplace.contractors && result.marketplace.contractors.length > 0 && (
                  <Card className="rounded-2xl">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4 text-primary" />
                        Matched contractors
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {result.marketplace.contractors.slice(0, 5).map((c) => (
                        <div key={c.contractorName} className="rounded-lg border p-2 text-sm">
                          <p className="font-medium">{c.contractorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.specialty}
                            {c.rating != null && ` · ★ ${c.rating}`}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : null}

            <Card className="rounded-2xl border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Procurement & contractor matching</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Download a BOQ PDF for procurement planning or get matched with verified
                    construction professionals on Imagineering India.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={handleDownloadBoq} disabled={downloadingPdf}>
                    {downloadingPdf ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download BOQ PDF
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/services?category=construction">Find contractors</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/requirement/submit">Submit requirement</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ConstructionEstimateWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        loading={optionsLoading}
        calculating={calculating}
        error={error}
        form={form}
        setForm={setForm}
        cities={cities}
        types={types}
        standards={standards}
        boqTemplates={boqTemplates}
        structureTypes={structureTypes}
        soilTypes={soilTypes}
        foundationTypes={foundationTypes}
        citySuggestions={cityDatalist}
        onApplyTemplate={(tpl) => applyTemplate(tpl, standards)}
        onSubmit={handleCalculate}
      />
    </div>
  );
}
