"use client";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Mail,
  UserCheck,
  Lock,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

// Icons8 CDN URLs for quick action cards
const DASHBOARD_ICONS = {
  businessProfile: "https://img.icons8.com/color/96/building.png",
  services: "https://img.icons8.com/color/96/briefcase.png",
  
  addOffer: "https://img.icons8.com/color/96/price-tag.png",
  requests: "https://img.icons8.com/color/96/document.png",
  bookings: "https://img.icons8.com/color/96/calendar.png",
  kyc: "https://img.icons8.com/color/96/shield.png",
  notifications: "https://img.icons8.com/color/96/bell.png",
  support: "https://img.icons8.com/color/96/help.png",
  earnings: "https://img.icons8.com/color/96/cash.png",
  payouts: "https://img.icons8.com/color/96/request-money.png",
  subscription: "https://img.icons8.com/color/96/crown.png",
  settings: "https://img.icons8.com/color/96/settings.png",
};
import { useState, useEffect } from "react";
import api from "@/lib/api-client";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { KycLock } from "@/components/provider/KycLock";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export async function getServerSideProps() { return { props: {} }; }

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { status: kycStatus, progress } = useProviderKycStatus();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalBookings: 0,
    earningsThisMonth: 0,
    pendingRequests: 0,
    profileCompletion: 0,
    subscriptionStatus: "free",
    completedBookings: 0,
  });
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [performanceStats, setPerformanceStats] = useState({
    completionRate: 0,
    responseRate: 0,
    onTimeDelivery: 0,
    avgResponseTime: "0 hours",
  });
  const [providerId, setProviderId] = useState<string | null>(null);
  const [banners, setBanners] = useState<{ _id: string; title: string; imageUrl: string; link?: string; order: number }[]>([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const isLocked = kycStatus !== "KYC_APPROVED";

  const creditsBalance = (user as any)?.creditsBalance ?? 0;
  const referralCode = (user as any)?.referralCode ?? "";
  const referralStats = (user as any)?.referralStats as
    | { totalReferred?: number; successfulReferrals?: number; totalCreditsEarned?: number }
    | undefined;

  // Auto-rotate banner carousel every 5s
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await api.cms.getBanners("provider_dashboard");
        if (res.success && Array.isArray(res.data)) setBanners(res.data);
      } catch {
        // non-blocking
      }
    };
    loadBanners();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch dashboard stats and recent leads in parallel
      const [statsResponse, leadsResponse] = await Promise.all([
        api.providers.getDashboardStats(),
        api.providers.getRecentLeads(5),
      ]);

      if (statsResponse.success && statsResponse.data) {
        const responseData = statsResponse.data as any;
        const statsData = responseData.stats;
        
        if (statsData) {
          setStats({
            totalLeads: statsData.totalLeads || 0,
            totalBookings: statsData.totalBookings || 0,
            earningsThisMonth: statsData.earningsThisMonth || 0,
            pendingRequests: statsData.pendingRequests || 0,
            profileCompletion: statsData.profileCompletion || 0,
            subscriptionStatus: statsData.subscriptionStatus || "free",
            completedBookings: statsData.completedBookings || 0,
          });

          // Calculate performance stats
          const totalBookings = statsData.totalBookings || 0;
          const completed = statsData.completedBookings || 0;
          const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;
          
          // Calculate response rate (leads responded / total leads)
          const responseRate = statsData.totalLeads > 0 
            ? Math.round(((statsData.totalLeads - statsData.pendingRequests) / statsData.totalLeads) * 100)
            : 0;

          setPerformanceStats({
            completionRate: completionRate,
            responseRate: responseRate,
            onTimeDelivery: 92, // This would come from backend in future
            avgResponseTime: "1.5 hours", // This would come from backend in future
          });
        }
      }

      if (leadsResponse.success && leadsResponse.data) {
        const leadsData = leadsResponse.data as any;
        setRecentLeads(leadsData.leads || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderKycBanner = () => {
    if (kycStatus === "KYC_APPROVED") return null;

    if (kycStatus === "KYC_PENDING") {
      return (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <Badge variant="secondary" className="text-xs md:text-sm w-fit">KYC Pending</Badge>
              <p className="text-xs md:text-sm text-blue-900">
                Your KYC is under review. We'll notify you once approved.
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
              <Progress value={progress} className="flex-1 sm:flex-initial sm:w-24" />
              <span className="text-xs md:text-sm font-medium text-blue-900 shrink-0">{progress}%</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-3 md:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="text-xs md:text-sm w-fit">Limited Mode</Badge>
            <p className="text-xs md:text-sm text-amber-900">
              Complete KYC to activate your services and start receiving jobs.
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
            <Progress value={0} className="flex-1 sm:flex-initial sm:w-24" />
            <span className="text-xs md:text-sm font-medium text-amber-900 shrink-0">0%</span>
            <Button size="sm" className="text-xs md:text-sm shrink-0" asChild>
              <Link href="/dashboard/provider/kyc">
                <span className="hidden sm:inline">Complete KYC Now</span>
                <span className="sm:hidden">KYC</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const userName = (user as { name?: string })?.name || (user as { email?: string })?.email || "there";
  const pendingSummary =
    stats.pendingRequests > 0
      ? `${stats.pendingRequests} pending request${stats.pendingRequests === 1 ? "" : "s"} to respond`
      : "No pending requests";

  return (
    <div className="mx-auto max-w-6xl lg:max-w-[1600px] px-3 py-4 sm:px-4 sm:py-6 md:p-6 lg:p-8 space-y-5 sm:space-y-6 md:space-y-8 lg:space-y-10 min-w-0 overflow-x-hidden">
        {/* Hero: Banner – mobile: full viewport width (no side cut); sm+: edge-to-edge in content */}
        {banners.length > 0 && (
          <div className="relative mt-0 overflow-hidden bg-muted
            w-screen max-w-[100vw] left-1/2 -translate-x-1/2
            sm:w-[calc(100%+2rem)] sm:left-0 sm:translate-x-0 sm:-mx-4
            md:w-[calc(100%+3rem)] md:-mx-6
            lg:w-[calc(100%+4rem)] lg:-mx-8
            rounded-none sm:rounded-lg md:rounded-xl">
            <div className="relative aspect-[4/1] sm:aspect-auto sm:h-[280px] md:h-[400px] w-full min-w-0 flex items-center justify-center bg-muted/80">
              {banners.map((banner, i) => (
                <div
                  key={banner._id}
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500 flex items-center justify-center",
                    i === bannerIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  )}
                >
                  {banner.link ? (
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                    >
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 sm:p-4">
                        <p className="font-semibold text-white text-xs sm:text-base line-clamp-2">{banner.title}</p>
                      </div>
                    </a>
                  ) : (
                    <>
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2.5 sm:p-4">
                        <p className="font-semibold text-white text-xs sm:text-base line-clamp-2">{banner.title}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full shadow-md opacity-90 hover:opacity-100"
                  onClick={() => setBannerIndex((i) => (i - 1 + banners.length) % banners.length)}
                  aria-label="Previous banner"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 h-8 w-8 sm:h-9 sm:w-9 rounded-full shadow-md opacity-90 hover:opacity-100"
                  onClick={() => setBannerIndex((i) => (i + 1) % banners.length)}
                  aria-label="Next banner"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1 sm:gap-1.5">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Go to slide ${i + 1}`}
                      className={cn(
                        "h-1.5 sm:h-2 rounded-full transition-all",
                        i === bannerIndex ? "w-4 sm:w-6 bg-white" : "w-1.5 sm:w-2 bg-white/60 hover:bg-white/80"
                      )}
                      onClick={() => setBannerIndex(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Business Profile Score */}
        <Card className="border bg-card">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
            <div className="relative flex-shrink-0">
              <svg className="h-20 w-20 sm:h-24 sm:w-24 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-muted"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${stats.profileCompletion}, 100`}
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
                {isLoading ? "…" : `${stats.profileCompletion}%`}
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Increase Business Profile Score</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Reach out to more customers</p>
            </div>
            <Button asChild className="shrink-0 gap-1 text-xs sm:text-sm" size="sm">
              <Link href="/dashboard/provider/settings">
                <span className="hidden sm:inline">INCREASE SCORE</span>
                <span className="sm:hidden">SCORE</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Invite & Earn Credits */}
        {referralCode && (
          <Card className="border-dashed bg-card/60">
            <CardContent className="p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground">
                    Invite & Earn Credits
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Share your referral link with buyers and providers. You both earn credits on their first booking.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm text-muted-foreground">Credits balance</p>
                  <p className="text-base sm:text-lg font-semibold text-foreground">
                    {creditsBalance}
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="provider-referral-code"
                        value={referralCode}
                        readOnly
                        className="pr-10 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap text-xs sm:text-sm"
                      onClick={async () => {
                        try {
                          const origin =
                            typeof window !== "undefined" ? window.location.origin : "";
                          const link = origin
                            ? `${origin}/signup?ref=${encodeURIComponent(referralCode)}`
                            : referralCode;
                          await navigator.clipboard.writeText(link);
                          toast({
                            title: "Referral link copied",
                            description: "Share it to earn credits on new bookings.",
                          });
                        } catch {
                          toast({
                            title: "Could not copy",
                            description: "Please copy the referral code manually.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
              </div>
              {referralStats && (
                <div className="flex flex-wrap gap-3 text-[11px] sm:text-xs text-muted-foreground">
                  <span>
                    Invited: <span className="font-medium">{referralStats.totalReferred ?? 0}</span>
                  </span>
                  <span>
                    Successful:{" "}
                    <span className="font-medium">{referralStats.successfulReferrals ?? 0}</span>
                  </span>
                  <span>
                    Credits earned:{" "}
                    <span className="font-medium">
                      {referralStats.totalCreditsEarned ?? creditsBalance}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions – mobile: 4 cols smaller; sm+ more cols */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4">
          {[
             { label: "Business Profile", href: "/dashboard/provider/business-profile", icon: DASHBOARD_ICONS.businessProfile },
            { label: "My Services", href: "/dashboard/provider/services", icon: DASHBOARD_ICONS.services },
           
            {
              label: "Add Offer",
              href: stats.subscriptionStatus !== "free" ? "/dashboard/provider/offers" : "/dashboard/provider/subscription",
              icon: DASHBOARD_ICONS.addOffer,
              badge: stats.subscriptionStatus === "free" ? "Premium" : undefined,
            },
            { label: "Requests", href: "/dashboard/provider/leads", icon: DASHBOARD_ICONS.requests, badge: stats.pendingRequests },
            { label: "Bookings", href: "/dashboard/provider/bookings", icon: DASHBOARD_ICONS.bookings },
            { label: "KYC", href: "/dashboard/provider/kyc", icon: DASHBOARD_ICONS.kyc, badge: isLocked ? "!" : undefined },
            { label: "Notifications", href: "/dashboard/provider/notifications", icon: DASHBOARD_ICONS.notifications },
            { label: "Support", href: "/dashboard/provider/support", icon: DASHBOARD_ICONS.support },
            { label: "Earnings", href: "/dashboard/provider/earnings", icon: DASHBOARD_ICONS.earnings },
            { label: "Payouts", href: "/dashboard/provider/payouts", icon: DASHBOARD_ICONS.payouts },
            { label: "Subscription", href: "/dashboard/provider/subscription", icon: DASHBOARD_ICONS.subscription },
            { label: "Settings", href: "/dashboard/provider/settings", icon: DASHBOARD_ICONS.settings },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-1.5 sm:gap-2 group"
            >
              <div className="relative rounded-full h-11 w-11 sm:h-14 sm:w-14 flex items-center justify-center bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                <img src={item.icon} alt={item.label} className="h-5 w-5 sm:h-6 sm:w-6 object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                {item.badge != null && item.badge !== 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] font-medium px-0.5 sm:px-1">
                    {typeof item.badge === "number" ? (item.badge > 99 ? "99+" : item.badge) : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-center text-foreground leading-tight max-w-[64px] sm:max-w-[72px]">{item.label}</span>
            </Link>
          ))}
        </div>

        {renderKycBanner()}

        {/* My Business – Recent requests & Performance */}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">My Business</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <CardTitle className="text-base md:text-lg">Recent Requests</CardTitle>
                <CardDescription className="text-xs md:text-sm">New client inquiries</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs md:text-sm self-start sm:self-auto" asChild>
                <Link href="/dashboard/provider/leads">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6 md:py-8 text-sm md:text-base text-muted-foreground">
                  Loading recent requests...
                </div>
              ) : recentLeads.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {recentLeads.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 md:p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 shrink-0">
                          <AvatarImage
                            src={request.client.avatar}
                            alt={request.client.name}
                          />
                          <AvatarFallback className="text-xs md:text-sm">{request.client.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <p className="font-medium text-sm md:text-base truncate">{request.title}</p>
                            {request.status === "new" && (
                              <Badge className="bg-success text-success-foreground text-[10px] md:text-xs shrink-0">
                                New
                              </Badge>
                            )}
                            {request.status === "viewed" && (
                              <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">
                                Viewed
                              </Badge>
                            )}
                            {request.status === "responded" && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs shrink-0">
                                Responded
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                            {request.client.name} • {request.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                        <p className="font-semibold text-sm md:text-base">{request.budget}</p>
                        <Button size="sm" className="text-xs md:text-sm shrink-0" asChild>
                          <Link href={`/dashboard/provider/leads`}>
                            {request.status === "new" ? "Respond" : "View"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 md:py-8 text-sm md:text-base text-muted-foreground">
                  No recent requests. Your leads will appear here.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg">Performance</CardTitle>
              <CardDescription className="text-xs md:text-sm">Your monthly stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm">Completion Rate</span>
                  <span className="font-semibold text-xs md:text-sm">{isLoading ? "..." : `${performanceStats.completionRate}%`}</span>
                </div>
                <Progress value={performanceStats.completionRate} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm">Response Rate</span>
                  <span className="font-semibold text-xs md:text-sm">{isLoading ? "..." : `${performanceStats.responseRate}%`}</span>
                </div>
                <Progress value={performanceStats.responseRate} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs md:text-sm">On-Time Delivery</span>
                  <span className="font-semibold text-xs md:text-sm">{isLoading ? "..." : `${performanceStats.onTimeDelivery}%`}</span>
                </div>
                <Progress value={performanceStats.onTimeDelivery} />
              </div>
              <div className="pt-3 md:pt-4 border-t">
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Avg. Response Time: {performanceStats.avgResponseTime}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
  );
}
