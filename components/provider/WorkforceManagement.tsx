"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  Download,
  FileText,
  IndianRupee,
  Info,
  Loader2,
  Plus,
  RefreshCcw,
  Users,
} from "lucide-react";
import api from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

const WORKER_ROLES = [
  "Mason",
  "Labour",
  "Electrician",
  "Plumber",
  "Painter",
  "Carpenter",
  "Welder",
  "Fabricator",
  "Supervisor",
  "Other",
];

const ATTENDANCE_STATUSES = ["Present", "Absent", "Half Day"];
const WORKFORCE_SECTIONS = ["workers", "sites", "attendance", "wages", "reports"] as const;
const REPORT_PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;
const SITE_STATUSES = ["Active", "Completed", "On Hold"];
const WAGE_ENTRY_TYPES = ["Advance", "Payment"];

type Worker = {
  _id: string;
  fullName: string;
  mobileNumber: string;
  role: string;
  dailyWage: number;
  joiningDate?: string;
  status: string;
  currentSite?: { _id: string; siteName: string } | string | null;
};

type Site = {
  _id: string;
  siteName: string;
  clientName?: string;
  status: string;
  startDate?: string;
  expectedEndDate?: string;
  workerCount?: number;
  location?: { address?: string; city?: string; state?: string };
};

type DashboardCards = {
  totalWorkers?: number;
  activeWorkers?: number;
  presentToday?: number;
  absentToday?: number;
  halfDayToday?: number;
  activeSites?: number;
  monthlyLabourCost?: number;
};

type WorkforceAccess = {
  eligible: boolean;
  reason?: string | null;
  categoryAllowed?: boolean;
  entitled?: boolean;
};

type ImportCandidate = {
  userId: string;
  providerId: string;
  displayName: string;
  phone?: string;
  avatar?: string;
  city?: string;
  state?: string;
  categoryLabel?: string;
  subcategories?: string[];
  experienceYears?: number;
  dailyRate?: number | null;
  alreadyImported?: boolean;
};

type DashboardData = {
  cards?: DashboardCards;
  distribution?: unknown;
};

type WageSummary = {
  _id: string;
  worker?: { fullName?: string };
  presentDays?: number;
  halfDays?: number;
  totalWage?: number;
  advanceTotal?: number;
  paymentTotal?: number;
  balance?: number;
};

type SiteCost = {
  _id?: string;
  site?: { siteName?: string };
  totalCost?: number;
};

type WageEntry = {
  _id: string;
  worker?: { fullName?: string };
  type?: string;
  date?: string;
  note?: string;
  amount?: number;
};
type ApiData<T> = { data?: T };

const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toISOString().slice(0, 7);

function money(value: unknown): string {
  const amount = Number(value) || 0;
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

function formatDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getSiteDelayDays(site: Site): number {
  if (!site.expectedEndDate || site.status === "Completed") return 0;
  const endDate = new Date(site.expectedEndDate);
  if (Number.isNaN(endDate.getTime())) return 0;

  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()).getTime();
  const now = new Date();
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return Math.max(0, Math.floor((todayDay - endDay) / 86400000));
}

function siteIdOf(worker: Worker): string {
  if (!worker.currentSite) return "";
  return typeof worker.currentSite === "string" ? worker.currentSite : worker.currentSite._id;
}

function siteNameOf(worker: Worker): string {
  if (!worker.currentSite) return "Unassigned";
  return typeof worker.currentSite === "string" ? "Assigned" : worker.currentSite.siteName;
}

