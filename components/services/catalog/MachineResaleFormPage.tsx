"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { ServiceImageUpload } from "@/components/services/ServiceImageUpload";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { cn } from "@/lib/utils";
import {
  MACHINE_RESALE_FALLBACK_TYPES,
  buildMachineResaleServicePayload,
  isMachineResaleCategorySlug,
  type MachineResaleLocation,
} from "@/lib/machineResale";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: unknown;
}

async function fetchProviderSnapshot(userId: string): Promise<{
  businessAddress: MachineResaleLocation | null;
  primaryCategoryId: string | null;
  primarySubcategory: string[];
}> {
  let provider: Record<string, unknown> | null = null;
  const r1 = await api.providers.getByUserId(String(userId));
  if (r1.success && r1.data) {
    provider = ((r1.data as { provider?: unknown }).provider ?? r1.data) as Record<
      string,
      unknown
    >;
  }
  if (!provider) {
    const r2 = await api.providers.getById(String(userId), 0);
    if (r2.success && r2.data) {
      provider = ((r2.data as { provider?: unknown }).provider ?? r2.data) as Record<
        string,
        unknown
      >;
    }
  }

  const ba = provider?.businessAddress as Record<string, unknown> | undefined;
  let businessAddress: MachineResaleLocation | null = null;
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
  if (rawPrimary && typeof rawPrimary === "object" && rawPrimary !== null) {
    primaryCategoryId = String((rawPrimary as { _id?: unknown })._id ?? "") || null;
  } else if (rawPrimary) {
    primaryCategoryId = String(rawPrimary);
  }

  const rawSubs = provider?.primarySubcategory;
  const primarySubcategory = Array.isArray(rawSubs)
    ? rawSubs.map((s) => String(s).trim()).filter(Boolean)
    : typeof rawSubs === "string" && rawSubs.trim()
      ? [rawSubs.trim()]
      : [];

  return { businessAddress, primaryCategoryId, primarySubcategory };
}

