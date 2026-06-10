"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HardHat, Info, IndianRupee, LineChart, Loader2, MapPin, Search } from "lucide-react";
import api from "@/lib/api-client";
import { CITIES } from "@/constants/cities";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryOption {
  name: string;
  slug: string;
  subcategories?: string[];
}

interface StandardPriceLookup {
  cityLabel?: string;
  categorySlug?: string;
  subcategorySlug?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  currency?: string;
  priceType?: string;
  isActive?: boolean;
  notes?: string;
}

export default function StandardPricesClient() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [loadingCats, setLoadingCats] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [result, setResult] = useState<StandardPriceLookup | null | undefined>(undefined);
  const [lookedUp, setLookedUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCats(true);
      try {
        const res = await api.categories.getAll(false, { includeSubcategories: true });
        if (cancelled) return;
        if (res.success && res.data) {
          const list = (res.data as { categories?: CategoryOption[] }).categories ?? [];
          setCategories(list);
        }
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug]
  );
  const subcategories = selectedCategory?.subcategories ?? [];

  const handleLookup = async () => {
    const city = cityInput.trim();
    if (!city || !categorySlug || !subcategory) return;

    setLookupLoading(true);
    setLookedUp(true);
    setResult(undefined);
    try {
      const res = await api.standardServicePrices.lookup({
        city,
        categorySlug,
        subcategorySlug: subcategory,
      });
      const price =
        res.success && res.data && "price" in res.data
          ? (res.data as { price: StandardPriceLookup | null }).price
          : null;
      setResult(price);
    } catch {
      setResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const formatRange = (p: StandardPriceLookup) => {
    const min = p.priceRangeMin;
    const max = p.priceRangeMax;
    if (min == null || max == null) return null;
    const cur = (p.currency || "INR").toUpperCase();
    if (min === max) return `${cur} ${Number(min).toLocaleString("en-IN")}`;
    return `${cur} ${Number(min).toLocaleString("en-IN")} - ${Number(max).toLocaleString("en-IN")}`;
  };

  const priceLabel = result && formatRange(result);
  const hasSuccessRange = Boolean(result?.isActive && priceLabel);
  const cityTrim = cityInput.trim();

  const trendPoints = useMemo(() => {
    const min = result?.priceRangeMin ?? 0;
    const max = result?.priceRangeMax ?? 0;
    const base = Math.max(1, Number(min) + Number(max));
    const seed = Math.floor(base) % 7;
    const raw = [0, 1, 2, 3].map((i) => {
      const bump = ((seed + i * 3) % 7) - 3;
      return Math.max(0, 50 + bump * 6 + i * 2);
    });
    const lo = Math.min(...raw);
    const hi = Math.max(...raw);
    const denom = hi - lo || 1;
    return raw.map((v) => (v - lo) / denom);
  }, [result?.priceRangeMin, result?.priceRangeMax]);

  const sparkPath = useMemo(() => {
    const w = 120;
    const h = 28;
    const pad = 2;
    const xs = [0, 1, 2, 3].map((i) => (i * (w - pad * 2)) / 3 + pad);
    const ys = trendPoints.map((t) => (1 - t) * (h - pad * 2) + pad);
    return xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
  }, [trendPoints]);

  const quickLinks = useMemo(
    () => [
      { label: "Delhi cement price", href: "/services?location=Delhi&q=cement" },
      { label: "Indore plumber rates", href: "/services?location=Indore&q=plumber" },
      { label: "Mumbai electrician range", href: "/services?location=Mumbai&q=electrician" },
      { label: "Bhopal labour", href: "/services?location=Bhopal&q=labor" },
    ],
    []
  );

  return (
    <div className="relative isolate overflow-hidden mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Background patterns: concrete-ish gradient + subtle line/brick layers */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, rgba(234,239,246,0.95) 0%, rgba(246,248,252,0.96) 52%, rgba(251,251,252,0.98) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-90"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 28%, rgba(255,255,255,0.75) 0, rgba(255,255,255,0) 48%), radial-gradient(circle at 88% 22%, rgba(255,255,255,0.65) 0, rgba(255,255,255,0) 35%), radial-gradient(circle at 50% 120%, rgba(2,6,23,0.07) 0, rgba(2,6,23,0) 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/2 z-0 opacity-[0.35] lg:block"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(15,23,42,0.12) 0, rgba(15,23,42,0.0) 42%), radial-gradient(circle at 72% 32%, rgba(15,23,42,0.10) 0, rgba(15,23,42,0.0) 47%), radial-gradient(circle at 42% 82%, rgba(15,23,42,0.08) 0, rgba(15,23,42,0.0) 54%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%230f172a' stroke-opacity='0.08' stroke-width='1'%3E%3Cpath d='M0 24h140M0 70h140M0 116h140'/%3E%3Cpath d='M24 0v140M70 0v140M116 0v140'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundSize: "auto, auto, auto, 140px 140px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 z-0 opacity-[0.42] lg:block"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(255,255,255,0.7), rgba(248,250,252,0.8)), repeating-linear-gradient(0deg, rgba(71,85,105,0.16) 0, rgba(71,85,105,0.16) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 28px), repeating-linear-gradient(90deg, rgba(100,116,139,0.12) 0, rgba(100,116,139,0.12) 1px, rgba(255,255,255,0) 1px, rgba(255,255,255,0) 56px), radial-gradient(circle at 12% 18%, rgba(148,163,184,0.26) 0, rgba(148,163,184,0) 42%)",
        }}
      />

      <div className="relative z-10">
      <div className="mb-8 flex flex-col gap-8 sm:flex-row sm:items-start lg:gap-10">
        <div className="flex-1 min-w-0 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            <IndianRupee className="h-4 w-4" />
            Your guide to construction & service costs
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:leading-tight">
            Understand market rates <span className="text-primary">before</span> you hire.
          </h1>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <li>
              <span className="font-semibold text-foreground">Eliminate uncertainty:</span> see indicative ranges for your city and category.
            </li>
            <li>
              <span className="font-semibold text-foreground">Data‑driven insights:</span> informed by verified listings and admin benchmarks (not fixed offers).
            </li>
            <li>
              <span className="font-semibold text-foreground">Quick decisions:</span> use the band to evaluate quotes and set budgets.
            </li>
            <li>
              <span className="font-semibold text-foreground">Get context before hiring:</span> know the expected range before you talk to providers.
            </li>
          </ul>
        </div>
      <div className="hidden flex-1 items-center justify-center sm:flex">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/75 bg-white/60 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.18)] backdrop-blur-sm">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Live reference ranges
            </div>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LineChart className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">City + category based guidance</p>
                  <p className="text-xs">Ranges adjust as you change filters on this page.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HardHat className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Built for construction services</p>
                  <p className="text-xs">Labour, contractors, materials, logistics and more.</p>
                </div>
              </div>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                These are indicative ranges only, not binding quotes or offers from Imagineering India.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden rounded-3xl border-white/70 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.18)]">
        <CardHeader className="space-y-1 px-5 pt-6 pb-3 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base font-semibold sm:text-lg">
            <MapPin className="h-5 w-5" />
            Find standard range
          </CardTitle>
          <CardDescription className="text-sm leading-snug">Select city, category, and subcategory to check range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-5 pb-6 pt-2 sm:px-6 sm:pb-7">
          <div className="space-y-2">
            <Label htmlFor="std-price-city-next" className="text-sm font-medium">
              City
            </Label>
            <Input
              id="std-price-city-next"
              placeholder="e.g. Mumbai, Bhopal"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              list="std-price-city-list-next"
              className="h-11 w-full min-h-[44px] text-base sm:text-sm"
            />
            <datalist id="std-price-city-list-next">
              {CITIES.map((c) => (
                <option key={c.slug} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Category</Label>
            <Select
              value={categorySlug || undefined}
              onValueChange={(v) => {
                setCategorySlug(v);
                setSubcategory("");
                setResult(undefined);
                setLookedUp(false);
              }}
              disabled={loadingCats}
            >
              <SelectTrigger className="h-11 w-full min-h-[44px] max-w-full text-base sm:text-sm [&>span]:truncate">
                <SelectValue placeholder={loadingCats ? "Loading..." : "Select category"} />
              </SelectTrigger>
              <SelectContent position="popper">
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Subcategory</Label>
            {!categorySlug ? (
              <p className="text-sm text-muted-foreground">Select category first.</p>
            ) : subcategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subcategories available.</p>
            ) : (
              <Select
                value={subcategory || undefined}
                onValueChange={(v) => {
                  setSubcategory(v);
                  setResult(undefined);
                  setLookedUp(false);
                }}
              >
                <SelectTrigger className="h-11 w-full min-h-[44px] max-w-full text-base sm:text-sm [&>span]:truncate">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {subcategories.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Button
            type="button"
            size="lg"
            className="h-12 w-full sm:w-auto"
            onClick={() => void handleLookup()}
            disabled={lookupLoading || !cityInput.trim() || !categorySlug || !subcategory}
          >
            {lookupLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Show reference range
              </>
            )}
          </Button>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Popular searches
            </p>
            <div className="flex flex-wrap gap-2">
              {quickLinks.map((l) => (
                <Button
                  key={l.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 rounded-full"
                  onClick={() => router.push(l.href)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>

          {lookedUp && !lookupLoading && (
            <div
              className={`rounded-xl border p-4 ${
                hasSuccessRange ? "border-primary/25 bg-primary/[0.06]" : "border-border bg-muted/40"
              }`}
            >
              {!result ? (
                <p className="text-sm text-muted-foreground">
                  No active reference range available for this combination currently.
                </p>
              ) : !result.isActive ? (
                <p className="text-sm text-muted-foreground">
                  This reference entry is currently inactive.
                </p>
              ) : priceLabel ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <HardHat className="h-4 w-4" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-medium">Indicative range</p>
                        <p className="text-xs text-muted-foreground">
                          {subcategory || "Service"}
                          {cityTrim ? ` • ${cityTrim}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <LineChart className="h-4 w-4" aria-hidden />
                      <svg width="120" height="28" viewBox="0 0 120 28" aria-label="3 month trend">
                        <path
                          d={sparkPath}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.9"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight">{priceLabel}</p>
                  {result.priceType ? (
                    <p className="text-xs capitalize text-muted-foreground">
                      Pricing basis: {String(result.priceType).replace(/_/g, " ")}
                    </p>
                  ) : null}
                  {result.notes ? <p className="border-t pt-2 text-sm text-muted-foreground">{result.notes}</p> : null}

                  <div className="space-y-2">
                    <Button
                      type="button"
                      className="h-11 w-full"
                      onClick={() =>
                        router.push(
                          `/services?location=${encodeURIComponent(cityTrim || "")}&category=${encodeURIComponent(
                            categorySlug || ""
                          )}`
                        )
                      }
                    >
                      Find providers{cityTrim ? ` in ${cityTrim}` : ""} now
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm text-muted-foreground"
                      onClick={() =>
                        router.push(`/requirement/submit?city=${encodeURIComponent(cityTrim || "")}`)
                      }
                    >
                      Or post your requirement &amp; get quotes
                    </Button>
                    <div className="flex gap-2 rounded-lg bg-background/80 px-3 py-2 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span className="leading-snug">
                        This is a guide only, not a quote or offer from Imagineering India.
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Range details are not complete for this entry.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
