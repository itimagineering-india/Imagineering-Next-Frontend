"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AREA_PRESETS,
  BoqTemplateOption,
  EstimateFormState,
  FOUNDATION_LABELS,
  WIZARD_STEPS,
} from "@/components/construction/estimate-types";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

interface ConstructionEstimateWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  calculating: boolean;
  error: string | null;
  form: EstimateFormState;
  setForm: React.Dispatch<React.SetStateAction<EstimateFormState>>;
  cities: Array<{ name: string; slug: string }>;
  types: Array<{ name: string; slug: string }>;
  standards: Array<{ name: string; slug: string }>;
  boqTemplates: BoqTemplateOption[];
  structureTypes: string[];
  soilTypes: string[];
  foundationTypes: string[];
  citySuggestions: string[];
  onApplyTemplate: (tpl: BoqTemplateOption) => void;
  onSubmit: () => void;
}

function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-0" aria-label="Estimate steps">
      {WIZARD_STEPS.map((s, i) => (
        <li key={s.id} className="flex min-w-0 flex-1 items-center last:flex-none">
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-medium tabular-nums",
              i <= current
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground"
            )}
            title={s.title}
          >
            {i + 1}
          </span>
          {i < WIZARD_STEPS.length - 1 && (
            <span
              className={cn("mx-1.5 h-px min-w-[8px] flex-1", i < current ? "bg-foreground/40" : "bg-border")}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}

function OptionList({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="overflow-hidden rounded-md border">{children}</div>
    </div>
  );
}

function OptionRow({
  selected,
  onClick,
  title,
  meta,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  meta?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b px-3 py-2.5 text-left text-sm last:border-b-0",
        "transition-colors hover:bg-muted/40",
        selected && "bg-muted/60"
      )}
    >
      <span>
        <span className="font-medium">{title}</span>
        {meta && <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span>}
      </span>
      {selected && <Check className="h-4 w-4 shrink-0 text-foreground" aria-hidden />}
    </button>
  );
}

function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-input bg-background text-foreground hover:bg-muted/50"
      )}
    >
      {children}
    </button>
  );
}

