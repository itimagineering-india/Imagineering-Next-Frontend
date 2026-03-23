"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Menu, Search, User, ChevronDown, LogOut, LayoutDashboard, UserCircle, X, Loader2, Briefcase, Building2, MapPin, MessageSquare, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAuthToken } from "@/lib/api-client";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { CartIcon } from "@/components/cart/CartIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { LocationSearchInline } from "./LocationSearchInline";
import { useTranslation } from "react-i18next";

export function Header() {
  const { t } = useTranslation(["header", "common"]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { userLocation, isLoading: isLocationLoading } = useUserLocation();

  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [headerCategories, setHeaderCategories] = useState<Array<{ _id?: string; id?: string; name: string; slug: string; subcategories?: string[] }>>([]);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  // Fetch categories from backend (with subcategories)
  useEffect(() => {
    let mounted = true;
    api.categories.getAll(false, { includeSubcategories: true }).then((res) => {
      if (!mounted) return;
      if (res.success && res.data) {
        const cats = (res.data as { categories?: any[] }).categories || [];
        setHeaderCategories(Array.isArray(cats) ? cats : []);
      }
    }).catch(() => { if (mounted) setHeaderCategories([]); });
    return () => { mounted = false; };
  }, []);

  const placeholders = [
    t("header:searchPlaceholder"),
    t("header:searchCategory"),
    t("header:searchProvider"),
  ];

  const isActive = (path: string) => pathname === path;

  // Auth is handled globally via AuthProvider (no per-route /me calls)

  // Animate placeholder text
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Fetch search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
        suggestionsAbortRef.current = null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
      }
      const controller = new AbortController();
      suggestionsAbortRef.current = controller;
      setIsLoadingSuggestions(true);
      try {
        const response = await api.search.search({
          q: searchQuery.trim(),
          limit: 5, // Limit to 5 suggestions
        }, { signal: controller.signal });

        if (response.success && response.data) {
          const data = response.data as any;
          const services = data.services || [];
          const categories = data.categories || [];
          const providers = data.providers || [];
          const locations = data.locations || [];

          // Combine and format suggestions
          const allSuggestions: any[] = [];
          
          // Add services
          services.slice(0, 3).forEach((service: any) => {
            allSuggestions.push({
              type: 'service',
              id: service._id || service.id,
              title: service.title,
              subtitle: service.category?.name || 'Service',
              url: `/service/${service.slug || service._id || service.id}`,
            });
          });

          // Add categories
          categories.slice(0, 2).forEach((category: any) => {
            allSuggestions.push({
              type: 'category',
              id: category._id || category.id,
              title: category.name,
              subtitle: 'Category',
              url: `/services?category=${category.slug || category._id}`,
            });
          });

          // Add providers
          providers.slice(0, 2).forEach((provider: any) => {
            // Provider profile uses provider document ID or user ID
            const providerId = provider._id || provider.id || provider.user?._id;
            allSuggestions.push({
              type: 'provider',
              id: providerId,
              title: provider.businessName || provider.user?.name || 'Provider',
              subtitle: 'Provider',
              url: `/provider/${provider.slug || providerId}`,
            });
          });

          // Add locations
          locations.slice(0, 2).forEach((loc: any) => {
            const label = (loc?.label || '').toString().trim();
            if (!label) return;
            allSuggestions.push({
              type: 'location',
              id: label,
              title: label,
              subtitle: 'Location',
              url: `/services?locationText=${encodeURIComponent(label)}&view=services`,
            });
          });

          setSuggestions(allSuggestions);
          setShowSuggestions(allSuggestions.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          return;
        }
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSuggestions(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => {
      clearTimeout(debounceTimer);
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
        suggestionsAbortRef.current = null;
      }
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast({
      title: t("header:loggedOut"),
      description: t("header:loggedOutDescription"),
    });
    router.push("/");
  };

  const LOCATION_CACHE_KEY = "lastSearchLocation";
  const LOCATION_TTL_MS = 30 * 60 * 1000; // 30 minutes

  const getCachedLocation = (): { lat: number; lng: number } | null => {
    try {
      const raw = localStorage.getItem(LOCATION_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const lat = Number(parsed?.lat);
      const lng = Number(parsed?.lng);
      const ts = Number(parsed?.ts);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(ts)) return null;
      if (Date.now() - ts > LOCATION_TTL_MS) return null;
      return { lat, lng };
    } catch {
      return null;
    }
  };

  const cacheLocation = (lat: number, lng: number) => {
    try {
      localStorage.setItem(
        LOCATION_CACHE_KEY,
        JSON.stringify({ lat, lng, ts: Date.now() })
      );
    } catch {
      // ignore
    }
  };

  const getCurrentPositionSafe = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            cacheLocation(lat, lng);
            resolve({ lat, lng });
          } else {
            resolve(null);
          }
        },
        () => resolve(null),
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 5 * 60 * 1000 }
      );
    });
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    const role = user.role || "buyer";
    if (role === "admin") return "/dashboard/admin";
    if (role === "provider") return "/dashboard/provider";
    return "/dashboard/buyer/orders"; // Buyer goes to orders page
  };

  const getUserInitials = () => {
    if (typeof user?.name !== "string") return "U";
    const names = user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return user.name[0].toUpperCase();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const q = searchQuery.trim();
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
      // Only when searching (non-empty), default to Services view
      params.set("view", "services");
      // Simple intent parsing (rule-based)
      const qLower = q.toLowerCase();

      // Sort intent
      if (/\b(best|top)\b/.test(qLower)) {
        params.set("sort", "best");
      } else if (/\b(cheap|cheapest|lowest)\b/.test(qLower)) {
        params.set("sort", "price_low");
      }

      // Price intent: under/below 500
      const priceMatch = qLower.match(/\b(under|below)\s*₹?\s*(\d{1,7})\b/);
      if (priceMatch?.[2]) {
        params.set("maxPrice", priceMatch[2]);
      }

      // Nearby intent: near me / nearby / within X km
      const withinMatch = qLower.match(/\bwithin\s*(\d{1,3})\s*(km|kms)\b/);
      const wantsNearby =
        /\b(near me|nearby|around me)\b/.test(qLower) || !!withinMatch;
      if (withinMatch?.[1]) {
        params.set("radiusKm", withinMatch[1]);
      }

      if (wantsNearby) {
        // Only auto “nearby” if query implies it
        const cached = getCachedLocation();
        if (cached) {
          params.set("lat", String(cached.lat));
          params.set("lng", String(cached.lng));
        } else {
          const pos = await getCurrentPositionSafe();
          if (pos) {
            params.set("lat", String(pos.lat));
            params.set("lng", String(pos.lng));
          }
        }
      }

      // Location phrase: "in Indore" / "at Jabalpur"
      const locMatch = qLower.match(/\b(in|at)\s+([a-z][a-z\s]{1,40})$/);
      if (locMatch?.[2]) {
        params.set("locationText", locMatch[2].trim());
      }
    } else {
      // If user is not searching, don't force Services view.
      // Preserve current view if present; otherwise allow Services page to choose default.
      const currentParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const view = currentParams.get("view");
      if (view === "services" || view === "providers") {
        params.set("view", view);
      }
    }

    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
    setSearchQuery("");
  };

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const searchForm = (onSubmitExtra?: () => void, onSuggestionSelect?: () => void) => (
    <form
      onSubmit={(e) => {
        handleSearch(e);
        onSubmitExtra?.();
      }}
      className="flex items-center flex-1 min-w-0 max-w-full"
    >
      <div className="relative w-full" ref={searchRef}>
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 lg:h-4 lg:w-4 text-muted-foreground z-10 pointer-events-none" />
        <Input
          ref={searchInputRef}
          type="text"
          aria-label="Search services"
          placeholder={placeholders[placeholderIndex]}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setShowSuggestions(false);
              handleSearch();
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          className="pl-8 pr-8 lg:pl-9 lg:pr-9 h-8 lg:h-9 w-full min-w-0 max-w-full lg:w-80 placeholder:transition-all placeholder:duration-500 text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
            aria-label="Clear search"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </button>
        )}

        {/* Search Suggestions Dropdown */}
        {showSuggestions && searchQuery.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
            {isLoadingSuggestions ? (
              <div className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                    <Link
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      href={suggestion.url}
                      onClick={() => {
                        setShowSuggestions(false);
                        setSearchQuery("");
                        onSuggestionSelect?.();
                      }}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex-shrink-0">
                      {suggestion.type === 'service' && <Briefcase className="h-4 w-4 text-muted-foreground" />}
                      {suggestion.type === 'category' && <Building2 className="h-4 w-4 text-muted-foreground" />}
                      {suggestion.type === 'provider' && <User className="h-4 w-4 text-muted-foreground" />}
                      {suggestion.type === 'location' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.subtitle}
                      </p>
                    </div>
                  </Link>
                ))}
                <div className="border-t mt-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions(false);
                      handleSearch();
                    }}
                    className="w-full px-4 py-2 text-sm text-primary hover:bg-accent transition-colors text-left flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    <span>View all results for "{searchQuery}"</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>No results found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try different keywords</p>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex min-h-16 h-auto py-2 sm:py-3 items-center justify-between gap-2 sm:gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <img 
            src="https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png" 
            alt="Imagineering India Logo" 
            className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-sm sm:text-lg md:text-xl font-bold text-foreground leading-tight whitespace-nowrap">Imagineering India</span>
            <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground leading-tight">
              One Point Solution for all the Construction M3
            </span>
          </div>
        </Link>

        {/* Location - Inline search in dropdown */}
        <DropdownMenu open={locationDropdownOpen} onOpenChange={setLocationDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0 max-w-[140px] md:max-w-[180px]"
              title={userLocation?.address || "Set or change your location"}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs truncate">
                {userLocation
                  ? (userLocation.city || (userLocation.address ? userLocation.address.split(",").slice(0, 2).join(", ") : "Near you"))
                  : isLocationLoading
                    ? "Getting location..."
                    : "Set location"}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-72 p-0"
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target?.closest?.(".pac-container")) {
                e.preventDefault();
              }
            }}
          >
            {userLocation && (
              <>
                <DropdownMenuLabel className="font-normal px-3 pt-3 pb-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {userLocation.address || `${userLocation.city || "Current location"}`}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <LocationSearchInline onClose={() => setLocationDropdownOpen(false)} />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 shrink-0">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem key="browse-services">
                <NavigationMenuTrigger className="bg-transparent">{t("header:exploreServices")}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[560px] gap-4 p-4 md:grid-cols-2">
                    {/* Left: main categories */}
                    <div className="space-y-2 pr-3 border-r">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Browse by category
                      </p>
                      <div className="space-y-1.5">
                      {headerCategories.slice(0, 12).map((category, idx) => {
                        const isActive =
                          activeCategorySlug === category.slug ||
                          (!activeCategorySlug && idx === 0);

                        return (
                          <NavigationMenuLink key={category.id || category._id || category.slug || `cat-${idx}`} asChild>
                            <Link
                              href={`/services?category=${category.slug}`}
                              className={cn(
                                "block select-none rounded-md px-3 py-2 leading-none no-underline outline-none transition-colors text-sm",
                                isActive
                                  ? "bg-accent text-accent-foreground shadow-sm"
                                  : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              )}
                              onMouseEnter={(e) => {
                                // Only update preview, don't trigger navigation
                                e.preventDefault();
                                setActiveCategorySlug(category.slug);
                              }}
                            >
                              <div className="font-medium leading-none">
                                {category.name}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        );
                      })}
                      </div>
                    </div>

                    {/* Right: subcategories preview */}
                    <div className="hidden md:block pl-1">
                      {(() => {
                        const fallbackCategory = headerCategories[0];
                        const active =
                          headerCategories.find((c) => c.slug === activeCategorySlug) ||
                          fallbackCategory;
                        const subs =
                          (active?.subcategories && Array.isArray(active.subcategories)) 
                            ? active.subcategories 
                            : [];

                        if (!active) return null;

                        return (
                          <div className="rounded-md border bg-muted/40 p-3 h-full">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              {active.name} subcategories
                            </p>
                            {subs.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {subs.slice(0, 10).map((sub, i) => (
                                  <button
                                    key={`${active.slug}-${sub}-${i}`}
                                    type="button"
                                    onClick={() => {
                                      const params = new URLSearchParams();
                                      params.set("category", active.slug);
                                      params.set("subcategory", sub);
                                      router.push(`/services?${params.toString()}`);
                                    }}
                                    className="w-full text-left text-[11px] px-2 py-1 rounded-md bg-background hover:bg-accent hover:text-accent-foreground border text-muted-foreground transition-colors"
                                  >
                                    {sub}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-muted-foreground">
                                Explore all services in {active.name}.
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Search Bar - In Navigation (Desktop) */}
          <div className="w-80 shrink-0">
            {searchForm()}
          </div>

          <Link
            href="/about"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive("/about") ? "text-primary" : "text-muted-foreground",
            )}
          >
            {t("common:about")}
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <CartIcon />
          {!isAuthLoading && (
            <>
              {isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={typeof user.avatar === "string" ? user.avatar : undefined} alt={typeof user.name === "string" ? user.name : "User"} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-block text-sm font-medium">
                        {user.name || "User"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email || (user as { phone?: string }).phone || '—'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <UserCircle className="mr-2 h-4 w-4" />
                        {t("header:myProfile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/chat" className="flex items-center cursor-pointer">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Messages
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/requirement/submit" className="flex items-center cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        Get a quote
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "buyer" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/buyer/orders" className="flex items-center cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            My orders
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/buyer/requirements" className="flex items-center cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            My requirements
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/buyer/job-posts/new" className="flex items-center cursor-pointer">
                            <Briefcase className="mr-2 h-4 w-4" />
                            Post a job
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/buyer/job-posts" className="flex items-center cursor-pointer">
                            <FileText className="mr-2 h-4 w-4" />
                            My job posts
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {(user.role === "admin" || user.role === "provider") && (
                      <>
                        {user.role === "provider" && (
                          <DropdownMenuItem asChild>
                            <Link href="/jobs" className="flex items-center cursor-pointer">
                              <Briefcase className="mr-2 h-4 w-4" />
                              Browse jobs
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={getDashboardPath()} className="flex items-center cursor-pointer">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            {t("header:dashboard")}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("header:logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">{t("header:login")}</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">{t("header:signUp")}</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile: Search icon + Menu (3 lines) - grouped together */}
        <div className="flex items-center gap-0 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Open search"
            title="Search"
          >
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10"
                aria-label="Open menu"
                title="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetTitle className="sr-only">
              Imagineering India — {t("header:exploreServices")} and account menu
            </SheetTitle>
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/services" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                {t("header:exploreServices")}
              </Link>
              <div className="space-y-2">
                {userLocation && (
                  <Link
                    href={`/services?lat=${userLocation.lat}&lng=${userLocation.lng}`}
                    className="text-lg font-medium flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {userLocation.city || (userLocation.address?.split(",")[0]) || "Services near you"}
                    </span>
                  </Link>
                )}
                <LocationSearchInline onClose={() => setIsOpen(false)} className="p-0" />
              </div>
              <Link href="/about" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                {t("common:about")}
              </Link>
              <Link href="/contact" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                {t("common:contact")}
              </Link>
              <Link href="/help" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                {t("common:help")}
              </Link>
              <hr className="my-4" />
              {!isAuthLoading && (
                <>
                  {isAuthenticated && user ? (
                    <>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={typeof user.avatar === "string" ? user.avatar : undefined} alt={typeof user.name === "string" ? user.name : "User"} />
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email || (user as { phone?: string }).phone || '—'}</p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        className="text-lg font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        {t("header:myProfile")}
                      </Link>
                      <Link
                        href="/chat"
                        className="text-lg font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Messages
                      </Link>
                      <Link
                        href="/requirement/submit"
                        className="text-lg font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Get a quote
                      </Link>
                      {user.role === "buyer" && (
                        <>
                          <Link
                            href="/dashboard/buyer/orders"
                            className="text-lg font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            My orders
                          </Link>
                          <Link
                            href="/dashboard/buyer/requirements"
                            className="text-lg font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            My requirements
                          </Link>
                          <Link
                            href="/dashboard/buyer/job-posts/new"
                            className="text-lg font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            Post a job
                          </Link>
                          <Link
                            href="/dashboard/buyer/job-posts"
                            className="text-lg font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            My job posts
                          </Link>
                        </>
                      )}
                      {(user.role === "admin" || user.role === "provider") && (
                        <>
                          {user.role === "provider" && (
                            <Link
                              href="/jobs"
                              className="text-lg font-medium"
                              onClick={() => setIsOpen(false)}
                            >
                              Browse jobs
                            </Link>
                          )}
                          <Link
                            href={getDashboardPath()}
                            className="text-lg font-medium"
                            onClick={() => setIsOpen(false)}
                          >
                            {t("header:dashboard")}
                          </Link>
                        </>
                      )}
                      <Button
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("header:logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="text-lg font-medium" onClick={() => setIsOpen(false)}>
                        {t("header:login")}
                      </Link>
                      <Button asChild className="mt-2">
                        <Link href="/signup" onClick={() => setIsOpen(false)}>
                          {t("header:signUp")}
                        </Link>
                      </Button>
                    </>
                  )}
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        </div>

        {/* Mobile Search Dialog */}
        <Dialog open={mobileSearchOpen} onOpenChange={(open) => {
          setMobileSearchOpen(open);
          if (!open) {
            setSearchQuery("");
            setShowSuggestions(false);
          }
        }}>
          <DialogContent className="sm:max-w-md p-4 sm:p-6 gap-4 top-16 translate-y-0 rounded-t-none border-t-0">
            <DialogHeader className="sr-only">
              <DialogTitle>Search Services</DialogTitle>
            </DialogHeader>
            <div className="pt-2">
              {searchForm(
                () => setMobileSearchOpen(false),
                () => setMobileSearchOpen(false)
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
