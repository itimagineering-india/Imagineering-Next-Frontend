"use client";

import { useEffect, useMemo, useState } from "react";
import { IndianRupee, Loader2, MapPin, Search } from "lucide-react";
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

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <IndianRupee className="h-7 w-7 text-primary" />
          Reference price guide
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Indicative price ranges (not fixed quotes) by city, category, and subcategory.
        </p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Find standard range
          </CardTitle>
          <CardDescription>Select city, category, and subcategory to check range.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="std-price-city-next">City</Label>
            <Input
              id="std-price-city-next"
              placeholder="e.g. Mumbai, Bhopal"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              list="std-price-city-list-next"
              className="h-11"
            />
            <datalist id="std-price-city-list-next">
              {CITIES.map((c) => (
                <option key={c.slug} value={c.name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
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
              <SelectTrigger className="h-11">
                <SelectValue placeholder={loadingCats ? "Loading..." : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subcategory</Label>
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
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
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

          {lookedUp && !lookupLoading && (
            <div className="rounded-lg border bg-muted/40 p-4">
              {!result ? (
                <p className="text-sm text-muted-foreground">
                  No active reference range available for this combination currently.
                </p>
              ) : !result.isActive ? (
                <p className="text-sm text-muted-foreground">
                  This reference entry is currently inactive.
                </p>
              ) : priceLabel ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Indicative range</p>
                  <p className="text-2xl font-semibold tracking-tight">{priceLabel}</p>
                  {result.priceType ? (
                    <p className="text-xs capitalize text-muted-foreground">
                      Pricing basis: {String(result.priceType).replace(/_/g, " ")}
                    </p>
                  ) : null}
                  {result.notes ? <p className="border-t pt-2 text-sm text-muted-foreground">{result.notes}</p> : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Range details are not complete for this entry.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
