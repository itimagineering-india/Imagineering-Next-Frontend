"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { RequirementSummary, RequirementDetail, RequirementStatus } from "@/types/requirements";
import {
  FileText,
  Plus,
  Calendar,
  IndianRupee,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

export default function MyRequirements() {
  const { toast } = useToast();
  const [list, setList] = useState<RequirementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RequirementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const res = await api.requirements.getAll({
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      if (res.success && res.data) {
        setList(Array.isArray(res.data) ? (res.data as RequirementSummary[]) : []);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load requirements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [statusFilter]);

  const openDetail = async (id: string) => {
    setDetailId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.requirements.getById(id);
      if (res.success && res.data) {
        const d = res.data as Record<string, unknown>;
        setDetail({
          requirement: d.requirement ?? d,
          quote: d.quote,
        } as RequirementDetail);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Failed to load requirement",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!detailId) return;
    setApproving(true);
    try {
      const res = await api.requirements.approveQuote(detailId);
      if (res.success) {
        toast({
          title: "Quote approved",
          description: "Admin will arrange everything as per the quote.",
        });
        setDetailId(null);
        setDetail(null);
        fetchList();
      } else {
        toast({
          title: "Error",
          description: res.error?.message || "Failed to approve",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to approve",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!detailId) return;
    setRejecting(true);
    try {
      const res = await api.requirements.rejectQuote(detailId);
      if (res.success) {
        toast({
          title: "Quote rejected",
          description: "You can request a new quote from admin if needed.",
        });
        setDetailId(null);
        setDetail(null);
        fetchList();
      } else {
        toast({
          title: "Error",
          description: res.error?.message || "Failed to reject",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e?.message || "Failed to reject",
        variant: "destructive",
      });
    } finally {
      setRejecting(false);
    }
  };

  const statusBadge = (status: RequirementStatus | string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      submitted: { label: "Submitted", variant: "secondary" },
      quoted: { label: "Quote received", variant: "default" },
      approved: { label: "Approved", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
      in_progress: { label: "In progress", variant: "outline" },
      completed: { label: "Completed", variant: "outline" },
    };
    const c = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <DashboardLayout type="buyer">
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">My requirements</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Submit a requirement and get a quote from admin. Approve to let admin arrange everything.
            </p>
          </div>
          <Button asChild className="flex items-center gap-2 shrink-0">
            <Link href="/requirement/submit">
              <Plus className="h-4 w-4" />
              Submit requirement
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {["all", "submitted", "quoted", "approved", "rejected", "in_progress", "completed"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : list.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No requirements yet</p>
              <p className="text-sm mt-1">Submit a requirement to get a quote from admin.</p>
              <Button asChild className="mt-4">
                <Link href="/requirement/submit">Submit requirement</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {list.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => openDetail(item.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
                    {statusBadge(item.status)}
                  </div>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  {item.quoteTotalAmount != null && (
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      ₹{item.quoteTotalAmount.toLocaleString()}
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Requirement details</DialogTitle>
            <DialogDescription>View quote and approve or reject.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Title</Label>
                <p className="font-medium">{detail.requirement?.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm whitespace-pre-wrap">{detail.requirement?.description}</p>
              </div>
              {detail.requirement?.location && (
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </Label>
                  <p className="text-sm">
                    {[
                      detail.requirement.location.address,
                      detail.requirement.location.city,
                      detail.requirement.location.state,
                      detail.requirement.location.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
              {detail.requirement?.preferredTimeline && (
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" />
                  {detail.requirement.preferredTimeline}
                </div>
              )}
              {detail.quote ? (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Admin quote</CardTitle>
                    <CardDescription>{detail.quote.notes || "No additional notes."}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-bold flex items-center gap-1">
                      <IndianRupee className="h-5 w-5" />
                      {detail.quote.totalAmount?.toLocaleString()}
                    </p>
                    {detail.quote.breakdown && typeof detail.quote.breakdown === "object" && (
                      <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                        {Object.entries(detail.quote.breakdown).map(
                          ([key, val]) =>
                            typeof val === "number" && (
                              <li key={key}>
                                {key}: ₹{val.toLocaleString()}
                              </li>
                            )
                        )}
                      </ul>
                    )}
                    {detail.quote.status === "pending" && (
                      <DialogFooter className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          onClick={handleReject}
                          disabled={rejecting || approving}
                          className="flex items-center gap-2"
                        >
                          {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject
                        </Button>
                        <Button
                          onClick={handleApprove}
                          disabled={approving || rejecting}
                          className="flex items-center gap-2"
                        >
                          {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Approve quote
                        </Button>
                      </DialogFooter>
                    )}
                    {detail.quote.status === "rejected" && (
                      <p className="text-sm text-muted-foreground mt-2">You rejected this quote.</p>
                    )}
                    {detail.quote.status === "approved" && (
                      <p className="text-sm text-green-600 mt-2">Quote approved. Admin will arrange everything.</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground">No quote yet. Admin will send one soon.</p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
