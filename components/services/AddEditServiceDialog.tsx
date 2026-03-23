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

interface ServiceFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  priceType: "fixed" | "hourly" | "daily" | "per_minute" | "per_article" | "monthly" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip" | "lumpsum" | "per_project" | "negotiable";
  deliveryTime: string;
  image: string;
  images: string[];
  uploadedImages: File[];
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
}

interface AddEditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceData: ServiceFormData;
  onServiceDataChange: (data: ServiceFormData) => void;
  categories: Array<{ _id: string; name: string; subcategories?: string[] }>;
  selectedCategory: { _id: string; name: string; subcategories?: string[] } | null;
  availableSubcategories: string[];
  isSubmitting: boolean;
  isEditMode: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImageUrl: (index: number) => void;
  onRemoveUploadedImage: (index: number) => void;
  onLocationChange: (location: ServiceFormData["location"]) => void;
  onClearLocation: () => void;
  isGettingLocation: boolean;
  onGettingLocationChange: (value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AddEditServiceDialog({
  open,
  onOpenChange,
  serviceData,
  onServiceDataChange,
  categories,
  selectedCategory,
  availableSubcategories,
  isSubmitting,
  isEditMode,
  onImageUpload,
  onRemoveImageUrl,
  onRemoveUploadedImage,
  onLocationChange,
  onClearLocation,
  isGettingLocation,
  onGettingLocationChange,
  onSubmit,
  onCancel,
}: AddEditServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent dialog from closing on outside clicks
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Service" : "Add New Service"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your service listing details."
              : "Create a new service listing. It will be reviewed before going live."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Residential Construction Service"
              value={serviceData.title}
              onChange={(e) => onServiceDataChange({ ...serviceData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your service in detail..."
              rows={4}
              value={serviceData.description}
              onChange={(e) => onServiceDataChange({ ...serviceData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={serviceData.category || ""}
              onValueChange={(value) => {
                onServiceDataChange({
                  ...serviceData,
                  category: value,
                  subcategory: "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name || "Unnamed Category"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {serviceData.category && selectedCategory && (
            <div className="space-y-2">
              <Label htmlFor="subcategory">
                Subcategory {availableSubcategories.length > 0 ? "(Optional)" : ""}
              </Label>
              <Select
                value={serviceData.subcategory || undefined}
                onValueChange={(value) => {
                  onServiceDataChange({ ...serviceData, subcategory: value });
                }}
                disabled={availableSubcategories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableSubcategories.length > 0
                        ? "Select subcategory (optional)"
                        : "No subcategories available"
                    }
                  />
                </SelectTrigger>
                {availableSubcategories.length > 0 && (
                  <SelectContent>
                    {availableSubcategories.map((subcat: string, index: number) => {
                      const subcatValue = subcat && subcat.trim() ? subcat.trim() : `subcat-${index}`;
                      return (
                        <SelectItem key={`subcat-${index}`} value={subcatValue}>
                          {subcat}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                )}
              </Select>
              {availableSubcategories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  This category doesn't have subcategories
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={serviceData.price}
                onChange={(e) => onServiceDataChange({ ...serviceData, price: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceType">Price Type *</Label>
              <Select
                value={serviceData.priceType}
                onValueChange={(value: any) => onServiceDataChange({ ...serviceData, priceType: value })}
              >
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="deliveryTime">Delivery Time *</Label>
            <Input
              id="deliveryTime"
              placeholder="e.g., 1-2 days, 1 week, 2-3 weeks"
              value={serviceData.deliveryTime}
              onChange={(e) => onServiceDataChange({ ...serviceData, deliveryTime: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Estimated time to complete the service
            </p>
          </div>

          {/* Images Section */}
          <ServiceImageUpload
            images={serviceData.images}
            uploadedImages={serviceData.uploadedImages}
            onImageUpload={onImageUpload}
            onRemoveImageUrl={onRemoveImageUrl}
            onRemoveUploadedImage={onRemoveUploadedImage}
          />

          {/* Location Section */}
          <ServiceLocationInput
            location={serviceData.location}
            onLocationChange={onLocationChange}
            onClear={onClearLocation}
            isGettingLocation={isGettingLocation}
            onGettingLocationChange={onGettingLocationChange}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? (isEditMode ? "Updating..." : "Creating...")
              : (isEditMode ? "Update Service" : "Create Service")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

