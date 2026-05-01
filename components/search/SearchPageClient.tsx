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
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const suggestionsAbortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setQuery(q);
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 md:py-16">
        <div className="w-full max-w-2xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-row flex-wrap gap-2 items-stretch sm:flex-nowrap"
          >
            <div className="relative flex-1 min-w-0 bg-background border border-border rounded-xl overflow-hidden">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                className="pl-12 pr-12 h-12 sm:h-14 text-base sm:text-lg border-0 focus-visible:ring-0 rounded-xl"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 sm:h-14 px-4 sm:px-6 shrink-0 bg-[hsl(var(--red-accent))] hover:bg-[hsl(var(--red-accent))]/90 rounded-xl"
            >
              <SearchIcon className="h-4 w-4 mr-2 sm:mr-2" />
              Search
            </Button>

            {showSuggestions && query.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
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
            )}
          </form>

          <div className="mt-8 sm:mt-12">
            <p className="text-sm text-muted-foreground text-center mb-4">Quick links</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/services">
                <Button variant="outline" size="sm">
                  Browse all services
                </Button>
              </Link>
              <Link href="/services?category=construction-materials">
                <Button variant="outline" size="sm">
                  Construction Materials
                </Button>
              </Link>
              <Link href="/services?category=manpower">
                <Button variant="outline" size="sm">
                  Manpower
                </Button>
              </Link>
              <Link href="/services?category=machines">
                <Button variant="outline" size="sm">
                  Machines
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