export default function WorkforceManagement() {
  const { toast } = useToast();
  const params = useParams<{ section?: string }>();
  const section = Array.isArray(params?.section) ? params.section[0] : params?.section;
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<WorkforceAccess | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [targetSiteId, setTargetSiteId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [month, setMonth] = useState(currentMonth);
  const [wages, setWages] = useState<WageSummary[]>([]);
  const [siteCosts, setSiteCosts] = useState<SiteCost[]>([]);
  const [wageEntries, setWageEntries] = useState<WageEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [wageEntryOpen, setWageEntryOpen] = useState(false);
  const [importWorkerOpen, setImportWorkerOpen] = useState(false);
  const [importSearch, setImportSearch] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importCandidates, setImportCandidates] = useState<ImportCandidate[]>([]);
  const [selectedImportCandidate, setSelectedImportCandidate] = useState<ImportCandidate | null>(null);
  const [createSiteOpen, setCreateSiteOpen] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState("");

  const [importForm, setImportForm] = useState({
    role: "Labour",
    dailyWage: "",
    joiningDate: today,
  });

  const [siteForm, setSiteForm] = useState({
    siteName: "",
    clientName: "",
    address: "",
    city: "",
    startDate: today,
    expectedEndDate: "",
    status: "Active",
  });
  const [siteEditForm, setSiteEditForm] = useState({
    siteName: "",
    clientName: "",
    address: "",
    city: "",
    startDate: "",
    expectedEndDate: "",
    status: "Active",
  });
  const [wageEntryForm, setWageEntryForm] = useState({
    workerId: "",
    type: "Advance",
    amount: "",
    date: today,
    note: "",
  });
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [reportDate, setReportDate] = useState(today);
  const [reportMonth, setReportMonth] = useState(currentMonth);
  const [reportWorkerId, setReportWorkerId] = useState("");
  const [reportSiteId, setReportSiteId] = useState("");
  const [reportDownloading, setReportDownloading] = useState(false);

  const activeWorkers = useMemo(() => workers.filter((worker) => worker.status === "Active"), [workers]);
  const activeSites = useMemo(() => sites.filter((site) => site.status !== "Completed"), [sites]);

  const hasLoadedOnce = useRef(false);

  const applyAttendanceRows = (
    rows: Array<{ worker?: string | { _id?: string }; status?: string }>,
  ) => {
    const nextAttendance: Record<string, string> = {};
    for (const row of rows) {
      const workerId =
        typeof row.worker === "string" ? row.worker : String(row.worker?._id || "").trim();
      const status = String(row.status || "").trim();
      if (workerId && status) nextAttendance[workerId] = status;
    }
    setAttendance(nextAttendance);
  };

  const loadData = useCallback(async () => {
    const soft = hasLoadedOnce.current;
    if (!soft) setLoading(true);
    try {
      const accessRes = await api.workforce.access();
      const accessData = (accessRes as ApiData<WorkforceAccess>).data || { eligible: false };
      setAccess(accessData);
      if (!accessData.eligible) {
        return;
      }

      const [dashboardRes, workersRes, sitesRes, wagesRes, costsRes, wageEntriesRes, attendanceRes] =
        await Promise.all([
          api.workforce.dashboard({ date: attendanceDate, month }),
          api.workforce.listWorkers({ limit: 100, status: "Active" }),
          api.workforce.listSites({ limit: 100 }),
          api.workforce.monthlyWages(month),
          api.workforce.siteCosts(month),
          api.workforce.wageEntries({ month }),
          api.workforce.attendanceToday(attendanceDate),
        ]);

      setDashboard((dashboardRes as ApiData<DashboardData>).data || null);
      setWorkers(((workersRes as ApiData<{ workers?: Worker[] }>).data?.workers || []) as Worker[]);
      setSites(((sitesRes as ApiData<{ sites?: Site[] }>).data?.sites || []) as Site[]);
      setWages(((wagesRes as ApiData<{ wages?: WageSummary[] }>).data?.wages || []) as WageSummary[]);
      setSiteCosts(((costsRes as ApiData<{ costs?: SiteCost[] }>).data?.costs || []) as SiteCost[]);
      setWageEntries(((wageEntriesRes as ApiData<{ entries?: WageEntry[] }>).data?.entries || []) as WageEntry[]);
      applyAttendanceRows(
        ((attendanceRes as ApiData<{ rows?: Array<{ worker?: string | { _id?: string }; status?: string }> }>).data
          ?.rows || []) as Array<{ worker?: string | { _id?: string }; status?: string }>,
      );
    } catch {
      toast({ title: "Could not load Workforce Management", variant: "destructive" });
    } finally {
      if (!soft) setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, [attendanceDate, month, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const searchImportCandidates = async () => {
    setImportLoading(true);
    try {
      const response = await api.workforce.searchImportCandidates({
        q: importSearch.trim(),
        limit: 20,
      });
      if (response.success && response.data) {
        setImportCandidates(response.data.candidates || []);
      } else {
        setImportCandidates([]);
        toast({
          title: response.error?.message || "Could not find registered workers",
          variant: "destructive",
        });
      }
    } catch {
      setImportCandidates([]);
      toast({ title: "Could not find registered workers", variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const importSelectedWorker = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedImportCandidate) {
      toast({ title: "Select a worker to import", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const response = await api.workforce.importWorker({
        userId: selectedImportCandidate.userId,
        role: importForm.role,
        dailyWage: Number(importForm.dailyWage) || selectedImportCandidate.dailyRate || 0,
        joiningDate: importForm.joiningDate,
      });
      if (!response.success) {
        throw new Error(response.error?.message || "Could not import worker");
      }
      setImportWorkerOpen(false);
      setSelectedImportCandidate(null);
      setImportSearch("");
      setImportCandidates([]);
      setImportForm({ role: "Labour", dailyWage: "", joiningDate: today });
      toast({ title: "Worker imported" });
      await loadData();
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Could not import worker",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const createSite = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.workforce.createSite({
        siteName: siteForm.siteName,
        clientName: siteForm.clientName,
        location: { address: siteForm.address, city: siteForm.city },
        startDate: siteForm.startDate,
        expectedEndDate: siteForm.expectedEndDate || undefined,
        status: siteForm.status,
      });
      setSiteForm({ siteName: "", clientName: "", address: "", city: "", startDate: today, expectedEndDate: "", status: "Active" });
      setCreateSiteOpen(false);
      toast({ title: "Site added" });
      await loadData();
    } catch {
      toast({ title: "Could not add site", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const beginEditSite = (site: Site) => {
    setEditingSiteId(site._id);
    setSiteEditForm({
      siteName: site.siteName || "",
      clientName: site.clientName || "",
      address: site.location?.address || "",
      city: site.location?.city || "",
      startDate: site.startDate ? String(site.startDate).slice(0, 10) : "",
      expectedEndDate: site.expectedEndDate ? String(site.expectedEndDate).slice(0, 10) : "",
      status: site.status || "Active",
    });
  };

  const saveSiteEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSiteId) return;
    setSaving(true);
    try {
      await api.workforce.updateSite(editingSiteId, {
        siteName: siteEditForm.siteName,
        clientName: siteEditForm.clientName,
        location: { address: siteEditForm.address, city: siteEditForm.city },
        startDate: siteEditForm.startDate || undefined,
        expectedEndDate: siteEditForm.expectedEndDate || undefined,
        status: siteEditForm.status,
      });
      setEditingSiteId("");
      toast({ title: "Site updated" });
      await loadData();
    } catch {
      toast({ title: "Could not update site", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const changeSiteStatus = async (siteId: string, status: string) => {
    setSaving(true);
    try {
      await api.workforce.updateSiteStatus(siteId, status);
      toast({ title: "Site status updated" });
      await loadData();
    } catch {
      toast({ title: "Could not update site status", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteSite = async (site: Site) => {
    const confirmed = window.confirm(`Delete ${site.siteName}? Assigned workers will become unassigned.`);
    if (!confirmed) return;
    setSaving(true);
    try {
      await api.workforce.deleteSite(site._id);
      toast({ title: "Site deleted" });
      await loadData();
    } catch {
      toast({ title: "Could not delete site", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const assignSelected = async () => {
    if (!targetSiteId || selectedWorkers.size === 0) {
      toast({ title: "Choose workers and a site first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.workforce.assignWorkers(targetSiteId, Array.from(selectedWorkers));
      setSelectedWorkers(new Set());
      toast({ title: "Workers assigned" });
      await loadData();
    } catch {
      toast({ title: "Could not assign workers", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const transferWorker = async (workerId: string, toSiteId: string) => {
    if (!toSiteId) return;
    setSaving(true);
    try {
      await api.workforce.transferWorker(workerId, toSiteId);
      toast({ title: "Worker transferred" });
      await loadData();
    } catch {
      toast({ title: "Could not transfer worker", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (worker: Worker) => {
    const siteId = siteIdOf(worker);
    if (!siteId) return;
    setSaving(true);
    try {
      await api.workforce.removeWorkerFromSite(siteId, worker._id);
      toast({ title: "Worker removed from site" });
      await loadData();
    } catch {
      toast({ title: "Could not remove worker", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteWorker = async (worker: Worker) => {
    const confirmed = window.confirm(`Delete ${worker.fullName} from your workforce directory?`);
    if (!confirmed) return;
    setSaving(true);
    try {
      await api.workforce.deactivateWorker(worker._id);
      setSelectedWorkers((prev) => {
        const next = new Set(prev);
        next.delete(worker._id);
        return next;
      });
      toast({ title: "Worker deleted" });
      await loadData();
    } catch {
      toast({ title: "Could not delete worker", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveAttendance = async () => {
    const entries = activeWorkers
      .map((worker) => ({ workerId: worker._id, status: attendance[worker._id] || "Absent", siteId: siteIdOf(worker) || undefined }))
      .filter((entry) => entry.status);
    if (entries.length === 0) {
      toast({ title: "No active workers to mark", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.workforce.upsertAttendance({ date: attendanceDate, entries });
      toast({ title: "Attendance saved" });
      await loadData();
    } catch {
      toast({ title: "Could not save attendance", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createWageEntry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!wageEntryForm.workerId) {
      toast({ title: "Select a worker", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api.workforce.createWageEntry({
        workerId: wageEntryForm.workerId,
        type: wageEntryForm.type,
        amount: Number(wageEntryForm.amount) || 0,
        date: wageEntryForm.date,
        note: wageEntryForm.note,
      });
      setWageEntryForm({ workerId: "", type: "Advance", amount: "", date: today, note: "" });
      setWageEntryOpen(false);
      toast({ title: "Wage entry added" });
      await loadData();
    } catch {
      toast({ title: "Could not add wage entry", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cards = dashboard?.cards || {};
  const activeSection = WORKFORCE_SECTIONS.includes(section as (typeof WORKFORCE_SECTIONS)[number])
    ? section
    : "";
  const sectionCards = [
    {
      value: "workers",
      label: "Workers",
      helper: "Import registered workers, assign sites, transfer or delete records",
      stat: `${activeWorkers.length} active workers`,
      icon: Users,
      image: "/Workforce/workers.png",
    },
    {
      value: "sites",
      label: "Sites",
      helper: "Create projects and see active/completed site cards",
      stat: `${activeSites.length} open sites`,
      icon: Building2,
      image: "/Workforce/Site.png",
    },
    {
      value: "attendance",
      label: "Attendance",
      helper: "View or edit attendance for any date",
      stat: "Daily entry",
      icon: CalendarCheck,
      image: "/Workforce/Attendance.png",
    },
    {
      value: "wages",
      label: "Wages",
      helper: "View current month worker wages and site costs",
      stat: money(cards.monthlyLabourCost),
      icon: IndianRupee,
      image: "/Workforce/Wages.png",
    },
    {
      value: "reports",
      label: "Reports",
      helper: "Download daily, weekly, or monthly PDF reports",
      stat: "PDF export",
      icon: FileText,
      image: "",
    },
  ];
  const activeSectionCard = sectionCards.find((item) => item.value === activeSection);

  const downloadReport = async () => {
    setReportDownloading(true);
    try {
      await api.workforce.downloadReportPdf({
        period: reportPeriod,
        date: reportPeriod === "monthly" ? undefined : reportDate,
        month: reportPeriod === "monthly" ? reportMonth : undefined,
        workerId: reportWorkerId || undefined,
        siteId: reportSiteId || undefined,
      });
      toast({ title: "Report downloaded" });
    } catch (error) {
      toast({
        title: "Could not download report",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setReportDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (access && !access.eligible) {
    return (
      <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6">
        <Card>
          <CardHeader>
            <Badge className="w-fit" variant="secondary">Provider Feature</Badge>
            <CardTitle>Workforce Management</CardTitle>
            <CardDescription>
              {access.reason || "This feature is available for provider accounts."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard/provider/business-profile">Update Business Profile</Link>
            </Button>
            <Button variant="outline" onClick={loadData}>Check Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Workforce Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage workers, site assignments, attendance, wages, and downloadable reports.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={saving}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {!activeSection && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Total Workers", value: cards.totalWorkers || 0, icon: Users },
            { label: "Active Workers", value: cards.activeWorkers || 0, icon: Activity },
            { label: "Present Today", value: cards.presentToday || 0, icon: CalendarCheck },
            { label: "Absent Today", value: cards.absentToday || 0, icon: CalendarCheck },
            { label: "Active Sites", value: cards.activeSites || 0, icon: Building2 },
            { label: "Monthly Labour Cost", value: money(cards.monthlyLabourCost), icon: IndianRupee },
          ].map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-lg font-semibold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!activeSection ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Manage Workforce</h2>
            <p className="text-sm text-muted-foreground">
              Choose what you want to manage. Each card opens a separate page.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {sectionCards.map((item) => (
              <Link key={item.value} href={`/dashboard/provider/workforce/${item.value}`} className="group block">
                <Card className="h-full overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex h-full flex-col p-0">
                    <div className="overflow-hidden bg-muted/40">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={`${item.label} illustration`}
                          className="block h-auto w-full transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-[16/10] flex-col items-center justify-center gap-2 p-6 text-center">
                          <item.icon className="h-10 w-10 text-primary" />
                          <p className="text-lg font-semibold">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.helper}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button variant="ghost" size="sm" className="h-8 shrink-0 gap-1.5 px-2 text-muted-foreground" asChild>
              <Link href="/dashboard/provider/workforce">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold sm:text-lg">{activeSectionCard?.label}</h2>
                {activeSectionCard ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <activeSectionCard.icon className="h-3.5 w-3.5" />
                    {activeSectionCard.stat}
                  </span>
                ) : null}
              </div>
              {activeSectionCard?.helper ? (
                <p className="truncate text-xs text-muted-foreground">{activeSectionCard.helper}</p>
              ) : null}
            </div>
          </div>

          <Tabs value={activeSection} className="space-y-4">

        <TabsContent value="workers" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Dialog open={importWorkerOpen} onOpenChange={setImportWorkerOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Import Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Import Registered Worker</DialogTitle>
                  <DialogDescription>
                    Search manpower providers already registered on Imagineering India and add them to your workforce directory.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="Search by name, phone, city, or skill"
                      value={importSearch}
                      onChange={(event) => setImportSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          searchImportCandidates();
                        }
                      }}
                    />
                    <Button type="button" onClick={searchImportCandidates} disabled={importLoading}>
                      {importLoading ? "Searching..." : "Search"}
                    </Button>
                  </div>

                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {importCandidates.map((candidate) => {
                      const selected = selectedImportCandidate?.userId === candidate.userId;
                      return (
                        <button
                          key={candidate.userId}
                          type="button"
                          disabled={candidate.alreadyImported}
                          onClick={() => {
                            setSelectedImportCandidate(candidate);
                            setImportForm((form) => ({
                              ...form,
                              dailyWage: candidate.dailyRate ? String(candidate.dailyRate) : form.dailyWage,
                            }));
                          }}
                          className={`w-full rounded-lg border p-3 text-left transition ${
                            selected ? "border-primary bg-primary/5" : "hover:border-primary/40"
                          } ${candidate.alreadyImported ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{candidate.displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {[candidate.categoryLabel, candidate.city, candidate.state].filter(Boolean).join(" · ") ||
                                  "Registered worker"}
                              </p>
                              {candidate.subcategories && candidate.subcategories.length > 0 && (
                                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                  {candidate.subcategories.join(", ")}
                                </p>
                              )}
                            </div>
                            <div className="shrink-0 text-right text-xs text-muted-foreground">
                              {candidate.alreadyImported ? (
                                <Badge variant="secondary">Imported</Badge>
                              ) : (
                                <>
                                  {candidate.experienceYears ? <p>{candidate.experienceYears}+ yrs</p> : null}
                                  {candidate.dailyRate ? <p>{money(candidate.dailyRate)}</p> : null}
                                </>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {!importLoading && importCandidates.length === 0 && (
                      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Search registered manpower workers to import.
                      </div>
                    )}
                  </div>

                  <form onSubmit={importSelectedWorker} className="grid gap-3 border-t pt-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={importForm.role} onValueChange={(role) => setImportForm((form) => ({ ...form, role }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{WORKER_ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Wage</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Daily wage"
                        value={importForm.dailyWage}
                        onChange={(event) => setImportForm((form) => ({ ...form, dailyWage: event.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Joining Date</Label>
                      <Input
                        type="date"
                        value={importForm.joiningDate}
                        onChange={(event) => setImportForm((form) => ({ ...form, joiningDate: event.target.value }))}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Button type="submit" disabled={saving || !selectedImportCandidate}>
                        Import Selected Worker
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assign Selected Workers</CardTitle>
              <CardDescription>Select workers below, choose a site, and assign them together.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Select value={targetSiteId} onValueChange={setTargetSiteId}>
                <SelectTrigger className="sm:max-w-xs"><SelectValue placeholder="Choose site" /></SelectTrigger>
                <SelectContent>{activeSites.map((site) => <SelectItem key={site._id} value={site._id}>{site.siteName}</SelectItem>)}</SelectContent>
              </Select>
              <Button onClick={assignSelected} disabled={saving || selectedWorkers.size === 0}>
                Assign {selectedWorkers.size || ""} Worker{selectedWorkers.size === 1 ? "" : "s"}
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:hidden">
            {workers.map((worker) => (
              <Card key={worker._id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{worker.fullName}</p>
                      <p className="text-xs text-muted-foreground">{worker.mobileNumber}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{worker.role}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Wage</p>
                      <p className="font-medium">{money(worker.dailyWage)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Site</p>
                      <p className="font-medium">{siteNameOf(worker)}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Select value="" onValueChange={(siteId) => transferWorker(worker._id, siteId)}>
                      <SelectTrigger><SelectValue placeholder="Move to site" /></SelectTrigger>
                      <SelectContent>
                        {activeSites.map((site) => <SelectItem key={site._id} value={site._id}>{site.siteName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!siteIdOf(worker) || saving}
                        onClick={() => removeAssignment(worker)}
                      >
                        Remove Site
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={saving}
                        onClick={() => deleteWorker(worker)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {workers.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No workers added yet.
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Daily Wage</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Transfer</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow key={worker._id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedWorkers.has(worker._id)}
                          onChange={(event) => {
                            setSelectedWorkers((prev) => {
                              const next = new Set(prev);
                              if (event.target.checked) next.add(worker._id);
                              else next.delete(worker._id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{worker.fullName}</div>
                        <div className="text-xs text-muted-foreground">{worker.mobileNumber}</div>
                      </TableCell>
                      <TableCell>{worker.role}</TableCell>
                      <TableCell>{money(worker.dailyWage)}</TableCell>
                      <TableCell>
                        <div>{siteNameOf(worker)}</div>
                        {siteIdOf(worker) && (
                          <Button variant="link" className="h-auto p-0 text-xs" onClick={() => removeAssignment(worker)}>
                            Remove
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select value="" onValueChange={(siteId) => transferWorker(worker._id, siteId)}>
                          <SelectTrigger className="min-w-36"><SelectValue placeholder="Move to site" /></SelectTrigger>
                          <SelectContent>
                            {activeSites.map((site) => <SelectItem key={site._id} value={site._id}>{site.siteName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={saving}
                          onClick={() => deleteWorker(worker)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {workers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No workers added yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sites" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={createSiteOpen} onOpenChange={setCreateSiteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Site
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Site</DialogTitle>
                  <DialogDescription>Add a project/site where your workforce will be assigned.</DialogDescription>
                </DialogHeader>
                <form onSubmit={createSite} className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input placeholder="Site name" value={siteForm.siteName} onChange={(e) => setSiteForm((f) => ({ ...f, siteName: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Client Name</Label>
                    <Input placeholder="Client name" value={siteForm.clientName} onChange={(e) => setSiteForm((f) => ({ ...f, clientName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input placeholder="Location" value={siteForm.address} onChange={(e) => setSiteForm((f) => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="City" value={siteForm.city} onChange={(e) => setSiteForm((f) => ({ ...f, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={siteForm.startDate} onChange={(e) => setSiteForm((f) => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected End Date</Label>
                    <Input type="date" value={siteForm.expectedEndDate} onChange={(e) => setSiteForm((f) => ({ ...f, expectedEndDate: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" className="w-full sm:w-auto" disabled={saving}>Create Site</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => {
              const delayDays = getSiteDelayDays(site);
              const expectedDate = formatDate(site.expectedEndDate);

              return (
              <Card key={site._id}>
                {editingSiteId === site._id ? (
                  <form onSubmit={saveSiteEdit}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Edit Site</CardTitle>
                      <CardDescription>Update site details and status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Input
                        placeholder="Site name"
                        value={siteEditForm.siteName}
                        onChange={(e) => setSiteEditForm((f) => ({ ...f, siteName: e.target.value }))}
                        required
                      />
                      <Input
                        placeholder="Client name"
                        value={siteEditForm.clientName}
                        onChange={(e) => setSiteEditForm((f) => ({ ...f, clientName: e.target.value }))}
                      />
                      <Input
                        placeholder="Location"
                        value={siteEditForm.address}
                        onChange={(e) => setSiteEditForm((f) => ({ ...f, address: e.target.value }))}
                      />
                      <Input
                        placeholder="City"
                        value={siteEditForm.city}
                        onChange={(e) => setSiteEditForm((f) => ({ ...f, city: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={siteEditForm.startDate}
                          onChange={(e) => setSiteEditForm((f) => ({ ...f, startDate: e.target.value }))}
                        />
                        <Input
                          type="date"
                          value={siteEditForm.expectedEndDate}
                          onChange={(e) => setSiteEditForm((f) => ({ ...f, expectedEndDate: e.target.value }))}
                        />
                      </div>
                      <Select
                        value={siteEditForm.status}
                        onValueChange={(status) => setSiteEditForm((f) => ({ ...f, status }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SITE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <Button type="submit" disabled={saving}>Save</Button>
                        <Button type="button" variant="outline" onClick={() => setEditingSiteId("")} disabled={saving}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                ) : (
                  <>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{site.siteName}</CardTitle>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={site.status === "Active" ? "default" : "secondary"}>{site.status}</Badge>
                          {delayDays > 0 && (
                            <Badge variant="destructive">Delayed by {delayDays} day{delayDays === 1 ? "" : "s"}</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>{site.clientName || "No client name"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <p>{[site.location?.address, site.location?.city].filter(Boolean).join(", ") || "Location not set"}</p>
                      {expectedDate && (
                        <div className={delayDays > 0 ? "rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive" : "rounded-lg border p-3 text-muted-foreground"}>
                          <p className="font-medium">Expected completion: {expectedDate}</p>
                          {delayDays > 0 && (
                            <p className="text-xs">Site completion date has passed. Follow up with the team to reduce delay.</p>
                          )}
                        </div>
                      )}
                      <p className="text-muted-foreground">{site.workerCount || 0} assigned workers</p>
                      <div className="space-y-2">
                        <Select value={site.status} onValueChange={(status) => changeSiteStatus(site._id, status)}>
                          <SelectTrigger><SelectValue placeholder="Change status" /></SelectTrigger>
                          <SelectContent>
                            {SITE_STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => beginEditSite(site)} disabled={saving}>
                            Edit
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => deleteSite(site)} disabled={saving}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            );
            })}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="max-w-xs space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="attendance-date">Date</Label>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Attendance help"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                        Change the date to view or edit past attendance. Defaults to Absent until marked.
                        No GPS or biometric tracking.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {attendanceDate === today
                    ? "Showing today’s sheet. Pick an earlier date to review or correct it."
                    : `Showing saved marks for ${attendanceDate}. Edit and save to update.`}
                </p>
              </div>

              {activeWorkers.length === 0 ? (
                <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
                  No active workers to mark attendance for.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[160px]">Worker</TableHead>
                        <TableHead className="min-w-[120px]">Role / Site</TableHead>
                        {ATTENDANCE_STATUSES.map((status) => (
                          <TableHead key={status} className="w-[100px] text-center">
                            {status}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeWorkers.map((worker) => {
                        const selected = attendance[worker._id] || "Absent";
                        return (
                          <TableRow key={worker._id}>
                            <TableCell className="font-medium">{worker.fullName}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {worker.role} · {siteNameOf(worker)}
                            </TableCell>
                            {ATTENDANCE_STATUSES.map((status) => {
                              const active = selected === status;
                              const tone =
                                status === "Present"
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : status === "Absent"
                                    ? "border-red-500 bg-red-50 text-red-700"
                                    : "border-amber-500 bg-amber-50 text-amber-700";
                              return (
                                <TableCell key={status} className="p-2 text-center">
                                  <button
                                    type="button"
                                    aria-pressed={active}
                                    aria-label={`${worker.fullName}: ${status}`}
                                    onClick={() =>
                                      setAttendance((prev) => ({ ...prev, [worker._id]: status }))
                                    }
                                    className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 transition ${
                                      active
                                        ? tone
                                        : "border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/40"
                                    }`}
                                  >
                                    {active ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                                  </button>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={saveAttendance} disabled={saving || activeWorkers.length === 0}>
                  {saving ? "Saving…" : "Save Attendance"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wage Tracking</CardTitle>
              <CardDescription>Track earned wages plus advance and payment entries. No payroll or bank transfers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <Label>Month</Label>
                  <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" onClick={loadData}>Load Month</Button>
                  <Dialog open={wageEntryOpen} onOpenChange={setWageEntryOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Advance / Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xl">
                      <DialogHeader>
                        <DialogTitle>Add Wage Entry</DialogTitle>
                        <DialogDescription>Record money given to a worker as advance or payment.</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={createWageEntry} className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Worker</Label>
                          <Select value={wageEntryForm.workerId} onValueChange={(workerId) => setWageEntryForm((f) => ({ ...f, workerId }))}>
                            <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                            <SelectContent>
                              {activeWorkers.map((worker) => <SelectItem key={worker._id} value={worker._id}>{worker.fullName}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Entry Type</Label>
                          <Select value={wageEntryForm.type} onValueChange={(type) => setWageEntryForm((f) => ({ ...f, type }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {WAGE_ENTRY_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input type="number" min="1" placeholder="Amount" value={wageEntryForm.amount} onChange={(e) => setWageEntryForm((f) => ({ ...f, amount: e.target.value }))} required />
                        </div>
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" value={wageEntryForm.date} onChange={(e) => setWageEntryForm((f) => ({ ...f, date: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Note</Label>
                          <Input placeholder="Optional note" value={wageEntryForm.note} onChange={(e) => setWageEntryForm((f) => ({ ...f, note: e.target.value }))} />
                        </div>
                        <div className="sm:col-span-2">
                          <Button type="submit" className="w-full sm:w-auto" disabled={saving}>Save Entry</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Worker-wise Wage Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-2 p-4 md:p-0">
                    <div className="space-y-2 md:hidden">
                      {wages.map((row) => (
                        <div key={row._id} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{row.worker?.fullName || "Worker"}</p>
                            <strong>{money(row.balance)}</strong>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Earned {money(row.totalWage)} · Advance {money(row.advanceTotal)} · Paid {money(row.paymentTotal)}
                          </p>
                        </div>
                      ))}
                      {wages.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          No wage data for this month.
                        </p>
                      )}
                    </div>
                    <Table className="hidden md:table">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Worker</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Earned</TableHead>
                          <TableHead>Advance</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {wages.map((row) => (
                          <TableRow key={row._id}>
                            <TableCell>{row.worker?.fullName || "Worker"}</TableCell>
                            <TableCell>{(row.presentDays || 0) + (row.halfDays || 0) * 0.5}</TableCell>
                            <TableCell>{money(row.totalWage)}</TableCell>
                            <TableCell>{money(row.advanceTotal)}</TableCell>
                            <TableCell>{money(row.paymentTotal)}</TableCell>
                            <TableCell className="font-semibold">{money(row.balance)}</TableCell>
                          </TableRow>
                        ))}
                        {wages.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No wage data for this month.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Site-wise Labour Cost</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {siteCosts.map((row) => (
                      <div key={row._id || "unassigned"} className="flex items-center justify-between rounded-lg border p-3">
                        <span>{row.site?.siteName || "Unassigned"}</span>
                        <strong>{money(row.totalCost)}</strong>
                      </div>
                    ))}
                    {siteCosts.length === 0 && <p className="text-sm text-muted-foreground">No site cost data for this month.</p>}
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader><CardTitle className="text-base">Advance & Payment Entries</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {wageEntries.map((entry) => (
                      <div key={entry._id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium">{entry.worker?.fullName || "Worker"}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.type} · {entry.date ? String(entry.date).slice(0, 10) : ""}{entry.note ? ` · ${entry.note}` : ""}
                          </p>
                        </div>
                        <strong>{money(entry.amount)}</strong>
                      </div>
                    ))}
                    {wageEntries.length === 0 && <p className="text-sm text-muted-foreground">No advance or payment entries for this month.</p>}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card className="overflow-hidden border-slate-200/90 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-[linear-gradient(180deg,#fff8f5_0%,#ffffff_100%)] pb-4">
              <CardTitle className="text-xl">Workforce reports</CardTitle>
              <CardDescription>
                Pick a period, optionally filter by worker or site, then download the PDF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label>Report type</Label>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1">
                  {REPORT_PERIODS.map((item) => {
                    const active = reportPeriod === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setReportPeriod(item.value as "daily" | "weekly" | "monthly")
                        }
                        className={
                          active
                            ? "rounded-xl bg-[hsl(var(--red-accent))] px-3 py-2.5 text-sm font-semibold text-white shadow-sm"
                            : "rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-white/70"
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reportPeriod === "monthly" ? (
                  <div className="space-y-1.5">
                    <Label>Month</Label>
                    <Input
                      type="month"
                      value={reportMonth}
                      onChange={(event) => setReportMonth(event.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>{reportPeriod === "weekly" ? "Any date in the week" : "Date"}</Label>
                    <Input
                      type="date"
                      value={reportDate}
                      onChange={(event) => setReportDate(event.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Worker (optional)</Label>
                  <Select
                    value={reportWorkerId || "all"}
                    onValueChange={(value) => setReportWorkerId(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All workers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All workers</SelectItem>
                      {workers.map((worker) => (
                        <SelectItem key={worker._id} value={worker._id}>
                          {worker.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Site (optional)</Label>
                  <Select
                    value={reportSiteId || "all"}
                    onValueChange={(value) => setReportSiteId(value === "all" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All sites" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All sites</SelectItem>
                      {sites.map((site) => (
                        <SelectItem key={site._id} value={site._id}>
                          {site.siteName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 px-4 py-3.5 text-sm text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">
                  This PDF includes
                </p>
                <p className="mt-1.5 font-medium leading-relaxed text-white/95">
                  {reportPeriod === "daily" && (
                    <>
                      Attendance detail and wage totals for{" "}
                      <span className="text-orange-200">{reportDate}</span>.
                    </>
                  )}
                  {reportPeriod === "weekly" && (
                    <>
                      Monday–Sunday week of{" "}
                      <span className="text-orange-200">{reportDate}</span>, with attendance and wages.
                    </>
                  )}
                  {reportPeriod === "monthly" && (
                    <>
                      Wage summary, site cost, and daily attendance sheet (P / A / H) for{" "}
                      <span className="text-orange-200">{reportMonth}</span>.
                    </>
                  )}
                </p>
              </div>

              <Button
                className="h-11 rounded-xl px-5 font-semibold"
                onClick={() => void downloadReport()}
                disabled={reportDownloading}
              >
                {reportDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
