"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Calculator,
  ChevronRight,
  Clock,
  Download,
  HardHat,
  IndianRupee,
  Info,
  Loader2,
  MapPin,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import api from "@/lib/api-client";
import { CITIES } from "@/constants/cities";
import { cn } from "@/lib/utils";

interface EstimateResult {
  materials: Array<{
    materialName: string;
    category: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    stageName: string;
    lowestMarketPrice?: number | null;
    averageCityPrice?: number | null;
  }>;
  labour: Array<{
    tradeName: string;
    personDays: number;
    dailyRate: number;
    totalCost: number;
    stageName: string;
  }>;
  stageWiseCost: Array<{
    stageName: string;
    sequence: number;
    materialCost: number;
    labourCost: number;
    totalCost: number;
    estimatedDays: number;
  }>;
  materialCost: number;
  labourCost: number;
  estimatedProjectCost: number;
  estimatedTimelineDays: number;
  confidence?: {
    level: "low" | "medium" | "high";
    score: number;
    factors: {
      priceCoveragePercent: number;
      ruleCoveragePercent: number;
      optionalInputsScore: number;
      marketplaceDataScore: number;
      templateUsed: boolean;
    };
  };
  marketplace?: {
    materials: Array<{
      materialId: string;
      lowestPrice: number | null;
      averageCityPrice: number | null;
      suppliers: Array<{ supplierName: string; rate: number; unit: string; phone?: string }>;
    }>;
    contractors: Array<{
      contractorName: string;
      specialty?: string;
      rating?: number;
      phone?: string;
    }>;
  };
  meta?: {
    cityName?: string;
    constructionTypeName?: string;
    standardName?: string;
    builtUpArea?: number;
    floors?: number;
    foundationType?: string | null;
    buildingConfiguration?: {
      bedrooms?: number;
      bathrooms?: number;
      kitchens?: number;
      balconies?: number;
      livingRooms?: number;
    };
    boqTemplateName?: string | null;
  };
}

interface BoqTemplateOption {
  _id: string;
  name: string;
  slug: string;
  defaultFloors: number;
  defaultBuiltUpArea?: number;
  defaultStandardSlug?: string;
  foundationType?: string;
  buildingConfiguration?: {
    bedrooms?: number;
    bathrooms?: number;
    kitchens?: number;
    balconies?: number;
    livingRooms?: number;
  };
  constructionTypeId?: { name: string; slug: string };
}

