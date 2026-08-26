"use client";

import { useEffect, useMemo, useState } from "react";
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
  BoqTemplateOption,
  EstimateFormState,
  FOUNDATION_GUIDE,
  FOUNDATION_LABELS,
  FOUNDATION_SECTION_INTRO,
} from "@/components/construction/estimate-types";
import {
  ROOM_FIELD_LABELS,
  getTypeFieldProfile,
  getWizardStepsForType,
  sanitizeFormForType,
  type RoomFieldId,
  type WizardStepDef,
} from "@/components/construction/construction-type-fields";
import {
  STANDARD_SECTION_INTRO,
  getStandardGuide,
} from "@/components/construction/construction-standards";
import { cn } from "@/lib/utils";
import { Check, CircleHelp, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  standards: Array<{ name: string; slug: string; description?: string }>;
  boqTemplates: BoqTemplateOption[];
  structureTypes: string[];
  soilTypes: string[];
  foundationTypes: string[];
  citySuggestions: string[];
  onApplyTemplate: (tpl: BoqTemplateOption) => void;
  onSubmit: () => void;
}

function StepIndicator({ steps, current }: { steps: WizardStepDef[]; current: number }) {
  return (
    <ol className="flex items-center gap-0" aria-label="Estimate steps">
      {steps.map((s, i) => (
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
          {i < steps.length - 1 && (
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
      <div className="max-h-[280px] overflow-y-auto overflow-x-hidden rounded-md border sm:max-h-[320px]">
        {children}
      </div>
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

const ROOM_COUNTER_MAX: Partial<Record<RoomFieldId, number>> = {
  kitchens: 3,
  livingRooms: 3,
  balconies: 6,
};

function floorChipLabel(n: number, showGPlus: boolean) {
  if (!showGPlus) return String(n);
  return `G+${n - 1}`;
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

  const selectedType = useMemo(
    () => types.find((t) => t.name === form.constructionType),
    [types, form.constructionType]
  );
  const typeKey = selectedType?.slug || form.constructionType;
  const profile = useMemo(() => getTypeFieldProfile(typeKey), [typeKey]);
  const steps = useMemo(() => getWizardStepsForType(typeKey), [typeKey]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  useEffect(() => {
    setStepIndex((i) => Math.min(i, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  const popularCities = useMemo(() => {
    const preferred = ["Bhopal", "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Pune"];
    const fromApi = cities.map((c) => c.name);
    return preferred.filter((p) => fromApi.includes(p) || citySuggestions.includes(p)).slice(0, 6);
  }, [cities, citySuggestions]);

  const relevantTemplates = useMemo(() => {
    if (!form.constructionType && !selectedType) return boqTemplates.slice(0, 8);
    const slug = selectedType?.slug;
    const name = form.constructionType;
    const matched = boqTemplates.filter((tpl) => {
      const tplSlug = tpl.constructionTypeId?.slug;
      const tplName = tpl.constructionTypeId?.name;
      if (slug && tplSlug) return tplSlug === slug;
      if (name && tplName) return tplName === name;
      return true;
    });
    return (matched.length > 0 ? matched : boqTemplates).slice(0, 8);
  }, [boqTemplates, form.constructionType, selectedType]);

  const setField = <K extends keyof EstimateFormState>(key: K, value: EstimateFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyConstructionType = (type: { name: string; slug: string }) => {
    setForm((prev) =>
      sanitizeFormForType(
        { ...prev, constructionType: type.name, boqTemplate: "" },
        type.slug
      )
    );
  };

  const canNext = (): boolean => {
    switch (step?.id) {
      case "project":
        return Boolean(form.constructionType);
      case "location":
        return Boolean(form.city.trim()) && Number(form.builtUpArea) > 0;
      case "layout":
        if (profile.showFloors) return Number(form.floors) >= 1;
        return true;
      case "finish":
        return Boolean(form.standard);
      case "review":
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (step?.id === "review") {
      setForm((prev) => sanitizeFormForType(prev, typeKey));
      onSubmit();
      return;
    }
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setStepIndex(0);
    onOpenChange(next);
  };

  const showResidentialFloorLabels =
    profile.showFloors &&
    (profile.roomFields.includes("bedrooms") || profile.floorOptions.length > 2);

  const layoutSummary = profile.roomFields
    .map((id) => {
      const n = Number(form[id]) || 0;
      if (n <= 0) return null;
      const short =
        id === "bedrooms"
          ? `${n} BR`
          : id === "bathrooms"
            ? `${n} bath`
            : id === "kitchens"
              ? `${n} kitchen`
              : id === "livingRooms"
                ? `${n} living`
                : `${n} balcony`;
      return short;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b px-5 pb-4 pt-5">
          <DialogHeader className="space-y-2 text-left">
            <p className="text-xs text-muted-foreground">
              Step {stepIndex + 1} of {steps.length} · {step?.title}
            </p>
            <DialogTitle className="text-lg font-semibold">{step?.hint}</DialogTitle>
            <DialogDescription className="sr-only">{step?.title}</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <StepIndicator steps={steps} current={stepIndex} />
          </div>
        </div>

        <div className="min-h-[240px] flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {step?.id === "project" && (
                <div className="space-y-5">
                  {relevantTemplates.length > 0 && (
                    <OptionList label="Quick templates">
                      {relevantTemplates.map((tpl) => (
                        <OptionRow
                          key={tpl.slug}
                          selected={form.boqTemplate === tpl.slug}
                          title={tpl.name}
                          meta={
                            tpl.defaultBuiltUpArea
                              ? `${tpl.defaultBuiltUpArea.toLocaleString("en-IN")} sqft${
                                  tpl.defaultFloors ? `, ${tpl.defaultFloors} floor(s)` : ""
                                }`
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
                        onClick={() => applyConstructionType(t)}
                      />
                    ))}
                  </OptionList>
                </div>
              )}

              {step?.id === "location" && (
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
                    <Label htmlFor="est-wizard-area">{profile.areaLabel}</Label>
                    {profile.areaHint && (
                      <p className="text-xs text-muted-foreground">{profile.areaHint}</p>
                    )}
                    <Input
                      id="est-wizard-area"
                      type="number"
                      min={1}
                      value={form.builtUpArea}
                      onChange={(e) => setField("builtUpArea", e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {profile.areaPresets.map((n) => (
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

              {step?.id === "layout" && (
                <div className="space-y-4">
                  {profile.showFloors && (
                    <div className="space-y-2">
                      <Label>{profile.floorsLabel}</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.floorOptions.map((n) => (
                          <ChoiceChip
                            key={n}
                            selected={Number(form.floors) === n}
                            onClick={() => setField("floors", String(n))}
                          >
                            {floorChipLabel(n, showResidentialFloorLabels)}
                          </ChoiceChip>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.roomFields.length > 0 && (
                    <div className="rounded-md border px-3">
                      {profile.roomFields.map((fieldId) => (
                        <Counter
                          key={fieldId}
                          label={ROOM_FIELD_LABELS[fieldId]}
                          value={Number(form[fieldId]) || 0}
                          onChange={(n) => setField(fieldId, String(n))}
                          max={ROOM_COUNTER_MAX[fieldId] ?? 12}
                        />
                      ))}
                    </div>
                  )}
                  {profile.layoutHint ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {profile.layoutHint}
                    </p>
                  ) : null}
                </div>
              )}

              {step?.id === "finish" && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Finish standard</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {STANDARD_SECTION_INTRO}
                      </p>
                    </div>
                    <div className="overflow-hidden rounded-md border">
                      {standards.map((s) => {
                        const guide = getStandardGuide(s.slug || s.name, s.description);
                        const selected = form.standard === s.name;
                        return (
                          <div
                            key={s.slug}
                            className={cn(
                              "flex w-full items-start justify-between gap-3 border-b px-3 py-3 last:border-b-0",
                              "transition-colors hover:bg-muted/40",
                              selected && "bg-muted/60"
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => setField("standard", s.name)}
                              className="min-w-0 flex-1 space-y-1 text-left"
                            >
                              <span className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold">{s.name}</span>
                              </span>
                              <span className="block text-xs leading-relaxed text-muted-foreground">
                                {guide.summary}
                              </span>
                            </button>
                            <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                    aria-label={`What ${s.name} affects`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <CircleHelp className="h-4 w-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent
                                  align="end"
                                  side="top"
                                  className="z-[100] w-64 space-y-2 p-3 text-sm"
                                  onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                  <p className="font-semibold text-foreground">{s.name} — affects</p>
                                  <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                                    {guide.affects.map((tag) => (
                                      <li key={tag}>{tag}</li>
                                    ))}
                                  </ul>
                                  {guide.notAffected && (
                                    <p className="border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
                                      Usually unchanged: {guide.notAffected}
                                    </p>
                                  )}
                                </PopoverContent>
                              </Popover>
                              {selected && (
                                <Check className="h-4 w-4 text-foreground" aria-hidden />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Tip: pick <span className="font-medium text-foreground">Standard</span> if you are
                      unsure — you can refine finish grade with the contractor later.
                    </p>
                  </div>
                  {profile.showFoundation && foundationTypes.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label className="text-muted-foreground">Foundation type (optional)</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="rounded-full p-0.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                              aria-label="What is foundation type"
                            >
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            side="top"
                            className="z-[100] w-72 space-y-2.5 p-3 text-sm"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {FOUNDATION_SECTION_INTRO}
                            </p>
                            <ul className="space-y-2.5">
                              {foundationTypes.map((f) => {
                                const guide = FOUNDATION_GUIDE[f];
                                return (
                                  <li key={f} className="text-xs">
                                    <p className="font-semibold text-foreground">
                                      {FOUNDATION_LABELS[f] || f}
                                    </p>
                                    {guide && (
                                      <>
                                        <p className="mt-0.5 text-muted-foreground">{guide.summary}</p>
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                          Best for: {guide.bestFor}
                                        </p>
                                      </>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                            <p className="border-t pt-2 text-[11px] text-muted-foreground">
                              Unsure? Leave as Not specified — the estimate still works.
                            </p>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{FOUNDATION_SECTION_INTRO}</p>
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
                  {(profile.showStructure || profile.showSoil) && (
                    <details className="rounded-md border px-3 py-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Site details (optional)
                      </summary>
                      <div className="mt-3 grid gap-3 pb-1 sm:grid-cols-2">
                        {profile.showStructure && (
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
                                  {s === "rcc_frame"
                                    ? "RCC frame"
                                    : s === "load_bearing"
                                      ? "Load bearing"
                                      : s}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {profile.showSoil && (
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
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}

              {step?.id === "review" && (
                <dl className="divide-y rounded-md border text-sm">
                  {[
                    ["Project", form.constructionType || "—"],
                    ["City", form.city || "—"],
                    [
                      profile.areaLabel.replace(/\s*\(.*\)$/, ""),
                      `${Number(form.builtUpArea).toLocaleString("en-IN")} sqft${
                        profile.showFloors
                          ? ` · ${
                              showResidentialFloorLabels
                                ? `G+${Math.max(0, Number(form.floors) - 1)}`
                                : `${form.floors} level(s)`
                            }`
                          : ""
                      }`,
                    ],
                    ["Standard", form.standard || "—"],
                    ...(form.foundationType && profile.showFoundation
                      ? [["Foundation", FOUNDATION_LABELS[form.foundationType] || form.foundationType]]
                      : []),
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between gap-4 px-3 py-2.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                  {form.standard && (
                    <div className="px-3 py-2.5 text-xs text-muted-foreground">
                      {getStandardGuide(
                        standards.find((s) => s.name === form.standard)?.slug || form.standard,
                        standards.find((s) => s.name === form.standard)?.description
                      ).summary}
                    </div>
                  )}
                  {layoutSummary ? (
                    <div className="flex justify-between gap-4 px-3 py-2.5">
                      <dt className="text-muted-foreground">Layout</dt>
                      <dd className="text-right font-medium">{layoutSummary}</dd>
                    </div>
                  ) : null}
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
            {step?.id === "finish" && (
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
              ) : step?.id === "review" ? (
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
