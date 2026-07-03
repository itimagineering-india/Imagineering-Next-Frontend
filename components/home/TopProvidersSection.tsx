"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import api from "@/lib/api-client";
import { useTranslation } from "react-i18next";
import {
  normalizeHomeTopProviders,
  type HomeTopProvider,
} from "@/lib/home-data";
import { ImagineVerifiedBadge } from "@/components/trust/ImagineScorePanel";

function getImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return url.startsWith("/") ? `${new URL(base).origin}${url}` : url;
}

type TopProvidersSectionProps = {
  /** Pre-fetched on the server for View Source / SEO. */
  initialProviders?: HomeTopProvider[];
};

export function TopProvidersSection({ initialProviders }: TopProvidersSectionProps) {
  const { t } = useTranslation("home");
  const hasServerData = initialProviders !== undefined;
  const [providers, setProviders] = useState<HomeTopProvider[]>(initialProviders ?? []);
  const [loading, setLoading] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(hasServerData);
  const sectionRef = useRef<HTMLElement>(null);
  const hasFetchedRef = useRef(hasServerData);

  useEffect(() => {
    if (hasServerData) return;
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasFetchedRef.current) {
          setHasEnteredView(true);
        }
      },
      { rootMargin: "100px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasServerData]);

  useEffect(() => {
    if (!hasEnteredView || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoading(true);

    const fetchTopProviders = async () => {
      try {
        const attempts = [
          { topRated: true, verified: true, limit: 10 },
          { verified: true, limit: 10 },
          { limit: 10 },
        ] as const;

        let providersData: Parameters<typeof normalizeHomeTopProviders>[0] = [];
        for (const params of attempts) {
          const response = await api.providers.getAll(params);
          const list =
            response.success && response.data
              ? (response.data as { providers?: Parameters<typeof normalizeHomeTopProviders>[0] })
                  .providers || []
              : [];
          if (list.length > 0) {
            providersData = list;
            break;
          }
        }

        setProviders(normalizeHomeTopProviders(providersData).slice(0, 10));
      } catch {
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTopProviders();
  }, [hasEnteredView]);

  return (
    <section
      ref={sectionRef}
      className="py-6 sm:py-8 md:py-12 lg:py-12 bg-gradient-to-b from-muted/40 via-background to-background"
    >
      <div className="home-shell">
        <div className="text-center mb-4 sm:mb-6 md:mb-8">
          <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mt-2">
            <span className="text-foreground">{t("topProviders.our")} </span>
            <span className="text-[hsl(var(--red-accent))] bg-gradient-to-r from-[hsl(var(--red-accent))] to-primary bg-clip-text text-transparent">
              {t("topProviders.title")}
            </span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4 mt-2">
            {t("topProviders.description")}
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
              {[...providers, ...providers].map((provider, index) => {
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
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {displayName}
                        </span>
                        <div className="flex justify-center">
                          <ImagineVerifiedBadge
                            score={
                              provider.imagineScore ?? {
                                trustScore: null,
                                imagineScore: null,
                                isImagineeringVerified: !!provider.verified,
                              }
                            }
                            className="text-[10px]"
                          />
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {provider.topRated ? (
                            <Badge variant="secondary" className="text-[9px] sm:text-[10px] gap-1">
                              <Award className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              {t("topProviders.topRated")}
                            </Badge>
                          ) : (
                            <span className="text-[10px] sm:text-[11px] text-muted-foreground">
                              {t("topProviders.title")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            {t("topProviders.empty")}
          </div>
        )}
      </div>
    </section>
  );
}
