"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award, CheckCircle2 } from "lucide-react";
import api from "@/lib/api-client";

interface TopProvider {
  id: string;
  slug?: string;
  name: string;
  avatar: string;
  businessName?: string;
  businessLogo?: string;
  verified?: boolean;
  topRated?: boolean;
}

interface ProviderApiItem {
  _id?: string;
  slug?: string;
  businessName?: string;
  businessLogo?: string;
  verified?: boolean;
  topRated?: boolean;
  user?: {
    _id?: string;
    name?: string;
    avatar?: string;
    verified?: boolean;
  };
}

function getImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return url.startsWith("/") ? `${new URL(base).origin}${url}` : url;
}

const normalizeProviders = (items: Array<TopProvider | ProviderApiItem>) => {
  return items
    .map((provider) => {
      const normalized = provider as TopProvider;
      if (normalized.id && normalized.name !== undefined) {
        return {
          id: normalized.id,
          slug: normalized.slug,
          name: normalized.name || "Provider",
          avatar: normalized.avatar || "",
          businessName: normalized.businessName,
          businessLogo: normalized.businessLogo,
          verified: normalized.verified,
          topRated: normalized.topRated,
        };
      }

      const apiItem = provider as ProviderApiItem;
      const id = apiItem._id || apiItem.user?._id || "";
      if (!id) return null;
      const businessName = apiItem.businessName || "";
      const businessLogo = apiItem.businessLogo || "";
      const name = apiItem.user?.name || "Provider";
      const avatar = apiItem.user?.avatar || "";
      const verified = apiItem.verified ?? apiItem.user?.verified;
      const topRated = apiItem.topRated;
      return {
        id,
        slug: apiItem.slug,
        name,
        avatar,
        businessName,
        businessLogo,
        verified,
        topRated,
      };
    })
    .filter(Boolean) as TopProvider[];
};

export function TopProvidersSection() {
  const [providers, setProviders] = useState<TopProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetchedRef.current) {
          setHasEnteredView(true);
        }
      },
      { rootMargin: "100px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEnteredView || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoading(true);

    const fetchTopProviders = async () => {
      try {
        // Prefer verified + top-rated; fall back when DB rows still have defaults (both false).
        const attempts = [
          { topRated: true, verified: true, limit: 10 },
          { verified: true, limit: 10 },
          { limit: 10 },
        ] as const;

        let providersData: ProviderApiItem[] = [];
        for (const params of attempts) {
          const response = await api.providers.getAll(params);
          const list =
            response.success && response.data
              ? (response.data as { providers?: ProviderApiItem[] }).providers || []
              : [];
          if (list.length > 0) {
            providersData = list;
            break;
          }
        }

        const normalizedProviders = normalizeProviders(providersData).slice(0, 10);
        setProviders(normalizedProviders);
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProviders();
  }, [hasEnteredView]);

  return (
    <section
      ref={sectionRef}
      className="py-8 sm:py-10 md:py-12 lg:py-16 bg-gradient-to-b from-muted/40 via-background to-background"
    >
      <div className="container mx-auto px-4 sm:px-6 md:px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mt-2">
            <span className="text-foreground">Our </span>
            <span className="text-[hsl(var(--red-accent))] bg-gradient-to-r from-[hsl(var(--red-accent))] to-primary bg-clip-text text-transparent">
              Top Providers
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 mt-2">
            Trusted professionals with verified profiles and great service.
          </p>
        </div>

        {!hasEnteredView ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 min-h-[140px]" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`top-provider-placeholder-${index}`}
                className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/30 p-3 sm:p-4"
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-muted/50 mx-auto" />
                <div className="h-3 sm:h-4 bg-muted/50 rounded mt-3 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={`top-provider-skeleton-${index}`}
                className="rounded-lg border bg-card p-3 sm:p-4 animate-pulse"
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-muted mx-auto" />
                <div className="h-3 sm:h-4 bg-muted rounded mt-3 w-3/4 mx-auto" />
              </div>
            ))}
          </div>
        ) : providers.length > 0 ? (
          <div className="relative overflow-hidden marquee-mask">
            <div className="marquee">
              {[...providers, ...providers].map((provider, index) => (
                (() => {
                  const displayName = provider.businessName || provider.name || "Provider";
                  const rawLogo = provider.businessLogo || provider.avatar || "";
                  const displayLogo = getImageUrl(rawLogo);
                  return (
                    <Link
                      key={`${provider.id}-${index}`}
                      href={`/provider/${provider.slug || provider.id}`}
                      className="group rounded-2xl border bg-card/90 p-3 sm:p-4 hover:shadow-lg transition-all duration-300 w-36 sm:w-44 md:w-52 flex-shrink-0 backdrop-blur hover:-translate-y-0.5"
                    >
                      <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 ring-2 ring-border shadow-sm">
                            <AvatarImage src={displayLogo} alt={displayName} />
                            <AvatarFallback className="text-xs sm:text-sm font-semibold">
                              {(displayName || "P")[0]}
                            </AvatarFallback>
                          </Avatar>
                          {provider.verified && (
                            <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5 shadow">
                              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:h-4 text-primary" />
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {displayName}
                          </span>
                          <div className="flex items-center justify-center gap-1">
                            {provider.topRated ? (
                              <Badge variant="secondary" className="text-[9px] sm:text-[10px] gap-1">
                                <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                Top Rated
                              </Badge>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                                Top provider
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })()
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            No Provider found
          </div>
        )}
      </div>
    </section>
  );
}
