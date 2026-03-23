"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, CheckCircle2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CategorySelector } from "./CategorySelector";
import { SubCategorySelector } from "./SubCategorySelector";
import { CommonFields, BRAND_NAME_CATEGORY_SLUGS } from "./CommonFields";
import { DynamicFieldsRenderer } from "./DynamicFieldsRenderer";
import { PricingSection } from "./PricingSection";
import { SubmitReview } from "./SubmitReview";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";
import { getDynamicFields } from "@/config/serviceFields";
import api from "@/lib/api-client";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: string[];
}

interface Location {
  address: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Availability {
  days: string[];
  timeSlots: {
    start: string;
    end: string;
  }[];
}

interface ServiceFormData {
  // Step 1
  category: string;
  subcategory: string;
  
  // Step 2 - Common Fields
  title: string;
  brandName: string;
  shortDescription: string;
  detailedDescription: string;
  /** Skills (Manpower & Technical Manpower only); multiple allowed */
  skills: string[];
  images: string[];
  uploadedImages: File[];
  location: Location;
  
  // Step 3 - Pricing
  pricingType: "fixed" | "hourly" | "daily" | "per_minute" | "per_article" | "monthly" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip" | "per_cuft" | "per_cum" | "per_metre" | "per_bag" | "lumpsum" | "per_project" | "negotiable";
  startingPrice: string;
  availability: Availability;
  
  // Step 4 - Dynamic Fields
  dynamicData: Record<string, any>;
  
  // Step 5 - Contact & Visibility
  contactMode: "platform" | "direct";
  visibility: "normal" | "featured";
}

interface MultiStepServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess: () => void;
  editMode?: boolean;
  serviceId?: string; // Service ID for edit mode
  initialData?: Partial<ServiceFormData>;
  adminMode?: boolean; // Admin mode - allows selecting provider
  selectedProviderId?: string; // Provider ID for admin mode
  onProviderChange?: (providerId: string) => void; // Callback for provider selection
  onProviderCreated?: (providerId: string) => void; // Callback when new provider is created
  availableUsers?: any[]; // Available users/providers for admin mode
}

const STEPS = [
  { id: 1, title: "Category", description: "Select category and subcategory" },
  { id: 2, title: "Basic Info", description: "Service details and location" },
  { id: 3, title: "Pricing", description: "Pricing and availability" },
  { id: 4, title: "Additional", description: "Category-specific fields" },
  { id: 5, title: "Settings", description: "Contact and visibility" },
  { id: 6, title: "Review", description: "Review and submit" },
];

