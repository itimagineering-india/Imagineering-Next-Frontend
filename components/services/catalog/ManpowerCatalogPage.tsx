"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Check, CheckCircle2, ChevronLeft, Loader2, Search } from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ManpowerServiceOfferPreset } from "@/config/manpowerServiceOfferPresets";
import {
  buildServicePayloadFromManpowerTask,
  getManpowerTasksForWorker,
  isManpowerCategorySlug,
  normalizePrimarySubcategoryLabels,
  resolveManpowerWorkerTypesForProfile,
  type ManpowerCatalogLocation,
  type ManpowerWorkerTypeOption,
} from "@/lib/manpowerCatalog";
import type { ProviderBusinessAddressSnapshot } from "@/components/services/ServiceLocationInput";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: unknown;
}

async function fetchProviderSnapshot(userId: string): Promise<{
  businessAddress: ProviderBusinessAddressSnapshot | null;
  primaryCategoryId: string | null;
  primarySubcategory: string[];
}> {
  let provider: Record<string, unknown> | null = null;
  const r1 = await api.providers.getByUserId(String(userId));
  if (r1.success && r1.data) {
    provider = ((r1.data as { provider?: unknown }).provider ?? r1.data) as Record<string, unknown>;
  }
  if (!provider) {
    const r2 = await api.providers.getById(String(userId), 0);
    if (r2.success && r2.data) {
      provider = ((r2.data as { provider?: unknown }).provider ?? r2.data) as Record<string, unknown>;
    }
  }

  const ba = provider?.businessAddress as Record<string, unknown> | undefined;
  let businessAddress: ProviderBusinessAddressSnapshot | null = null;
  if (ba) {
    const addr = String(ba.address ?? "").trim();
    const city = String(ba.city ?? "").trim();
    const state = String(ba.state ?? "").trim();
    if (addr || city || state) {
      const cr = ba.coordinates as Record<string, unknown> | undefined;
      const lat = Number(cr?.lat ?? cr?.latitude);
      const lng = Number(cr?.lng ?? cr?.longitude);
      businessAddress = {
        address: addr,
        city,
        state,
        coordinates:
          Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
            ? { lat, lng }
            : undefined,
      };
    }
  }

  const rawPrimary = provider?.primaryCategory;
  let primaryCategoryId: string | null = null;
  if (rawPrimary && typeof rawPrimary === "object" && "_id" in (rawPrimary as object)) {
    primaryCategoryId = String((rawPrimary as { _id?: unknown })._id ?? "");
  } else if (rawPrimary) {
    primaryCategoryId = String(rawPrimary);
  }

  return {
    businessAddress,
    primaryCategoryId,
    primarySubcategory: normalizePrimarySubcategoryLabels(provider?.primarySubcategory),
  };
}

