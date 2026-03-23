"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ServiceImageUpload } from "./ServiceImageUpload";
import { ServiceLocationInput } from "./ServiceLocationInput";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { Plus } from "lucide-react";

interface AdminSimpleServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Array<{ _id: string; name: string; slug: string; subcategories?: string[] }>;
  availableUsers: Array<{ _id?: string; id?: string; name?: string; email?: string }>;
  onSuccess: () => void;
}

export function AdminSimpleServiceForm({
  open,
  onOpenChange,
  categories,
  availableUsers,
  onSuccess,
}: AdminSimpleServiceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showCreateProviderDialog, setShowCreateProviderDialog] = useState(false);
  const [isCreatingProvider, setIsCreatingProvider] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");
  const [newProviderData, setNewProviderData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [formData, setFormData] = useState({
    provider: "",
    title: "",
    description: "",
    category: "",
    subcategory: "",
    price: "",
    priceType: "fixed" as "fixed" | "hourly" | "daily" | "per_minute" | "per_article" | "monthly" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip" | "lumpsum" | "per_project" | "negotiable",
    deliveryTime: "",
    images: [] as string[],
    uploadedImages: [] as File[],
    location: {
      address: "",
      city: "",
      state: "",
      coordinates: { lat: 0, lng: 0 },
    },
  });

  const selectedCategory = useMemo(() => {
    if (!formData.category || categories.length === 0) return null;
    return categories.find((cat) => String(cat._id) === String(formData.category)) || null;
  }, [formData.category, categories]);

  const availableSubcategories = useMemo(() => {
    if (!selectedCategory || !selectedCategory.subcategories) return [];
    return Array.isArray(selectedCategory.subcategories) 
      ? selectedCategory.subcategories.filter(Boolean) 
      : [];
  }, [selectedCategory]);

  const providerOptions = useMemo(() => {
    return availableUsers.map((provider: any) => {
      const user = provider.user || provider;
      const id = user._id || user.id || provider._id || provider.id || "";
      const name = provider.businessName || user.name || "";
      const email = user.email || "";
      const label = name || email || `User ${id}`;
      const searchText = `${name} ${email} ${id}`.toLowerCase();
      return { id, label, searchText };
    });
  }, [availableUsers]);

  const filteredProviders = useMemo(() => {
    const query = providerSearch.trim().toLowerCase();
    if (!query) return providerOptions;
    return providerOptions.filter((provider) => provider.searchText.includes(query));
  }, [providerOptions, providerSearch]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        provider: "",
        title: "",
        description: "",
        category: "",
        subcategory: "",
        price: "",
        priceType: "fixed",
        deliveryTime: "",
        images: [],
        uploadedImages: [],
        location: {
          address: "",
          city: "",
          state: "",
          coordinates: { lat: 0, lng: 0 },
        },
      });
      setIsGettingLocation(false);
      setProviderSearch("");
    }
  }, [open]);

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
      const response = await api.auth.register({
        name: newProviderData.name,
        email: newProviderData.email,
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12) + "A1!",
        role: "provider",
        phone: newProviderData.phone || undefined,
      });

      const data = response.data as { user?: { id: string } } | undefined;
      if (response.success && data?.user) {
        const newUserId = data.user.id;
        setFormData({ ...formData, provider: newUserId });
        setShowCreateProviderDialog(false);
        setNewProviderData({ name: "", email: "", phone: "" });
        toast({
          title: "Success",
          description: "New provider account created successfully",
        });
        // Refresh users list
        onSuccess();
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
    // Validation
    if (!formData.provider) {
      toast({
        title: "Error",
        description: "Please select a provider",
        variant: "destructive",
      });
      return;
    }
    if (!formData.title || !formData.description || !formData.category || !formData.price || !formData.deliveryTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload new images to S3/CDN
      const uploadedUrls: string[] = [];
      for (const file of formData.uploadedImages) {
        const res = await api.services.uploadImage(file);
        if (res.success && res.data?.url) {
          uploadedUrls.push(res.data.url);
        } else {
          throw new Error(res.error?.message || 'Failed to upload image');
        }
      }

      const allImages = [...formData.images, ...uploadedUrls];

      const servicePayload: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || "",
        price: parseFloat(formData.price),
        priceType: formData.priceType,
        deliveryTime: formData.deliveryTime,
        provider: formData.provider,
      };

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

      const response = await api.services.create(servicePayload);

      if (response.success) {
        toast({
          title: "Success",
          description: "Service created successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: response.error?.message || "Failed to create service",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Service</DialogTitle>
            <DialogDescription>
              Create a new service listing for a provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Provider Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="provider">Select Provider *</Label>
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
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
              >
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Search provider..."
                      value={providerSearch}
                      onChange={(e) => setProviderSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
                    </SelectItem>
                  ))}
                  {filteredProviders.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No providers found</div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Can't find the provider? Click "Create New" to add a new account.
              </p>
            </div>

            {/* Service Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Professional Construction Service"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your service in detail..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value, subcategory: "" });
                }}
              >
                <SelectTrigger id="category">
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

            {/* Subcategory */}
            {selectedCategory && availableSubcategories.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory (Optional)</Label>
                <Select
                  value={formData.subcategory}
                  onValueChange={(value) => setFormData({ ...formData, subcategory: value })}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select subcategory (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {availableSubcategories.map((subcat: string, index: number) => (
                      <SelectItem key={`subcat-${index}`} value={subcat.trim()}>
                        {subcat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price and Price Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceType">Price Type *</Label>
                <Select
                  value={formData.priceType}
                  onValueChange={(value: any) => setFormData({ ...formData, priceType: value })}
                >
                  <SelectTrigger id="priceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="hourly">Per Hour</SelectItem>
                    <SelectItem value="daily">Per Day</SelectItem>
                    <SelectItem value="monthly">Per Month</SelectItem>
                    <SelectItem value="per_minute">Per Minute</SelectItem>
                    <SelectItem value="per_article">Per Article</SelectItem>
                    <SelectItem value="per_kg">Per KG</SelectItem>
                    <SelectItem value="per_litre">Per Litre</SelectItem>
                    <SelectItem value="per_unit">Per Unit</SelectItem>
                    <SelectItem value="metric_ton">Metric Ton</SelectItem>
                    <SelectItem value="per_sqft">Per Square Foot</SelectItem>
                    <SelectItem value="per_sqm">Per Square Meter</SelectItem>
                    <SelectItem value="per_load">Per Load</SelectItem>
                    <SelectItem value="per_trip">Per Trip</SelectItem>
                    <SelectItem value="lumpsum">Lumsum</SelectItem>
                    <SelectItem value="per_project">Per Project</SelectItem>
                    <SelectItem value="negotiable">Negotiable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Delivery Time */}
            <div className="space-y-2">
              <Label htmlFor="deliveryTime">Delivery Time *</Label>
              <Input
                id="deliveryTime"
                placeholder="e.g., 1-2 days, 1 week"
                value={formData.deliveryTime}
                onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
              />
            </div>

            {/* Images */}
            <ServiceImageUpload
              images={formData.images}
              uploadedImages={formData.uploadedImages}
              onImageUpload={(e) => {
                const files = e.target.files;
                if (files) {
                  const newFiles = Array.from(files);
                  setFormData({
                    ...formData,
                    uploadedImages: [...formData.uploadedImages, ...newFiles],
                  });
                }
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
            />

            {/* Location */}
            <ServiceLocationInput
              location={formData.location}
              onLocationChange={(location) => {
                setFormData({
                  ...formData,
                  location: {
                    ...location,
                    coordinates: location.coordinates ?? { lat: 0, lng: 0 },
                  },
                });
              }}
              onClear={() => {
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
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}






