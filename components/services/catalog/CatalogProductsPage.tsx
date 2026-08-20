"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, ChevronLeft, FilePenLine, Loader2, Package } from "lucide-react";
import { MultiStepServiceForm } from "@/components/services/form";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";
import { filterSubcategoriesToProfile, getSubcategoryNames, normalizePrimarySubcategoryList } from "@/lib/categorySubcategories";
import {
  CONSTRUCTION_MATERIALS_CATALOG_SLUG,
  DEFAULT_CONSTRUCTION_MATERIAL_TYPES,
  isB2bMaterialSuppliersSubcategory,
  isConstructionMaterialsCategorySlug,
  usesSharedConstructionMaterialsCatalog,
} from "@/lib/constructionMaterials";
import { cn } from "@/lib/utils";
import { getSubcategoryImageUrl } from "@/lib/subcategoryImages";
import {
  buildServicePayloadFromCatalogProduct,
  type CatalogProductItem,
} from "@/lib/productCatalog";
import { ProductCatalogPicker } from "@/components/services/form/ProductCatalogPicker";
import type { ProviderBusinessAddressSnapshot } from "@/components/services/ServiceLocationInput";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: unknown;
}

export interface CatalogProductsPageProps {
  mode: "add" | "edit";
  serviceId?: string;
  initialSubcategory?: string;
  initialCatalogProductId?: string | null;
}

async function fetchProviderBusinessAddress(
  userId: string,
): Promise<ProviderBusinessAddressSnapshot | null> {
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
  if (!ba) return null;
  const addr = String(ba.address ?? "").trim();
  const city = String(ba.city ?? "").trim();
  const state = String(ba.state ?? "").trim();
  if (!addr && !city && !state) return null;
  const cr = ba.coordinates as Record<string, unknown> | undefined;
  const lat = Number(cr?.lat ?? cr?.latitude);
  const lng = Number(cr?.lng ?? cr?.longitude);
  return {
    address: addr,
    city,
    state,
    coordinates:
      Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
        ? { lat, lng }
        : undefined,
  };
}

