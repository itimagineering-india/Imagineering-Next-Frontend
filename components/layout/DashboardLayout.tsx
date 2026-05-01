"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  MessageSquare,
  Settings,
  CreditCard,
  Menu,
  LogOut,
  Briefcase,
  Building2,
  Star,
  BarChart3,
  FileText,
  Plus,
  Users,
  FolderOpen,
  Shield,
  Calendar,
  Crown,
  Bell,
  HelpCircle,
  Store,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  type: "buyer" | "provider" | "admin";
}

const buyerNavItems = [
  { label: "My Orders", href: "/dashboard/buyer/orders", icon: ShoppingBag },
  { label: "My Job Posts", href: "/dashboard/buyer/job-posts", icon: Briefcase },
  { label: "Post a Job", href: "/dashboard/buyer/job-posts/new", icon: Plus },
  { label: "My Requirements", href: "/dashboard/buyer/requirements", icon: FileText },
  { label: "My Tickets", href: "/dashboard/buyer/tickets", icon: HelpCircle },
  { label: "Favorites", href: "/profile#favorites", icon: Heart },
  { label: "Messages", href: "/chat", icon: MessageSquare },
  { label: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
  { label: "Settings", href: "/profile", icon: Settings },
];

const providerNavItems = [
  { label: "Overview", href: "/dashboard/provider", icon: LayoutDashboard },
  { label: "My Services", href: "/dashboard/provider/services", icon: Briefcase },
  { label: "Business Profile", href: "/dashboard/provider/business-profile", icon: Building2 },
  { label: "KYC & Verification", href: "/dashboard/provider/kyc", icon: Shield },
  { label: "Requests", href: "/dashboard/provider/leads", icon: FileText },
  { label: "Hire labour", href: "/dashboard/provider/manpower-crew", icon: Users },
  { label: "Bookings & Jobs", href: "/dashboard/provider/bookings", icon: Calendar },
  // { label: "Messages", href: "/dashboard/provider/messages", icon: MessageSquare },
  { label: "Notifications", href: "/dashboard/provider/notifications", icon: Bell },
  { label: "Support", href: "/dashboard/provider/support", icon: HelpCircle },
  { label: "Earnings", href: "/dashboard/provider/earnings", icon: CreditCard },
  { label: "Payouts", href: "/dashboard/provider/payouts", icon: Store },
  { label: "Subscription", href: "/dashboard/provider/subscription", icon: Crown },
  { label: "Settings", href: "/dashboard/provider/settings", icon: Settings },
];

const adminNavItems = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Services", href: "/dashboard/admin/services", icon: Briefcase },
  { label: "Categories", href: "/dashboard/admin/categories", icon: FolderOpen },
  { label: "Reviews", href: "/dashboard/admin/reviews", icon: Star },
  { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  { label: "Support", href: "/dashboard/admin/support", icon: HelpCircle },
  { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
];

export function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isLoading: isLoadingUser, isAuthenticated, logout } = useAuth();
  
  const navItems = 
    type === "admin" ? adminNavItems :
    type === "buyer" ? buyerNavItems : 
    providerNavItems;
  
  const dashboardTitle = 
    type === "admin" ? "Admin Dashboard" :
    type === "buyer" ? "Buyer Dashboard" : 
    "Provider Dashboard";

  // User is loaded globally via AuthProvider

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png" 
            alt="Imagineering India Logo" 
            className="h-8 w-8 object-contain"
          />
          <span className="text-xl font-bold text-foreground">Imagineering India</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="border-b p-4">
        {isLoadingUser ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={typeof user.avatar === "string" ? user.avatar : undefined} />
              <AvatarFallback>
                {(typeof user.name === "string" ? user.name : typeof user.email === "string" ? user.email : (user as { phone?: string }).phone)?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{typeof user.name === "string" ? user.name : "User"}</p>
              <p className="text-xs text-muted-foreground capitalize">{typeof user.role === "string" ? user.role : type}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">You are not signed in.</p>
            <Button variant="default" size="sm" className="w-full" asChild>
              <Link href={`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`}>Sign in</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          let isActive = pathname === item.href;
          if (type === "buyer") {
            if (item.href === "/dashboard/buyer/job-posts/new") {
              isActive = pathname === "/dashboard/buyer/job-posts/new";
            } else if (item.href === "/dashboard/buyer/job-posts") {
              isActive =
                pathname === item.href ||
                (!!pathname?.startsWith("/dashboard/buyer/job-posts/") &&
                  pathname !== "/dashboard/buyer/job-posts/new");
            }
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Admin Badge */}
      {type === "admin" && (
        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Admin Access</p>
              <p className="text-xs text-muted-foreground">Full platform control</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      {isAuthenticated ? (
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      ) : null}
    </div>
  );

  // Provider: tabs layout (no sidebar)
  if (type === "provider") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 sm:gap-2 shrink-0 min-w-0">
            <img
              src="https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png"
              alt="Imagineering India Logo"
              className="h-7 w-7 object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-foreground leading-tight truncate">
                Imagineering India
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight truncate">
                One Point Solution for all the Construction M3
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/jobs"
              className="hidden sm:inline-flex text-xs md:text-sm font-medium text-primary hover:underline px-2"
            >
              Browse jobs
            </Link>
            {isLoadingUser ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" aria-hidden />
            ) : isAuthenticated && user ? (
              <>
                <span className="hidden max-w-[120px] truncate text-sm text-muted-foreground md:inline">
                  {typeof user.name === "string" ? user.name : typeof user.email === "string" ? user.email : "Account"}
                </span>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={typeof user.avatar === "string" ? user.avatar : undefined} />
                  <AvatarFallback>
                    {(typeof user.name === "string" ? user.name : typeof user.email === "string" ? user.email : (user as { phone?: string }).phone)?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground shrink-0"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link href={`/login?redirect=${encodeURIComponent(pathname || "/dashboard/provider")}`}>Sign in</Link>
              </Button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Buyer & Admin: top bar + slide-out menu (no fixed desktop sidebar)
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-card px-4">
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open dashboard menu"
              title="Open dashboard menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <span className="font-semibold truncate px-2">{dashboardTitle}</span>
          {isLoadingUser ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" aria-hidden />
          ) : isAuthenticated && user ? (
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={typeof user.avatar === "string" ? user.avatar : undefined} />
              <AvatarFallback>
                {(typeof user.name === "string" ? user.name : typeof user.email === "string" ? user.email : (user as { phone?: string }).phone)?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Button variant="outline" size="sm" className="shrink-0 text-xs px-2" asChild>
              <Link href={`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`}>Sign in</Link>
            </Button>
          )}
        </header>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">
            {dashboardTitle} — Imagineering India navigation
          </SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
