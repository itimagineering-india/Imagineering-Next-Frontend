"use client";
import { useEffect, useState, useRef } from "react";
import { Briefcase, MapPin, Clock, Search, Send, CheckCircle2, List, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";

export async function getServerSideProps() { return { props: {} }; }

interface Job {
  _id: string;
  title: string;
  slug: string;
  department?: string;
  location: string;
  employmentType: "full_time" | "part_time" | "internship" | "contract";
  experienceLevel?: "junior" | "mid" | "senior" | "lead";
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  skills?: string[];
  description: string;
  responsibilities?: string;
  requirements?: string;
  perks?: string;
  isRemoteFriendly?: boolean;
}

interface JobsResponse {
  success: boolean;
  data?: Job[];
  error?: { message: string };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const employmentTypeLabel: Record<Job["employmentType"], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
};

const experienceLabelMap: Record<NonNullable<Job["experienceLevel"]>, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
};

const Careers = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [employmentFilter, setEmploymentFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [candidatePhone, setCandidatePhone] = useState("");
  const [candidateLocation, setCandidateLocation] = useState("");
  const [candidateExperience, setCandidateExperience] = useState("");
  const [candidateCompany, setCandidateCompany] = useState("");
  const [candidateLinkedIn, setCandidateLinkedIn] = useState("");
  const [candidatePortfolio, setCandidatePortfolio] = useState("");
  const [candidateCoverLetter, setCandidateCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const { toast } = useToast();
  const applicationFormRef = useRef<HTMLDivElement>(null);

  const scrollToApplyForm = () => {
    applicationFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = (await api.careers.getJobs({
        search: search || undefined,
        location: locationFilter || undefined,
        department: departmentFilter || undefined,
        employmentType: employmentFilter || undefined,
        page: 1,
        limit: 50,
      })) as JobsResponse;

      if (response.success && Array.isArray(response.data)) {
        setJobs(response.data);
        if (!selectedJob && response.data.length > 0) {
          setSelectedJob(response.data[0]);
        } else if (
          selectedJob &&
          !response.data.find((j) => j._id === selectedJob._id)
        ) {
          setSelectedJob(response.data[0] || null);
        }
      } else {
        setJobs([]);
        toast({
          title: "Could not load openings",
          description: response.error?.message || "Please try again in a moment.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to load jobs", error);
      setJobs([]);
      toast({
        title: "Could not load openings",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadJobs();
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    if (!candidateName.trim() || !candidateEmail.trim()) {
      toast({
        title: "Name and email are required",
        description: "Please fill in the required fields to apply.",
        variant: "destructive",
      });
      return;
    }

    setIsApplying(true);
    setApplySuccess(false);

    try {
      let resumeUrl: string | undefined;

      if (resumeFile) {
        const uploadResult = await api.careers.uploadResume(resumeFile);
        if (!uploadResult.success || !uploadResult.data?.url) {
          throw new Error(
            uploadResult.error?.message || "Failed to upload resume. Please try again."
          );
        }
        resumeUrl = uploadResult.data.url;
      }

      const payload = {
        name: candidateName.trim(),
        email: candidateEmail.trim(),
        phone: candidatePhone.trim() || undefined,
        currentLocation: candidateLocation.trim() || undefined,
        experienceYears: candidateExperience ? Number(candidateExperience) : undefined,
        currentCompany: candidateCompany.trim() || undefined,
        linkedInUrl: candidateLinkedIn.trim() || undefined,
        portfolioUrl: candidatePortfolio.trim() || undefined,
        coverLetter: candidateCoverLetter.trim() || undefined,
        resumeUrl,
        source: "web_careers_page",
      };

      const response = await api.careers.apply(
        selectedJob.slug || selectedJob._id,
        payload
      );

      if (response.success) {
        setApplySuccess(true);
        setCandidateName("");
        setCandidateEmail("");
        setCandidatePhone("");
        setCandidateLocation("");
        setCandidateExperience("");
        setCandidateCompany("");
        setCandidateLinkedIn("");
        setCandidatePortfolio("");
        setCandidateCoverLetter("");
        setResumeFile(null);

        toast({
          title: "Application submitted",
          description: "Our team will review your profile and get back to you.",
        });

        setTimeout(() => setApplySuccess(false), 3000);
      } else {
        toast({
          title: "Could not submit application",
          description: response.error?.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Failed to submit application", error);
      toast({
        title: "Could not submit application",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const uniqueDepartments = Array.from(
    new Set(jobs.map((j) => j.department).filter(Boolean) as string[])
  );
  const uniqueLocations = Array.from(
    new Set(jobs.map((j) => j.location).filter(Boolean))
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 bg-gradient-to-b from-background to-muted/40">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-16 lg:py-20">
        {/* Hero */}
        <section className="mb-10 md:mb-14 lg:mb-16">
          <div className="text-center max-w-3xl mx-auto mb-8 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Join the team building the{" "}
              <span className="text-primary">future of construction services</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6">
              At Imagineering India, we bring structure, transparency and trust to how India discovers
              and manages construction services. Work with product, engineering and on-ground teams
              solving real problems for buyers, providers and cities.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="text-xs md:text-sm">Fast-growing team</Badge>
              <Badge variant="secondary" className="text-xs md:text-sm">Remote + on-site</Badge>
              <Badge variant="secondary" className="text-xs md:text-sm">Pan-India impact</Badge>
            </div>
          </div>

          {/* How it works - 3 steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="flex gap-3 p-4 rounded-xl border bg-card/60">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <List className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">1. Browse jobs</h3>
                <p className="text-xs text-muted-foreground">Search and filter open roles below</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl border bg-card/60">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">2. View details</h3>
                <p className="text-xs text-muted-foreground">Click a role to see full description</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-xl border bg-card/60">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-0.5">3. Apply</h3>
                <p className="text-xs text-muted-foreground">Fill the form and submit your application</p>
              </div>
            </div>
          </div>

          {/* Why work with us */}
          <div className="rounded-xl border bg-card p-4 md:p-6 max-w-2xl mx-auto">
            <h2 className="text-base md:text-lg font-semibold flex items-center gap-2 mb-3">
              <Briefcase className="h-4 w-4 text-primary" />
              Why work with us?
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />Own zero-to-one product journeys</li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />Sharp team across product, ops & growth</li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />Build for scale – multi-city operations</li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />Transparent culture, fast feedback</li>
            </ul>
          </div>
        </section>

        {/* Filters + List */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] items-start">
          {/* Left: Filters + Jobs */}
          <div className="space-y-5 md:space-y-6">
            <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-3 md:p-4">
              <h3 className="text-sm font-semibold mb-3">Filter jobs</h3>
              <form
                onSubmit={handleFilterSubmit}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Search className="h-3 w-3" /> Search
                  </label>
                  <Input
                    placeholder="Title, skills..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 md:h-10 text-xs md:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" /> Location
                  </label>
                  <Input
                    list="careers-locations"
                    placeholder="Any"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="h-9 md:h-10 text-xs md:text-sm"
                  />
                  <datalist id="careers-locations">
                    {uniqueLocations.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <Input
                    list="careers-departments"
                    placeholder="Any"
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="h-9 md:h-10 text-xs md:text-sm"
                  />
                  <datalist id="careers-departments">
                    {uniqueDepartments.map((dep) => (
                      <option key={dep} value={dep} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Job type</label>
                  <select
                    value={employmentFilter}
                    onChange={(e) => setEmploymentFilter(e.target.value)}
                    className="w-full h-9 md:h-10 text-xs md:text-sm border rounded-md bg-background px-3"
                  >
                    <option value="">All types</option>
                    <option value="full_time">Full-time</option>
                    <option value="part_time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full h-9 md:h-10 text-xs md:text-sm" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Apply filters"}
                  </Button>
                </div>
              </form>
            </div>

            <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-3 md:p-4 lg:p-5 space-y-3 md:space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Open roles
                </h2>
                <span className="text-[11px] md:text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                  {isLoading
                    ? "Loading..."
                    : jobs.length === 0
                      ? "No roles"
                      : `${jobs.length} ${jobs.length === 1 ? "role" : "roles"}`}
                </span>
              </div>

              {jobs.length === 0 && !isLoading && (
                <div className="text-center border rounded-lg p-6 md:p-8 bg-muted/30">
                  <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/60 mb-2" />
                  <p className="text-sm font-medium mb-1">No open roles at the moment</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    You can still submit your profile below. We&apos;ll reach out when a relevant role opens up.
                  </p>
                </div>
              )}

              <div className="space-y-2 md:space-y-3">
                {jobs.map((job) => {
                  const isSelected = selectedJob?._id === job._id;
                  return (
                    <div
                      key={job._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedJob(job)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedJob(job)}
                      className={`w-full text-left rounded-lg border px-3 py-3 md:px-4 md:py-3.5 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm md:text-base font-semibold">
                            {job.title}
                          </h3>
                          {job.department && (
                            <p className="text-[11px] md:text-xs text-muted-foreground">
                              {job.department}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            <Badge
                              variant="outline"
                              className="text-[10px] md:text-[11px] font-normal"
                            >
                              {employmentTypeLabel[job.employmentType]}
                            </Badge>
                            {job.isRemoteFriendly && (
                              <Badge
                                variant="outline"
                                className="text-[10px] md:text-[11px] font-normal"
                              >
                                Remote friendly
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] md:text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{job.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 justify-between">
                        <div className="flex flex-wrap gap-1.5">
                          {job.experienceLevel && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] md:text-[11px] font-normal"
                            >
                              {experienceLabelMap[job.experienceLevel]}
                            </Badge>
                          )}
                          {Array.isArray(job.skills) &&
                            job.skills.slice(0, 3).map((skill) => (
                              <Badge
                                key={skill}
                                variant="outline"
                                className="text-[10px] md:text-[11px] font-normal"
                              >
                                {skill}
                              </Badge>
                            ))}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          className="h-7 text-[11px] shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedJob(job);
                            scrollToApplyForm();
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] md:text-xs text-muted-foreground mt-2">
                        <Clock className="h-3 w-3" />
                        <span>Typically responds in 3–5 business days</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Job details + Application */}
          <div className="space-y-4 md:space-y-5">
            <div className="rounded-xl border bg-card/70 backdrop-blur-sm p-4 md:p-5 lg:p-6">
              {selectedJob ? (
                <>
                  <div className="flex items-start justify-between gap-3 mb-3 md:mb-4">
                    <div>
                      <h2 className="text-base md:text-lg font-semibold">
                        {selectedJob.title}
                      </h2>
                      <p className="text-[11px] md:text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedJob.location}
                        </span>
                        <span>•</span>
                        <span>{employmentTypeLabel[selectedJob.employmentType]}</span>
                        {selectedJob.experienceLevel && (
                          <>
                            <span>•</span>
                            <span>{experienceLabelMap[selectedJob.experienceLevel]}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 md:space-y-4 text-xs md:text-sm text-muted-foreground">
                    <div>
                      <h3 className="text-xs md:text-sm font-semibold text-foreground mb-1">
                        About the role
                      </h3>
                      <p className="whitespace-pre-line">
                        {selectedJob.description}
                      </p>
                    </div>
                    {selectedJob.requirements && (
                      <div>
                        <h3 className="text-xs md:text-sm font-semibold text-foreground mb-1">
                          What we look for
                        </h3>
                        <p className="whitespace-pre-line">
                          {selectedJob.requirements}
                        </p>
                      </div>
                    )}
                    {selectedJob.responsibilities && (
                      <div>
                        <h3 className="text-xs md:text-sm font-semibold text-foreground mb-1">
                          What you will own
                        </h3>
                        <p className="whitespace-pre-line">
                          {selectedJob.responsibilities}
                        </p>
                      </div>
                    )}
                    {selectedJob.perks && (
                      <div>
                        <h3 className="text-xs md:text-sm font-semibold text-foreground mb-1">
                          Perks & benefits
                        </h3>
                        <p className="whitespace-pre-line">
                          {selectedJob.perks}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 md:py-12 px-4">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Select a job to view details</p>
                  <p className="text-xs text-muted-foreground">
                    Click on any role from the list on the left to see the full description and apply.
                  </p>
                </div>
              )}
            </div>

            {/* Application form */}
            <div ref={applicationFormRef} className="rounded-xl border bg-card/70 backdrop-blur-sm p-4 md:p-5 lg:p-6">
              <div className="flex items-center justify-between gap-2 mb-3 md:mb-4 flex-wrap">
                <h2 className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <Send className="h-4 w-4 text-primary" />
                  {selectedJob ? `Apply for: ${selectedJob.title}` : "Apply for a role"}
                </h2>
                {applySuccess && (
                  <span className="inline-flex items-center gap-1 text-[11px] md:text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Application sent
                  </span>
                )}
              </div>

              <form onSubmit={handleApply} className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Full name *
                    </label>
                    <Input
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      placeholder="Your full name"
                      className="h-9 md:h-10 text-xs md:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-9 md:h-10 text-xs md:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Phone
                    </label>
                    <Input
                      value={candidatePhone}
                      onChange={(e) => setCandidatePhone(e.target.value)}
                      placeholder="Optional"
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Current city
                    </label>
                    <Input
                      value={candidateLocation}
                      onChange={(e) => setCandidateLocation(e.target.value)}
                      placeholder="E.g. Bhopal, Bangalore"
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Total experience (years)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={candidateExperience}
                      onChange={(e) => setCandidateExperience(e.target.value)}
                      placeholder="E.g. 2.5"
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Current / last company
                    </label>
                    <Input
                      value={candidateCompany}
                      onChange={(e) => setCandidateCompany(e.target.value)}
                      placeholder="Optional"
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      LinkedIn profile URL
                    </label>
                    <Input
                      value={candidateLinkedIn}
                      onChange={(e) => setCandidateLinkedIn(e.target.value)}
                      placeholder="https://www.linkedin.com/in/..."
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Portfolio / website
                    </label>
                    <Input
                      value={candidatePortfolio}
                      onChange={(e) => setCandidatePortfolio(e.target.value)}
                      placeholder="Portfolio, GitHub, Behance, etc."
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                      Resume (PDF / DOC / DOCX)
                    </label>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setResumeFile(file);
                      }}
                      className="h-9 md:h-10 text-xs md:text-sm"
                    />
                    <p className="text-[10px] md:text-[11px] text-muted-foreground">
                      Optional, max size 10MB.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] md:text-xs font-medium text-muted-foreground">
                    Short note / cover letter
                  </label>
                  <Textarea
                    value={candidateCoverLetter}
                    onChange={(e) => setCandidateCoverLetter(e.target.value)}
                    rows={4}
                    placeholder="Tell us why you are a great fit for this role and Imagineering India."
                    className="text-xs md:text-sm resize-none"
                  />
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                  <p className="text-[10px] md:text-xs text-muted-foreground max-w-md">
                    By submitting this form you agree to be contacted by our hiring team
                    over email / phone for this and related roles.
                  </p>
                  <Button
                    type="submit"
                    className="h-9 md:h-10 text-xs md:text-sm min-w-[140px]"
                    disabled={isApplying || !selectedJob}
                  >
                    {isApplying ? "Submitting..." : selectedJob ? "Submit application" : "Select a role"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
};

export default Careers;

