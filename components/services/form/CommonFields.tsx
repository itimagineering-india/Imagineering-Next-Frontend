import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ServiceImageUpload } from "../ServiceImageUpload";
import { ServiceLocationInput } from "../ServiceLocationInput";

interface Location {
  address: string;
  city: string;
  state: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/** Category slugs where Brand Name field is shown (Construction material, Machines, Manufacturer, Traders, Electrical & lighting, Furniture, Hardware, Tools). */
export const BRAND_NAME_CATEGORY_SLUGS = [
  "construction-materials",
  "machines",
  "manufacturer",
  "traders",
  "electrical-lighting",
  "furniture",
  "hardware",
  "tools",
];

interface CommonFieldsProps {
  title: string;
  brandName: string;
  /** When false, Brand Name field is hidden. Used so only specific categories show it. */
  showBrandName?: boolean;
  shortDescription: string;
  detailedDescription: string;
  images: string[];
  uploadedImages: File[];
  location: Location;
  onTitleChange: (value: string) => void;
  onBrandNameChange: (value: string) => void;
  onShortDescriptionChange: (value: string) => void;
  onDetailedDescriptionChange: (value: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImageUrl: (index: number) => void;
  onRemoveUploadedImage: (index: number) => void;
  onLocationChange: (location: Location) => void;
  onClearLocation: () => void;
  isGettingLocation: boolean;
  onGettingLocationChange: (value: boolean) => void;
  errors?: {
    title?: string;
    shortDescription?: string;
    detailedDescription?: string;
  };
}

export function CommonFields({
  title,
  brandName,
  showBrandName = false,
  shortDescription,
  detailedDescription,
  images,
  uploadedImages,
  location,
  onTitleChange,
  onBrandNameChange,
  onShortDescriptionChange,
  onDetailedDescriptionChange,
  onImageUpload,
  onRemoveImageUrl,
  onRemoveUploadedImage,
  onLocationChange,
  onClearLocation,
  isGettingLocation,
  onGettingLocationChange,
  errors,
}: CommonFieldsProps) {
  return (
    <div className="space-y-6">
      {/* Service Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Service Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="e.g., Professional Residential Construction Service"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={errors?.title ? "border-destructive" : ""}
        />
        {errors?.title && (
          <p className="text-sm text-destructive">{errors.title}</p>
        )}
        <p className="text-xs text-muted-foreground">
          A clear, descriptive title for your service
        </p>
      </div>

      {/* Brand Name - only for Construction materials, Machines, Manufacturer, Traders, Electrical & lighting, Furniture, Hardware, Tools */}
      {showBrandName && (
        <div className="space-y-2">
          <Label htmlFor="brandName">Brand Name</Label>
          <Input
            id="brandName"
            placeholder="e.g., Tata, Birla, Local Brand"
            value={brandName}
            onChange={(e) => onBrandNameChange(e.target.value)}
          />
        </div>
      )}

      {/* Short Description */}
      <div className="space-y-2">
        <Label htmlFor="shortDescription">
          Short Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="shortDescription"
          placeholder="Brief overview of your service (2-3 sentences)"
          rows={3}
          value={shortDescription}
          onChange={(e) => onShortDescriptionChange(e.target.value)}
          className={errors?.shortDescription ? "border-destructive" : ""}
          maxLength={200}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {shortDescription.length}/200 characters
          </p>
          {errors?.shortDescription && (
            <p className="text-sm text-destructive">{errors.shortDescription}</p>
          )}
        </div>
      </div>

      {/* Detailed Description (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="detailedDescription">
          Detailed Description <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Textarea
          id="detailedDescription"
          placeholder="Provide detailed information about your service, including features, benefits, and what makes it unique..."
          rows={6}
          value={detailedDescription}
          onChange={(e) => onDetailedDescriptionChange(e.target.value)}
          className={errors?.detailedDescription ? "border-destructive" : ""}
        />
        {errors?.detailedDescription && (
          <p className="text-sm text-destructive">{errors.detailedDescription}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Include all relevant details that customers should know
        </p>
      </div>

      {/* Service Images */}
      <ServiceImageUpload
        images={images}
        uploadedImages={uploadedImages}
        onImageUpload={onImageUpload}
        onRemoveImageUrl={onRemoveImageUrl}
        onRemoveUploadedImage={onRemoveUploadedImage}
      />

      {/* Location */}
      <ServiceLocationInput
        location={location}
        onLocationChange={onLocationChange}
        onClear={onClearLocation}
        isGettingLocation={isGettingLocation}
        onGettingLocationChange={onGettingLocationChange}
      />
    </div>
  );
}


















