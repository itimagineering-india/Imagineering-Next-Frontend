"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api, { type ApiResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Briefcase,
  MapPin,
  IndianRupee,
  Clock,
  ArrowLeft,
  Send,
  MessageSquare,
  Lightbulb,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { formatJobLocation } from "@/utils/jobLocation";

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
  buyer?: string | { _id?: string };
}

interface JobApplication {
  id: string;
  status: string;
  message?: string;
  proposedBudget?: number;
  proposedDuration?: string;
  createdAt?: string;
}

interface JobData {
  job: UserJobPost;
  application: JobApplication | null;
}

type JobResponse = ApiResponse<JobData>;

export default function UserJobDetails() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [job, setJob] = useState<UserJobPost | null>(null);
  const [existingApplication, setExistingApplication] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [proposedDuration, setProposedDuration] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "provider")) {
      router.replace(`/login?redirect=${encodeURIComponent(`/jobs/${id || ""}`)}`);
    }
  }, [authLoading, isAuthenticated, user, router, id]);

  const loadJob = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = (await api.userJobs.getById(id, "provider")) as JobResponse;
      if (res.success && res.data?.job) {
        setJob(res.data.job);
        const app = res.data.application;
        setExistingApplication(app);
        if (app?.message) {
          setApplyMessage(app.message);
          setProposedBudget(app.proposedBudget != null ? String(app.proposedBudget) : "");
          setProposedDuration(app.proposedDuration || "");
        } else {
          setApplyMessage("");
          setProposedBudget("");
          setProposedDuration("");
        }
        setIsEditing(false);
      } else {
        toast({
          title: "Could not load job",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not load job",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === "provider" && id) {
      loadJob();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role, id]);

  const formatBudget = (p: UserJobPost) => {
    if (p.budgetMin && p.budgetMax) {
      return `₹${p.budgetMin.toLocaleString()} – ₹${p.budgetMax.toLocaleString()}`;
    }
    if (p.budgetMin) {
      return `From ₹${p.budgetMin.toLocaleString()}`;
    }
    if (p.budgetMax) {
      return `Up to ₹${p.budgetMax.toLocaleString()}`;
    }
    return "Budget not specified";
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !id) return;
    if (!applyMessage.trim()) {
      toast({
        title: "Message required",
        description: "Please write a short message explaining why you are a good fit.",
        variant: "destructive",
      });
      return;
    }
    setIsApplying(true);
    try {
      const payload: {
        message: string;
        proposedBudget?: number;
        proposedDuration?: string;
      } = {
        message: applyMessage.trim(),
      };
      if (proposedBudget.trim()) {
        const num = Number(proposedBudget.replace(/[^\d.]/g, ""));
        if (!Number.isNaN(num) && num >= 0) payload.proposedBudget = num;
      }
      if (proposedDuration.trim()) {
        payload.proposedDuration = proposedDuration.trim();
      }

      const res = await api.userJobs.apply(id, payload);
      if (res.success) {
        toast({
          title: existingApplication ? "Application updated" : "Application sent",
          description: existingApplication
            ? "Your application has been updated."
            : "The buyer will see your application and may contact you.",
        });
        if (!existingApplication) {
          setApplyMessage("");
          setProposedBudget("");
          setProposedDuration("");
        }
        loadJob();
      } else {
        toast({
          title: "Could not apply",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not apply",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleContactBuyer = async () => {
    if (!job || !id) return;
    setIsContacting(true);
    try {
      const res = await api.userJobs.contactBuyer(id);
      if (res.success && (res.data as { buyerId?: string })?.buyerId) {
        toast({
          title: "Buyer details available",
          description: "Open the chat panel and start a conversation with the buyer.",
        });
      } else {
        toast({
          title: "Could not contact buyer",
          description: res.error?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: unknown) {
      toast({
        title: "Could not contact buyer",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsContacting(false);
    }
  };

  if (authLoading || !isAuthenticated || user?.role !== "provider") {
    return (
      <div className="container px-4 py-16 flex justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="border-b bg-card/90 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 -ml-2" asChild>
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4 mr-1" />
            All jobs
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link href="/dashboard/provider">Dashboard</Link>
        </Button>
      </div>
      <div className="flex-1 bg-gradient-to-b from-background to-muted/40">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-4xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </button>

          {isLoading && !job && <p className="text-sm text-muted-foreground">Loading job details...</p>}

          {job && (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4 md:p-6 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="space-y-1">
                      <h1 className="text-lg md:text-xl font-semibold flex items-start gap-2">
                        <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                        <span>{job.title}</span>
                      </h1>
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
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={job.status === "open" ? "default" : "outline"}
                        className="text-[11px] capitalize"
                      >
                        {job.status.replace("_", " ")}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {job.appliedCount
                          ? `${job.appliedCount} application${job.appliedCount > 1 ? "s" : ""}`
                          : "No applications yet"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
                    <div className="inline-flex items-center gap-1">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      <span>{formatBudget(job)}</span>
                    </div>
                    {job.durationText && (
                      <div className="inline-flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{job.durationText}</span>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t text-xs md:text-sm text-muted-foreground whitespace-pre-line">
                    {job.description}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6 space-y-3">
                  {(() => {
                    const buyerId =
                      typeof job.buyer === "object" && job.buyer?._id
                        ? String(job.buyer._id)
                        : job.buyer
                          ? String(job.buyer)
                          : "";
                    const currentUserId = (user as { _id?: string; id?: string })?._id || (user as { id?: string })?.id;
                    const isJobOwner = !!currentUserId && !!buyerId && String(currentUserId) === String(buyerId);

                    if (isJobOwner) {
                      return (
                        <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center">
                          <p className="text-sm font-medium">You posted this job</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            You cannot apply to your own job. View applications in{" "}
                            <Link href="/dashboard/buyer/job-posts" className="text-primary hover:underline">
                              My Job Posts
                            </Link>
                            .
                          </p>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <h2 className="text-sm md:text-base font-semibold flex items-center gap-2">
                            <Send className="h-4 w-4 text-primary" />
                            {existingApplication && !isEditing ? "Your application" : "Apply to this job"}
                          </h2>
                          {existingApplication && !isEditing && (
                            <Badge variant="secondary" className="text-[11px] capitalize">
                              {existingApplication.status}
                            </Badge>
                          )}
                        </div>

                        {existingApplication && !isEditing ? (
                          <div className="space-y-3">
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                              <p className="text-sm whitespace-pre-line">{existingApplication.message}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {existingApplication.proposedBudget != null && (
                                  <span className="inline-flex items-center gap-1">
                                    <IndianRupee className="h-3 w-3" />₹
                                    {existingApplication.proposedBudget.toLocaleString()} proposed
                                  </span>
                                )}
                                {existingApplication.proposedDuration && (
                                  <span className="inline-flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {existingApplication.proposedDuration}
                                  </span>
                                )}
                                {existingApplication.createdAt && (
                                  <span>
                                    Applied {format(new Date(existingApplication.createdAt), "dd MMM yyyy, HH:mm")}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 md:h-10 text-xs md:text-sm"
                                onClick={() => setIsEditing(true)}
                                disabled={job.status !== "open"}
                              >
                                <Pencil className="h-4 w-4 mr-1" />
                                Edit application
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 md:h-10 text-xs md:text-sm"
                                disabled={isContacting}
                                onClick={handleContactBuyer}
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {isContacting ? "Contacting..." : "Contact buyer"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <form onSubmit={handleApply} className="space-y-3 md:space-y-4">
                            <div className="space-y-2">
                              <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                                Message to buyer *
                              </label>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Lightbulb className="h-3 w-3" />
                                Tap a suggestion to use it, or write your own
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  {
                                    label: "Experience + Available",
                                    text: "I have experience in this work. Available immediately.",
                                  },
                                  {
                                    label: "Professional, start today",
                                    text: "I can do this job professionally. Can start today.",
                                  },
                                  {
                                    label: "Reasonable rates",
                                    text: "Experienced worker. Reasonable rates, quality work.",
                                  },
                                  {
                                    label: "Available now",
                                    text: "Available now. Will complete the job on time.",
                                  },
                                  {
                                    label: "Regular work",
                                    text: "I do this type of work regularly. Please contact.",
                                  },
                                ].map(({ label, text }) => (
                                  <button
                                    key={text}
                                    type="button"
                                    onClick={() => setApplyMessage(text)}
                                    className="text-[10px] md:text-xs px-2.5 py-1.5 rounded-md border bg-muted/50 hover:bg-muted transition-colors whitespace-nowrap"
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <Textarea
                                value={applyMessage}
                                onChange={(e) => setApplyMessage(e.target.value)}
                                rows={4}
                                placeholder="Briefly explain your experience and how you will complete this job."
                                className="text-xs md:text-sm resize-none"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                                  Proposed budget (optional)
                                </label>
                                <Input
                                  value={proposedBudget}
                                  onChange={(e) => setProposedBudget(e.target.value)}
                                  placeholder="e.g. 2000"
                                  className="h-9 md:h-10 text-xs md:text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                                  Estimated duration (optional)
                                </label>
                                <Input
                                  value={proposedDuration}
                                  onChange={(e) => setProposedDuration(e.target.value)}
                                  placeholder='e.g. "1 day", "3 hours"'
                                  className="h-9 md:h-10 text-xs md:text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                              <p className="text-[10px] md:text-xs text-muted-foreground max-w-md">
                                Your contact details are shared via the platform messaging only. Be professional and
                                avoid sharing sensitive information.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-9 md:h-10 text-xs md:text-sm"
                                  disabled={isContacting}
                                  onClick={handleContactBuyer}
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  {isContacting ? "Contacting..." : "Contact buyer"}
                                </Button>
                                {existingApplication && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 md:h-10 text-xs md:text-sm"
                                    onClick={() => setIsEditing(false)}
                                  >
                                    Cancel
                                  </Button>
                                )}
                                <Button
                                  type="submit"
                                  className="h-9 md:h-10 text-xs md:text-sm min-w-[120px]"
                                  disabled={isApplying || job.status !== "open"}
                                >
                                  {job.status !== "open"
                                    ? "Job closed"
                                    : isApplying
                                      ? existingApplication
                                        ? "Updating..."
                                        : "Submitting..."
                                      : existingApplication
                                        ? "Update application"
                                        : "Submit application"}
                                </Button>
                              </div>
                            </div>
                          </form>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