export function ManpowerCatalogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: kycStatus } = useProviderKycStatus();
  const isKycApproved = kycStatus === "KYC_APPROVED";

  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [profileSubcategories, setProfileSubcategories] = useState<string[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<ManpowerWorkerTypeOption | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<ManpowerServiceOfferPreset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessAddress, setBusinessAddress] = useState<ManpowerCatalogLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ worker?: string; tasks?: string }>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const userId = user?.id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const [catRes, snapshot] = await Promise.all([
          api.categories.getAll(true, { includeSubcategories: true }),
          fetchProviderSnapshot(String(userId)),
        ]);

        if (cancelled) return;
        setBusinessAddress(snapshot.businessAddress);
        setProfileSubcategories(snapshot.primarySubcategory);

        if (!catRes.success || !catRes.data) {
          setLoading(false);
          return;
        }

        const categories =
          (catRes.data as { categories?: Category[] }).categories || [];
        const match =
          categories.find((c) => String(c._id) === String(snapshot.primaryCategoryId)) ||
          categories.find((c) => isManpowerCategorySlug(c.slug));
        if (match) setCategory(match);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const workerTypes = useMemo(
    () => resolveManpowerWorkerTypesForProfile(profileSubcategories),
    [profileSubcategories],
  );

  // Single profile subcategory → skip picker
  useEffect(() => {
    if (loading || step !== 1) return;
    if (workerTypes.length !== 1) return;
    const only = workerTypes[0];
    if (!only) return;
    setSelectedWorker(only);
    setSelectedTasks([]);
    setSearchQuery("");
    setStep(2);
  }, [loading, step, workerTypes]);

  const workerTypeKey = selectedWorker?.key || "";
  const tasks = useMemo(() => getManpowerTasksForWorker(workerTypeKey), [workerTypeKey]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (task) =>
        task.label.toLowerCase().includes(q) || task.id.toLowerCase().includes(q),
    );
  }, [searchQuery, tasks]);

  const selectedIds = useMemo(() => new Set(selectedTasks.map((t) => t.id)), [selectedTasks]);

  const workerLabel = selectedWorker?.label || workerTypeKey;

  const goToTasks = useCallback((option: ManpowerWorkerTypeOption) => {
    setSelectedWorker(option);
    setSelectedTasks([]);
    setSearchQuery("");
    setErrors({});
    setStep(2);
  }, []);

  const toggleTask = useCallback((task: ManpowerServiceOfferPreset) => {
    setSelectedTasks((prev) => {
      const exists = prev.some((x) => x.id === task.id);
      if (exists) return prev.filter((x) => x.id !== task.id);
      return [...prev, task];
    });
    setErrors((e) => ({ ...e, tasks: undefined }));
  }, []);

  const handleSubmit = async () => {
    if (!category || !selectedWorker) return;
    if (selectedTasks.length === 0) {
      setErrors({ tasks: "Select at least one task" });
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.all(
        selectedTasks.map((task) =>
          api.services.create(
            buildServicePayloadFromManpowerTask(task, {
              categoryId: category._id,
              workerTypeKey: selectedWorker.key,
              profileLabel: selectedWorker.label,
              location: businessAddress,
            }),
          ),
        ),
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        toast({
          title: "Done",
          description:
            selectedTasks.length === 1
              ? isKycApproved
                ? "Service added. It will be reviewed before going live."
                : "Service saved as draft. Complete KYC to go live."
              : `${selectedTasks.length} services added.`,
        });
        router.push("/dashboard/provider/services");
      } else if (failed.length < results.length) {
        toast({
          title: "Partially saved",
          description: `${results.length - failed.length} of ${results.length} added.`,
          variant: "destructive",
        });
        router.push("/dashboard/provider/services");
      } else {
        toast({
          title: "Error",
          description: failed[0]?.error?.message || "Could not add services",
          variant: "destructive",
        });
      }
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const progress = step === 1 ? 50 : 100;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!category || !isManpowerCategorySlug(category.slug)) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 py-16 text-center">
        <p className="text-muted-foreground">Manpower category not found on your profile.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/provider/services")}
        >
          Back to services
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 min-w-0">
      <button
        type="button"
        onClick={() =>
          step === 2 ? setStep(1) : router.push("/dashboard/provider/services")
        }
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 2 ? "Back to worker type" : "Back to my services"}
      </button>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Add services you offer
          </h1>
          <span className="text-sm text-muted-foreground shrink-0">Step {step} of 2</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-medium">Choose worker type</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Only subcategories from your business profile are listed. Tap one to continue.
            </p>
          </div>

          {workerTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {profileSubcategories.length === 0
                ? "No subcategories on your business profile. Open Business Profile and select the worker types you offer."
                : "No worker types available."}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {workerTypes.map((option) => {
                const selected =
                  selectedWorker?.key === option.key && selectedWorker?.label === option.label;
                return (
                  <button
                    key={`${option.key}-${option.label}`}
                    type="button"
                    onClick={() => goToTasks(option)}
                    className={cn(
                      "relative rounded-lg border px-3 py-4 text-left transition-all",
                      selected
                        ? "border-primary ring-1 ring-primary/25 bg-primary/5"
                        : "border-border hover:border-primary/40 bg-card",
                    )}
                  >
                    <p className="text-sm font-medium leading-tight">{option.label}</p>
                    {selected && (
                      <div className="absolute top-2 right-2 rounded-full bg-primary p-px text-primary-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {errors.worker && <p className="text-sm text-destructive">{errors.worker}</p>}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Select tasks</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {workerLabel} — tap all tasks you offer
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Change type
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks"
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {searchQuery.trim()
                  ? "No tasks match your search."
                  : "No tasks for this worker type."}
              </p>
            ) : (
              filteredTasks.map((task) => {
                const selected = selectedIds.has(task.id);
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 bg-card",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40",
                      )}
                    >
                      {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="text-sm font-medium">{task.label}</span>
                  </button>
                );
              })
            )}
          </div>

          {errors.tasks && <p className="text-sm text-destructive">{errors.tasks}</p>}

          <div className="sticky bottom-0 -mx-3 border-t bg-background/95 px-3 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => void handleSubmit()}
                disabled={submitting || selectedTasks.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : selectedTasks.length > 0 ? (
                  `Add ${selectedTasks.length} service${selectedTasks.length === 1 ? "" : "s"}`
                ) : (
                  "Add services"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