export function MachineResaleFormPage({ serviceId }: { serviceId?: string } = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: kycStatus } = useProviderKycStatus();
  const isKycApproved = kycStatus === "KYC_APPROVED";
  const editMode = Boolean(serviceId);

  const [step, setStep] = useState<1 | 2>(1);
  const [category, setCategory] = useState<Category | null>(null);
  const [machineTypes, setMachineTypes] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [brandName, setBrandName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [price, setPrice] = useState("");
  const [availableUnits, setAvailableUnits] = useState("1");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [businessAddress, setBusinessAddress] = useState<MachineResaleLocation | null>(null);
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
          categories.find((c) => isMachineResaleCategorySlug(c.slug)) ||
          categories.find((c) => String(c._id) === String(snapshot.primaryCategoryId));

        if (match && isMachineResaleCategorySlug(match.slug)) {
          setCategory(match);
          const fromCategory = getSubcategoryNames(match.subcategories);
          const fromProfile = snapshot.primarySubcategory;
          const merged = (fromProfile.length > 0 ? fromProfile : fromCategory).filter(Boolean);
          setMachineTypes(
            merged.length > 0 ? merged : [...MACHINE_RESALE_FALLBACK_TYPES],
          );
        }

        if (serviceId) {
          const res = await api.services.getById(serviceId);
          if (cancelled) return;
          if (!res.success || !res.data) {
            toast({
              title: "Listing not found",
              description: "This machine resale listing could not be loaded.",
              variant: "destructive",
            });
            router.replace("/dashboard/provider/services");
            return;
          }
          const raw =
            (res.data as { service?: Record<string, unknown> }).service ?? res.data;
          const svc = raw as {
            title?: string;
            description?: string;
            brandName?: string;
            subcategory?: string;
            images?: string[];
            image?: string;
            price?: number;
            metadata?: Record<string, unknown>;
            location?: MachineResaleLocation;
          };
          const meta = svc.metadata && typeof svc.metadata === "object" ? svc.metadata : {};
          setTitle(String(svc.title || ""));
          setBrandName(String(svc.brandName || meta.machineModel || ""));
          setShortDescription(String(svc.description || "").trim());
          const sub = String(svc.subcategory || "").trim();
          setSubcategory(sub);
          if (sub) {
            setMachineTypes((prev) => (prev.includes(sub) ? prev : [...prev, sub]));
          }
          const imgs = Array.isArray(svc.images)
            ? svc.images.filter(Boolean).map(String)
            : svc.image
              ? [String(svc.image)]
              : [];
          setImages(imgs);
          setPrice(svc.price != null && Number(svc.price) > 0 ? String(svc.price) : "");
          const units = String(meta.availableUnits || meta.availableMachines || "1");
          setAvailableUnits(units);
          setYearOfManufacture(String(meta.yearOfManufacture || ""));
          setConditionNotes(String(meta.conditionNotes || ""));
          if (svc.location && (svc.location.address || svc.location.city)) {
            setBusinessAddress(svc.location);
          }
          if (sub) setStep(2);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, serviceId, router, toast]);

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
    if (!Number.isFinite(amount) || amount <= 0) {
      next.price = "Enter a valid selling price (₹)";
    }
    const units = Math.floor(Number(availableUnits));
    if (!Number.isFinite(units) || units < 1) {
      next.availableUnits = "Enter how many units you have for sale (at least 1)";
    } else if (units > 99) {
      next.availableUnits = "Maximum 99 units per listing";
    }
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
        : `${title.trim()} available for sale on Imagineering India.`;

      const payload = buildMachineResaleServicePayload({
        categoryId: category._id,
        categorySlug: category.slug,
        subcategory,
        title,
        brandName,
        description,
        images: allImages,
        price: parseFloat(price),
        availableUnits: Math.floor(Number(availableUnits)) || 1,
        yearOfManufacture,
        conditionNotes,
        location: businessAddress,
      });

      const response =
        editMode && serviceId
          ? await api.services.update(serviceId, payload)
          : await api.services.create(payload);

      if (response.success) {
        toast({
          title: editMode ? "Listing updated" : "Listing added",
          description: editMode
            ? "Your machine resale listing has been saved."
            : isKycApproved
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

  if (!category || !isMachineResaleCategorySlug(category.slug)) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 py-16 text-center">
        <p className="text-muted-foreground">
          Machines (resale) is not the primary category on your business profile.
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
            {editMode ? "Edit machine for sale" : "Add a machine for sale"}
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
              Pick the machine you want to sell. You can add more listings after this one.
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
                {subcategory} — fixed selling price and photos.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Change type
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resale-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
              placeholder={`e.g. ${subcategory} for sale`}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-model">Brand / model</Label>
            <Input
              id="resale-model"
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
            <Label htmlFor="resale-desc">Short description</Label>
            <Textarea
              id="resale-desc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Condition, hours used, papers, location…"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-price">
              Selling price (₹) <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground">Fixed price only — one amount for this listing.</p>
            <Input
              id="resale-price"
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setErrors((prev) => ({ ...prev, price: "" }));
              }}
              placeholder="e.g. 850000"
              className={errors.price ? "border-destructive" : ""}
            />
            {errors.price ? <p className="text-sm text-destructive">{errors.price}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-units">
              Units available <span className="text-destructive">*</span>
            </Label>
            <Input
              id="resale-units"
              type="number"
              min={1}
              max={99}
              step={1}
              value={availableUnits}
              onChange={(e) => {
                setAvailableUnits(e.target.value);
                setErrors((prev) => ({ ...prev, availableUnits: "" }));
              }}
              placeholder="e.g. 1"
              className={errors.availableUnits ? "border-destructive" : ""}
            />
            {errors.availableUnits ? (
              <p className="text-sm text-destructive">{errors.availableUnits}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-year">Year of manufacture (optional)</Label>
            <Input
              id="resale-year"
              value={yearOfManufacture}
              onChange={(e) => setYearOfManufacture(e.target.value)}
              placeholder="e.g. 2019"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resale-condition">Condition notes (optional)</Label>
            <Input
              id="resale-condition"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="e.g. Good working condition, recently serviced"
            />
          </div>

          <Button
            type="button"
            className="w-full"
            disabled={submitting}
            onClick={() => void handleSubmit()}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : editMode ? (
              "Save listing"
            ) : (
              "Add listing"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
