"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { format, parse } from "date-fns";
import { FileText, Send, Paperclip, Loader2, Crosshair, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/UserLocationContext";

export async function getServerSideProps() { return { props: {} }; }

type CategoryRow = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  subcategories?: string[];
};

/** When API has no subcategories for manpower, still offer common labour types */
const MANPOWER_FALLBACK_SUBS = [
  "Skilled labour",
  "Unskilled labour",
  "Helper / mazdoor mix",
  "Other (explain in notes)",
];

function categoryKey(c: CategoryRow): string {
  return String(c._id ?? c.id ?? c.slug ?? "");
}

type RequirementLine = { id: string; sub: string; qty: string };

function newRequirementLine(): RequirementLine {
  return {
    id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    sub: "",
    qty: "",
  };
}

function formatDateLabel(date?: Date): string {
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInclusiveDayCount(from?: Date, to?: Date): number | null {
  if (!from || !to) return null;
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  if (end < start) return null;
  return Math.floor((end - start) / 86400000) + 1;
}

function toDateInputValue(d?: Date): string {
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

export default function SubmitRequirement() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ url: string; name?: string }>>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("");
  const [lineItems, setLineItems] = useState<RequirementLine[]>(() => [newRequirementLine()]);
  const [preferredFromDate, setPreferredFromDate] = useState<Date | undefined>(undefined);
  const [preferredToDate, setPreferredToDate] = useState<Date | undefined>(undefined);
  const [form, setForm] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    expectedBudget: "",
    preferredTimeline: "",
    additionalNotes: "",
  });
  const { userLocation, isLoading: isLocationLoading, refreshLocation } = useUserLocation();
  const [locationRequested, setLocationRequested] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent("/requirement/submit")}`);
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!locationRequested || !userLocation) return;
    setForm((f) => ({
      ...f,
      address: userLocation.address || f.address,
      city: userLocation.city || f.city,
    }));
  }, [locationRequested, userLocation]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let cancelled = false;
    setCategoriesLoading(true);
    api.categories
      .getAll(false, { includeSubcategories: true })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const cats = (res.data as { categories?: CategoryRow[] }).categories ?? [];
          setCategories(Array.isArray(cats) ? cats : []);
        } else {
          setCategories([]);
        }
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    setLineItems([newRequirementLine()]);
  }, [categoryId]);

  const updateLine = (id: string, patch: Partial<Pick<RequirementLine, "sub" | "qty">>) => {
    setLineItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addLine = () => {
    setLineItems((rows) => [...rows, newRequirementLine()]);
  };

  const removeLine = (id: string) => {
    setLineItems((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  };

  const selectedCategory = useMemo(
    () => categories.find((c) => categoryKey(c) === categoryId) ?? null,
    [categories, categoryId],
  );

  const subcategoryOptions = useMemo(() => {
    if (!selectedCategory) return [];
    const raw = selectedCategory.subcategories;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    if (selectedCategory.slug === "manpower") return MANPOWER_FALLBACK_SUBS;
    return [];
  }, [selectedCategory]);

  const sortedCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => Boolean(categoryKey(c)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const preferredDayCount = useMemo(
    () => getInclusiveDayCount(preferredFromDate, preferredToDate),
    [preferredFromDate, preferredToDate],
  );

  const preferredTimelineText = useMemo(() => {
    const fromLabel = formatDateLabel(preferredFromDate);
    const toLabel = formatDateLabel(preferredToDate);
    if (!fromLabel || !toLabel || !preferredDayCount) return "";
    const daysWord = preferredDayCount === 1 ? "day" : "days";
    return `${fromLabel} to ${toLabel} (${preferredDayCount} ${daysWord})`;
  }, [preferredDayCount, preferredFromDate, preferredToDate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
    if (!categoryId) {
      toast({
        title: "Category required",
        description: "Please choose a category.",
        variant: "destructive",
      });
      return;
    }
    const parsed: { sub: string; qty: number }[] = [];
    for (const row of lineItems) {
      const s = row.sub.trim();
      const q = Number.parseInt(row.qty, 10);
      if (!s && !row.qty.trim()) continue;
      if (!s || !Number.isFinite(q) || q < 1) {
        toast({
          title: "Complete each line",
          description:
            "Every row needs a subcategory/type and a quantity (minimum 1). Remove extra rows or fill them in.",
          variant: "destructive",
        });
        return;
      }
      parsed.push({ sub: s, qty: q });
    }
    if (parsed.length === 0) {
      toast({
        title: "Add at least one item",
        description:
          subcategoryOptions.length > 0
            ? "Select type and quantity for each line you need."
            : "Enter type and quantity for each line (e.g. skilled labour — 10).",
        variant: "destructive",
      });
      return;
    }

    const merged = new Map<string, number>();
    for (const { sub, qty } of parsed) {
      merged.set(sub, (merged.get(sub) ?? 0) + qty);
    }
    const lineBullets = [...merged.entries()].map(([sub, qty]) => `• ${sub}: ${qty}`);
    const catName = selectedCategory?.name?.trim() || "Service";
    const titleParts = [...merged.keys()];
    const titleSuffix =
      titleParts.length <= 2 ? titleParts.join(", ") : `${titleParts.slice(0, 2).join(", ")} +${titleParts.length - 2}`;
    const title = `${catName} — ${titleSuffix}`.slice(0, 200);
    const description = [
      "Requirement submitted via Imagineering India structured form.",
      "",
      `• Category: ${catName}`,
      "• Items requested (subcategory / type and quantity):",
      ...lineBullets,
      "",
      "Additional details from buyer:",
      form.additionalNotes.trim() || "(None — admin may follow up for clarification.)",
    ].join("\n");

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title,
        description,
      };
      const rawCatId = selectedCategory?._id ?? selectedCategory?.id;
      if (rawCatId && /^[a-f\d]{24}$/i.test(String(rawCatId))) {
        payload.category = String(rawCatId);
      }
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
        if (!Number.isNaN(num)) payload.expectedBudget = num;
      }
      const timeline = preferredTimelineText || form.preferredTimeline.trim();
      if (timeline) payload.preferredTimeline = timeline;

      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      const res = await api.requirements.create(
        payload as Parameters<typeof api.requirements.create>[0],
      );
      if (res.success) {
        toast({
          title: "Requirement submitted",
          description: "Admin will review and send you a quote. You can approve it from My requirements.",
        });
        setCategoryId("");
        setLineItems([newRequirementLine()]);
        setForm({
          address: "",
          city: "",
          state: "",
          zipCode: "",
          expectedBudget: "",
          preferredTimeline: "",
          additionalNotes: "",
        });
        setPreferredFromDate(undefined);
        setPreferredToDate(undefined);
        setAttachments([]);
        router.push("/dashboard/buyer/requirements");
      } else {
        toast({
          title: "Error",
          description: res.error?.message || "Failed to submit requirement",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit requirement",
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
                Choose category, add one or more sub-types (e.g. skilled and unskilled labour) with quantity for each, then add any extra notes. Imagineering India admin will prepare a quotation; after you approve it in{" "}
                <strong>My requirements</strong>, work can move to payment and execution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3.5">
                  <Label>Category *</Label>
                  <Select
                    value={categoryId || undefined}
                    onValueChange={setCategoryId}
                    disabled={categoriesLoading}
                  >
                    <SelectTrigger className="h-11 w-full rounded-lg">
                      <SelectValue placeholder={categoriesLoading ? "Loading categories…" : "Select a category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedCategories.map((c) => (
                        <SelectItem key={categoryKey(c)} value={categoryKey(c)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {categoryId ? (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Label>Subcategory / type & quantity *</Label>
                      <Button type="button" variant="outline" size="sm" className="h-9 gap-1 shrink-0" onClick={addLine}>
                        <Plus className="h-4 w-4" />
                        Add another line
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {subcategoryOptions.length > 0
                        ? "Pick a type and count per row. Same type on multiple rows is combined in the summary."
                        : "This category has no preset list — type each line (e.g. skilled labour, JCB) and how many you need."}
                    </p>
                    <div className="space-y-3">
                      {lineItems.map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3 rounded-lg border border-border/60 bg-muted/20 p-3"
                        >
                          <div className="flex-1 space-y-2.5 min-w-0">
                            <span className="text-xs font-medium text-muted-foreground">Type</span>
                            {subcategoryOptions.length > 0 ? (
                              <Select
                                value={row.sub || undefined}
                                onValueChange={(v) => updateLine(row.id, { sub: v })}
                              >
                                <SelectTrigger className="h-11 w-full rounded-lg">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subcategoryOptions.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                placeholder="e.g. OPC cement, site supervisor…"
                                value={row.sub}
                                onChange={(e) => updateLine(row.id, { sub: e.target.value })}
                                className="h-11 rounded-lg"
                              />
                            )}
                          </div>
                          <div className="w-full sm:w-28 space-y-2.5 shrink-0">
                            <span className="text-xs font-medium text-muted-foreground">Qty</span>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={1}
                              step={1}
                              placeholder="e.g. 10"
                              value={row.qty}
                              onChange={(e) => updateLine(row.id, { qty: e.target.value.replace(/\D/g, "") })}
                              className="h-11 rounded-lg"
                            />
                          </div>
                          {lineItems.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive self-end sm:self-auto"
                              onClick={() => removeLine(row.id)}
                              aria-label="Remove line"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <div className="hidden sm:block sm:w-11 shrink-0" aria-hidden />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3.5">
                  <Label htmlFor="additionalNotes">Additional notes (optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Site address details, duration, shifts, safety needs, drawings…"
                    value={form.additionalNotes}
                    onChange={(e) => setForm((f) => ({ ...f, additionalNotes: e.target.value }))}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3.5">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Street / area"
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="City"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="State"
                      value={form.state}
                      onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-3.5">
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
                <div className="space-y-6">
                  <div className="space-y-3.5">
                    <Label>Preferred timeline</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2.5">
                        <span className="text-xs font-medium text-muted-foreground">From</span>
                        <Input
                          type="date"
                          className="h-11 rounded-lg [color-scheme:light] dark:[color-scheme:dark]"
                          value={toDateInputValue(preferredFromDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                              setPreferredFromDate(undefined);
                              setPreferredToDate(undefined);
                              setForm((f) => ({ ...f, preferredTimeline: "" }));
                              return;
                            }
                            const parsed = parse(v, "yyyy-MM-dd", new Date());
                            if (Number.isNaN(parsed.getTime())) return;
                            setPreferredFromDate(parsed);
                            setPreferredToDate(undefined);
                            setForm((f) => ({ ...f, preferredTimeline: "" }));
                          }}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <span className="text-xs font-medium text-muted-foreground">To</span>
                        <Input
                          type="date"
                          className="h-11 rounded-lg [color-scheme:light] dark:[color-scheme:dark]"
                          min={preferredFromDate ? toDateInputValue(preferredFromDate) : undefined}
                          disabled={!preferredFromDate}
                          value={toDateInputValue(preferredToDate)}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                              setPreferredToDate(undefined);
                              setForm((f) => ({ ...f, preferredTimeline: "" }));
                              return;
                            }
                            const parsed = parse(v, "yyyy-MM-dd", new Date());
                            if (Number.isNaN(parsed.getTime()) || !preferredFromDate) return;
                            setPreferredToDate(parsed);
                            const count = getInclusiveDayCount(preferredFromDate, parsed);
                            const fromLabel = formatDateLabel(preferredFromDate);
                            const toLabel = formatDateLabel(parsed);
                            if (count && fromLabel && toLabel) {
                              const daysWord = count === 1 ? "day" : "days";
                              setForm((f) => ({
                                ...f,
                                preferredTimeline: `${fromLabel} to ${toLabel} (${count} ${daysWord})`,
                              }));
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {preferredDayCount
                          ? `Auto duration: ${preferredDayCount} ${preferredDayCount === 1 ? "day" : "days"}`
                          : "Uses your device date picker. To must be on or after From."}
                      </p>
                      {preferredFromDate || preferredToDate ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPreferredFromDate(undefined);
                            setPreferredToDate(undefined);
                            setForm((f) => ({ ...f, preferredTimeline: "" }));
                          }}
                        >
                          Clear
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="space-y-3.5">
                    <Label htmlFor="expectedBudget">
                      Expected budget (₹){" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="expectedBudget"
                      placeholder="e.g. 500000"
                      value={form.expectedBudget}
                      onChange={(e) => setForm((f) => ({ ...f, expectedBudget: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-3.5">
                  <Label>
                    Attach document (PDF, DOC, DOCX){" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
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
