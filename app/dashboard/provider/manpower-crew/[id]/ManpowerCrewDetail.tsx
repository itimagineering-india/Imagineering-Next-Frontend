"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Search } from "lucide-react";
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
  requesterUser?: string;
  title: string;
  description: string;
  headcount: number;
  acceptedCount: number;
  status: string;
  location?: { city?: string; state?: string };
};

type InviteRow = {
  _id: string;
  status: string;
  workerUser?: { name?: string; email?: string; phone?: string };
};

export default function ManpowerCrewDetail() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [crew, setCrew] = useState<CrewRequest | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [workers, setWorkers] = useState<LabourWorkerListItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [sending, setSending] = useState(false);
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

  const myUserId = user?._id ? String(user._id) : "";

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.manpowerCrew.getById(id),
        api.manpowerCrew.listInvites(id),
      ]);
      const d1 = r1 as { data?: { crewRequest?: CrewRequest } };
      const d2 = r2 as { data?: { invites?: InviteRow[] } };
      setCrew(d1.data?.crewRequest ?? null);
      setInvites(d2.data?.invites ?? []);
    } catch {
      toast({ title: "Failed to load", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

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
      })) as {
        success?: boolean;
        data?: { workers?: LabourWorkerListItem[] };
      };
      setWorkers(res.data?.workers ?? []);
    } catch {
      toast({ title: "Could not load manpower list", variant: "destructive" });
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
    toast,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    load();
  }, [load, isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (crew) loadWorkers();
  }, [crew, loadWorkers, isAuthenticated, user]);

  // Debounce search
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

  const selectedPreview = useMemo(() => {
    const map = new Map(workers.map((w) => [w.userId, w.displayName]));
    return inviteIds.map((uid) => map.get(uid) || uid);
  }, [workers, inviteIds]);

  const sendInvites = async () => {
    if (!id || inviteIds.length === 0) {
      toast({ title: "Select at least one worker first", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const res = await api.manpowerCrew.inviteBatch(id, inviteIds);
      const ok = (res as { success?: boolean }).success;
      const d = res as { data?: { invitesCreated?: number; skipped?: string[] } };
      if (ok) {
        toast({
          title: "Invites sent",
          description: `Notifications sent to ${d.data?.invitesCreated ?? 0} worker${(d.data?.invitesCreated ?? 0) === 1 ? "" : "s"}${(d.data?.skipped?.length ?? 0) > 0 ? ` (${d.data?.skipped?.length} skipped)` : ""}.`,
        });
        setSelected(new Set());
        await load();
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
    } finally {
      setSending(false);
    }
  };

  const cancelReq = async () => {
    if (!id || !crew) return;
    try {
      const res = await api.manpowerCrew.cancel(id);
      if ((res as { success?: boolean }).success) {
        toast({ title: "Requirement cancelled" });
        await load();
      }
    } catch {
      toast({ variant: "destructive", title: "Could not cancel" });
    }
  };

  if (!id) return null;

  if (authLoading) {
    return <AuthLoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <SignInRequiredPrompt />;
  }

  if (loading && !crew) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="p-6">
        <p>Not found.</p>
        <Link href="/dashboard/provider/manpower-crew" className="text-primary underline">
          Back
        </Link>
      </div>
    );
  }

  const isOwner = Boolean(myUserId && String(crew.requesterUser ?? "") === myUserId);

  return (
    <div className="max-w-[1600px] mx-auto min-w-0 w-full space-y-4 sm:space-y-6 px-3 py-4 sm:px-4 md:p-6 overflow-x-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Link
        href="/dashboard/provider/manpower-crew"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to crew requests
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="break-words">{crew.title}</CardTitle>
          <CardDescription>
            Progress: {crew.acceptedCount ?? 0} / {crew.headcount} accepted · Status: {crew.status}
            {crew.location?.city ? ` · ${crew.location.city}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-wrap">{crew.description}</p>
          {isOwner && crew.status === "open" && (
            <Button variant="destructive" size="sm" onClick={cancelReq}>
              Cancel requirement
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>Workers who were invited and how they responded.</CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invites yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {invites.map((inv) => (
                <li key={inv._id} className="py-2 flex justify-between gap-2 min-w-0">
                  <span className="min-w-0 break-words pr-2">{inv.workerUser?.name ?? "Worker"}</span>
                  <span className="text-muted-foreground shrink-0">{inv.status}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isOwner && crew.status === "open" && (
        <Card>
          <CardHeader>
            <CardTitle>Select workers to invite</CardTitle>
            <CardDescription className="text-foreground/90">
              Selected workers receive a notification and appear in Invites above. Use the filter for categories and
              subcategories. You can select multiple people.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 min-w-0 overflow-hidden">
            <div className="flex flex-col gap-3 min-w-0">
              <div className="relative w-full min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9 h-11 sm:h-10 text-base sm:text-sm min-w-0"
                  placeholder="Search by name, city, or address…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex items-center justify-end gap-2 w-full min-w-0 flex-wrap sm:flex-nowrap">
                <LabourFilterDialog
                  idPrefix="crew"
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
                  }}
                />
                <LabourViewModeToggle value={viewMode} onChange={setViewMode} className="shrink-0" />
              </div>
            </div>

            {loadingWorkers ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : workers.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/30">
                No worker profiles in this category yet. Providers need a service or primary category under Manpower
                here. Try another category filter.
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
                        checkboxId={`w-${uid}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {inviteIds.length > 0 && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <span className="font-medium">Selected ({inviteIds.length}): </span>
                {selectedPreview.join(", ")}
              </div>
            )}

            <Button
              className="w-full sm:w-auto"
              onClick={sendInvites}
              disabled={sending || inviteIds.length === 0}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send invites ({inviteIds.length})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
