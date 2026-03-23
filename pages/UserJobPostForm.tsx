"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useMapboxGeocoder } from "@/hooks/useMapboxGeocoder";
import { FileText, MapPin, Clock, Loader2 } from "lucide-react";

export default function UserJobPostForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    lat: null as number | null,
    lng: null as number | null,
    durationText: "",
    category: "",
  });

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [categories, setCategories] = useState<Array<{ _id: string; name: string; slug: string }>>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent("/dashboard/buyer/job-posts/new")}`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    let mounted = true;
    api.categories
      .getAll(false, { includeSubcategories: true })
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.data) {
          const cats = (res.data as { categories?: Array<{ _id: string; name: string; slug: string }> })
            .categories;
          setCategories(Array.isArray(cats) ? cats : []);
        }
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const {
    isLoaded: mapboxLoaded,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    handleInputChange: handleAddressInputChange,
    getCurrentLocation,
  } = useMapboxGeocoder({
    onPlaceSelect: (place) => {
      const lat =
        typeof place.geometry.location.lat === "function"
          ? place.geometry.location.lat()
          : (place.geometry.location.lat as unknown as number);
      const lng =
        typeof place.geometry.location.lng === "function"
          ? place.geometry.location.lng()
          : (place.geometry.location.lng as unknown as number);
      setForm((f) => ({
        ...f,
        address: place.formatted_address,
        city: (place as { city?: string }).city || f.city,
        state: (place as { state?: string }).state || f.state,
        lat,
        lng,
      }));
      setIsGettingLocation(false);
    },
    onError: (err) => {
      setIsGettingLocation(false);
      toast({ title: "Location error", description: err, variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <DashboardLayout type="buyer">
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast({
        title: "Required fields",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: {
        title: string;
        description: string;
        category?: string;
        location?: {
          city: string;
          state?: string;
          address?: string;
          coordinates?: { lat: number; lng: number };
        };
        durationText?: string;
      } = {
        title: form.title.trim(),
        description: form.description.trim(),
      };

      if (form.category && form.category !== "none") {
        payload.category = form.category.trim();
      }

      if (form.address || form.city || form.state) {
        const parts = form.address.split(",").map((p) => p.trim()).filter(Boolean);
        const city =
          form.city.trim() ||
          (parts.length >= 2 ? parts[Math.max(0, parts.length - 3)] : parts[0]) ||
          "Unknown";
        const state =
          form.state.trim() ||
          (parts.length >= 2 ? parts[parts.length - 2] : undefined) ||
          undefined;
        const loc: {
          city: string;
          state?: string;
          address?: string;
          coordinates?: { lat: number; lng: number };
        } = {
          city,
          state,
          address: form.address.trim() || undefined,
        };
        if (form.lat != null && form.lng != null) {
          loc.coordinates = { lat: form.lat, lng: form.lng };
        }
        payload.location = loc;
      }

      if (form.durationText.trim()) {
        payload.durationText = form.durationText.trim();
      }

      const res = await api.userJobs.create(payload);
      if (res.success) {
        toast({
          title: "Job posted",
          description: "Your job is now visible to nearby providers.",
        });
        router.push("/dashboard/buyer/job-posts");
      } else {
        toast({
          title: "Error",
          description: res.error?.message || "Failed to create job post",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create job post",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout type="buyer">
      <div className="w-full max-w-2xl mx-auto px-4 py-6 md:py-10">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/dashboard/buyer/job-posts">
            ← My job posts
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Post a job
            </CardTitle>
            <CardDescription>
              Describe the work you need done. Verified providers on Imagineering India can view and apply.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Job title *</Label>
                <Input
                  id="title"
                  placeholder='e.g. "Need Electrician for 2BHK"'
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Clearly describe what help you need, when, and any special expectations."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  maxLength={500}
                  required
                />
                <p className="text-xs text-muted-foreground">{form.description.length}/500</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category || "none"}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v === "none" ? "" : v }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address / Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                  {!mapboxLoaded && (
                    <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground animate-spin z-10" />
                  )}
                  <Input
                    id="address"
                    placeholder={
                      mapboxLoaded
                        ? "Start typing for address suggestions (street, area, city)"
                        : "Loading location services..."
                    }
                    className="pl-9 pr-9"
                    value={form.address}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, address: e.target.value }));
                      handleAddressInputChange(e);
                    }}
                    onFocus={() =>
                      form.address.length >= 2 &&
                      handleAddressInputChange({
                        target: { value: form.address },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    disabled={!mapboxLoaded}
                    required
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-[2147483647] max-h-48 overflow-auto">
                      {suggestions.map((s, i) => (
                        <button
                          key={s.id || i}
                          type="button"
                          className="w-full px-3 py-2.5 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSuggestion(s);
                          }}
                        >
                          {s.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1"
                  onClick={() => {
                    setIsGettingLocation(true);
                    getCurrentLocation();
                  }}
                  disabled={!mapboxLoaded || isGettingLocation}
                >
                  {isGettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 mr-2" />
                  )}
                  Use my current location
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationText">Estimated duration</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="durationText"
                    className="pl-7"
                    placeholder='e.g. "2 days", "3 hours", "Monthly"'
                    value={form.durationText}
                    onChange={(e) => setForm((f) => ({ ...f, durationText: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    Jobs are shown to providers near your city. Exact address is only shared after you confirm.
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                  {isSubmitting ? "Posting..." : "Post job"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/buyer/job-posts">View my jobs</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