function Counter({
  label,
  value,
  onChange,
  max = 12,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${label}`}
        >
          −
        </Button>
        <span className="w-6 text-center text-sm font-medium tabular-nums">{value}</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-7 w-7"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  );
}

export default function ConstructionEstimateWizard({
  open,
  onOpenChange,
  loading,
  calculating,
  error,
  form,
  setForm,
  cities,
  types,
  standards,
  boqTemplates,
  structureTypes,
  soilTypes,
  foundationTypes,
  citySuggestions,
  onApplyTemplate,
  onSubmit,
}: ConstructionEstimateWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = WIZARD_STEPS[stepIndex];

  const popularCities = useMemo(() => {
    const preferred = ["Bhopal", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"];
    const fromApi = cities.map((c) => c.name);
    return preferred.filter((p) => fromApi.includes(p) || citySuggestions.includes(p)).slice(0, 6);
  }, [cities, citySuggestions]);

  const setField = <K extends keyof EstimateFormState>(key: K, value: EstimateFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const canNext = (): boolean => {
    switch (step.id) {
      case "project":
        return Boolean(form.constructionType);
      case "location":
        return Boolean(form.city.trim()) && Number(form.builtUpArea) > 0;
      case "rooms":
        return Number(form.floors) >= 1;
      case "finish":
        return Boolean(form.standard);
      case "review":
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (step.id === "review") {
      onSubmit();
      return;
    }
    if (stepIndex < WIZARD_STEPS.length - 1) setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setStepIndex(0);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b px-5 pb-4 pt-5">
          <DialogHeader className="space-y-2 text-left">
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {WIZARD_STEPS.length} · {step.title}
            </p>
            <DialogTitle className="text-lg font-semibold">{step.hint}</DialogTitle>
            <DialogDescription className="sr-only">{step.title}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <StepIndicator current={stepIndex} />
          </div>
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {step.id === "project" && (
                <div className="space-y-5">
                  {boqTemplates.length > 0 && (
                    <OptionList label="BOQ templates">
                      {boqTemplates.slice(0, 8).map((tpl) => (
                        <OptionRow
                          key={tpl.slug}
                          selected={form.boqTemplate === tpl.slug}
                          title={tpl.name}
                          meta={
                            tpl.defaultBuiltUpArea
                              ? `${tpl.defaultBuiltUpArea.toLocaleString("en-IN")} sqft, ${tpl.defaultFloors} floor(s)`
                              : undefined
                          }
                          onClick={() => {
                            onApplyTemplate(tpl);
                            setField("boqTemplate", tpl.slug);
                          }}
                        />
                      ))}
                    </OptionList>
                  )}
                  <OptionList label="Construction type">
                    {types.map((t) => (
                      <OptionRow
                        key={t.slug}
                        selected={form.constructionType === t.name && !form.boqTemplate}
                        title={t.name}
                        onClick={() => {
                          setField("constructionType", t.name);
                          setField("boqTemplate", "");
                        }}
                      />
                    ))}
                  </OptionList>
                </div>
              )}

              {step.id === "location" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="est-wizard-city">City</Label>
                    <Input
                      id="est-wizard-city"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="e.g. Bhopal"
                      list="wizard-city-list"
                    />
                    <datalist id="wizard-city-list">
                      {citySuggestions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    {popularCities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {popularCities.map((name) => (
                          <ChoiceChip
                            key={name}
                            selected={form.city === name}
                            onClick={() => setField("city", name)}
                          >
                            {name}
                          </ChoiceChip>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="est-wizard-area">Built-up area (sqft)</Label>
                    <Input
                      id="est-wizard-area"
                      type="number"
                      min={1}
                      value={form.builtUpArea}
                      onChange={(e) => setField("builtUpArea", e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {AREA_PRESETS.map((n) => (
                        <ChoiceChip
                          key={n}
                          selected={Number(form.builtUpArea) === n}
                          onClick={() => setField("builtUpArea", String(n))}
                        >
                          {n.toLocaleString("en-IN")}
                        </ChoiceChip>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step.id === "rooms" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Floors</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {[1, 2, 3, 4].map((n) => (
                        <ChoiceChip
                          key={n}
                          selected={Number(form.floors) === n}
                          onClick={() => setField("floors", String(n))}
                        >
                          G+{n - 1}
                        </ChoiceChip>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border px-3">
                    <Counter
                      label="Bedrooms"
                      value={Number(form.bedrooms) || 0}
                      onChange={(n) => setField("bedrooms", String(n))}
                    />
                    <Counter
                      label="Bathrooms"
                      value={Number(form.bathrooms) || 0}
                      onChange={(n) => setField("bathrooms", String(n))}
                    />
                    <Counter
                      label="Kitchens"
                      value={Number(form.kitchens) || 0}
                      onChange={(n) => setField("kitchens", String(n))}
                      max={3}
                    />
                    <Counter
                      label="Living rooms"
                      value={Number(form.livingRooms) || 0}
                      onChange={(n) => setField("livingRooms", String(n))}
                      max={3}
                    />
                    <Counter
                      label="Balconies"
                      value={Number(form.balconies) || 0}
                      onChange={(n) => setField("balconies", String(n))}
                      max={6}
                    />
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Room counts help estimate plumbing, flooring, and electrical quantities. Leave at 0 if
                    not relevant.
                  </p>
                </div>
              )}

              {step.id === "finish" && (
                <div className="space-y-5">
                  <OptionList label="Construction standard">
                    {standards.map((s) => (
                      <OptionRow
                        key={s.slug}
                        selected={form.standard === s.name}
                        title={s.name}
                        onClick={() => setField("standard", s.name)}
                      />
                    ))}
                  </OptionList>
                  {foundationTypes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Foundation type (optional)</Label>
                      <div className="flex flex-wrap gap-1.5">
                        <ChoiceChip
                          selected={!form.foundationType}
                          onClick={() => setField("foundationType", "")}
                        >
                          Not specified
                        </ChoiceChip>
                        {foundationTypes.map((f) => (
                          <ChoiceChip
                            key={f}
                            selected={form.foundationType === f}
                            onClick={() => setField("foundationType", f)}
                          >
                            {FOUNDATION_LABELS[f] || f}
                          </ChoiceChip>
                        ))}
                      </div>
                    </div>
                  )}
                  <details className="rounded-md border px-3 py-2">
                    <summary className="cursor-pointer text-sm font-medium">Site details (optional)</summary>
                    <div className="mt-3 grid gap-3 pb-1 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="est-structure" className="text-xs">
                          Structure
                        </Label>
                        <select
                          id="est-structure"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={form.structureType}
                          onChange={(e) => setField("structureType", e.target.value)}
                        >
                          <option value="">Not specified</option>
                          {structureTypes.map((s) => (
                            <option key={s} value={s}>
                              {s === "rcc_frame" ? "RCC frame" : s === "load_bearing" ? "Load bearing" : s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="est-soil" className="text-xs">
                          Soil
                        </Label>
                        <select
                          id="est-soil"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={form.soilType}
                          onChange={(e) => setField("soilType", e.target.value)}
                        >
                          <option value="">Not specified</option>
                          {soilTypes.map((s) => (
                            <option key={s} value={s}>
                              {s === "black_cotton" ? "Black cotton" : s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {step.id === "review" && (
                <dl className="divide-y rounded-md border text-sm">
                  {[
                    ["Project", form.constructionType || "—"],
                    ["City", form.city || "—"],
                    [
                      "Built-up area",
                      `${Number(form.builtUpArea).toLocaleString("en-IN")} sqft · G+${Math.max(0, Number(form.floors) - 1)}`,
                    ],
                    ["Standard", form.standard || "—"],
                    ...(form.foundationType
                      ? [["Foundation", FOUNDATION_LABELS[form.foundationType] || form.foundationType]]
                      : []),
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 px-3 py-2.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                  {(Number(form.bedrooms) > 0 || Number(form.bathrooms) > 0) && (
                    <div className="flex justify-between gap-4 px-3 py-2.5">
                      <dt className="text-muted-foreground">Layout</dt>
                      <dd className="text-right font-medium">
                        {form.bedrooms} BR, {form.bathrooms} bath, {form.kitchens} kitchen
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {error && (
                <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={stepIndex === 0 || calculating}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {step.id === "finish" && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setStepIndex((i) => i + 1)}>
                Skip
              </Button>
            )}
            <Button type="button" size="sm" onClick={goNext} disabled={!canNext() || calculating || loading}>
              {calculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating
                </>
              ) : step.id === "review" ? (
                "Calculate estimate"
              ) : (
                "Next"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