export function MultiStepServiceForm({
  open,
  onOpenChange,
  categories,
  onSuccess,
  editMode = false,
  serviceId,
  initialData,
  adminMode = false,
  selectedProviderId = "",
  onProviderChange,
  availableUsers = [],
  onProviderCreated,
}: MultiStepServiceFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateProviderDialog, setShowCreateProviderDialog] = useState(false);
  const [newProviderData, setNewProviderData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const { toast } = useToast();
  const { status: kycStatus } = useProviderKycStatus();
  const isKycApproved = kycStatus === "KYC_APPROVED";

  const [formData, setFormData] = useState<ServiceFormData>({
    category: "",
    subcategory: "",
    title: "",
    brandName: "",
    shortDescription: "",
    detailedDescription: "",
    images: [],
    uploadedImages: [],
    location: {
      address: "",
      city: "",
      state: "",
      coordinates: { lat: 0, lng: 0 },
    },
    pricingType: "fixed",
    startingPrice: "",
    availability: {
      days: [],
      timeSlots: [{ start: "09:00", end: "18:00" }],
    },
    dynamicData: {},
    contactMode: "platform",
    visibility: "normal",
    ...initialData,
    skills: (initialData?.skills ?? []) as string[],
  });

  const [errors, setErrors] = useState<Record<string, any>>({});

  // Reset form when dialog closes or initialData changes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setSkillInput("");
      setFormData({
        category: "",
        subcategory: "",
        title: "",
        brandName: "",
        shortDescription: "",
        detailedDescription: "",
        skills: [],
        images: [],
        uploadedImages: [],
        location: {
          address: "",
          city: "",
          state: "",
          coordinates: { lat: 0, lng: 0 },
        },
        pricingType: "fixed",
        startingPrice: "",
        availability: {
          days: [],
          timeSlots: [{ start: "09:00", end: "18:00" }],
        },
        dynamicData: {},
        contactMode: "platform",
        visibility: "normal",
      });
      setErrors({});
      setAgreedToTerms(false);
    } else if (open && initialData) {
      // When dialog opens with initialData (edit mode), populate form
      setFormData({
        category: initialData.category || "",
        subcategory: initialData.subcategory || "",
        title: initialData.title || "",
        brandName: initialData.brandName || "",
        shortDescription: initialData.shortDescription || "",
        detailedDescription: initialData.detailedDescription || "",
        skills: initialData.skills ?? (Array.isArray((initialData as any).tags) ? (initialData as any).tags : []),
        images: initialData.images || [],
        uploadedImages: initialData.uploadedImages || [],
        location: initialData.location || {
          address: "",
          city: "",
          state: "",
          coordinates: { lat: 0, lng: 0 },
        },
        pricingType: initialData.pricingType || "fixed",
        startingPrice: initialData.startingPrice || "",
        availability: initialData.availability || {
          days: [],
          timeSlots: [{ start: "09:00", end: "18:00" }],
        },
        dynamicData: initialData.dynamicData || {},
        contactMode: initialData.contactMode || "platform",
        visibility: initialData.visibility || "normal",
      });
      setCurrentStep(1);
      setErrors({});
      setAgreedToTerms(false);
    }
  }, [open, initialData]);

  const selectedCategory = useMemo(() => {
    if (!formData.category || categories.length === 0) return null;
    return categories.find((cat) => String(cat._id) === String(formData.category)) || null;
  }, [formData.category, categories]);

  const availableSubcategories = useMemo(() => {
    if (!selectedCategory || !selectedCategory.subcategories) return [];
    return Array.isArray(selectedCategory.subcategories) ? selectedCategory.subcategories.filter(Boolean) : [];
  }, [selectedCategory]);

  // Step 4 (Additional) only shown when this category has dynamic fields
  const hasStep4DynamicFields = useMemo(() => {
    const slug = selectedCategory?.slug ?? "";
    const fields = getDynamicFields(slug, formData.subcategory ?? "");
    return fields.length > 0;
  }, [selectedCategory?.slug, formData.subcategory]);

  // Step 5 (Contact & Visibility) removed for all – defaults used. Step 4 only when category has dynamic fields.
  const visibleStepIds = useMemo(
    () => (hasStep4DynamicFields ? [1, 2, 3, 4, 6] : [1, 2, 3, 6]),
    [hasStep4DynamicFields]
  );

  const currentStepIndex = visibleStepIds.indexOf(currentStep) + 1;
  const progress = (currentStepIndex / visibleStepIds.length) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, any> = {};

    switch (step) {
      case 1:
        if (adminMode && !selectedProviderId) {
          newErrors.provider = "Please select an account/provider";
        }
        if (!formData.category) {
          newErrors.category = "Please select a category";
        }
        break;

      case 2:
        if (!formData.title.trim()) {
          newErrors.title = "Service title is required";
        }
        if (!formData.shortDescription.trim()) {
          newErrors.shortDescription = "Short description is required";
        }
        break;

      case 3:
        if (!formData.pricingType) {
          newErrors.pricingType = "Please select a pricing type";
        }
        if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
          newErrors.startingPrice = "Please enter a valid starting price";
        }
        break;

      case 4:
        if (
          (selectedCategory?.slug === "manpower" && formData.subcategory === "Technical Manpower") ||
          selectedCategory?.slug === "technical-manpower"
        ) {
          const resumeVal = formData.dynamicData?.resumeOrDocument;
          const hasFile = resumeVal instanceof File;
          const hasExistingUrl = initialData?.dynamicData?.resumeUrl || (typeof resumeVal === "string" && resumeVal?.startsWith("http"));
          if (!hasFile && !hasExistingUrl) {
            newErrors.dynamicData = { ...(newErrors.dynamicData || {}), resumeOrDocument: "Resume or document is required" };
          }
        }
        break;

      case 6:
        if (!agreedToTerms) {
          newErrors.agreedToTerms = "You must agree to the terms and conditions";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const idx = visibleStepIds.indexOf(currentStep);
      if (idx >= 0 && idx < visibleStepIds.length - 1) {
        setCurrentStep(visibleStepIds[idx + 1]);
      }
    }
  };

  const handlePrevious = () => {
    const idx = visibleStepIds.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(visibleStepIds[idx - 1]);
    }
  };

  const handleCreateProvider = async () => {
    if (!newProviderData.name || !newProviderData.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingProvider(true);
    try {
      // Create user with provider role
      const response = await api.auth.register({
        name: newProviderData.name,
        email: newProviderData.email,
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + "A1!", // Generate random password with requirements
        role: "provider",
        phone: newProviderData.phone || undefined,
      });

      const data = response.data as { user?: { id: string } } | undefined;
      if (response.success && data?.user) {
        const newUserId = data.user.id;
        onProviderChange?.(newUserId);
        setShowCreateProviderDialog(false);
        setNewProviderData({ name: "", email: "", phone: "" });
        toast({
          title: "Success",
          description: "New provider account created successfully. You can now add services for this provider.",
        });
        // Notify parent to refresh users list
        onProviderCreated?.(newUserId);
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to create provider account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create provider account",
        variant: "destructive",
      });
    } finally {
      setIsCreatingProvider(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) {
      setCurrentStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload new images to S3/CDN in parallel (was sequential – major delay with multiple images)
      let uploadedUrls: string[] = [];
      if (formData.uploadedImages.length > 0) {
        const results = await Promise.all(
          formData.uploadedImages.map((file) => api.services.uploadImage(file))
        );
        const urls: string[] = [];
        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          if (res.success && res.data?.url) {
            urls.push(res.data.url);
          } else {
            throw new Error(res.error?.message || `Failed to upload image ${i + 1}`);
          }
        }
        uploadedUrls = urls;
      }

      // Combine all images (existing URLs + newly uploaded CDN URLs)
      const allImages = [
        ...formData.images,
        ...uploadedUrls,
      ];

      // Combine short and detailed description
      const fullDescription = formData.shortDescription
        ? `${formData.shortDescription}\n\n${formData.detailedDescription}`
        : formData.detailedDescription;

      // Technical Manpower: upload resume/document to bucket (both manpower subcategory and technical-manpower category)
      let resumeUrl: string | undefined;
      const isTechnicalManpower =
        (selectedCategory?.slug === "manpower" && formData.subcategory === "Technical Manpower") ||
        selectedCategory?.slug === "technical-manpower";
      if (isTechnicalManpower) {
        const resumeVal = formData.dynamicData?.resumeOrDocument;
        const existingUrl = formData.dynamicData?.resumeUrl;
        if (resumeVal instanceof File) {
          const docRes = await api.services.uploadDocument(resumeVal);
          if (!docRes.success || !docRes.data?.url) {
            throw new Error(docRes.error?.message || "Failed to upload resume/document");
          }
          resumeUrl = docRes.data.url;
        } else if (typeof existingUrl === "string" && existingUrl.startsWith("http")) {
          resumeUrl = existingUrl;
        }
      }

      // Exclude File and internal fields from dynamicData before spreading (File cannot be JSON serialized)
      const { resumeOrDocument: _rd, resumeUrl: _ru, ...restDynamicData } = formData.dynamicData || {};

      const isManpowerOrTechnical =
        selectedCategory?.slug === "manpower" || selectedCategory?.slug === "technical-manpower";
      const servicePayload: any = {
        title: formData.title,
        description: fullDescription,
        ...(formData.brandName?.trim() && { brandName: formData.brandName.trim() }),
        category: formData.category,
        subcategory: formData.subcategory || "",
        price: parseFloat(formData.startingPrice),
        priceType: formData.pricingType, // Already using correct enum values
        deliveryTime: "1-2 days", // Default, can be enhanced
        featured: formData.visibility === "featured",
        ...(isManpowerOrTechnical && { tags: formData.skills ?? [] }),
        ...restDynamicData,
      };

      if (resumeUrl) {
        servicePayload.resumeUrl = resumeUrl;
      }

      // If admin mode, include provider ID
      if (adminMode && selectedProviderId) {
        servicePayload.provider = selectedProviderId;
      }

      if (allImages.length > 0) {
        servicePayload.image = allImages[0];
        servicePayload.images = allImages;
      }

      if (formData.location.address || formData.location.city) {
        servicePayload.location = {
          address: formData.location.address,
          city: formData.location.city,
          state: formData.location.state,
          coordinates: formData.location.coordinates?.lat !== 0 && formData.location.coordinates?.lng !== 0
            ? formData.location.coordinates
            : undefined,
        };
      }

      // Determine service status based on KYC
      // If KYC not approved, service will be saved as draft/pending
      // Backend should handle this, but we can add a flag if needed

      const response = editMode && serviceId
        ? await api.services.update(serviceId, servicePayload)
        : await api.services.create(servicePayload);

      if (response.success) {
        toast({
          title: "Success",
          description: editMode
            ? "Service updated successfully!"
            : isKycApproved
            ? "Service created successfully! It will be reviewed before going live."
            : "Service saved as draft. Complete KYC verification to make it live.",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.error?.message || (editMode ? "Failed to update service" : "Failed to create service"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Service creation error:", error);
      const msg = error?.message || "";
      const friendlyMessage =
        msg.includes("not valid JSON") || msg.includes("Unexpected token")
          ? "Server error. Please try again in a moment."
          : msg || "Failed to create service";
      toast({
        title: "Error",
        description: friendlyMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {adminMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Select Account/Provider *</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateProviderDialog(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create New
                  </Button>
                </div>
                <select
                  className={`w-full px-3 py-2 border rounded-md ${errors.provider ? 'border-destructive' : ''}`}
                  value={selectedProviderId}
                  onChange={(e) => {
                    onProviderChange?.(e.target.value);
                    if (errors.provider) {
                      setErrors({ ...errors, provider: undefined });
                    }
                  }}
                  required
                >
                  <option value="">Select an account</option>
                  {availableUsers.map((user) => (
                    <option key={user._id || user.id} value={user._id || user.id}>
                      {user.name || user.email || `User ${user._id || user.id}`}
                    </option>
                  ))}
                </select>
                {errors.provider && (
                  <p className="text-sm text-destructive">{errors.provider}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Can't find the provider? Click "Create New" to add a new account.
                </p>
              </div>
            )}
            <CategorySelector
              categories={categories}
              selectedCategoryId={formData.category}
              onCategoryChange={(categoryId) => {
                setFormData({ ...formData, category: categoryId, subcategory: "" });
                setErrors({ ...errors, category: undefined });
              }}
              error={errors.category}
            />
            {selectedCategory ? (
              <SubCategorySelector
                subcategories={availableSubcategories}
                selectedSubcategory={formData.subcategory}
                onSubcategoryChange={(subcategory) => {
                  setFormData({ ...formData, subcategory });
                }}
                categoryName={selectedCategory.name}
              />
            ) : (
              <div className="space-y-2">
                <Label htmlFor="subcategory">
                  Subcategory <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="subcategory"
                  placeholder="Enter subcategory (optional)"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  You can enter a subcategory manually. Select a category first for predefined options.
                </p>
              </div>
            )}
          </div>
        );

      case 2: {
        const showSkillsField =
          selectedCategory?.slug === "manpower" || selectedCategory?.slug === "technical-manpower";
        return (
          <div className="space-y-6">
            <CommonFields
              title={formData.title}
              brandName={formData.brandName}
              showBrandName={selectedCategory ? BRAND_NAME_CATEGORY_SLUGS.includes(selectedCategory.slug) : false}
              shortDescription={formData.shortDescription}
              detailedDescription={formData.detailedDescription}
              images={formData.images}
              uploadedImages={formData.uploadedImages}
              location={formData.location}
              onTitleChange={(value) => {
                setFormData({ ...formData, title: value });
                setErrors({ ...errors, title: undefined });
              }}
              onBrandNameChange={(value) => setFormData({ ...formData, brandName: value })}
              onShortDescriptionChange={(value) => {
                setFormData({ ...formData, shortDescription: value });
                setErrors({ ...errors, shortDescription: undefined });
              }}
              onDetailedDescriptionChange={(value) => {
                setFormData({ ...formData, detailedDescription: value });
                setErrors({ ...errors, detailedDescription: undefined });
              }}
              onImageUpload={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              const maxSizeBytes = 10 * 1024 * 1024; // 10MB (must match backend)

              const validFiles: File[] = [];
              const rejectedMessages: string[] = [];

              Array.from(files).forEach((file) => {
                const isImage = !file.type || file.type.startsWith("image/");
                if (!isImage) {
                  rejectedMessages.push(
                    `${file.name}: Unsupported file type (${file.type || "unknown"}). Please upload image files only.`
                  );
                  return;
                }
                if (file.size > maxSizeBytes) {
                  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
                  rejectedMessages.push(
                    `${file.name}: Too large (${sizeMb} MB). Max size is 10 MB.`
                  );
                  return;
                }
                validFiles.push(file);
              });

              if (rejectedMessages.length > 0) {
                toast({
                  title: "Image upload issue",
                  description: rejectedMessages.join(" "),
                  variant: "destructive",
                });
              }

              if (validFiles.length === 0) return;

              setFormData({
                ...formData,
                uploadedImages: [...formData.uploadedImages, ...validFiles],
              });
            }}
            onRemoveImageUrl={(index) => {
              setFormData({
                ...formData,
                images: formData.images.filter((_, i) => i !== index),
              });
            }}
            onRemoveUploadedImage={(index) => {
              setFormData({
                ...formData,
                uploadedImages: formData.uploadedImages.filter((_, i) => i !== index),
              });
            }}
            onLocationChange={(location) => {
              setFormData({ ...formData, location });
            }}
            onClearLocation={() => {
              setFormData({
                ...formData,
                location: {
                  address: "",
                  city: "",
                  state: "",
                  coordinates: { lat: 0, lng: 0 },
                },
              });
            }}
            isGettingLocation={isGettingLocation}
            onGettingLocationChange={setIsGettingLocation}
            errors={errors}
          />
          {showSkillsField && (
            <div className="space-y-2">
              <Label htmlFor="skills">Skills <span className="text-muted-foreground">(Optional)</span></Label>
              <p className="text-xs text-muted-foreground">
                Add one or more skills. Type and press Enter or click Add.
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  id="skills"
                  placeholder="e.g., Plumbing, Electrical, Carpentry"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const v = skillInput.trim();
                      const skills = formData.skills ?? [];
                      if (v && !skills.includes(v)) {
                        setFormData({ ...formData, skills: [...skills, v] });
                        setSkillInput("");
                      }
                    }
                  }}
                  className="max-w-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const v = skillInput.trim();
                    const skills = formData.skills ?? [];
                    if (v && !skills.includes(v)) {
                      setFormData({ ...formData, skills: [...skills, v] });
                      setSkillInput("");
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {(formData.skills?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(formData.skills ?? []).map((skill, index) => (
                    <Badge
                      key={`${skill}-${index}`}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 gap-1 text-sm font-normal"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => {
                          const skills = formData.skills ?? [];
                          setFormData({
                            ...formData,
                            skills: skills.filter((_, i) => i !== index),
                          });
                        }}
                        className="rounded-full hover:bg-muted p-0.5"
                        aria-label={`Remove ${skill}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        );
      }

      case 3:
        return (
          <PricingSection
            pricingType={formData.pricingType}
            startingPrice={formData.startingPrice}
            availability={formData.availability}
            onPricingTypeChange={(value) => {
              setFormData({ ...formData, pricingType: value });
              setErrors({ ...errors, pricingType: undefined });
            }}
            onStartingPriceChange={(value) => {
              setFormData({ ...formData, startingPrice: value });
              setErrors({ ...errors, startingPrice: undefined });
            }}
            onAvailabilityChange={(availability) => {
              setFormData({ ...formData, availability });
            }}
            errors={errors}
          />
        );

      case 4:
        return (
          <DynamicFieldsRenderer
            categorySlug={selectedCategory?.slug || ""}
            subcategory={formData.subcategory}
            dynamicData={formData.dynamicData}
            onFieldChange={(fieldName, value) => {
              setFormData({
                ...formData,
                dynamicData: { ...formData.dynamicData, [fieldName]: value },
              });
            }}
            errors={errors.dynamicData}
          />
        );

      case 6:
        return (
          <SubmitReview
            formData={{
              ...formData,
              categoryName: selectedCategory?.name,
            }}
            onAgreeToTerms={setAgreedToTerms}
            agreedToTerms={agreedToTerms}
            errors={errors}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent dialog from closing on outside clicks (user closes via Cancel/Back buttons)
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {editMode ? "Edit Service" : "Create New Service"}
          </DialogTitle>
          <DialogDescription>
            {editMode
              ? "Update your service listing details."
              : "Create a new service listing. Follow the steps below."}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStepIndex} of {visibleStepIds.length}
            </span>
            <span className="font-medium">{STEPS[currentStep - 1].title}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {STEPS[currentStep - 1].description}
          </p>
        </div>

        {/* Step Content */}
        <div className="py-4 min-h-[400px]">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? () => onOpenChange(false) : handlePrevious}
            disabled={isSubmitting}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>

          <div className="flex items-center gap-2">
            {visibleStepIds.map((stepId, index) => (
              <div
                key={stepId}
                className={`h-2 w-2 rounded-full ${
                  index + 1 < currentStepIndex
                    ? "bg-primary"
                    : index + 1 === currentStepIndex
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {currentStepIndex < visibleStepIds.length ? (
            <Button onClick={handleNext} disabled={isSubmitting}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting || !agreedToTerms}>
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Create New Provider Dialog */}
      <Dialog open={showCreateProviderDialog} onOpenChange={setShowCreateProviderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Provider Account</DialogTitle>
            <DialogDescription>
              Create a new provider account to add services for users who haven't registered yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Name *</Label>
              <Input
                id="provider-name"
                placeholder="Provider name"
                value={newProviderData.name}
                onChange={(e) => setNewProviderData({ ...newProviderData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-email">Email *</Label>
              <Input
                id="provider-email"
                type="email"
                placeholder="provider@example.com"
                value={newProviderData.email}
                onChange={(e) => setNewProviderData({ ...newProviderData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-phone">Phone (Optional)</Label>
              <Input
                id="provider-phone"
                type="tel"
                placeholder="+91 1234567890"
                value={newProviderData.phone}
                onChange={(e) => setNewProviderData({ ...newProviderData, phone: e.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A random password will be generated. The provider can reset it later via email.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateProviderDialog(false);
                setNewProviderData({ name: "", email: "", phone: "" });
              }}
              disabled={isCreatingProvider}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProvider} disabled={isCreatingProvider}>
              {isCreatingProvider ? "Creating..." : "Create Provider"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

