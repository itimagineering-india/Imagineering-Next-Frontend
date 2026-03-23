"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, IndianRupee, Clock, ArrowRight } from "lucide-react";
import api from "@/lib/api-client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { formatJobLocation } from "@/utils/jobLocation";

interface JobPost {
  _id: string;
  title: string;
  description: string;
  location?: { address?: string; city?: string; state?: string };
  budgetMin?: number;
  budgetMax?: number;
  durationText?: string;
  createdAt: string;
}

export function JobsSection() {
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.05, rootMargin: "80px" });

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.userJobs.getRecentPublic();
        if (res.success && Array.isArray(res.data)) {
          setJobs(res.data as JobPost[]);
        }
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const formatBudget = (job: JobPost) => {
    if (job.budgetMin && job.budgetMax) {
      return `₹${job.budgetMin.toLocaleString()} – ₹${job.budgetMax.toLocaleString()}`;
    }
    if (job.budgetMin) return `From ₹${job.budgetMin.toLocaleString()}`;
    if (job.budgetMax) return `Up to ₹${job.budgetMax.toLocaleString()}`;
    return null;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <section
      className="relative py-12 md:py-16 lg:py-20 overflow-hidden"
      role="region"
      aria-labelledby="home-jobs-heading"
    >
      <div ref={ref} className="absolute inset-0 z-0 bg-gradient-to-b from-muted/20 via-background to-background pointer-events-none" aria-hidden />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div
          className={`text-center mb-8 md:mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 id="home-jobs-heading" className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 md:mb-3">
            <span className="text-foreground">Recent </span>
            <span className="text-[hsl(var(--red-accent))]">Jobs</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mx-auto">
            Buyers are looking for helpers, electricians, carpenters and more. Apply and start earning.
          </p>
        </div>

        <div
          className={`overflow-x-auto overflow-y-hidden pb-2 -mx-4 md:-mx-6 px-4 md:px-6 snap-x snap-mandatory transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          <div className="flex gap-4 md:gap-5">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Card
                  key={i}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start border bg-card rounded-xl overflow-hidden animate-pulse"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : jobs.length === 0 ? (
              <div className="flex-1 min-w-full text-center py-8 text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No jobs posted yet. Check back soon!</p>
              </div>
            ) : (
              jobs.slice(0, 10).map((job) => (
                <Link
                  key={job._id}
                  href={`/jobs/${job._id}`}
                  className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
                >
                  <Card className="h-full group cursor-pointer border bg-card hover:bg-card/95 transition-all hover:shadow-md rounded-xl overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-primary transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                      <div className="flex flex-wrap items-start gap-2 text-[11px] text-muted-foreground">
                        {(() => {
                          const loc = formatJobLocation(job.location);
                          return loc ? (
                            <span className="inline-flex items-start gap-1 break-words min-w-0">
                              <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                              <span className="break-words">{loc}</span>
                            </span>
                          ) : null;
                        })()}
                        {formatBudget(job) && (
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" />
                            {formatBudget(job)}
                          </span>
                        )}
                        {job.durationText && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.durationText}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Posted {formatDate(job.createdAt)}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>

        <div
          className={`mt-8 text-center transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "250ms" }}
        >
          <Button variant="outline" size="lg" className="gap-2" asChild>
            <Link href="/jobs">
              <Briefcase className="h-4 w-4" />
              View all jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
