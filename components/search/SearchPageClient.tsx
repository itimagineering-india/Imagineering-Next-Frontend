"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2, X } from "lucide-react";
import { fetchSearchSuggestions } from "@/lib/api-client";
import { useUserLocation } from "@/contexts/UserLocationContext";

/** Dedicated search landing + suggestions — parity with Vite `src/pages/Search.tsx` */
export function SearchPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userLocation } = useUserLocation();
  const [query, setQuery] = useState(() => searchParams?.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams?.get("q");
    if (q !== null && q !== undefined) setQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      if (suggestionsAbortRef.current) {
        suggestionsAbortRef.current.abort();
        suggestionsAbortRef.current = null;
      }
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      if (suggestionsAbortRef.current) suggestionsAbortRef.current.abort();
      const controller = new AbortController();
      suggestionsAbortRef.current = controller;
      setIsLoadingSuggestions(true);
      try {
        const all = await fetchSearchSuggestions(query.trim(), 5);
        if (!controller.signal.aborted) {
          setSuggestions(all);
        }
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoadingSuggestions(false);
        suggestionsAbortRef.current = null;
      }
    };
    fetchSuggestions();
    return () => {
      if (suggestionsAbortRef.current) suggestionsAbortRef.current.abort();
    };
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (userLocation?.lat && userLocation?.lng) {
      params.set("lat", String(userLocation.lat));
      params.set("lng", String(userLocation.lng));
    }
    if (userLocation?.address) params.set("location", userLocation.address);
    router.push(`/services${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const quickLinks = [
    { href: "/services", label: "Browse all services" },
    { href: "/services?category=construction-materials", label: "Construction materials" },
    { href: "/services?category=manpower", label: "Manpower" },
    { href: "/services?category=machines", label: "Machines" },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 w-full px-4 py-8 sm:px-6 sm:py-12 md:py-14">
        <div className="w-full max-w-2xl mx-auto">
          <div className="mb-8 text-center sm:mb-10 sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              <span className="text-foreground">Search </span>
              <span className="text-[hsl(var(--red-accent))]">Imagineering India</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base max-w-xl sm:mx-0 mx-auto leading-relaxed">
              Find services, categories, and providers — results open in the services directory with your location when set.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative flex-1 min-w-0 rounded-xl border border-border bg-background shadow-sm overflow-hidden">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search services, categories, or providers..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="h-12 border-0 pl-12 pr-12 text-base focus-visible:ring-0 sm:h-14 sm:text-lg rounded-xl"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full shrink-0 rounded-xl bg-[hsl(var(--red-accent))] px-6 hover:bg-[hsl(var(--red-accent))]/90 sm:h-14 sm:w-auto"
              >
                <SearchIcon className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>

            {showSuggestions && query.trim().length >= 2 ? (
              <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-80 overflow-y-auto rounded-xl border bg-popover shadow-lg">
                {isLoadingSuggestions ? (
                  <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map((s, i) => (
                      <Link
                        key={`${s.type}-${s.id}-${i}`}
                        href={s.url}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
                      >
                        <SearchIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                        </div>
                      </Link>
                    ))}
                    <div className="border-t pt-2">
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        className="w-full px-4 py-3 text-left text-primary hover:bg-accent transition-colors flex items-center gap-2"
                      >
                        <SearchIcon className="h-4 w-4" />
                        View all results for &quot;{query}&quot;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No results for &quot;{query}&quot;</p>
                    <p className="text-xs mt-1">Try different keywords</p>
                  </div>
                )}
              </div>
            ) : null}
          </form>

          <section
            className="mt-10 rounded-2xl border border-border/80 bg-muted/30 p-5 shadow-sm sm:mt-12 sm:p-6 dark:bg-muted/20"
            aria-labelledby="search-quick-links"
          >
            <h2 id="search-quick-links" className="text-sm font-semibold text-foreground">
              Quick links
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Jump to popular categories</p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {quickLinks.map(({ href, label }) => (
                <li key={href}>
                  <Button variant="outline" className="h-auto w-full justify-start py-3 text-left font-medium" asChild>
                    <Link href={href}>{label}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
