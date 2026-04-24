"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Loader2, Upload, X } from "lucide-react";
import api from "@/lib/api-client";
import { useGoogleGeocoder } from "@/hooks/useGoogleGeocoder";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { useToast } from "@/hooks/use-toast";

export async function getServerSideProps() { return { props: {} }; }

const cropTo4x1 = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.width;
      const h = img.height;
      const targetRatio = 4 / 1;
      const currentRatio = w / h;
      let cropW = w;
      let cropH = h;
      let sx = 0;
      let sy = 0;
      if (currentRatio > targetRatio) {
        cropW = h * 4;
        sx = (w - cropW) / 2;
      } else {
        cropH = w / 4;
        sy = (h - cropH) / 2;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cropW);
      canvas.height = Math.round(cropH);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Crop failed"))),
        file.type || "image/jpeg",
        0.9
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
};

export default function ProviderBusinessProfile() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { status: kycStatus } = useProviderKycStatus();
  const { toast } = useToast();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    businessName: "",
    providerType: "Individual" as "Individual" | "Company" | "Firm" | "Proprietorship",
    primaryCategory: "",
    primarySubcategory: [] as string[],
    yearsOfExperience: "",
    businessDescription: "",
    businessLogo: "",
    coverImage: "",
    businessAddress: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
    serviceAreas: [] as Array<{ city: string; state: string; radius?: number }>,
    businessPhone: "",
    businessEmail: "",
    website: "",
    gstRegistered: false,
    gstNumber: "",
    coordinates: { lat: "", lng: "" },
  });

  const {
    inputRef: addressInputRef,
    isLoaded: isLocationLoaded,
    getCurrentLocation,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange,
  } = useGoogleGeocoder({
    onPlaceSelect: (place) => {
      let address = place.formatted_address || "";
      let city = "";
      let state = "";
      let zipCode = "";
      let lat = "";
      let lng = "";

      if (place.geometry?.location) {
        const latFn = place.geometry.location.lat;
        const lngFn = place.geometry.location.lng;
        lat = (typeof latFn === "function" ? latFn() : latFn).toString();
        lng = (typeof lngFn === "function" ? lngFn() : lngFn).toString();
      }

      const addressParts = place.formatted_address.split(",").map((part) => part.trim());
      if (addressParts.length >= 3) {
        address = addressParts[0] || "";
        city = addressParts[addressParts.length - 3] || "";
        const stateZipPart = addressParts[addressParts.length - 2] || "";
        const stateZipMatch = stateZipPart.match(/^(.+?)\s+(\d{5,6}(?:-\d{4})?)$/);
        if (stateZipMatch) {
          state = stateZipMatch[1].trim();
          zipCode = stateZipMatch[2].trim();
        } else {
          state = stateZipPart;
        }
      } else if (addressParts.length === 2) {
        address = addressParts[0] || "";
        const cityStateZip = addressParts[1] || "";
        const cityStateZipMatch = cityStateZip.match(/^(.+?),\s*(.+?)\s+(\d{5,6}(?:-\d{4})?)$/);
        if (cityStateZipMatch) {
          city = cityStateZipMatch[1].trim();
          state = cityStateZipMatch[2].trim();
          zipCode = cityStateZipMatch[3].trim();
        } else {
          city = cityStateZip;
        }
      } else {
        address = place.formatted_address;
      }

      setBusinessProfile((prev) => ({
        ...prev,
        businessAddress: { address, city, state, zipCode },
        coordinates: { lat, lng },
      }));
      setIsGettingLocation(false);
    },
    onError: (error) => {
      setIsGettingLocation(false);
      toast({ title: "Location Error", description: error, variant: "destructive" });
    },
  });

  const handleFetchLocation = () => {
    setIsGettingLocation(true);
    getCurrentLocation();
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll(true, { includeSubcategories: true });
        if (response.success && response.data) {
          const d = response.data as { categories?: any[] };
          setCategories(d.categories || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchProviderData = async () => {
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      if (!userId) return;

      const providerResponse = await api.providers.getByUserId(userId);
      if (providerResponse.success && providerResponse.data) {
        const provider = (providerResponse.data as any).provider;
        setProviderId(provider._id || provider.id);

        if (provider) {
          setBusinessProfile({
            businessName: provider.businessName || "",
            providerType: provider.providerType || "Individual",
            primaryCategory: provider.primaryCategory?._id || provider.primaryCategory || "",
            primarySubcategory: Array.isArray(provider.primarySubcategory)
              ? provider.primarySubcategory
              : provider.primarySubcategory
                ? [provider.primarySubcategory]
                : [],
            yearsOfExperience: provider.yearsOfExperience?.toString() || "",
            businessDescription: (provider.bio || "").slice(0, 250),
            businessLogo: provider.businessLogo || "",
            coverImage: provider.coverImage || "",
            businessAddress: {
              address: provider.businessAddress?.address || "",
              city: provider.businessAddress?.city || "",
              state: provider.businessAddress?.state || "",
              zipCode: provider.businessAddress?.zipCode || "",
            },
            serviceAreas: provider.serviceAreas || [],
            businessPhone: provider.businessPhone || "",
            businessEmail: provider.businessEmail || "",
            website: provider.website || "",
            gstRegistered: Boolean(provider.gstRegistered ?? (provider.gstNumber && String(provider.gstNumber).trim())),
            gstNumber: provider.gstNumber || "",
            coordinates: {
              lat: provider.businessAddress?.coordinates?.lat?.toString() || "",
              lng: provider.businessAddress?.coordinates?.lng?.toString() || "",
            },
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch provider data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return;
    fetchProviderData();
  }, [isAuthLoading, user]);

  const handleSave = async () => {
    if (!providerId) {
      toast({ title: "Error", description: "Provider ID not found", variant: "destructive" });
      return;
    }
    if (!businessProfile.businessName || !businessProfile.businessDescription) {
      toast({
        title: "Validation Error",
        description: "Business Name and Description are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const updateData: any = {
        businessName: businessProfile.businessName.trim(),
        providerType: businessProfile.providerType,
        bio: businessProfile.businessDescription.trim(),
      };

      if (businessProfile.businessPhone) updateData.businessPhone = businessProfile.businessPhone.trim();
      if (businessProfile.businessEmail) updateData.businessEmail = businessProfile.businessEmail.trim().toLowerCase();
      if (businessProfile.website) updateData.website = businessProfile.website.trim();
      updateData.gstRegistered = Boolean(businessProfile.gstRegistered);
      if (businessProfile.gstRegistered && businessProfile.gstNumber?.trim()) {
        updateData.gstNumber = businessProfile.gstNumber.trim().toUpperCase();
      } else {
        updateData.gstNumber = "";
      }
      if (businessProfile.businessLogo) updateData.businessLogo = businessProfile.businessLogo;
      if (businessProfile.coverImage) updateData.coverImage = businessProfile.coverImage;
      if (businessProfile.primaryCategory) updateData.primaryCategory = businessProfile.primaryCategory;
      if (businessProfile.primarySubcategory?.length > 0) updateData.primarySubcategory = businessProfile.primarySubcategory;

      const years = Number(businessProfile.yearsOfExperience);
      if (!isNaN(years) && years >= 0) updateData.yearsOfExperience = years;

      if (businessProfile.businessAddress.city || businessProfile.businessAddress.address) {
        updateData.businessAddress = {
          address: businessProfile.businessAddress.address?.trim() || "",
          city: businessProfile.businessAddress.city?.trim() || "",
          state: businessProfile.businessAddress.state?.trim() || "",
          zipCode: businessProfile.businessAddress.zipCode?.trim() || "",
        };
        if (businessProfile.coordinates.lat && businessProfile.coordinates.lng) {
          const lat = Number(businessProfile.coordinates.lat);
          const lng = Number(businessProfile.coordinates.lng);
          if (!isNaN(lat) && !isNaN(lng)) {
            updateData.businessAddress.coordinates = { lat, lng };
          }
        }
      }

      if (businessProfile.serviceAreas?.length > 0) {
        updateData.serviceAreas = businessProfile.serviceAreas.map((area: any) => ({
          city: area.city?.trim() || "",
          state: area.state?.trim() || "",
          radius: area.radius ? Number(area.radius) : undefined,
        }));
      }

      const response = await api.providers.update(providerId, updateData);
      if (response.success) {
        toast({ title: "Success", description: "Business profile updated successfully" });
        await fetchProviderData();
      } else {
        throw new Error(response.error?.message || "Failed to update");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update business profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Business Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete your business information to help clients find and contact you
        </p>
      </div>

      {kycStatus !== "KYC_APPROVED" && (
        <p className="text-sm text-muted-foreground mt-2">
          Your KYC is not approved yet. You can still edit your business profile.
        </p>
      )}

      <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Manage your business profile, contact details, and location information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="contact">Contact & Location</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business / Company Name *</Label>
                    <Input
                      id="business-name"
                      placeholder="e.g., ABC Construction Pvt Ltd"
                      value={businessProfile.businessName}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, businessName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider-type">Provider Type *</Label>
                    <Select
                      value={businessProfile.providerType}
                      onValueChange={(value: "Individual" | "Company" | "Firm" | "Proprietorship") =>
                        setBusinessProfile({ ...businessProfile, providerType: value })
                      }
                    >
                      <SelectTrigger id="provider-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual">Individual</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="Firm">Firm</SelectItem>
                        <SelectItem value="Proprietorship">Proprietorship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-category">Primary Category *</Label>
                    <Select
                      value={businessProfile.primaryCategory}
                      onValueChange={(value) =>
                        setBusinessProfile({ ...businessProfile, primaryCategory: value, primarySubcategory: [] })
                      }
                    >
                      <SelectTrigger id="primary-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary-subcategory">Primary Sub-Categories</Label>
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {businessProfile.primaryCategory ? (
                        categories.find((c) => c._id === businessProfile.primaryCategory)?.subcategories?.length > 0 ? (
                          categories
                            .find((c) => c._id === businessProfile.primaryCategory)
                            ?.subcategories?.map((subcat: string) => (
                              <div key={subcat} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`subcat-${subcat}`}
                                  checked={businessProfile.primarySubcategory.includes(subcat)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setBusinessProfile({
                                        ...businessProfile,
                                        primarySubcategory: [...businessProfile.primarySubcategory, subcat],
                                      });
                                    } else {
                                      setBusinessProfile({
                                        ...businessProfile,
                                        primarySubcategory: businessProfile.primarySubcategory.filter((s) => s !== subcat),
                                      });
                                    }
                                  }}
                                />
                                <Label htmlFor={`subcat-${subcat}`} className="text-sm font-normal cursor-pointer">
                                  {subcat}
                                </Label>
                              </div>
                            ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No subcategories available</p>
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground">Please select a category first</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years-experience">Years of Experience</Label>
                  <Input
                    id="years-experience"
                    type="number"
                    min="0"
                    placeholder="e.g., 5"
                    value={businessProfile.yearsOfExperience}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, yearsOfExperience: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-description">Short Business Description / About *</Label>
                  <Textarea
                    id="business-description"
                    placeholder="Describe your business, services, and expertise..."
                    value={businessProfile.businessDescription}
                    onChange={(e) =>
                      setBusinessProfile({ ...businessProfile, businessDescription: e.target.value.slice(0, 250) })
                    }
                    rows={4}
                    maxLength={250}
                  />
                  <p className="text-xs text-muted-foreground">{businessProfile.businessDescription.length}/250</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-logo">Business Logo</Label>
                    <div className="flex items-center gap-2">
                      {businessProfile.businessLogo ? (
                        <div className="relative">
                          <img
                            src={businessProfile.businessLogo}
                            alt="Logo preview"
                            className="h-20 w-20 object-contain border rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => setBusinessProfile({ ...businessProfile, businessLogo: "" })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null}
                      <label
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm cursor-pointer ${
                          logoUploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setLogoUploading(true);
                            try {
                              const res = await api.providers.uploadProfileImage(file, "logo");
                              if (res.success && res.data?.url) {
                                setBusinessProfile((p) => ({ ...p, businessLogo: res.data!.url }));
                                toast({ title: "Uploaded", description: "Logo uploaded" });
                              } else {
                                toast({
                                  title: "Upload failed",
                                  description: res.error?.message || "Failed",
                                  variant: "destructive",
                                });
                              }
                            } finally {
                              setLogoUploading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                        <Upload className="h-4 w-4" />
                        {logoUploading ? "Uploading..." : "Upload"}
                      </label>
                    </div>
                    <Input
                      id="business-logo"
                      placeholder="Or paste URL"
                      value={businessProfile.businessLogo}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, businessLogo: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover-image">Cover Image / Banner</Label>
                    <div className="flex items-center gap-2">
                      {businessProfile.coverImage ? (
                        <div className="relative aspect-[4/1] w-32 min-w-[80px]">
                          <img
                            src={businessProfile.coverImage}
                            alt="Cover preview"
                            className="h-full w-full object-cover border rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => setBusinessProfile({ ...businessProfile, coverImage: "" })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : null}
                      <label
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm cursor-pointer ${
                          coverUploading ? "opacity-50 pointer-events-none" : ""
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setCoverUploading(true);
                            try {
                              const blob = await cropTo4x1(file);
                              const croppedFile = new File([blob], file.name, { type: blob.type });
                              const res = await api.providers.uploadProfileImage(croppedFile, "cover");
                              if (res.success && res.data?.url) {
                                setBusinessProfile((p) => ({ ...p, coverImage: res.data!.url }));
                                toast({ title: "Uploaded", description: "Cover uploaded (4:1 ratio)" });
                              } else {
                                toast({
                                  title: "Upload failed",
                                  description: res.error?.message || "Failed",
                                  variant: "destructive",
                                });
                              }
                            } catch (err) {
                              toast({
                                title: "Upload failed",
                                description: err instanceof Error ? err.message : "Failed",
                                variant: "destructive",
                              });
                            } finally {
                              setCoverUploading(false);
                              e.target.value = "";
                            }
                          }}
                        />
                        <Upload className="h-4 w-4" />
                        {coverUploading ? "Uploading..." : "Upload"}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">4:1 ratio (e.g. 1200×300)</p>
                    <Input
                      id="cover-image"
                      placeholder="Or paste URL"
                      value={businessProfile.coverImage}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, coverImage: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="business-address">Business Address</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFetchLocation}
                      disabled={!isLocationLoaded || isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3 mr-1" />
                          Fetch Location
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      id="business-address"
                      ref={addressInputRef}
                      placeholder={
                        isLocationLoaded
                          ? "Start typing address or click 'Fetch Location'"
                          : "Loading location services..."
                      }
                      className="pl-10"
                      disabled={!isLocationLoaded}
                      value={businessProfile.businessAddress.address}
                      onChange={(e) => {
                        setBusinessProfile({
                          ...businessProfile,
                          businessAddress: { ...businessProfile.businessAddress, address: e.target.value },
                        });
                        handleInputChange(e);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-[2147483647] max-h-48 overflow-auto">
                        {suggestions.map((s, i) => (
                          <button
                            key={s.id || i}
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              void selectSuggestion(s);
                            }}
                          >
                            {s.place_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-city">City *</Label>
                    <Input
                      id="business-city"
                      placeholder="City"
                      value={businessProfile.businessAddress.city}
                      onChange={(e) =>
                        setBusinessProfile({
                          ...businessProfile,
                          businessAddress: { ...businessProfile.businessAddress, city: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-state">State *</Label>
                    <Input
                      id="business-state"
                      placeholder="State"
                      value={businessProfile.businessAddress.state}
                      onChange={(e) =>
                        setBusinessProfile({
                          ...businessProfile,
                          businessAddress: { ...businessProfile.businessAddress, state: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-zip">ZIP Code</Label>
                    <Input
                      id="business-zip"
                      placeholder="ZIP Code"
                      value={businessProfile.businessAddress.zipCode}
                      onChange={(e) =>
                        setBusinessProfile({
                          ...businessProfile,
                          businessAddress: { ...businessProfile.businessAddress, zipCode: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coordinates-lat">Latitude</Label>
                    <Input
                      id="coordinates-lat"
                      type="number"
                      step="any"
                      placeholder="e.g., 28.6139"
                      value={businessProfile.coordinates.lat}
                      onChange={(e) =>
                        setBusinessProfile({
                          ...businessProfile,
                          coordinates: { ...businessProfile.coordinates, lat: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coordinates-lng">Longitude</Label>
                    <Input
                      id="coordinates-lng"
                      type="number"
                      step="any"
                      placeholder="e.g., 77.2090"
                      value={businessProfile.coordinates.lng}
                      onChange={(e) =>
                        setBusinessProfile({
                          ...businessProfile,
                          coordinates: { ...businessProfile.coordinates, lng: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-phone">Business Phone Number</Label>
                    <Input
                      id="business-phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={businessProfile.businessPhone}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, businessPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-email">Business Email Address</Label>
                    <Input
                      id="business-email"
                      type="email"
                      placeholder="business@example.com"
                      value={businessProfile.businessEmail}
                      onChange={(e) => setBusinessProfile({ ...businessProfile, businessEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={businessProfile.website}
                    onChange={(e) => setBusinessProfile({ ...businessProfile, website: e.target.value })}
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gst-registered"
                      checked={businessProfile.gstRegistered}
                      onCheckedChange={(checked) =>
                        setBusinessProfile((prev) => ({
                          ...prev,
                          gstRegistered: Boolean(checked),
                          gstNumber: checked ? prev.gstNumber : "",
                        }))
                      }
                    />
                    <Label htmlFor="gst-registered" className="cursor-pointer">
                      GST Registered
                    </Label>
                  </div>
                  {businessProfile.gstRegistered && (
                    <div className="space-y-2">
                      <Label htmlFor="gst-number">GST Number</Label>
                      <Input
                        id="gst-number"
                        placeholder="e.g., 22AAAAA0000A1Z5"
                        value={businessProfile.gstNumber}
                        onChange={(e) =>
                          setBusinessProfile({ ...businessProfile, gstNumber: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
