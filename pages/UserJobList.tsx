"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import api, { type ApiResponse } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Briefcase, MapPin, Search, IndianRupee, Clock, LayoutDashboard } from "lucide-react";
import { formatJobLocation } from "@/utils/jobLocation";

interface UserJobPost {
  _id: string;
  title: string;
  description: string;
  category?: string;
  location?: { address?: string; city?: string; state?: string };
  budgetMin?: number;
  budgetMax?: number;
  durationText?: string;
  status: "open" | "in_progress" | "completed" | "cancelled" | "expired";
  appliedCount?: number;
  createdAt: string;
}

type JobsResponse = ApiResponse<UserJobPost[]>;

export default function UserJobList() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [jobs, setJobs] = useState<UserJobPost[]>([]);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "provider")) {
      router.replace(`/login?redirect=${encodeURIComponent("/jobs")}`);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const res = (await api.userJobs.getAll({
        search: search || undefined,
        city: city || undefined,
        status: "open",
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
    if (!authLoading && isAuthenticated && user?.role === "provider") {
      loadJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
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
        <span className="text-sm font-medium text-foreground">Jobs</span>
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link href="/dashboard/provider" className="inline-flex items-center gap-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </Button>
      </div>
      <div className="bg-gradient-to-b from-background via-muted/30 to-background flex-1">
      <div className="container px-2 md:px-6 py-8 md:py-12 lg:py-6 space-y-6 md:space-y-8">
        <section className="space-y-2 md:space-y-3">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
            Browse jobs posted by buyers
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Find real work like helpers, electricians, carpenters and more. Apply with a short note and start a
            conversation with the buyer on Imagineering India.
          </p>
        </section>

        <section>
          <div className="rounded-xl border bg-card/80 backdrop-blur-sm p-3 md:p-4 lg:p-5 shadow-sm">
            <form
              onSubmit={handleFilterSubmit}
              className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_auto] gap-3 md:gap-4 items-end"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Search className="h-3 w-3" />
                  Search
                </label>
                <Input
                  placeholder='Job title or description (e.g. "electrician")'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 md:h-10 text-xs md:text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  City
                </label>
                <Input
                  placeholder="Any city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-9 md:h-10 text-xs md:text-sm"
                />
              </div>
              <Button type="submit" className="w-full md:w-auto h-9 md:h-10 text-xs md:text-sm" disabled={isLoading}>
                {isLoading ? "Loading..." : "Apply filters"}
              </Button>
            </form>
          </div>
        </section>

        <section className="space-y-4 md:space-y-5">
          {jobs.length === 0 && !isLoading && (
            <div className="rounded-xl border bg-card/80 backdrop-blur-sm px-6 py-10 flex flex-col items-center text-center gap-2 shadow-sm">
              <Briefcase className="h-10 w-10 text-muted-foreground mb-1" />
              <p className="text-sm md:text-base font-medium text-foreground">No open jobs right now</p>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md">
                Check again in some time. New jobs from buyers will appear here as soon as they are posted.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {jobs.map((job) => {
              const locationStr = formatJobLocation(job.location);
              return (
                <Card
                  key={job._id}
                  className="group cursor-pointer border bg-card/90 hover:bg-card transition-colors shadow-sm hover:shadow-md rounded-xl"
                  onClick={() => router.push(`/jobs/${job._id}`)}
                >
                  <CardContent className="p-4 md:p-5 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h2 className="text-sm md:text-base font-semibold line-clamp-2 group-hover:text-primary">
                          {job.title}
                        </h2>
                        <div className="flex flex-wrap items-start gap-2 text-[11px] md:text-xs text-muted-foreground">
                          {job.category && (
                            <Badge variant="outline" className="text-[10px] md:text-[11px]">
                              {job.category}
                            </Badge>
                          )}
                          {locationStr && (
                            <span className="inline-flex items-start gap-1 break-words min-w-0 max-w-full">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="break-words">{locationStr}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="inline-flex items-center gap-1 text-[11px] md:text-xs">
                          <IndianRupee className="h-3 w-3 text-muted-foreground" />
                          <span>{formatBudget(job)}</span>
                        </div>
                        {job.durationText && (
                          <div className="inline-flex items-center gap-1 text-[11px] md:text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{job.durationText}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] md:text-xs text-muted-foreground">
                        {job.appliedCount
                          ? `${job.appliedCount} application${job.appliedCount > 1 ? "s" : ""}`
                          : "Be the first to apply"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 text-[11px] md:text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/jobs/${job._id}`);
                        }}
                      >
                        View & apply
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
