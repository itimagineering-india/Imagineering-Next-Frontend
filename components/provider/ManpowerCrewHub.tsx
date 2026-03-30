"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";
import { LabourWorkerCard, type LabourWorkerListItem } from "@/components/provider/LabourWorkerCard";
import { LabourViewModeToggle, type LabourViewMode } from "@/components/provider/LabourViewModeToggle";
import {
  LABOUR_BROWSE_DEFAULT_FILTERS,
  type LabourBrowseFilters,
} from "@/components/provider/LabourDirectoryFilters";
import { LabourFilterDialog } from "@/components/provider/LabourFilterDialog";
import { AuthLoadingSpinner, SignInRequiredPrompt } from "@/components/auth/DashboardAuthPrompts";

type CrewRequest = {
  _id: string;
  title: string;
  description: string;
  headcount: number;
  acceptedCount?: number;
  status: string;
  location?: { city?: string; state?: string; address?: string };
  startDate?: string | Date;
  endDate?: string | Date;
  createdAt?: string;
};

type InviteRow = {
  _id: string;
  status: string;
  crewRequest?: CrewRequest | Record<string, unknown>;
  createdAt?: string;
};

export default function ManpowerCrewHub() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const todayStr = new Date().toISOString().slice(0, 10);

  const [loadingLists, setLoadingLists] = useState(true);
  const [mine, setMine] = useState<CrewRequest[]>([]);
  const [incoming, setIncoming] = useState<InviteRow[]>([]);

  const [workers, setWorkers] = useState<LabourWorkerListItem[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [viewMode, setViewMode] = useState<LabourViewMode>("grid");
  const [browseFilters, setBrowseFilters] = useState<LabourBrowseFilters>(LABOUR_BROWSE_DEFAULT_FILTERS);
  const [debouncedLocation, setDebouncedLocation] = useState({
    addressQ: "",
    city: "",
    state: "",
    minExperience: "",
    maxPrice: "",
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // Labour directory availability filter (date range).
  // Workers list will exclude providers who are already booked in overlapping accepted requests.
  const [availabilityRange, setAvailabilityRange] = useState({
    startDate: todayStr,
    endDate: todayStr,
  });

  const [modalForm, setModalForm] = useState({
    title: "Labour requirement",
    description: "",
    headcount: "1",
    city: "",
    startTime: "09:00",
    endTime: "17:00",
  });

  const myUserId = user?._id ? String(user._id) : "";

  const scheduleShort = (startDate?: string | Date, endDate?: string | Date) => {
    if (!startDate || !endDate) return "";
    const s = startDate instanceof Date ? startDate : new Date(startDate);
    const e = endDate instanceof Date ? endDate : new Date(endDate);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
    const msPerDay = 1000 * 60 * 60 * 24;
    const durationDays = Math.max(1, Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1);
    const startT = s.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const endT = e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return ` · ${durationDays} day${durationDays === 1 ? "" : "s"} (${startT}-${endT})`;
  };

  const loadLists = useCallback(async () => {
    setLoadingLists(true);
    try {
      const [r1, r2] = await Promise.all([
        api.manpowerCrew.listMine({ limit: 50 }),
        api.manpowerCrew.listWorkerInvites({ limit: 50 }),
      ]);
      const d1 = r1 as { success?: boolean; data?: { crewRequests?: CrewRequest[] } };
      const d2 = r2 as { success?: boolean; data?: { invites?: InviteRow[] } };
      setMine(d1.data?.crewRequests ?? []);
      setIncoming(d2.data?.invites ?? []);
    } catch {
      toast({ title: "Failed to load", variant: "destructive" });
    } finally {
      setLoadingLists(false);
    }
  }, [toast]);

  const loadWorkers = useCallback(async () => {
    setLoadingWorkers(true);
    try {
      const minExpN =
        debouncedLocation.minExperience === ""
          ? undefined
          : Number.parseFloat(debouncedLocation.minExperience);
      const maxPriceN =
        debouncedLocation.maxPrice === "" ? undefined : Number.parseFloat(debouncedLocation.maxPrice);
      const res = (await api.manpowerCrew.browseLabour({
        categorySlug: browseFilters.categorySlugs || "manpower,technical-manpower",
        q: searchQ || undefined,
        sort: browseFilters.sort,
        addressQ: debouncedLocation.addressQ || undefined,
        city: debouncedLocation.city || undefined,
        state: debouncedLocation.state || undefined,
        startDate: (() => {
          const [y, m, d] = availabilityRange.startDate.split("-").map((x) => Number.parseInt(x, 10));
          const dt = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
          return dt.toISOString();
        })(),
        endDate: (() => {
          const [y, m, d] = availabilityRange.endDate.split("-").map((x) => Number.parseInt(x, 10));
          const dt = new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
          return dt.toISOString();
        })(),
        minRating:
          browseFilters.minRating === "" ? undefined : Number.parseFloat(browseFilters.minRating),
        minExperience:
          minExpN != null && Number.isFinite(minExpN) && minExpN >= 0 ? minExpN : undefined,
        maxPrice:
          maxPriceN != null && Number.isFinite(maxPriceN) && maxPriceN >= 0 ? maxPriceN : undefined,
        subManpower: browseFilters.subManpower.trim() || undefined,
        subTechnical: browseFilters.subTechnical.trim() || undefined,
        limit: 80,
        page: 1,
      })) as { data?: { workers?: LabourWorkerListItem[] } };
      setWorkers(res.data?.workers ?? []);
    } catch {
      toast({ title: "Could not load labour list", variant: "destructive" });
    } finally {
      setLoadingWorkers(false);
    }
  }, [
    searchQ,
    browseFilters.sort,
    browseFilters.minRating,
    browseFilters.categorySlugs,
    browseFilters.subManpower,
    browseFilters.subTechnical,
    debouncedLocation,
    availabilityRange.startDate,
    availabilityRange.endDate,
    toast,
  ]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    if (user) loadWorkers();
  }, [user, loadWorkers]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQ(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedLocation({
        addressQ: browseFilters.addressQ.trim(),
        city: browseFilters.city.trim(),
        state: browseFilters.state.trim(),
        minExperience: browseFilters.minExperience.trim(),
        maxPrice: browseFilters.maxPrice.trim(),
      });
    }, 400);
    return () => clearTimeout(t);
  }, [
    browseFilters.addressQ,
    browseFilters.city,
    browseFilters.state,
    browseFilters.minExperience,
    browseFilters.maxPrice,
  ]);

  const toggle = (userId: string) => {
    if (!userId || userId === myUserId) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(userId)) n.delete(userId);
      else n.add(userId);
      return n;
    });
  };

  const inviteIds = useMemo(() => Array.from(selected), [selected]);

  const openSendModal = () => {
    if (inviteIds.length === 0) {
      toast({ title: "Select at least one worker first", variant: "destructive" });
      return;
    }
    setModalForm((f) => ({
      ...f,
      headcount: String(Math.max(inviteIds.length, Number.parseInt(f.headcount, 10) || inviteIds.length)),
    }));
    setSendOpen(true);
  };

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const headcount = Number.parseInt(modalForm.headcount, 10);
    if (!modalForm.title.trim() || !modalForm.description.trim() || !Number.isFinite(headcount) || headcount < 1) {
      toast({ title: "Title, details, and worker count are required", variant: "destructive" });
      return;
    }
    if (inviteIds.length === 0) {
      toast({ title: "No workers selected", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const startTimeStr = modalForm.startTime.trim();
      const endTimeStr = modalForm.endTime.trim() || startTimeStr;

      const parseLocalIso = (dateStr: string, timeStr: string) => {
        // date/time inputs are local (no timezone). Convert to ISO string for backend.
        const [y, m, d] = dateStr.split("-").map((x) => Number.parseInt(x, 10));
        const [hh, mm] = timeStr.split(":").map((x) => Number.parseInt(x, 10));
        const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
        return dt.toISOString();
      };

      const startDateISO = availabilityRange.startDate ? parseLocalIso(availabilityRange.startDate, startTimeStr) : undefined;
      const endDateISO = availabilityRange.endDate ? parseLocalIso(availabilityRange.endDate, endTimeStr) : undefined;

      const location =
        modalForm.city.trim() ? ({ address: modalForm.city.trim() } as const) : undefined;

      const createRes = await api.manpowerCrew.create({
        title: modalForm.title.trim(),
        description: modalForm.description.trim(),
        headcount,
        location,
        startDate: startDateISO,
        endDate: endDateISO,
      });
      const ok = (createRes as { success?: boolean }).success;
      const cr = (createRes as { data?: { crewRequest?: { _id?: string } } }).data?.crewRequest;
      const crewId = cr?._id ? String(cr._id) : "";

      if (!ok || !crewId) {
        toast({
          title: "Could not save request",
          description: (createRes as { error?: { message?: string } }).error?.message,
          variant: "destructive",
        });
        return;
      }

      const invRes = await api.manpowerCrew.inviteBatch(crewId, inviteIds);
      if (!(invRes as { success?: boolean }).success) {
        toast({
          title: "Request created but invites failed",
          description: (invRes as { error?: { message?: string } }).error?.message,
          variant: "destructive",
        });
        router.push(`/dashboard/provider/manpower-crew/${crewId}`);
        return;
      }

      toast({
        title: "Request sent",
        description: `Notifications sent to ${inviteIds.length} worker${inviteIds.length === 1 ? "" : "s"}.`,
      });
      setSendOpen(false);
      setSelected(new Set());
      setModalForm({
        title: "Labour requirement",
        description: "",
        headcount: "1",
        city: "",
        startTime: "09:00",
        endTime: "17:00",
      });
      await loadLists();
      router.push(`/dashboard/provider/manpower-crew/${crewId}`);
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const respond = async (inviteId: string, action: "accept" | "decline") => {
    try {
      const res = await api.manpowerCrew.respondInvite(inviteId, action);
      if ((res as { success?: boolean }).success) {
        toast({ title: action === "accept" ? "Accepted" : "Declined" });
        await loadLists();
      } else {
        toast({
          title: "Failed",
          description: (res as { error?: { message?: string } }).error?.message,
          variant: "destructive",
        });
      }
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <SignInRequiredPrompt />;
  }

  return (
    <div className="max-w-[1600px] mx-auto min-w-0 w-full space-y-0 px-3 py-4 sm:px-4 md:p-6 overflow-x-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="w-full rounded-2xl border border-border/60 bg-card/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-100 to-blue-50 dark:from-zinc-900 dark:to-blue-950/30 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-white/70 dark:bg-white/5 flex items-center justify-center shadow-sm">
              <span aria-hidden className="text-xl">
                👷
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">Hire Workers</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Select workers and send job requests easily
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <Tabs defaultValue="browse" className="w-full min-w-0">
            <TabsList className="flex w-full h-auto flex-nowrap justify-start gap-2 overflow-x-auto overscroll-x-contain bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger
                value="browse"
                className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-out data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:hover:bg-[#2563eb] dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                Labour directory
              </TabsTrigger>
              <TabsTrigger
                value="mine"
                className="shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 ease-out data-[state=active]:bg-[#2563eb] data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:hover:bg-[#2563eb] dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                My requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="space-y-4 mt-3">
          <Card>
            <CardContent className="space-y-4 min-w-0 overflow-hidden p-6">
              <div className="flex flex-col gap-3 min-w-0">
                <div className="relative w-full min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    className="pl-9 h-11 sm:h-10 text-base sm:text-sm min-w-0"
                    placeholder="Name, city, or address…"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    autoComplete="off"
                  />
                </div>

                <div className="bg-muted/30 border border-border/60 rounded-xl px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
                  <div className="flex-1">
                    <Label htmlFor="hub-start-date" className="sr-only">
                      Start date
                    </Label>
                    <Input
                      id="hub-start-date"
                      type="date"
                      className="h-9"
                      aria-label="Start date"
                      value={availabilityRange.startDate}
                      onChange={(e) => setAvailabilityRange((r) => ({ ...r, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="hub-end-date" className="sr-only">
                      End date
                    </Label>
                    <Input
                      id="hub-end-date"
                      type="date"
                      className="h-9"
                      aria-label="End date"
                      value={availabilityRange.endDate}
                      onChange={(e) => setAvailabilityRange((r) => ({ ...r, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 w-full min-w-0 flex-wrap sm:flex-nowrap">
                  <LabourFilterDialog
                    idPrefix="hub"
                    filters={browseFilters}
                    onChange={setBrowseFilters}
                    onClear={() => {
                      setBrowseFilters(LABOUR_BROWSE_DEFAULT_FILTERS);
                      setDebouncedLocation({
                        addressQ: "",
                        city: "",
                        state: "",
                        minExperience: "",
                        maxPrice: "",
                      });
                      setAvailabilityRange({ startDate: todayStr, endDate: todayStr });
                    }}
                  />
                  <LabourViewModeToggle value={viewMode} onChange={setViewMode} className="shrink-0" />
                </div>
              </div>

              {loadingWorkers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : workers.length === 0 ? (
                <p className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/30">
                  No worker profiles match this filter. Try another category, or ensure workers have listed services
                  under Manpower with the right primary category.
                </p>
              ) : (
                <div className="max-h-[min(60dvh,520px)] sm:max-h-[min(720px,70vh)] overflow-y-auto overflow-x-hidden -mx-1 px-1 min-w-0 touch-pan-y">
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-w-0"
                        : "flex flex-col gap-3 min-w-0"
                    }
                  >
                    {workers.map((w) => {
                      const uid = w.userId;
                      if (!uid || uid === myUserId) return null;
                      return (
                        <LabourWorkerCard
                          key={uid}
                          layout={viewMode}
                          worker={w}
                          selected={selected.has(uid)}
                          onToggle={() => toggle(uid)}
                          checkboxId={`hub-${uid}`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {inviteIds.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  <strong>{inviteIds.length}</strong> selected — click &quot;Send request&quot; to continue.
                </p>
              )}

              <Button size="lg" className="w-full sm:w-auto" onClick={openSendModal} disabled={inviteIds.length === 0}>
                Send request ({inviteIds.length})
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mine" className="mt-3">
          <h2 className="text-lg font-semibold mb-3">Your crew requests</h2>
          {loadingLists ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : mine.length === 0 ? (
            <p className="text-muted-foreground">
              No requests yet. Start from the &quot;Labour directory&quot; tab to send one.
            </p>
          ) : (
            <ul className="space-y-3">
              {mine.map((c) => (
                <li key={c._id}>
                  <Link
                    href={`/dashboard/provider/manpower-crew/${c._id}`}
                    className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium">{c.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {c.acceptedCount ?? 0} / {c.headcount} accepted · {c.status}
                      {c.location?.address ? ` · ${c.location.address}` : c.location?.city ? ` · ${c.location.city}` : ""}
                      {scheduleShort(c.startDate, c.endDate)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* Incoming invites tab removed. Use Provider Leads page instead. */}
      </Tabs>

        {/* Close Tabs body + card wrapper */}
      </div>
    </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="w-[calc(100vw-1.25rem)] max-w-md max-h-[90dvh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <form onSubmit={submitRequest} className="min-w-0">
            <DialogHeader>
              <DialogTitle>Request details</DialogTitle>
              <DialogDescription>
                Workers will see this summary. You have selected {inviteIds.length} worker
                {inviteIds.length === 1 ? "" : "s"}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="m-title">Short title</Label>
                <Input
                  id="m-title"
                  value={modalForm.title}
                  onChange={(e) => setModalForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-desc">Job details</Label>
                <Textarea
                  id="m-desc"
                  rows={3}
                  value={modalForm.description}
                  onChange={(e) => setModalForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Site, schedule, duration, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="m-hc">Total workers needed</Label>
                  <Input
                    id="m-hc"
                    type="number"
                    min={1}
                    max={500}
                    value={modalForm.headcount}
                    onChange={(e) => setModalForm((f) => ({ ...f, headcount: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-days">Duration (days)</Label>
                  <Input id="m-days" type="number" value={(() => {
                    const [sy, sm, sd] = availabilityRange.startDate.split("-").map((x) => Number.parseInt(x, 10));
                    const [ey, em, ed] = availabilityRange.endDate.split("-").map((x) => Number.parseInt(x, 10));
                    const s = new Date(sy, (sm || 1) - 1, sd || 1);
                    const e = new Date(ey, (em || 1) - 1, ed || 1);
                    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 1;
                    const msPerDay = 1000 * 60 * 60 * 24;
                    const durationDays = Math.max(1, Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1);
                    return durationDays;
                  })()} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-city">Address (optional)</Label>
                  <Input
                    id="m-city"
                    value={modalForm.city}
                    onChange={(e) => setModalForm((f) => ({ ...f, city: e.target.value }))}
                    placeholder="House no, locality, city, pincode"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-start-time">Start time</Label>
                  <Input
                    id="m-start-time"
                    type="time"
                    value={modalForm.startTime}
                    onChange={(e) => setModalForm((f) => ({ ...f, startTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="m-end-time">End time</Label>
                  <Input
                    id="m-end-time"
                    type="time"
                    value={modalForm.endTime}
                    onChange={(e) => setModalForm((f) => ({ ...f, endTime: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setSendOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
