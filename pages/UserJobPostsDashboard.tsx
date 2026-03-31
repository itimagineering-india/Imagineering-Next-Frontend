"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api, { type ApiResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Briefcase, MapPin, IndianRupee, Clock } from "lucide-react";
import { formatJobLocation } from "@/lib/utils";

interface UserJobPost {
  _id: string;
  title: string;
  description: string;
  category?: string;
  location?: { city?: string; state?: string; address?: string };
  budgetMin?: number;
  budgetMax?: number;
  durationText?: string;
  status: "open" | "in_progress" | "completed" | "cancelled" | "expired";
  appliedCount?: number;
  createdAt: string;
}

type JobsResponse = ApiResponse<UserJobPost[]>;

export default function UserJobPostsDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [jobs, setJobs] = useState<UserJobPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | UserJobPost["status"]>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent("/dashboard/buyer/job-posts")}`);
    }
  }, [authLoading, isAuthenticated, router]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = (await api.userJobs.getMy({
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 1,
        limit: 50,
      })) as JobsResponse;
      if (res.success && Array.isArray(res.data)) {
        setJobs(res.data);
      } else {
        setJobs([]);
        toast({
          title: "Could not load jobs",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      setJobs([]);
      toast({
        title: "Could not load jobs",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, authLoading, isAuthenticated]);

  const handleStatusChange = async (jobId: string, status: UserJobPost["status"]) => {
    try {
      const res = await api.userJobs.updateStatus(jobId, status);
      if (res.success) {
        toast({
          title: "Status updated",
          description: `Job marked as ${status}.`,
        });
        loadJobs();
      } else {
        toast({
          title: "Could not update status",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not update status",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatBudget = (job: UserJobPost) => {
    if (job.budgetMin && job.budgetMax) {
      return `₹${job.budgetMin.toLocaleString()} – ₹${job.budgetMax.toLocaleString()}`;
    }
    if (job.budgetMin) {
      return `From ₹${job.budgetMin.toLocaleString()}`;
    }
    if (job.budgetMax) {
      return `Up to ₹${job.budgetMax.toLocaleString()}`;
    }
    return "Budget not specified";
  };

  const statusBadgeVariant: Record<
    UserJobPost["status"],
    "default" | "outline" | "secondary" | "destructive"
  > = {
    open: "default",
    in_progress: "secondary",
    completed: "outline",
    cancelled: "destructive",
    expired: "destructive",
  };

  if (authLoading || !isAuthenticated) {
    return (
      <DashboardLayout type="buyer">
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="buyer">
      <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">My Job Posts</h1>
            <p className="text-sm text-muted-foreground">
              Create and manage jobs like “Need Helper”, “Need Electrician”. Providers can apply and contact you.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/dashboard/buyer/job-posts/new">
              <Plus className="h-4 w-4 mr-2" />
              New job
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", "open", "in_progress", "completed", "cancelled", "expired"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              className="text-xs"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </Button>
          ))}
        </div>

        {jobs.length === 0 && !isLoading && (
          <Card>
            <CardContent className="py-10 flex flex-col items-center text-center gap-2">
              <Briefcase className="h-10 w-10 text-muted-foreground mb-1" />
              <p className="text-sm font-medium">No job posts yet</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Post your first job to get responses from trusted providers near you.
              </p>
              <Button size="sm" className="mt-3" asChild>
                <Link href="/dashboard/buyer/job-posts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Post a job
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {jobs.map((job) => (
            <Card
              key={job._id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => router.push(`/dashboard/buyer/job-posts/${job._id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-sm md:text-base">{job.title}</CardTitle>
                    <div className="flex flex-wrap items-start gap-2 text-xs text-muted-foreground">
                      {job.category && (
                        <Badge variant="outline" className="text-[11px]">
                          {job.category}
                        </Badge>
                      )}
                      {formatJobLocation(job.location) && (
                        <span className="inline-flex items-start gap-1 break-words min-w-0">
                          <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                          <span className="break-words">{formatJobLocation(job.location)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusBadgeVariant[job.status]} className="text-[11px] capitalize">
                      {job.status.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {job.appliedCount
                        ? `${job.appliedCount} application${job.appliedCount > 1 ? "s" : ""}`
                        : "No applications yet"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3 space-y-2 text-xs md:text-sm">
                <p className="text-muted-foreground line-clamp-2">{job.description}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-1 text-xs">
                    <IndianRupee className="h-3 w-3 text-muted-foreground" />
                    <span>{formatBudget(job)}</span>
                  </div>
                  {job.durationText && (
                    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{job.durationText}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  {job.status === "open" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(job._id, "completed")}>
                      Mark completed
                    </Button>
                  )}
                  {job.status === "open" && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(job._id, "cancelled")}>
                      Close job
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/buyer/job-posts/${job._id}`);
                    }}
                  >
                    View applications
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
