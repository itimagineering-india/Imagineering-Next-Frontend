import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  MapPin,
  DollarSign,
  Clock,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import {
  getManpowerServiceOfferPresetsForSubcategory,
  humanizeManpowerTaskId,
} from "@/config/manpowerServiceOfferPresets";

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

interface SubmitReviewProps {
  formData: {
    title: string;
    brandName?: string;
    shortDescription: string;
    detailedDescription: string;
    category: string;
    categoryName?: string;
    categorySlug?: string;
    subcategory: string;
    priceMode: "exact" | "range";
    pricingType: "fixed" | "hourly" | "daily" | "per_minute" | "per_article" | "monthly" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip" | "per_cuft" | "per_cum" | "per_metre" | "per_bag" | "lumpsum" | "per_project" | "negotiable";
    startingPrice: string;
    priceMin: string;
    priceMax: string;
    availability: Availability;
    images: string[];
    uploadedImages: File[];
    location: Location;
    contactMode: "platform" | "direct";
    visibility: "normal" | "featured";
    dynamicData: Record<string, any>;
    skills?: string[];
  };
  onAgreeToTerms: (agreed: boolean) => void;
  agreedToTerms: boolean;
  errors?: {
    agreedToTerms?: string;
  };
}

export function SubmitReview({
  formData,
  onAgreeToTerms,
  agreedToTerms,
  errors,
}: SubmitReviewProps) {
  const totalImages = formData.images.length + formData.uploadedImages.length;
  const hasLocation = formData.location.address || formData.location.city;
  const manpowerOfferPresetRows = getManpowerServiceOfferPresetsForSubcategory(formData.subcategory);
  const manpowerTaskIds = (formData.dynamicData?.manpowerTaskIds as string[] | undefined) ?? [];
  const manpowerCustomTasks = (formData.dynamicData?.manpowerCustomTasks as string[] | undefined) ?? [];
  const showManpowerOffersReview =
    formData.categorySlug === "manpower" &&
    !!formData.subcategory?.trim() &&
    formData.subcategory !== "Technical Manpower" &&
    (manpowerTaskIds.length > 0 || manpowerCustomTasks.length > 0);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="heading-md">Review Your Service</h3>
        <p className="caption">
          Please review all information before submitting. Your service will be reviewed by our team before going live.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-md flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="caption">Service Title</Label>
              <p className="body">{formData.title || "—"}</p>
            </div>
            {formData.brandName && (
              <div>
                <Label className="caption">Brand Name</Label>
                <p className="body">{formData.brandName}</p>
              </div>
            )}
            <div>
              <Label className="caption">Short Description</Label>
              <p className="body">{formData.shortDescription || "—"}</p>
            </div>
            <div>
              <Label className="caption">Category</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="body">{formData.categoryName || "—"}</p>
                {formData.subcategory && (
                  <>
                    <span className="text-muted-foreground">/</span>
                    <Badge variant="secondary">{formData.subcategory}</Badge>
                  </>
                )}
              </div>
            </div>
            {formData.skills && formData.skills.length > 0 && (
              <div>
                <Label className="caption">Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {formData.skills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="body">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {showManpowerOffersReview && (
              <div>
                <Label className="caption">Services you offer</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {manpowerTaskIds.map((id) => {
                    const label =
                      manpowerOfferPresetRows.find((p) => p.id === id)?.label ?? humanizeManpowerTaskId(id);
                    return (
                      <Badge key={id} variant="outline" className="body">
                        {label}
                      </Badge>
                    );
                  })}
                  {manpowerCustomTasks.map((line, i) => (
                    <Badge key={`custom-${i}`} variant="secondary" className="body">
                      {line}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-md flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="caption">Pricing Type</Label>
              <p className="font-medium capitalize">{formData.pricingType || "—"}</p>
            </div>
            <div>
              <Label className="caption">
                {formData.priceMode === "range" ? "Price Range" : "Starting Price"}
              </Label>
              <p className="body">
                {formData.priceMode === "range"
                  ? `₹${parseFloat(formData.priceMin || "0").toLocaleString()} - ₹${parseFloat(formData.priceMax || "0").toLocaleString()}`
                  : `₹${parseFloat(formData.startingPrice || "0").toLocaleString()}`}
              </p>
              {formData.priceMode === "range" && (
                <p className="caption">Enquiry-only listing</p>
              )}
            </div>
            <div>
              <Label className="caption">Availability</Label>
              <div className="mt-1 space-y-1">
                <p className="body">
                  <span className="body">Days:</span>{" "}
                  {formData.availability.days.length > 0
                    ? formData.availability.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")
                    : "Not specified"}
                </p>
                {formData.availability.timeSlots.length > 0 && (
                  <p className="body">
                    <span className="body">Time:</span>{" "}
                    {formData.availability.timeSlots
                      .map((slot) => `${slot.start} - ${slot.end}`)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        {hasLocation && (
          <Card>
            <CardHeader>
              <CardTitle className="heading-md flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {formData.location.address && (
                  <p className="body">{formData.location.address}</p>
                )}
                {(formData.location.city || formData.location.state) && (
                  <p className="caption">
                    {formData.location.city}
                    {formData.location.city && formData.location.state && ", "}
                    {formData.location.state}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        {totalImages > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="heading-md flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="body">
                {totalImages} image{totalImages !== 1 ? "s" : ""} uploaded
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dynamic Fields */}
        {Object.keys(formData.dynamicData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="heading-md">Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(formData.dynamicData)
                  .filter(([key]) =>
                    !["manpowerTaskIds", "manpowerCustomTasks", "resumeOrDocument", "resumeUrl"].includes(key)
                  )
                  .map(([key, value]) => {
                  if (!value || (Array.isArray(value) && value.length === 0)) return null;
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span className="text-sm font-medium">
                        {Array.isArray(value) ? value.join(", ") : String(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="heading-md">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="caption">Contact:</span>
              <Badge variant="secondary">Platform Chat</Badge>
            </div>
            <div className="flex justify-between">
              <span className="caption">Visibility:</span>
              <Badge variant={formData.visibility === "featured" ? "default" : "secondary"}>
                {formData.visibility === "featured" ? "Featured" : "Normal"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => onAgreeToTerms(checked === true)}
            className={errors?.agreedToTerms ? "border-destructive" : ""}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal cursor-pointer leading-relaxed"
          >
            I agree to the{" "}
            <a href="/terms" target="_blank" className="text-primary hover:underline">
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a href="/privacy" target="_blank" className="text-primary hover:underline">
              Privacy Policy
            </a>
            . I understand that my service will be reviewed by our team before going live.
            <span className="text-destructive">*</span>
          </Label>
        </div>
        {errors?.agreedToTerms && (
          <p className="caption text-destructive">{errors.agreedToTerms}</p>
        )}
      </div>

      {/* Status Notice */}
      <div className="p-4 rounded-lg border bg-muted/30">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Service Status</p>
            <p className="text-xs text-muted-foreground mt-1">
              After submission, your service will be in <strong>Pending Review</strong> status.
              Once approved by our team, it will go live and appear in search results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