export function CatalogProductsPage({
  mode,
  serviceId,
  initialSubcategory = "",
  initialCatalogProductId = null,
}: CatalogProductsPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { status: kycStatus } = useProviderKycStatus();
  const isKycApproved = kycStatus === "KYC_APPROVED";

  const [step, setStep] = useState<1 | 2>(mode === "edit" && initialSubcategory ? 2 : 1);
  const [category, setCategory] = useState<Category | null>(null);
  const [cmCategory, setCmCategory] = useState<Category | null>(null);
  const [profileSubcategories, setProfileSubcategories] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [materialType, setMaterialType] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<CatalogProductItem[]>([]);
  const [businessAddress, setBusinessAddress] = useState<ProviderBusinessAddressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ subcategory?: string; products?: string }>({});
  const [customFormOpen, setCustomFormOpen] = useState(false);

  const isEdit = mode === "edit";
  const isCm = isConstructionMaterialsCategorySlug(category?.slug);
  const needsCmTypePicker = usesSharedConstructionMaterialsCatalog(category?.slug, subcategory);

  const cmMaterialTypes = useMemo(() => {
    const names = getSubcategoryNames(cmCategory?.subcategories).filter(
      (n) => !isB2bMaterialSuppliersSubcategory(n) && !/equipment\s+vendor/i.test(n),
    );
    return names.length > 0 ? names : [...DEFAULT_CONSTRUCTION_MATERIAL_TYPES];
  }, [cmCategory]);

  useEffect(() => {
    if (!needsCmTypePicker || materialType || cmMaterialTypes.length !== 1) return;
    setMaterialType(cmMaterialTypes[0]);
  }, [needsCmTypePicker, materialType, cmMaterialTypes]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const userId = user?.id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const [catRes, providerRes] = await Promise.all([
          api.categories.getAll(true, { includeSubcategories: true }),
          fetchProviderBusinessAddress(String(userId)),
        ]);

        if (cancelled) return;
        setBusinessAddress(providerRes);

        if (!catRes.success || !catRes.data) {
          setLoading(false);
          return;
        }

        const categories =
          (catRes.data as { categories?: Category[] }).categories || [];

        let provider: Record<string, unknown> | null = null;
        const pr = await api.providers.getByUserId(String(userId));
        if (pr.success && pr.data) {
          provider = ((pr.data as { provider?: unknown }).provider ?? pr.data) as Record<
            string,
            unknown
          >;
        }

        const rawPrimary = provider?.primaryCategory;
        let primaryId: string | null = null;
        if (rawPrimary && typeof rawPrimary === "object" && "_id" in (rawPrimary as object)) {
          primaryId = String((rawPrimary as { _id?: unknown })._id ?? "");
        } else if (rawPrimary) {
          primaryId = String(rawPrimary);
        }

        const match = categories.find((c) => String(c._id) === String(primaryId));
        if (match) setCategory(match);
        const cm = categories.find((c) => isConstructionMaterialsCategorySlug(c.slug));
        if (cm) setCmCategory(cm);
        setProfileSubcategories(normalizePrimarySubcategoryList(provider?.primarySubcategory));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!isEdit || !initialCatalogProductId) return;
    let cancelled = false;
    api.productCatalog.getById(initialCatalogProductId).then((res) => {
      if (cancelled || !res.success) return;
      const product =
        (res.data as { product?: CatalogProductItem })?.product ?? res.data;
      if (product && typeof product === "object" && "_id" in product) {
        const item = product as CatalogProductItem;
        setSelectedProducts([item]);
        const fromProduct = String(item.subcategory || "").trim();
        if (fromProduct && !isB2bMaterialSuppliersSubcategory(fromProduct)) {
          setMaterialType(fromProduct);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, initialCatalogProductId]);

  const subcategories = useMemo(() => {
    if (!category) return [];
    return filterSubcategoriesToProfile(category.subcategories, profileSubcategories, {
      include: isEdit ? initialSubcategory : undefined,
    });
  }, [category, profileSubcategories, isEdit, initialSubcategory]);

  const handleToggleProduct = useCallback(
    (product: CatalogProductItem) => {
      setSelectedProducts((prev) => {
        const exists = prev.some((p) => p._id === product._id);
        if (exists) return prev.filter((p) => p._id !== product._id);
        if (isEdit) return [product];
        return [...prev, product];
      });
      setErrors((e) => ({ ...e, products: undefined }));
    },
    [isEdit],
  );

  const goToProducts = () => {
    if (!subcategory.trim()) {
      setErrors({ subcategory: isCm ? "Please select a material type" : "Please select a subcategory" });
      return;
    }
    setErrors({});
    setSelectedProducts([]);
    if (!usesSharedConstructionMaterialsCatalog(category?.slug, subcategory)) {
      setMaterialType("");
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!category || !subcategory.trim()) return;
    if (selectedProducts.length === 0) {
      setErrors({ products: "Select at least one product" });
      return;
    }

    setSubmitting(true);
    try {
      const location = businessAddress;

      if (isEdit && serviceId) {
        const product = selectedProducts[0];
        const payload = buildServicePayloadFromCatalogProduct(product, {
          categoryId: category._id,
          categorySlug: category.slug,
          subcategory,
          itemType: materialType,
          location,
        });
        const response = await api.services.update(serviceId, payload);
        if (response.success) {
          toast({ title: "Saved", description: "Product listing updated." });
          router.push("/dashboard/provider/services");
        } else {
          toast({
            title: "Error",
            description: response.error?.message || "Could not save",
            variant: "destructive",
          });
        }
        return;
      }

      const results = await Promise.all(
        selectedProducts.map((product) =>
          api.services.create(
            buildServicePayloadFromCatalogProduct(product, {
              categoryId: category._id,
              categorySlug: category.slug,
              subcategory,
              itemType: materialType,
              location,
            }),
          ),
        ),
      );

      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        toast({
          title: "Done",
          description:
            selectedProducts.length === 1
              ? isKycApproved
                ? "Product added. It will be reviewed before going live."
                : "Product saved as draft. Complete KYC to go live."
              : `${selectedProducts.length} products added.`,
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
          description: failed[0]?.error?.message || "Could not add products",
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

  if (!category) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-8 py-16 text-center">
        <p className="text-muted-foreground">
          This category is not set on your business profile.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/dashboard/provider/services")}>
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
          step === 2 && !isEdit ? setStep(1) : router.push("/dashboard/provider/services")
        }
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {step === 2 && !isEdit ? (isCm ? "Back to material type" : "Back to subcategory") : "Back to my services"}
      </button>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {isEdit ? "Change product" : "Add products you sell"}
          </h1>
          <span className="text-sm text-muted-foreground shrink-0">Step {step} of 2</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-medium">{isCm ? "Choose material type" : "Choose subcategory"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isCm
                ? "Material types from your Business Profile."
                : "Only the subcategories you selected on your Business Profile."}
            </p>
          </div>

          {subcategories.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center">
              <p className="text-sm font-medium">No subcategory on your Business Profile</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the types you sell there, then come back to add listings.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/provider/business-profile">Go to Business Profile</Link>
              </Button>
            </div>
          ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
            {subcategories.map((sub) => {
              const selected = subcategory === sub;
              const img = getSubcategoryImageUrl(category.slug, sub);
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSubcategory(sub);
                    setMaterialType("");
                    setErrors((e) => ({ ...e, subcategory: undefined }));
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border text-left transition-all",
                    selected
                      ? "border-primary ring-1 ring-primary/25"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div className="aspect-[5/3] overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <p className="text-xs font-medium leading-tight line-clamp-2">{sub}</p>
                  </div>
                  {selected && (
                    <div className="absolute top-1 right-1 rounded-full bg-primary p-px text-primary-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          )}

          {errors.subcategory && (
            <p className="text-sm text-destructive">{errors.subcategory}</p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
            {!isEdit && subcategories.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setCustomFormOpen(true)}
              >
                <FilePenLine className="mr-2 h-4 w-4" />
                Can&apos;t find it? Add a custom listing
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={goToProducts} disabled={!subcategory.trim() || subcategories.length === 0} className="min-w-[120px]">
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-medium">
                {needsCmTypePicker && !materialType
                  ? "Choose material type"
                  : isEdit
                    ? "Pick product"
                    : "Select products"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {needsCmTypePicker && !materialType
                  ? "Construction materials from the shared catalog."
                  : `${needsCmTypePicker && materialType ? materialType : subcategory}${
                      !isEdit ? " — tap all products you sell" : ""
                    }`}
              </p>
            </div>
            {!isEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (needsCmTypePicker && materialType) {
                    setMaterialType("");
                    setSelectedProducts([]);
                    return;
                  }
                  setStep(1);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {needsCmTypePicker && materialType
                  ? "Change type"
                  : `Change ${isCm ? "type" : "subcategory"}`}
              </Button>
            )}
          </div>

          {needsCmTypePicker && !materialType ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
              {cmMaterialTypes.map((type) => {
                const img = getSubcategoryImageUrl(CONSTRUCTION_MATERIALS_CATALOG_SLUG, type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setMaterialType(type);
                      setSelectedProducts([]);
                      setErrors((e) => ({ ...e, products: undefined }));
                    }}
                    className="group relative overflow-hidden rounded-lg border border-border text-left transition-all hover:border-primary/40"
                  >
                    <div className="aspect-[5/3] overflow-hidden bg-muted">
                      <img
                        src={img}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium leading-tight line-clamp-2">{type}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <ProductCatalogPicker
              categorySlug={needsCmTypePicker ? CONSTRUCTION_MATERIALS_CATALOG_SLUG : category.slug}
              subcategory={needsCmTypePicker ? materialType : subcategory}
              multiple
              selectedProductIds={selectedProducts.map((p) => p._id)}
              onToggleProduct={handleToggleProduct}
              catalogOnlyMode
              layout="grid"
            />
          )}

          {errors.products && (
            <p className="text-sm text-destructive">{errors.products}</p>
          )}

          {!(needsCmTypePicker && !materialType) ? (
            <div className="sticky bottom-0 -mx-3 border-t bg-background/95 px-3 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <div className="flex gap-3">
              {!isEdit && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (needsCmTypePicker && materialType) {
                      setMaterialType("");
                      setSelectedProducts([]);
                      return;
                    }
                    setStep(1);
                  }}
                  disabled={submitting}
                >
                  Back
                </Button>
              )}
              {!isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground hidden sm:inline-flex"
                  onClick={() => setCustomFormOpen(true)}
                  disabled={submitting}
                >
                  <FilePenLine className="mr-2 h-4 w-4" />
                  Custom listing
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitting || selectedProducts.length === 0}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : isEdit ? (
                  "Save"
                ) : selectedProducts.length > 0 ? (
                  `Add ${selectedProducts.length} product${selectedProducts.length === 1 ? "" : "s"}`
                ) : (
                  "Add products"
                )}
              </Button>
            </div>
            </div>
          ) : null}
        </div>
      )}

      {category && !isEdit ? (
        <MultiStepServiceForm
          open={customFormOpen}
          onOpenChange={setCustomFormOpen}
          categories={[category]}
          providerPrimaryCategoryId={category._id}
          onSuccess={() => {
            setCustomFormOpen(false);
            router.push("/dashboard/provider/services");
          }}
          initialData={
            subcategory.trim()
              ? {
                  category: category._id,
                  subcategory,
                }
              : { category: category._id }
          }
        />
      ) : null}
    </div>
  );
}
