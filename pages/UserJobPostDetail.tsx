"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api, { type ApiResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  MapPin,
  IndianRupee,
  Clock,
  ArrowLeft,
  MessageSquare,
  Phone,
  Mail,
  User,
  Loader2,
  CalendarCheck,
} from "lucide-react";
import { formatJobLocation } from "@/lib/utils";
import { format } from "date-fns";

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

interface Application {
  _id: string;
  provider: { _id: string; name?: string; email?: string; phone?: string };
  message: string;
  proposedBudget?: number;
  proposedDuration?: string;
  status: string;
  createdAt: string;
}

interface JobDetailData {
  job: UserJobPost;
  applications: Application[];
}

type JobDetailResponse = ApiResponse<JobDetailData>;

export default function UserJobPostDetail() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [job, setJob] = useState<UserJobPost | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(`/dashboard/buyer/job-posts/${id || ""}`)}`);
    }
  }, [authLoading, isAuthenticated, router, id]);

  const loadJob = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = (await api.userJobs.getById(id, "buyer")) as JobDetailResponse;
      if (res.success && res.data) {
        setJob(res.data.job);
        setApplications(res.data.applications || []);
      } else {
        toast({
          title: "Could not load job",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
        router.push("/dashboard/buyer/job-posts");
      }
    } catch (err: unknown) {
      toast({
        title: "Could not load job",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      router.push("/dashboard/buyer/job-posts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && id) {
      loadJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, id]);

  const handleStatusChange = async (status: UserJobPost["status"]) => {
    if (!id) return;
    setStatusUpdating(true);
    try {
      const res = await api.userJobs.updateStatus(id, status);
      if (res.success) {
        toast({ title: "Status updated", description: `Job marked as ${status.replace("_", " ")}.` });
        loadJob();
      } else {
        toast({
          title: "Could not update",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not update",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const formatBudget = (p: UserJobPost) => {
    if (p.budgetMin && p.budgetMax) {
      return `₹${p.budgetMin.toLocaleString()} – ₹${p.budgetMax.toLocaleString()}`;
    }
    if (p.budgetMin) return `From ₹${p.budgetMin.toLocaleString()}`;
    if (p.budgetMax) return `Up to ₹${p.budgetMax.toLocaleString()}`;
    return "Budget not specified";
  };

  const statusBadgeVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
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

  if (isLoading || !job) {
    return (
      <DashboardLayout type="buyer">
        <div className="flex min-h-[40vh] items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="buyer">
      <div className="w-full max-w-5xl mx-auto px-4 py-6 md:py-8">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
          <Link href="/dashboard/buyer/job-posts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Job Posts
          </Link>
        </Button>

        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg md:text-xl">{job.title}</CardTitle>
                <div className="flex flex-wrap items-start gap-2 text-sm text-muted-foreground">
                  {job.category && (
                    <Badge variant="outline" className="text-xs">
                      {job.category}
                    </Badge>
                  )}
                  {formatJobLocation(job.location) && (
                    <span className="inline-flex items-start gap-1 break-words min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="break-words">{formatJobLocation(job.location)}</span>
                    </span>
                  )}
                </div>
              </div>
              <Badge variant={statusBadgeVariant[job.status] || "outline"} className="capitalize w-fit">
                {job.status.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{job.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                {formatBudget(job)}
              </span>
              {job.durationText && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {job.durationText}
                </span>
              )}
              <span className="text-muted-foreground">Posted {format(new Date(job.createdAt), "dd MMM yyyy")}</span>
            </div>
            {job.status === "open" && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange("completed")}
                  className="gap-2"
                >
                  {statusUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Mark completed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={statusUpdating}
                  onClick={() => handleStatusChange("cancelled")}
                >
                  Close job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Applications ({applications.length})</h2>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No applications yet. Providers will see your job on the Jobs page and can apply.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Share your job or wait for providers to discover it.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const provider = app.provider as { _id: string; name?: string; email?: string; phone?: string };
                const providerId = provider?._id;
                const providerName = provider?.name || "Provider";
                const providerEmail = provider?.email || "";
                const providerPhone = provider?.phone || "";

                return (
                  <Card key={app._id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{providerName}</span>
                          </div>
                          {providerEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3.5 w-3.5" />
                              <a href={`mailto:${providerEmail}`} className="hover:text-primary">
                                {providerEmail}
                              </a>
                            </div>
                          )}
                          {providerPhone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              <a href={`tel:${providerPhone}`} className="hover:text-primary">
                                {providerPhone}
                              </a>
                            </div>
                          )}
                          <p className="text-sm mt-2">{app.message}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {app.proposedBudget != null && (
                              <span className="inline-flex items-center gap-1">
                                <IndianRupee className="h-3 w-3" />₹{app.proposedBudget.toLocaleString()} proposed
                              </span>
                            )}
                            {app.proposedDuration && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {app.proposedDuration}
                              </span>
                            )}
                            <span>Applied {format(new Date(app.createdAt), "dd MMM yyyy, HH:mm")}</span>
                          </div>
                        </div>
                        {providerId && (
                          <div className="flex flex-nowrap sm:flex-wrap gap-1.5 sm:gap-2 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                            <Link href={`/provider/${providerId}`} className="shrink-0">
                              <Button size="sm" variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">View Profile</span>
                              </Button>
                            </Link>

                            <Link
                              href={`/chat?providerId=${providerId}&name=${encodeURIComponent(providerName)}`}
                              className="shrink-0"
                            >
                              <Button size="sm" variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Message</span>
                              </Button>
                            </Link>
                            <Link href={`/provider/${providerId}#services`} className="shrink-0">
                              <Button size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8">
                                <CalendarCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                                <span className="whitespace-nowrap">Book Now</span>
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
