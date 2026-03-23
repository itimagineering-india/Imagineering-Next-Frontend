"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tag, Plus, Upload, Loader2, Lock, Crown, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api-client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export async function getServerSideProps() { return { props: {} }; }

const initialForm = {
  title: "",
  description: "",
  discountType: "percentage" as "flat" | "percentage",
  discount: "",
  couponCode: "",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  termsAndConditions: "",
  bannerImageUrl: "",
};

export default function ProviderOffers() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [subscriptionAllowed, setSubscriptionAllowed] = useState<boolean | null>(null);
  const [currentOffer, setCurrentOffer] = useState<{
    title?: string;
    description?: string;
    bannerImageUrl?: string;
    validFrom?: string;
    validTo?: string;
  } | null>(null);
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.subscriptions.getMy("provider").then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        const d = res.data as { subscription?: { name?: string }; status?: string };
        const plan = (d.subscription?.name || "free").toLowerCase();
        const status = (d.status || "").toLowerCase();
        const isActive = status === "active";
        const isPaidPlan = plan !== "free";
        setSubscriptionAllowed(isActive && isPaidPlan);
      } else {
        setSubscriptionAllowed(false);
      }
    }).catch(() => setSubscriptionAllowed(false));
    return () => { cancelled = true; };
  }, []);

  // Load provider's current offer (banner) once subscription is confirmed
  useEffect(() => {
    if (!subscriptionAllowed) return;
    if (!user) return;

    let cancelled = false;

    const fetchCurrentOffer = async () => {
      try {
        setIsLoadingOffer(true);
        const userId = (user as any).id || (user as any)._id;
        if (!userId) return;
        const res = await api.providers.getByUserId(userId);
        if (!cancelled && res.success && res.data) {
          const data = (res.data as any).provider || res.data;
          setCurrentOffer({
            title: data.offerTitle,
            description: data.offerDescription,
            bannerImageUrl: data.offerBannerUrl,
            validFrom: data.offerValidFrom,
            validTo: data.offerValidTo,
          });
        }
      } catch {
        if (!cancelled) setCurrentOffer(null);
      } finally {
        if (!cancelled) setIsLoadingOffer(false);
      }
    };

    fetchCurrentOffer();
    return () => {
      cancelled = true;
    };
  }, [subscriptionAllowed, user]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image (JPEG, PNG, WebP, GIF)", variant: "destructive" });
      return;
    }
    setIsUploadingBanner(true);
    try {
      const res = await api.providers.uploadOfferImage(file);
      if (res.success && res.data?.url) {
        setForm((p) => ({ ...p, bannerImageUrl: res.data!.url }));
        toast({ title: "Uploaded", description: "Banner image uploaded" });
      } else {
        throw new Error((res as any).error?.message || "Upload failed");
      }
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || "Failed to upload", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast({ title: "Required", description: "Offer title is required", variant: "destructive" });
      return;
    }
    if (form.discountType === "percentage" && (Number(form.discount) < 0 || Number(form.discount) > 100)) {
      toast({ title: "Invalid discount", description: "Percentage must be between 0 and 100", variant: "destructive" });
      return;
    }
    if (!form.bannerImageUrl) {
      toast({
        title: "Banner required",
        description: "Please upload an offer banner image.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.providers.saveOffer({
        title: form.title,
        description: form.description,
        bannerImageUrl: form.bannerImageUrl,
        validFrom: form.startDate || undefined,
        validTo: form.endDate || undefined,
      });
      if (!res.success) {
        throw new Error((res as any).error?.message || "Failed to save offer");
      }

      toast({
        title: "Offer saved",
        description: "Your offer banner will now be visible on your public profile.",
      });
      setCurrentOffer({
        title: form.title,
        description: form.description,
        bannerImageUrl: form.bannerImageUrl,
        validFrom: form.startDate || undefined,
        validTo: form.endDate || undefined,
      });
      setForm(initialForm);
    } catch {
      toast({ title: "Error", description: "Failed to save offer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subscriptionAllowed === null) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Checking subscription…</p>
        </div>
      </div>
    );
  }

  if (!subscriptionAllowed) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Add Offer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create offers and promotions for your services.
          </p>
        </div>
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Lock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Subscription required</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Add Offer is a premium feature. Subscribe to a plan to create and manage offers for your services.
            </p>
            <Button asChild className="gap-2">
              <Link href="/dashboard/provider/subscription">
                <Crown className="h-4 w-4" />
                View subscription plans <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Add Offer</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create offers and promotions for your services. Buyers will see these on your profile and service pages.
        </p>
      </div>

      {/* Existing / current offer banner preview */}
      {isLoadingOffer ? (
        <Card className="border bg-card">
          <CardContent className="py-6 text-sm text-muted-foreground text-center">
            Loading your current offer…
          </CardContent>
        </Card>
      ) : currentOffer?.bannerImageUrl ? (
        <Card className="border bg-card">
          <CardHeader>
            <CardTitle className="text-base md:text-lg">Current Offer</CardTitle>
            {currentOffer.title && (
              <CardDescription className="text-xs md:text-sm">
                This banner is currently visible on your public profile.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border overflow-hidden w-full md:max-w-3xl aspect-[4/1] bg-muted">
              <img
                src={currentOffer.bannerImageUrl}
                alt={currentOffer.title || "Current offer banner"}
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="space-y-1 text-sm">
              {currentOffer.title && (
                <p className="font-semibold text-foreground">{currentOffer.title}</p>
              )}
              {currentOffer.description && (
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                  {currentOffer.description}
                </p>
              )}
              {(currentOffer.validFrom || currentOffer.validTo) && (
                <p className="text-xs text-muted-foreground">
                  Valid{" "}
                  {currentOffer.validFrom &&
                    `from ${new Date(currentOffer.validFrom).toLocaleDateString()}`}
                  {currentOffer.validTo &&
                    ` to ${new Date(currentOffer.validTo).toLocaleDateString()}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            New offer
          </CardTitle>
          <CardDescription>Add a promotional offer (e.g. discount, seasonal deal)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
            <div className="space-y-2">
              <Label htmlFor="title">Offer title *</Label>
              <Input
                id="title"
                placeholder="e.g. 20% off on first booking"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Short description of the offer"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Discount type: Flat or Percentage */}
            <div className="space-y-2">
              <Label>Discount type</Label>
              <Select
                value={form.discountType}
                onValueChange={(v: "flat" | "percentage") => setForm((p) => ({ ...p, discountType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="flat">Flat amount (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">
                Discount {form.discountType === "percentage" ? "(%)" : "(₹)"}
              </Label>
              <Input
                id="discount"
                type="text"
                inputMode="numeric"
                placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                value={form.discount}
                onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon / Voucher code</Label>
              <Input
                id="couponCode"
                placeholder="e.g. SAVE20 or FIRST500"
                value={form.couponCode}
                onChange={(e) => setForm((p) => ({ ...p, couponCode: e.target.value.toUpperCase() }))}
                className="uppercase"
              />
            </div>

            {/* Duration: Start & End date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Time: Start & End time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Terms and conditions</Label>
              <Textarea
                placeholder="e.g. Valid on first booking only. Cannot be combined with other offers."
                value={form.termsAndConditions}
                onChange={(e) => setForm((p) => ({ ...p, termsAndConditions: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Banner upload */}
            <div className="space-y-2">
              <Label>Offer banner image</Label>
              <p className="text-xs text-muted-foreground">Recommended size: 1200×400 px. Image will be stored in S3.</p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    id="offer-banner"
                    onChange={handleBannerUpload}
                    disabled={isUploadingBanner}
                  />
                  <Label htmlFor="offer-banner" className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                      <span>
                        {isUploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {isUploadingBanner ? "Uploading…" : "Upload banner"}
                      </span>
                    </Button>
                  </Label>
                </div>
                {form.bannerImageUrl && (
                  <div className="rounded-lg border overflow-hidden max-w-md aspect-[3/1] bg-muted">
                    <img src={form.bannerImageUrl} alt="Offer banner" className="w-full h-full object-cover" />
                  </div>
                )}
                <Input
                  placeholder="Or paste image URL (optional)"
                  value={form.bannerImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, bannerImageUrl: e.target.value }))}
                />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <Plus className="h-4 w-4" />
              {isSubmitting ? "Saving…" : "Add offer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
