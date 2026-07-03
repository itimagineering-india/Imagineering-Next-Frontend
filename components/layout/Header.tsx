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
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Search, User, ChevronDown, LogOut, LayoutDashboard, UserCircle, X, Loader2, Briefcase, Building2, MapPin, MessageSquare, FileText, Users, Zap, Mic, MicOff, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import api, { getAuthToken, fetchSearchSuggestions } from "@/lib/api-client";
import { parseHeaderSearchQuery } from "@/lib/searchNavigation";
import { getSubcategoryNames } from "@/lib/categorySubcategories";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { CartIcon } from "@/components/cart/CartIcon";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { LocationSearchInline } from "./LocationSearchInline";
import { useTranslation } from "react-i18next";
import {
 ConstructionCompaniesIcon,
 ConstructionMaterialsIcon,
 ContractorsIcon,
 FinancingIcon,
 LogisticsIcon,
 MachinesIcon,
 ManpowerIcon,
 ManufacturerIcon,
 RentalServicesIcon,
 TechnicalManpowerIcon,
 HomesIcon,
} from "@/components/home/CategoryIcons";

const IMAGIMITRA_DOWNLOAD_URL =
 "https://play.google.com/store/apps/details?id=com.imagineeringindia.imagimitra";

export function Header() {
 const mainHeadline = "ONE POINT SOLUTION FOR ALL THE CONSTRUCTION M3";
 const { t } = useTranslation(["header", "common", "services"]);
 const [showImagiMitraBar, setShowImagiMitraBar] = useState(true);
 const [isOpen, setIsOpen] = useState(false);
 const [searchQuery, setSearchQuery] = useState("");
 const [placeholderIndex, setPlaceholderIndex] = useState(0);
 const [suggestions, setSuggestions] = useState<any[]>([]);
 const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
 const [showSuggestions, setShowSuggestions] = useState(false);
 const [isListening, setIsListening] = useState(false);
 const [voiceModalOpen, setVoiceModalOpen] = useState(false);
 const [voiceTranscript, setVoiceTranscript] = useState("");
 const searchRef = useRef<HTMLDivElement>(null);
 const searchInputRef = useRef<HTMLInputElement>(null);
 const suggestionsAbortRef = useRef<AbortController | null>(null);
 const speechRecognitionRef = useRef<any>(null);
 const voiceShouldSubmitRef = useRef(false);
 const pathname = usePathname();
 const router = useRouter();
 const { toast } = useToast();
 const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
 const { userLocation, isLoading: isLocationLoading } = useUserLocation();
 const { cartCount } = useCart();

 const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
 const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [b2bCategories, setB2bCategories] = useState<Array<{ slug: string; name: string; subcategories?: string[] }>>([]);
  const [activeB2bCategorySlug, setActiveB2bCategorySlug] = useState<string | null>(null);
  const [activeB2bSubcategory, setActiveB2bSubcategory] = useState<string | null>(null);
 const [headerCategories, setHeaderCategories] = useState<Array<{ _id?: string; id?: string; name: string; slug: string; subcategories?: string[] }>>([]);
 const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
 const [typedHeadline, setTypedHeadline] = useState("");
 const [isClient, setIsClient] = useState(false);

 useEffect(() => {
  setIsClient(true);
 }, []);

 useEffect(() => {
  setTypedHeadline("");
  let charIndex = 0;
  const timer = window.setInterval(() => {
   charIndex += 1;
   setTypedHeadline(mainHeadline.slice(0, charIndex));
   if (charIndex >= mainHeadline.length) {
    window.clearInterval(timer);
   }
  }, 50);

  return () => window.clearInterval(timer);
 }, [mainHeadline]);

 useEffect(() => {
  const onScroll = () => {
   setShowImagiMitraBar(window.scrollY < 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
 }, []);

 useEffect(() => {
  return () => {
   speechRecognitionRef.current?.abort?.();
  };
 }, []);

 const getExploreCategoryIcon = (slug: string) => {
  switch (slug) {
   case "construction-companies":
    return <ConstructionCompaniesIcon className="h-6 w-6" />;
   case "construction-materials":
    return <ConstructionMaterialsIcon className="h-6 w-6" />;
   case "contractors":
    return <ContractorsIcon className="h-6 w-6" />;
   case "financing":
    return <FinancingIcon className="h-6 w-6" />;
   case "logistics":
    return <LogisticsIcon className="h-6 w-6" />;
   case "machines":
    return <MachinesIcon className="h-6 w-6" />;
   case "manpower":
    return <ManpowerIcon className="h-6 w-6" />;
   case "manufacturer":
    return <ManufacturerIcon className="h-6 w-6" />;
   case "real-estate":
    return <HomesIcon className="h-6 w-6" />;
   case "rental-services":
    return <RentalServicesIcon className="h-6 w-6" />;
   case "technical-manpower":
    return <TechnicalManpowerIcon className="h-6 w-6" />;
   case "consultant":
    return <ManpowerIcon className="h-6 w-6" />;
   default:
    return <ConstructionMaterialsIcon className="h-6 w-6" />;
  }
 };

  const getB2BCategoryIcon = (slug: string) => {
    switch (slug) {
      case "construction-material":
      case "construction-materials":
        return <Building2 className="h-6 w-6" />;
      case "electrical-lightening":
      case "electrical-lighting":
        return <Zap className="h-6 w-6" />;
      case "hardware-senitary":
      case "hardware":
        return <Briefcase className="h-6 w-6" />;
      case "furniture":
        return <Briefcase className="h-6 w-6" />;
      case "furniture-hardware":
        return <Briefcase className="h-6 w-6" />;
      default:
        return <Building2 className="h-6 w-6" />;
    }
  };

 // Fetch categories from backend (with subcategories)
 useEffect(() => {
  let mounted = true;
  api.categories.getAll(false, { includeSubcategories: true, admin: true }).then((res) => {
   if (!mounted) return;
   if (res.success && res.data) {
    const cats = (res.data as { categories?: any[] }).categories || [];
    const normalized = Array.isArray(cats) ? cats : [];
    const activeCategoriesForExplore = normalized.filter((c: any) => c?.isActive !== false);

       // B2B categories come from admin-configured categories (subcategories too),
       // even if they are not active yet.
       // We filter by category name to keep this UI aligned with what admins add in the Categories admin panel.
       const b2bNameSet = new Set([
        "construction material",
        "construction materials",
        "electrical & lighting",
        "electrical & lightening",
        "furniture",
        "furniture & hardware",
        "furniture and hardware",
        "hardware and senitary",
        "hardware",
       ]);
       const filteredB2b = normalized.filter((c: any) => {
        const name = (c?.name ?? "").toString().toLowerCase().replace(/\s+/g, " ").trim();
        const interactionType = (c?.interactionType ?? "").toString();
        const matchesName =
         b2bNameSet.has(name) ||
         // Allow minor formatting differences (e.g. electrical-lighting vs electrical & lighting).
         name.replace(/&/g, "").trim() === "electrical lighting" ||
         name.replace(/&/g, "").trim() === "electrical lightening";

        // Only show categories that admins marked for purchase flow.
        return matchesName && (!interactionType || interactionType === "PURCHASE_ONLY");
       });
       const withSubcategoryNames = (category: any) => ({
        ...category,
        subcategories: getSubcategoryNames(category?.subcategories),
       });
       setB2bCategories(filteredB2b.map(withSubcategoryNames));
       setActiveB2bCategorySlug(filteredB2b[0]?.slug ?? null);
       setActiveB2bSubcategory(null);

       setHeaderCategories(activeCategoriesForExplore.map(withSubcategoryNames));
    const firstWithSubs =
     activeCategoriesForExplore.find((c: any) => Array.isArray(c?.subcategories) && c.subcategories.length > 0) ||
     activeCategoriesForExplore[0];
    if (!activeCategorySlug && firstWithSubs?.slug) {
     setActiveCategorySlug(firstWithSubs.slug);
    }
    setActiveSubcategory(null);
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
    const allSuggestions = await fetchSearchSuggestions(searchQuery.trim(), 5);
    if (controller.signal.aborted) return;
    setSuggestions(allSuggestions);
    setShowSuggestions(allSuggestions.length > 0);
   } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
     return;
    }
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
  const names = user.name.split("");
  if (names.length >= 2) {
   return `${names[0][0]}${names[1][0]}`.toUpperCase();
  }
  return user.name[0].toUpperCase();
 };

 const handleSearch = async (e?: React.FormEvent, queryOverride?: string) => {
  if (e) e.preventDefault();
  setShowSuggestions(false);

  const q = (queryOverride ?? searchQuery).trim();
  const params = new URLSearchParams();
  if (q) {
   const parsed = parseHeaderSearchQuery(q);
   params.set("q", parsed.keyword);
   // Only when searching (non-empty), default to Services view
   params.set("view", "services");

   if (parsed.sort === "best") {
    params.set("sort", "best");
   } else if (parsed.sort === "price_low") {
    params.set("sort", "price_low");
   }

   if (parsed.maxPrice) {
    params.set("maxPrice", parsed.maxPrice);
   }

   if (parsed.radiusKm) {
    params.set("radiusKm", parsed.radiusKm);
   }

   if (parsed.nearby) {
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

   if (parsed.locationText) {
    params.set("locationText", parsed.locationText);
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

 const handleVoiceSearch = () => {
  const SpeechRecognition =
   typeof window !== "undefined" &&
   ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  if (!SpeechRecognition) {
   toast({
    title: "Voice search not supported",
    description: "Please use Chrome or another browser that supports speech search.",
    variant: "destructive",
   });
   return;
  }

  if (isListening) {
   voiceShouldSubmitRef.current = true;
   speechRecognitionRef.current?.stop?.();
   setIsListening(false);
   return;
  }

  voiceShouldSubmitRef.current = true;
  setVoiceTranscript("");
  setVoiceModalOpen(true);
  const recognition = new SpeechRecognition();
  speechRecognitionRef.current = recognition;
  recognition.lang = "hi-IN";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let finalTranscript = "";
  recognition.onstart = () => {
   setIsListening(true);
   setShowSuggestions(false);
  };
  recognition.onresult = (event: any) => {
   const transcript = Array.from(event.results || [])
    .map((result: any) => result?.[0]?.transcript || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
   if (transcript) {
    finalTranscript = transcript;
    setSearchQuery(transcript);
    setVoiceTranscript(transcript);
   }
  };
  recognition.onerror = (event: any) => {
   if (!voiceShouldSubmitRef.current && event?.error === "aborted") {
    return;
   }
   voiceShouldSubmitRef.current = false;
   setIsListening(false);
   setVoiceModalOpen(false);
   toast({
    title: "Could not hear clearly",
    description: "Please try again or type your search.",
    variant: "destructive",
   });
  };
  recognition.onend = () => {
   setIsListening(false);
   const spokenQuery = finalTranscript.trim();
   if (voiceShouldSubmitRef.current && spokenQuery) {
    setVoiceModalOpen(false);
    handleSearch(undefined, spokenQuery);
   }
   voiceShouldSubmitRef.current = false;
  };
  recognition.start();
 };

 const handleVoiceModalOpenChange = (open: boolean) => {
  setVoiceModalOpen(open);
  if (!open && isListening) {
   voiceShouldSubmitRef.current = false;
   speechRecognitionRef.current?.abort?.();
   setIsListening(false);
  }
 };

 const searchForm = (onSubmitExtra?: () => void, onSuggestionSelect?: () => void) => (
  <form
   onSubmit={(e) => {
    handleSearch(e);
    onSubmitExtra?.();
   }}
   className="flex items-center flex-1 min-w-0 max-w-full"
  >
   <div className="relative w-full" ref={searchRef}>
    <div className="flex h-11 w-full min-w-0 items-center gap-1.5 rounded-2xl border border-primary/20 bg-background px-2 py-1.5 shadow-[0_10px_30px_rgba(37,99,235,0.18)] ring-1 ring-primary/10 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/25 lg:h-12 lg:px-3">
     <button
      type="submit"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
      aria-label="Search"
      title="Search"
     >
      <Search className="h-4 w-4 shrink-0" />
     </button>
     <Input
      ref={searchInputRef}
      type="text"
      aria-label="Search services"
      placeholder="What are you looking for today?"
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
       if (e.key === "Escape") {
        setShowSuggestions(false);
       }
      }}
      className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium shadow-none outline-none placeholder:text-muted-foreground/80 focus-visible:ring-0 focus-visible:ring-offset-0"
     />
     {searchQuery && (
      <button
       type="button"
       onClick={() => {
        setSearchQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
       }}
       className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
       aria-label="Clear search"
       title="Clear search"
      >
       <X className="h-4 w-4" />
      </button>
     )}
     <button
      type="button"
      onClick={handleVoiceSearch}
      className={cn(
       "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/5 text-primary shadow-sm ring-1 ring-primary/10 transition hover:bg-primary hover:text-primary-foreground",
       isListening && "animate-pulse bg-primary text-primary-foreground ring-4 ring-primary/20"
      )}
      aria-label={isListening ? "Stop voice search" : "Search by voice"}
      title={isListening ? "Listening..." : "Search by voice"}
     >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
     </button>
     <Button
      type="submit"
      className="h-8 shrink-0 rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.35)] transition hover:bg-blue-700 lg:h-9 lg:px-7"
     >
      Search
     </Button>
    </div>

    {/* Search Suggestions Dropdown */}
    {showSuggestions && searchQuery.trim().length >= 2 && (
     <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
      {isLoadingSuggestions ? (
       <div className="p-4 flex items-center justify-center gap-2 caption">
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
           {suggestion.type === 'popular' && <Zap className="h-4 w-4 text-amber-500" />}
           {suggestion.type === 'service' && <Briefcase className="h-4 w-4 text-muted-foreground" />}
           {suggestion.type === 'category' && <Building2 className="h-4 w-4 text-muted-foreground" />}
           {suggestion.type === 'provider' && <User className="h-4 w-4 text-muted-foreground" />}
           {suggestion.type === 'location' && <MapPin className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
           <p className="body text-foreground truncate">
            {suggestion.title}
           </p>
           <p className="caption">
            {suggestion.subtitle}
           </p>
          </div>
         </Link>
        ))}
        <div className="border-t mt-2 pt-2">
         <Button
          type="button"
          variant="secondary"
          onClick={() => {
           setShowSuggestions(false);
           handleSearch();
          }}
          className="w-full justify-start"
         >
          <Search className="h-4 w-4" />
          <span>View all results for "{searchQuery}"</span>
         </Button>
        </div>
       </div>
      ) : (
       <div className="p-4 text-center caption">
        <p>No results found for "{searchQuery}"</p>
        <p className="caption mt-1">Try different keywords</p>
       </div>
      )}
     </div>
    )}
   </div>
  </form>
 );

 return (
  <header className="sticky top-0 z-50 w-full max-w-full overflow-x-clip overflow-y-visible border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
   <Dialog open={voiceModalOpen} onOpenChange={handleVoiceModalOpenChange}>
    <DialogContent className="max-w-md overflow-hidden border-primary/15 p-0 shadow-2xl">
     <div className="relative bg-gradient-to-br from-primary/15 via-background to-background p-6">
      <div className="absolute right-6 top-6 h-16 w-16 rounded-full bg-primary/10 blur-2xl" />
      <DialogHeader className="relative space-y-2 text-center">
       <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
        <div
         className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg",
          isListening && "animate-pulse"
         )}
        >
         <Mic className="h-7 w-7" />
        </div>
       </div>
       <DialogTitle className="text-center">Voice Search</DialogTitle>
       <DialogDescription className="text-center">
        {isListening
         ? "Listening... speak in Hindi, English, or Hinglish."
         : "Preparing your voice search."}
       </DialogDescription>
      </DialogHeader>

      <div className="relative mt-5 rounded-2xl border bg-background/85 p-4 shadow-sm backdrop-blur">
       <div className="mb-2 flex items-center justify-between gap-3">
        <span className="caption text-muted-foreground">You said</span>
        <span
         className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          isListening ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
         )}
        >
         {isListening ? "Listening" : "Ready"}
        </span>
       </div>
       <p className="min-h-14 text-center text-lg font-semibold leading-snug text-foreground">
        {voiceTranscript || "Try saying “reta near me” or “cement Indore me”"}
       </p>
      </div>

      <div className="relative mt-4 flex flex-wrap justify-center gap-2">
       {["Sand near me", "सस्ती ईंट", "Raj mistri"].map((example) => (
        <span
         key={example}
         className="rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
         {example}
        </span>
       ))}
      </div>

      <div className="relative mt-5 flex justify-center">
       <Button
        type="button"
        variant={isListening ? "destructive" : "secondary"}
        onClick={() => {
         speechRecognitionRef.current?.stop?.();
         setIsListening(false);
         setVoiceModalOpen(false);
        }}
       >
        {isListening ? "Stop listening" : "Close"}
       </Button>
      </div>
     </div>
    </DialogContent>
   </Dialog>
   {pathname === "/" ? (
    <div
     className={cn(
      "w-full border-b bg-primary text-primary-foreground transition-all duration-300 ease-out overflow-hidden",
      showImagiMitraBar ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
     )}
    >
     <div className="flex w-full min-w-0 max-w-full flex-col items-center justify-center gap-2 px-2 py-2 text-center sm:flex-row sm:gap-3 sm:px-3 md:px-4 lg:px-5 2xl:px-6">
      <p className="caption text-primary-foreground/90">
       <span className="inline-flex items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-foreground">
        ImagiMitra
       </span>{" "}
       <span className="hidden sm:inline">—</span>{" "}
       The provider app to manage leads, bookings, and business growth.
      </p>
      <a
       href={IMAGIMITRA_DOWNLOAD_URL}
       target="_blank"
       rel="noopener noreferrer"
       className="shrink-0 inline-flex items-center justify-center rounded-full bg-primary-foreground px-4 py-1.5 text-xs font-semibold text-primary shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
      >
       Download
      </a>
     </div>
    </div>
   ) : null}
   <div className="home-shell flex h-auto min-h-14 w-full min-w-0 max-w-full items-center justify-between gap-2 py-2 sm:min-h-16 sm:py-3 sm:gap-3">
    {/* Logo — full flex width on mobile; cap width md–lg for tablet */}
    <Link
     href="/"
     className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-[15rem] md:max-w-[18rem] lg:w-[18rem] lg:max-w-none lg:flex-none lg:shrink-0"
    >
     <img 
      src="https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png" 
      alt="Imagineering India Logo" 
      className="h-7 w-7 shrink-0 object-contain sm:h-8 sm:w-8 md:h-10 md:w-10"
     />
     <div className="min-w-0 flex-1 overflow-hidden">
      <span className="block truncate text-sm font-semibold leading-tight text-foreground sm:text-base sm:font-medium">
       Imagineering India
      </span>
      {/* div avoids globals `span { font-size: 16px }` wiping out small tagline text */}
      <div
       className="mt-0.5 h-3 max-w-full whitespace-nowrap text-muted-foreground"
       title={mainHeadline}
       style={{
        fontSize: "clamp(6px, 0.58vw, 7.5px)",
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: "0.025em",
        textTransform: "uppercase",
       }}
      >
       {typedHeadline}
      </div>
     </div>
    </Link>

    {/* Location - Inline search in dropdown */}
    <DropdownMenu open={locationDropdownOpen} onOpenChange={setLocationDropdownOpen}>
     <DropdownMenuTrigger asChild>
      <Button
       variant="secondary"
       size="sm"
       className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground shrink-0 max-w-[140px] md:max-w-[180px]"
       title={userLocation?.city || userLocation?.address || "Set or change your location"}
      >
       <MapPin className="h-3.5 w-3.5 shrink-0" />
       <span className="caption truncate">
        {userLocation
         ? (userLocation.city || (userLocation.address ? userLocation.address.split(",")[0]?.trim() || userLocation.address : "Near you"))
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
        <DropdownMenuLabel className="body px-3 pt-3 pb-1">
         <p className="caption truncate">
          {userLocation.city || userLocation.address || "Current location"}
         </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
       </>
      )}
      {locationDropdownOpen ? (
       <LocationSearchInline onClose={() => setLocationDropdownOpen(false)} />
      ) : null}
     </DropdownMenuContent>
    </DropdownMenu>

    {/* Desktop Navigation */}
    <nav className="hidden lg:flex items-center gap-6 shrink-0">
     {/** z-30: mega-menu must paint above the desktop search bar (next sibling), which otherwise covers the right-hand cards. */}
     {isClient ? (
     <NavigationMenu className="z-30">
      <NavigationMenuList>
       <NavigationMenuItem key="browse-services">
        <NavigationMenuTrigger className="bg-transparent">{t("header:exploreServices")}</NavigationMenuTrigger>
        <NavigationMenuContent>
         <div className="w-[min(92vw,980px)] rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
          <div className="flex h-[360px]">
           {/* Left: categories list */}
           <div className="w-64 border-r border-slate-100 bg-white">
            <div className="px-4 pt-3 pb-2">
             <p className="caption subtitle text-slate-500">
              {t("services:browseByCategory")}
             </p>
            </div>
            <div className="max-h-[310px] overflow-y-auto pb-2">
             {headerCategories.slice(0, 12).map((category, idx) => {
              const isActive =
               activeCategorySlug === category.slug ||
               (!activeCategorySlug && idx === 0);

              return (
               <button
                key={category.id || category._id || category.slug || `cat-${idx}`}
                type="button"
                onMouseEnter={() => {
                 setActiveCategorySlug((prev) => (prev === category.slug ? prev : category.slug));
                 setActiveSubcategory((prev) => (prev === null ? prev : null));
                }}
                className={cn(
                 "flex w-full items-center gap-3 px-4 py-3 body text-slate-800 cursor-pointer transition-colors",
                 "border-l-4 border-transparent hover:bg-slate-50",
                 isActive && "bg-red-50 border-red-500 subtitle"
                )}
               >
                <span className="inline-flex h-6 w-6 items-center justify-center">
                 {getExploreCategoryIcon(category.slug)}
                </span>
                <span className="truncate">{category.name}</span>
               </button>
              );
             })}
            </div>
           </div>

           {/* Right: subcategories panel */}
           <div className="flex-1 min-w-0 w-[min(62vw,700px)]">
            {(() => {
             const fallbackCategory = headerCategories[0];
             const active =
              headerCategories.find((c) => c.slug === activeCategorySlug) ||
              fallbackCategory;
             if (!active) return null;

             const subs = getSubcategoryNames(active?.subcategories);
             const effectiveActiveSub =
              activeSubcategory && subs.includes(activeSubcategory)
               ? activeSubcategory
               : subs[0] || null;

             return (
              <div className="flex h-full flex-col px-6 py-6">
               {/* Chips */}
               <div className="mt-1 flex-1 overflow-y-auto pr-2">
                {subs.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3">
                  {subs.map((sub, subIdx) => {
                   const isChipActive = effectiveActiveSub === sub;
                   return (
                    <button
                     key={`${active.slug}-${sub}-${subIdx}`}
                     type="button"
                     onMouseEnter={() => {
                      setActiveSubcategory((prev) => (prev === sub ? prev : sub));
                     }}
                     onClick={() => {
                      const params = new URLSearchParams();
                      params.set("category", active.slug);
                      params.set("subcategory", sub);
                      router.push(`/services?${params.toString()}`);
                     }}
                     className={cn(
                      "inline-flex items-center justify-center w-full rounded-lg border px-4 py-3 caption leading-snug text-center transition-all duration-150",
                      isChipActive
                       ? "border-red-500 bg-red-500 text-white shadow-sm"
                       : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-sm"
                     )}
                    >
                     <span className="whitespace-normal break-words">
                      {sub}
                     </span>
                    </button>
                   );
                  })}
                 </div>
                ) : (
                 <div className="flex h-full items-center justify-center px-6 text-center">
                  <p className="caption text-slate-500">
                   {t("header:exploreServices")}{" "}
                   <span className="subtitle text-slate-700">
                    {active.name}
                   </span>
                   .
                  </p>
                 </div>
                )}
               </div>

               {/* Bottom View All row */}
               {subs.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4 flex justify-center">
                 <Link
                  href={`/services?category=${active.slug}`}
                  className="inline-flex items-center caption text-red-500 hover:text-red-600 hover:underline"
                 >
                  {t("services:viewAll")} {active.name} <span className="ml-1">→</span>
                 </Link>
                </div>
               )}
              </div>
             );
            })()}
           </div>
          </div>
         </div>
        </NavigationMenuContent>
       </NavigationMenuItem>
          <NavigationMenuItem key="browse-b2b-services">
            <NavigationMenuTrigger className="bg-transparent">{t("services:b2bServices")}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[min(92vw,980px)] rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden">
                <div className="flex h-[360px]">
                  {/* Left: B2B categories list */}
                  <div className="w-64 border-r border-slate-100 bg-white">
                    <div className="px-4 pt-3 pb-2">
                      <p className="caption subtitle text-slate-500">{t("services:browseByCategory")}</p>
                    </div>
                    <div className="max-h-[310px] overflow-y-auto pb-2">
                      {b2bCategories.map((category) => {
                        const isActive = activeB2bCategorySlug === category.slug;
                        return (
                          <button
                            key={category.slug}
                            type="button"
                            onMouseEnter={() => {
                              setActiveB2bCategorySlug((prev) => (prev === category.slug ? prev : category.slug));
                              setActiveB2bSubcategory((prev) => (prev === null ? prev : null));
                            }}
                            className={cn(
                              "flex w-full items-center gap-3 px-4 py-3 body text-slate-800 cursor-pointer transition-colors",
                              "border-l-4 border-transparent hover:bg-slate-50",
                              isActive && "bg-red-50 border-red-500 subtitle"
                            )}
                          >
                            <span className="inline-flex h-6 w-6 items-center justify-center">
                              {getB2BCategoryIcon(category.slug)}
                            </span>
                            <span className="truncate">{category.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: B2B subcategories panel */}
                  <div className="flex-1 min-w-0 w-[min(62vw,700px)]">
                  {(() => {
                    if (b2bCategories.length === 0) return null;
                    const active =
                      b2bCategories.find((c) => c.slug === activeB2bCategorySlug) || b2bCategories[0];
                      const subs = getSubcategoryNames(active?.subcategories);
                      const effectiveActiveSub =
                        activeB2bSubcategory && subs.includes(activeB2bSubcategory)
                          ? activeB2bSubcategory
                          : subs[0] || null;

                      return (
                        <div className="flex h-full flex-col px-6 py-6">
                          {/* Chips */}
                          <div className="mt-1 flex-1 overflow-y-auto pr-2">
                            {subs.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-3">
                                {subs.map((sub, subIdx) => {
                                  const isChipActive = effectiveActiveSub === sub;
                                  return (
                                    <button
                                      key={`${active.slug}-${sub}-${subIdx}`}
                                      type="button"
                                      onMouseEnter={() => {
                                        setActiveB2bSubcategory((prev) => (prev === sub ? prev : sub));
                                      }}
                                      onClick={() => {
                                        const params = new URLSearchParams();
                                        params.set("category", active.slug);
                                        params.set("subcategory", sub);
                                        router.push(`/b2b-services?${params.toString()}`);
                                      }}
                                      className={cn(
                                        "inline-flex items-center justify-center w-full rounded-lg border px-4 py-3 caption leading-snug text-center transition-all duration-150",
                                        isChipActive
                                          ? "border-red-500 bg-red-500 text-white shadow-sm"
                                          : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-sm"
                                      )}
                                    >
                                      <span className="whitespace-normal break-words">{sub}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center px-6 text-center">
                                <p className="caption text-slate-500">
                                  Explore all B2B services in{" "}
                                  <span className="subtitle text-slate-700">{active.name}</span>.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Bottom View All row */}
                          {subs.length > 0 && (
                            <div className="mt-4 border-t border-slate-100 pt-4 flex justify-center">
                              <Link
                                href={`/b2b-services?category=${active.slug}`}
                                className="inline-flex items-center caption text-red-500 hover:text-red-600 hover:underline"
                              >
                                {t("services:viewAll")} {active.name} <span className="ml-1">→</span>
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
      </NavigationMenuList>
     </NavigationMenu>
     ) : (
      <div className="hidden h-10 w-[11rem] shrink-0 lg:block" aria-hidden />
     )}

     {/* Search Bar - In Navigation (Desktop) */}
     <div className="w-[30rem] shrink-0">
      {searchForm()}
     </div>

     <Link
      href="/about"
      className={cn(
       "body transition-colors hover:text-primary",
       isActive("/about") ? "text-primary" : "text-muted-foreground",
      )}
     >
      {t("common:about")}
     </Link>
    </nav>

    {/* Desktop Actions */}
    <div className="hidden lg:flex items-center gap-3">
     <LanguageSwitcher />
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
           <span className="hidden md:inline-block body">
            {user.name || "User"}
           </span>
           <ChevronDown className="h-4 w-4" />
          </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
           <div className="flex flex-col space-y-1">
            <p className="body leading-none">{user.name}</p>
            <p className="caption leading-none text-muted-foreground">
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
            {t("services:messages")}
           </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
           <Link href="/requirement/submit" className="flex items-center cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            {t("services:getQuote")}
           </Link>
          </DropdownMenuItem>
          {user.role === "buyer" && (
           <>
            <DropdownMenuItem asChild>
             <Link href="/dashboard/buyer/orders" className="flex items-center cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t("services:myOrders")}
             </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
             <Link href="/dashboard/buyer/requirements" className="flex items-center cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              {t("services:myRequirements")}
             </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
             <Link href="/dashboard/buyer/job-posts/new" className="flex items-center cursor-pointer">
              <Briefcase className="mr-2 h-4 w-4" />
              {t("services:postJob")}
             </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
             <Link href="/dashboard/buyer/job-posts" className="flex items-center cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              {t("services:myJobPosts")}
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
               {t("services:browseJobs")}
              </Link>
             </DropdownMenuItem>
            )}
            {user.role === "provider" && (
             <DropdownMenuItem asChild>
              <Link href="/dashboard/provider/manpower-crew" className="flex items-center cursor-pointer">
               <Users className="mr-2 h-4 w-4" />
               {t("services:hireLabour")}
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
         <Button variant="secondary" asChild>
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

    {/* Mobile: Search icon + Cart + Menu */}
    <div className="flex shrink-0 items-center gap-0 lg:hidden">
     <Button
      type="button"
      variant="search"
      onClick={() => router.push("/search")}
      aria-label={t("common:search")}
      title={t("common:search")}
     >
      <Search className="h-5 w-5 text-muted-foreground" />
     </Button>
     <div className="flex h-10 w-10 items-center justify-center">
      <CartIcon />
     </div>
     <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
       <Button 
        variant="icon" 
        size="icon"
        aria-label={t("header:exploreServices")}
        title={t("header:exploreServices")}
       >
        <Menu className="h-5 w-5" />
       </Button>
      </SheetTrigger>
     <SheetContent side="right" className="flex w-[300px] flex-col overflow-hidden p-0 sm:w-[400px]">
      <SheetTitle className="sr-only">
       Imagineering India — {t("header:exploreServices")} and account menu
      </SheetTitle>
      <div className="flex-1 overflow-y-auto overscroll-y-contain px-6 pb-6 pt-14 [-webkit-overflow-scrolling:touch]">
      <nav className="flex flex-col gap-4">
       <LanguageSwitcher compact />
       <Link href="/services" className="subtitle" onClick={() => setIsOpen(false)}>
        {t("header:exploreServices")}
       </Link>
       <Link href="/cart" className="subtitle flex items-center gap-2" onClick={() => setIsOpen(false)}>
        <ShoppingCart className="h-4 w-4 shrink-0" />
        Cart{cartCount > 0 ? ` (${cartCount > 99 ? "99+" : cartCount})` : ""}
       </Link>
       <div className="space-y-2">
        {userLocation && (
         <Link
          href={`/services?lat=${userLocation.lat}&lng=${userLocation.lng}`}
          className="subtitle flex items-center gap-2"
          onClick={() => setIsOpen(false)}
         >
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">
           {userLocation.city || (userLocation.address?.split(",")[0]) || t("services:servicesNearYou")}
          </span>
         </Link>
        )}
        {isOpen ? (
         <LocationSearchInline onClose={() => setIsOpen(false)} className="p-0" />
        ) : null}
       </div>
       <Link href="/b2b-services" className="subtitle" onClick={() => setIsOpen(false)}>
        {t("services:b2bServices")}
       </Link>
       <Link href="/about" className="subtitle" onClick={() => setIsOpen(false)}>
        {t("common:about")}
       </Link>
       <Link href="/contact" className="subtitle" onClick={() => setIsOpen(false)}>
        {t("common:contact")}
       </Link>
       <Link href="/help" className="subtitle" onClick={() => setIsOpen(false)}>
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
             <p className="body">{user.name}</p>
             <p className="caption">{user.email || (user as { phone?: string }).phone || '—'}</p>
            </div>
           </div>
           <Link
            href="/profile"
            className="subtitle"
            onClick={() => setIsOpen(false)}
           >
            {t("header:myProfile")}
           </Link>
           <Link
            href="/chat"
            className="subtitle"
            onClick={() => setIsOpen(false)}
           >
            {t("services:messages")}
           </Link>
           <Link
            href="/requirement/submit"
            className="subtitle"
            onClick={() => setIsOpen(false)}
           >
            {t("services:getQuote")}
           </Link>
           {user.role === "buyer" && (
            <>
             <Link
              href="/dashboard/buyer/orders"
              className="subtitle"
              onClick={() => setIsOpen(false)}
             >
              {t("services:myOrders")}
             </Link>
             <Link
              href="/dashboard/buyer/requirements"
              className="subtitle"
              onClick={() => setIsOpen(false)}
             >
              {t("services:myRequirements")}
             </Link>
             <Link
              href="/dashboard/buyer/job-posts/new"
              className="subtitle"
              onClick={() => setIsOpen(false)}
             >
              {t("services:postJob")}
             </Link>
             <Link
              href="/dashboard/buyer/job-posts"
              className="subtitle"
              onClick={() => setIsOpen(false)}
             >
              {t("services:myJobPosts")}
             </Link>
            </>
           )}
           {(user.role === "admin" || user.role === "provider") && (
            <>
             {user.role === "provider" && (
              <Link
               href="/jobs"
               className="subtitle"
               onClick={() => setIsOpen(false)}
              >
               {t("services:browseJobs")}
              </Link>
             )}
             {user.role === "provider" && (
              <Link
               href="/dashboard/provider/manpower-crew"
               className="subtitle"
               onClick={() => setIsOpen(false)}
              >
               {t("services:hireLabour")}
              </Link>
             )}
             <Link
              href={getDashboardPath()}
              className="subtitle"
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
           <Link href="/login" className="subtitle" onClick={() => setIsOpen(false)}>
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
      </div>
     </SheetContent>
    </Sheet>
    </div>
   </div>
  </header>
 );
}