const FOUNDATION_LABELS: Record<string, string> = {
  isolated_footing: "Isolated Footing",
  combined_footing: "Combined Footing",
  raft_foundation: "Raft Foundation",
  pile_foundation: "Pile Foundation",
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

export default function ConstructionCalculatorClient({ typeSlug }: { typeSlug?: string }) {

  const [optionsLoading, setOptionsLoading] = useState(true);
  const [cities, setCities] = useState<Array<{ name: string; slug: string }>>([]);
  const [types, setTypes] = useState<Array<{ name: string; slug: string }>>([]);
  const [standards, setStandards] = useState<Array<{ name: string; slug: string }>>([]);
  const [brands, setBrands] = useState<Array<{ _id: string; name: string }>>([]);
  const [boqTemplates, setBoqTemplates] = useState<BoqTemplateOption[]>([]);
  const [structureTypes, setStructureTypes] = useState<string[]>([]);
  const [soilTypes, setSoilTypes] = useState<string[]>([]);
  const [foundationTypes, setFoundationTypes] = useState<string[]>([]);

  const [boqTemplate, setBoqTemplate] = useState<string>("");
  const [city, setCity] = useState("");
  const [constructionType, setConstructionType] = useState("");
  const [standard, setStandard] = useState("");
  const [structureType, setStructureType] = useState<string>("");
  const [soilType, setSoilType] = useState<string>("");
  const [foundationType, setFoundationType] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [builtUpArea, setBuiltUpArea] = useState("1500");
  const [floors, setFloors] = useState("1");
  const [bedrooms, setBedrooms] = useState("0");
  const [bathrooms, setBathrooms] = useState("0");
  const [kitchens, setKitchens] = useState("0");
  const [balconies, setBalconies] = useState("0");
  const [livingRooms, setLivingRooms] = useState("0");

  const [calculating, setCalculating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyTemplate = useCallback((
    tpl: BoqTemplateOption,
    standardsList?: Array<{ name: string; slug: string }>
  ) => {
    setBoqTemplate(tpl.slug);
    if (tpl.constructionTypeId?.name) setConstructionType(tpl.constructionTypeId.name);
    if (tpl.defaultBuiltUpArea) setBuiltUpArea(String(tpl.defaultBuiltUpArea));
    if (tpl.defaultFloors) setFloors(String(tpl.defaultFloors));
    if (tpl.foundationType) setFoundationType(tpl.foundationType);
    const cfg = tpl.buildingConfiguration;
    if (cfg) {
      setBedrooms(String(cfg.bedrooms ?? 0));
      setBathrooms(String(cfg.bathrooms ?? 0));
      setKitchens(String(cfg.kitchens ?? 0));
      setBalconies(String(cfg.balconies ?? 0));
      setLivingRooms(String(cfg.livingRooms ?? 0));
    }
    if (tpl.defaultStandardSlug && standardsList?.length) {
      const std =
        standardsList.find((s) => s.slug === tpl.defaultStandardSlug) ||
        standardsList.find((s) => s.slug === "standard");
      if (std) setStandard(std.name);
    }
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
        setBrands(data.brands || []);
        setBoqTemplates(data.boqTemplates || []);
        setStructureTypes(data.structureTypes || []);
        setSoilTypes(data.soilTypes || []);
        setFoundationTypes(data.foundationTypes || []);

        if (typeSlug) {
          const matchTpl = data.boqTemplates?.find((t) => t.slug === typeSlug);
          const match = data.constructionTypes?.find((t) => t.slug === typeSlug);
          if (matchTpl) {
            applyTemplate(matchTpl, data.constructionStandards || []);
          } else if (match) {
            setConstructionType(match.name);
          }
        } else if (data.constructionTypes?.[0]) {
          setConstructionType(data.constructionTypes[0].name);
        }
        if (data.constructionStandards?.length) {
          const std =
            data.constructionStandards.find((s) => s.slug === "standard") ||
            data.constructionStandards[0];
          setStandard(std.name);
        }
        if (data.cities?.length) {
          const bhopal = data.cities.find((c) => c.slug === "bhopal");
          setCity(bhopal?.name || data.cities[0].name);
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [typeSlug, applyTemplate]);

  const buildPayload = () => ({
    city: city.trim(),
    constructionType,
    standard,
    builtUpArea: Number(builtUpArea),
    floors: Math.max(1, Number(floors) || 1),
    structureType: structureType || null,
    soilType: soilType || null,
    foundationType: foundationType || null,
    buildingConfiguration: {
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 0,
      kitchens: Number(kitchens) || 0,
      balconies: Number(balconies) || 0,
      livingRooms: Number(livingRooms) || 0,
    },
    boqTemplate: boqTemplate || undefined,
    brandId: brandId || null,
  });

  const selectedType = useMemo(
    () => types.find((t) => t.name === constructionType),
    [types, constructionType]
  );

  const pageTitle = selectedType
    ? `${selectedType.name} Construction Cost Calculator`
    : "Construction Cost Calculator";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const handleCalculate = async () => {
    setError(null);
    setResult(null);
    if (!city.trim() || !constructionType || !standard) {
      setError("Please select city, construction type, and standard.");
      return;
    }
    const area = Number(builtUpArea);
    if (!Number.isFinite(area) || area <= 0) {
      setError("Built-up area must be a positive number.");
      return;
    }

    setCalculating(true);
    try {
      const res = await api.estimation.calculate(buildPayload());
      if (res.success && res.data) {
        setResult(res.data as EstimateResult);
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
    if (!city.trim() || !constructionType || !standard) {
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
      <div className="border-b bg-gradient-to-br from-slate-50 via-background to-primary/5">
            <div className="container max-w-6xl px-4 py-8 md:py-10">
              <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
                <Link href="/construction-calculator">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All calculators
                </Link>
              </Button>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    <HardHat className="h-3.5 w-3.5" />
                    Imagineering India
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                    {pageTitle}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                    Enter your project details for a rule-based estimate of materials, labour, stage-wise
                    cost, and timeline. Indicative only — final quotes may vary by site conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="container max-w-6xl px-4 py-8 md:py-10">
            <div className="grid gap-8 lg:grid-cols-5">
              {/* Form */}
              <div className="lg:col-span-2">
                <Card className="sticky top-24 rounded-2xl shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calculator className="h-5 w-5 text-primary" />
                      Project details
                    </CardTitle>
                    <CardDescription>All fields drive the estimation engine.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {optionsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="est-city">City</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="est-city"
                              list="est-city-list"
                              className="pl-9"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              placeholder="e.g. Bhopal"
                            />
                            <datalist id="est-city-list">
                              {cityDatalist.map((name) => (
                                <option key={name} value={name} />
                              ))}
                            </datalist>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>BOQ template (optional)</Label>
                          <Select
                            value={boqTemplate || "__none__"}
                            onValueChange={(v) => {
                              if (v === "__none__") {
                                setBoqTemplate("");
                                return;
                              }
                              const tpl = boqTemplates.find((t) => t.slug === v);
                              if (tpl) applyTemplate(tpl, standards);
                            }}
                          >
                            <SelectTrigger><SelectValue placeholder="Custom project" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Custom project</SelectItem>
                              {boqTemplates.map((t) => (
                                <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Construction type</Label>
                          <Select value={constructionType} onValueChange={setConstructionType}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((t) => (
                                <SelectItem key={t.slug} value={t.name}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Construction standard</Label>
                          <Select value={standard} onValueChange={setStandard}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select standard" />
                            </SelectTrigger>
                            <SelectContent>
                              {standards.map((s) => (
                                <SelectItem key={s.slug} value={s.name}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Premium/Economy apply only to materials with matching stage rules — not a global multiplier.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Structure type (optional)</Label>
                          <Select
                            value={structureType || "__none__"}
                            onValueChange={(v) => setStructureType(v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Any structure" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Any / not specified</SelectItem>
                              {structureTypes.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s === "rcc_frame" ? "RCC Frame" : s === "load_bearing" ? "Load Bearing" : s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Soil type (optional)</Label>
                          <Select
                            value={soilType || "__none__"}
                            onValueChange={(v) => setSoilType(v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Any soil" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Any / not specified</SelectItem>
                              {soilTypes.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s === "black_cotton" ? "Black Cotton" : s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Foundation type (optional)</Label>
                          <Select
                            value={foundationType || "__none__"}
                            onValueChange={(v) => setFoundationType(v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger><SelectValue placeholder="Any foundation" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Any / not specified</SelectItem>
                              {foundationTypes.map((f) => (
                                <SelectItem key={f} value={f}>
                                  {FOUNDATION_LABELS[f] || f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {brands.length > 0 && (
                          <div className="space-y-2">
                            <Label>Material brand (optional)</Label>
                            <Select
                              value={brandId || "__none__"}
                              onValueChange={(v) => setBrandId(v === "__none__" ? "" : v)}
                            >
                              <SelectTrigger><SelectValue placeholder="Best available price" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Best available price</SelectItem>
                                {brands.map((b) => (
                                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="est-area">Built-up area (sqft)</Label>
                            <Input
                              id="est-area"
                              type="number"
                              min={1}
                              value={builtUpArea}
                              onChange={(e) => setBuiltUpArea(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="est-floors">Floors</Label>
                            <Input
                              id="est-floors"
                              type="number"
                              min={1}
                              value={floors}
                              onChange={(e) => setFloors(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border bg-muted/30 p-3 space-y-3">
                          <Label className="text-sm font-semibold">Building configuration</Label>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {[
                              { id: "bedrooms", label: "Bedrooms", value: bedrooms, set: setBedrooms },
                              { id: "bathrooms", label: "Bathrooms", value: bathrooms, set: setBathrooms },
                              { id: "kitchens", label: "Kitchens", value: kitchens, set: setKitchens },
                              { id: "balconies", label: "Balconies", value: balconies, set: setBalconies },
                              { id: "livingRooms", label: "Living rooms", value: livingRooms, set: setLivingRooms },
                            ].map((field) => (
                              <div key={field.id} className="space-y-1">
                                <Label htmlFor={`est-${field.id}`} className="text-xs text-muted-foreground">
                                  {field.label}
                                </Label>
                                <Input
                                  id={`est-${field.id}`}
                                  type="number"
                                  min={0}
                                  value={field.value}
                                  onChange={(e) => field.set(e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {error && (
                          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                          </p>
                        )}

                        <Button
                          className="w-full h-11"
                          onClick={handleCalculate}
                          disabled={calculating}
                        >
                          {calculating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Calculating…
                            </>
                          ) : (
                            <>
                              Get estimate
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </>
                          )}
                        </Button>

                        <p className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          Estimates use latest configured city prices and consumption rules. Not a fixed
                          contract price.
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <div className="lg:col-span-3 space-y-6">
                {!result && !calculating && (
                  <Card className="rounded-2xl border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <IndianRupee className="h-7 w-7 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-foreground">Your estimate will appear here</p>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Fill in project details and tap Get estimate to see material, labour, and
                        stage-wise breakdown.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {result && (
                  <>
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
                            className={cn(
                              "rounded-2xl",
                              item.highlight && "border-primary bg-primary/5"
                            )}
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
                          {result.meta?.standardName} · {result.meta?.builtUpArea?.toLocaleString("en-IN")}{" "}
                          sqft
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
                                  <TableCell className="text-right font-semibold">
                                    {fmt(s.totalCost)}
                                  </TableCell>
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
                                      <div className="text-xs text-muted-foreground mt-0.5">
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

                    {(result.marketplace?.contractors?.length || result.marketplace?.materials?.some((m) => m.suppliers.length > 0)) ? (
                      <div className="grid gap-4 md:grid-cols-2">
                        {result.marketplace.materials?.some((m) => m.suppliers.length > 0) && (
                          <Card className="rounded-2xl">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Store className="h-4 w-4 text-primary" />
                                Material suppliers
                              </CardTitle>
                              <CardDescription>Matched suppliers with lowest city prices</CardDescription>
                            </CardHeader>
                            <CardContent className="max-h-64 overflow-y-auto space-y-3">
                              {result.marketplace.materials
                                .filter((m) => m.suppliers.length > 0)
                                .slice(0, 5)
                                .map((m) => (
                                  <div key={m.materialId} className="rounded-lg border p-2 text-sm">
                                    <p className="font-medium">
                                      Lowest: {m.lowestPrice != null ? fmt(m.lowestPrice) : "—"}
                                      {m.averageCityPrice != null && (
                                        <span className="text-muted-foreground font-normal">
                                          {" "}· Avg city: {fmt(m.averageCityPrice)}
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
                              <CardTitle className="text-base flex items-center gap-2">
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
                          <Button
                            variant="outline"
                            onClick={handleDownloadBoq}
                            disabled={downloadingPdf}
                          >
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
                  </>
                )}
              </div>
            </div>
          </div>
    </div>
  );
}
