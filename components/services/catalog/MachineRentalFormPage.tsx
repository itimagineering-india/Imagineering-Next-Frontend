"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, ChevronLeft, Loader2, Plus, X } from "lucide-react";
import { ServiceImageUpload } from "@/components/services/ServiceImageUpload";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { cn } from "@/lib/utils";
import {
  MACHINE_RENTAL_FALLBACK_TYPES,
  MACHINE_RENTAL_SPEC_SUGGESTIONS,
  buildMachineRentalServicePayload,
  createMachineRentalSpecRow,
  isMachineRentalCategorySlug,
  type MachineRentalLocation,
  type MachineRentalSpecRow,
} from "@/lib/machineRental";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: unknown;
}

async function fetchProviderSnapshot(userId: string): Promise<{
  businessAddress: MachineRentalLocation | null;
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
  let businessAddress: MachineRentalLocation | null = null;
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

  const rawSubs = provider?.primarySubcategory;
  const primarySubcategory = Array.isArray(rawSubs)
    ? rawSubs.map((s) => String(s || "").trim()).filter(Boolean)
    : typeof rawSubs === "string" && rawSubs.trim()
      ? [rawSubs.trim()]
      : [];

  return { businessAddress, primaryCategoryId, primarySubcategory };
}

export function MachineRentalFormPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: kycStatus } = useProviderKycStatus();
  const isKycApproved = kycStatus === "KYC_APPROVED";

  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [machineTypes, setMachineTypes] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [priceType, setPriceType] = useState<"daily" | "hourly">("daily");
  const [price, setPrice] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [operatorIncluded, setOperatorIncluded] = useState(false);
  const [specs, setSpecs] = useState<MachineRentalSpecRow[]>([]);
  const [businessAddress, setBusinessAddress] = useState<MachineRentalLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

        const categories =
          catRes.success && catRes.data
            ? ((catRes.data as { categories?: Category[] }).categories || [])
            : [];
        const match =
          categories.find((c) => isMachineRentalCategorySlug(c.slug)) ||
          categories.find((c) => String(c._id) === String(snapshot.primaryCategoryId));

        if (match && isMachineRentalCategorySlug(match.slug)) {
          setCategory(match);
          const fromCategory = getSubcategoryNames(match.subcategories);
          const fromProfile = snapshot.primarySubcategory;
          const merged = (fromProfile.length > 0 ? fromProfile : fromCategory).filter(Boolean);
          setMachineTypes(
            merged.length > 0 ? merged : [...MACHINE_RENTAL_FALLBACK_TYPES],
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const goToDetails = useCallback((type: string) => {
    setSubcategory(type);
    setErrors({});
    setStep(2);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxSizeBytes = 10 * 1024 * 1024;
    const valid: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > maxSizeBytes) continue;
      if (!file.type.startsWith("image/")) continue;
      valid.push(file);
    }
    if (valid.length > 0) {
      setUploadedImages((prev) => [...prev, ...valid]);
    }
  };

  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "Enter a listing title";
    const amount = parseFloat(price);
    if (!Number.isFinite(amount) || amount <= 0) next.price = "Enter a valid rental price";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!category || !subcategory.trim()) return;
    if (!validateDetails()) return;

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      if (uploadedImages.length > 0) {
        const results = await Promise.all(
          uploadedImages.map((file) => api.services.uploadImage(file)),
        );
        uploadedUrls = results.map((res, i) => {
          if (!res.success || !res.data?.url) {
            throw new Error(res.error?.message || `Failed to upload image ${i + 1}`);
          }
          return res.data.url;
        });
      }

      const allImages = [...images, ...uploadedUrls];
      const description = shortDescription.trim()
        ? shortDescription.trim()
        : `${title.trim()} available for rent on Imagineering India.`;

      const response = await api.services.create(
        buildMachineRentalServicePayload({
          categoryId: category._id,
          categorySlug: category.slug,
          subcategory,
          title,
          brandName,
          description,
          images: allImages,
          priceType,
          price: parseFloat(price),
          securityDeposit,
          operatorIncluded,
          specs,
          location: businessAddress,
        }),
      );

      if (response.success) {
        toast({
          title: "Listing added",
          description: isKycApproved
            ? "It will be reviewed before going live."
            : "Saved as draft. Complete KYC to go live.",
        });
        router.push("/dashboard/provider/services");
      } else {
        toast({
          title: "Could not save",
          description: response.error?.message || "Please try again.",
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

  if (!category || !isMachineRentalCategorySlug(category.slug)) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 py-16 text-center">
        <p className="text-muted-foreground">
          Machine Rental is not the primary category on your business profile.
        </p>
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
        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 2 ? "Back to machine type" : "Back to my services"}
      </button>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Add a machine for rent
          </h1>
          <span className="text-sm text-muted-foreground shrink-0">Step {step} of 2</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-medium">Choose machine type</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Pick the machine you want to list. You can add more listings after this one.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {machineTypes.map((type) => {
              const selected = subcategory === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => goToDetails(type)}
                  className={cn(
                    "relative rounded-lg border px-3 py-4 text-left transition-all",
                    selected
                      ? "border-primary ring-1 ring-primary/25 bg-primary/5"
                      : "border-border hover:border-primary/40 bg-card",
                  )}
                >
                  <p className="text-sm font-medium leading-tight">{type}</p>
                  {selected ? (
                    <div className="absolute top-2 right-2 rounded-full bg-primary p-px text-primary-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">Listing details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {subcategory} — price and photos only. No weekly availability needed.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Change type
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rental-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder={`e.g. ${subcategory} with operator`}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-model">Brand / model</Label>
            <Input
              id="rental-model"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. JCB 3DX, CAT 320D"
            />
          </div>

          <ServiceImageUpload
            images={images}
            uploadedImages={uploadedImages}
            onImageUpload={handleImageUpload}
            onRemoveImageUrl={(index) => setImages((prev) => prev.filter((_, i) => i !== index))}
            onRemoveUploadedImage={(index) =>
              setUploadedImages((prev) => prev.filter((_, i) => i !== index))
            }
          />

          <div className="space-y-2">
            <Label htmlFor="rental-desc">Short description</Label>
            <Textarea
              id="rental-desc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Condition, capacity, where you deliver, operator notes…"
              rows={4}
            />
          </div>

          <div className="space-y-3">
            <Label>
              Rental rate <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "daily" as const, title: "Per day" },
                { value: "hourly" as const, title: "Per hour" },
              ]).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriceType(option.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition hover:border-primary/60",
                    priceType === option.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-background",
                  )}
                >
                  <span className="block font-medium">{option.title}</span>
                </button>
              ))}
            </div>
            <Input
              id="rental-price"
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setErrors((prev) => ({ ...prev, price: "" }));
              }}
              placeholder={priceType === "hourly" ? "Price per hour (₹)" : "Price per day (₹)"}
              className={errors.price ? "border-destructive" : ""}
            />
            {errors.price ? <p className="text-sm text-destructive">{errors.price}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rental-deposit">Security deposit (optional)</Label>
            <Input
              id="rental-deposit"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
              placeholder="e.g. ₹10,000 or 1 day rent"
            />
          </div>

          <div className="flex items-center space-x-2 rounded-lg border p-3">
            <Checkbox
              id="rental-operator"
              checked={operatorIncluded}
              onCheckedChange={(checked) => setOperatorIncluded(checked === true)}
            />
            <Label htmlFor="rental-operator" className="cursor-pointer font-normal">
              Operator included
            </Label>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label>Technical specifications</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Add Capacity, fuel type, year, or any other spec buyers should see.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => setSpecs((prev) => [...prev, createMachineRentalSpecRow()])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add information
              </Button>
            </div>

            {specs.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {MACHINE_RENTAL_SPEC_SUGGESTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSpecs((prev) => [...prev, createMachineRentalSpecRow(label)])}
                    className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                  >
                    + {label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {specs.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        placeholder="e.g. Capacity"
                        value={row.label}
                        onChange={(e) =>
                          setSpecs((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, label: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      <Input
                        placeholder="e.g. 20 ton, Diesel"
                        value={row.value}
                        onChange={(e) =>
                          setSpecs((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, value: e.target.value } : item,
                            ),
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setSpecs((prev) => prev.filter((item) => item.id !== row.id))}
                      aria-label="Remove specification"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  {MACHINE_RENTAL_SPEC_SUGGESTIONS.filter(
                    (label) => !specs.some((row) => row.label.toLowerCase() === label.toLowerCase()),
                  ).map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setSpecs((prev) => [...prev, createMachineRentalSpecRow(label)])}
                      className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 -mx-3 border-t bg-background/95 px-3 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-2xl gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
                disabled={submitting}
              >
                Back
              </Button>
              <Button className="flex-1" onClick={() => void handleSubmit()} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Add listing"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
