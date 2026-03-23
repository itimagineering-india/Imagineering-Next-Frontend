"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { FileText, MapPin, Send, Paperclip, Loader2, Crosshair } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/UserLocationContext";

export async function getServerSideProps() { return { props: {} }; }

export default function SubmitRequirement() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ url: string; name?: string }>>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    expectedBudget: "",
    preferredTimeline: "",
  });
  const { userLocation, isLoading: isLocationLoading, refreshLocation } = useUserLocation();
  const [locationRequested, setLocationRequested] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!authLoading && !isAuthenticated) {
    router.push(`/login?redirect=${encodeURIComponent("/requirement/submit")}`);
    return null;
  }

  useEffect(() => {
    if (!locationRequested || !userLocation) return;
    setForm((f) => ({
      ...f,
      address: userLocation.address || f.address,
      city: userLocation.city || f.city,
    }));
  }, [locationRequested, userLocation]);

  const handleUseCurrentLocation = () => {
    setLocationRequested(true);
    refreshLocation();
  };

  const handleDocumentButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocumentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDoc(true);
    try {
      const res = await api.requirements.uploadDocument(file);
      if (res.success && res.data) {
        const d = res.data as { url?: string; name?: string };
        setAttachments((prev) => [...prev, { url: d.url ?? "", name: d.name || file.name }]);
        toast({
          title: "Document uploaded",
          description: file.name,
        });
      } else {
        toast({
          title: "Upload failed",
          description: res.error?.message || "Could not upload document",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err?.message || "Could not upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploadingDoc(false);
      // reset input value so same file can be re-selected if needed
      e.target.value = "";
    }
  };

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
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
      };
      if (form.address || form.city || form.state || form.zipCode) {
        payload.location = {
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          zipCode: form.zipCode.trim() || undefined,
        };
      }
      if (form.expectedBudget.trim()) {
        const num = Number(form.expectedBudget.replace(/\D/g, ""));
        if (!isNaN(num)) payload.expectedBudget = num;
      }
      if (form.preferredTimeline.trim()) payload.preferredTimeline = form.preferredTimeline.trim();

      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      const res = await api.requirements.create(payload);
      if (res.success) {
        toast({
          title: "Requirement submitted",
          description: "Admin will review and send you a quote soon.",
        });
        setForm({
          title: "",
          description: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          expectedBudget: "",
          preferredTimeline: "",
        });
        setAttachments([]);
        router.push("/dashboard/buyer/requirements");
      } else {
        toast({
          title: "Error",
          description: res.error?.message || "Failed to submit requirement",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to submit requirement",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit your requirement
              </CardTitle>
              <CardDescription>
                Describe what you need (e.g. house construction, contractor + material + manpower). Admin will send you a quote and arrange everything once you approve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Your Requirement *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Full house construction - contractor, material, manpower"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your requirement in detail: location, size, timeline, any specific needs..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={5}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street / area"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Pincode</Label>
                    <Input
                      id="zipCode"
                      placeholder="Pincode"
                      value={form.zipCode}
                      onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>Location helps admin arrange contractor/material in your area.</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit flex items-center gap-2"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocationLoading}
                  >
                    {isLocationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crosshair className="h-4 w-4" />
                    )}
                    Use my current location
                  </Button>
                  {userLocation?.city && (
                    <span className="text-xs text-muted-foreground">
                      Detected approx: {userLocation.city}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expectedBudget">Expected budget (₹)</Label>
                    <Input
                      id="expectedBudget"
                      placeholder="e.g. 500000"
                      value={form.expectedBudget}
                      onChange={(e) => setForm((f) => ({ ...f, expectedBudget: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredTimeline">Preferred timeline</Label>
                    <Input
                      id="preferredTimeline"
                      placeholder="e.g. 3-6 months"
                      value={form.preferredTimeline}
                      onChange={(e) => setForm((f) => ({ ...f, preferredTimeline: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Attach document (PDF, DOC, DOCX)</Label>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={handleDocumentChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={handleDocumentButtonClick}
                    >
                      {isUploadingDoc ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Paperclip className="h-4 w-4" />
                      )}
                      {isUploadingDoc ? "Uploading..." : "Upload document"}
                    </Button>
                    {attachments.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Attached: {attachments.map((a) => a.name || "Document").join(", ")}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                    {isSubmitting ? "Submitting..." : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit requirement
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/buyer/requirements")}
                  >
                    View my requirements
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
