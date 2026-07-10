"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { ProviderMismatchDialog } from "@/components/cart/ProviderMismatchDialog";
import api, { getAuthToken } from "@/lib/api-client";
import { formatServicePrice } from "@/lib/formatServicePrice";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Plus, ExternalLink, ShoppingCart } from "lucide-react";

const ACTIVITY_STORAGE_KEY = "imagineering-cart-activity-ids";
const GROUP_PRIORITY = [
  "missing_essentials",
  "materials_required",
  "manpower_required",
  "tools_required",
  "machines_required",
  "related_services",
  "safety_equipment",
  "logistics",
  "lowest_price_suppliers",
  "nearby_suppliers",
];

const GROUP_LABELS: Record<string, string> = {
  missing_essentials: "Don't forget",
  materials_required: "Materials you may need",
  manpower_required: "Manpower you may need",
  tools_required: "Tools you may need",
  machines_required: "Machines & equipment",
  related_services: "Related services",
  safety_equipment: "Safety equipment",
  logistics: "Logistics",
  lowest_price_suppliers: "Best prices",
  nearby_suppliers: "Nearby suppliers",
};

type MarketplaceMatch = {
  serviceId: string;
  title: string;
  slug?: string;
  price: number;
  priceType: string;
  providerId: string;
  image?: string;
  city?: string;
};

type SuggestionGroup = {
  key: string;
  label: string;
  items: Array<{
    requirement: { label: string };
    marketplace: { matches: MarketplaceMatch[] };
  }>;
};

type ActivityCandidate = {
  activityId: string;
  name: string;
  slug?: string;
};

type ActivityPrompt = {
  promptTitle: string;
  candidates: ActivityCandidate[];
};

type SuggestionsResponse = {
  needsUserSelection?: boolean;
  prompts?: ActivityPrompt[];
  groups?: SuggestionGroup[];
};

export type FlatSuggestion = MarketplaceMatch & {
  groupKey: string;
  groupLabel: string;
  requirementLabel: string;
};

function loadStoredActivityIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveActivityIds(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function flattenSuggestionGroups(
  groups: SuggestionGroup[] | undefined,
  cartServiceIds: Set<string>,
  limit = 12
): FlatSuggestion[] {
  if (!groups?.length) return [];

  const sorted = [...groups].sort(
    (a, b) => GROUP_PRIORITY.indexOf(a.key) - GROUP_PRIORITY.indexOf(b.key)
  );

  const seen = new Set<string>();
  const out: FlatSuggestion[] = [];

  for (const group of sorted) {
    const groupLabel = GROUP_LABELS[group.key] || group.label;
    for (const item of group.items || []) {
      for (const match of item.marketplace?.matches || []) {
        const id = String(match.serviceId);
        if (!id || seen.has(id) || cartServiceIds.has(id)) continue;
        seen.add(id);
        out.push({
          ...match,
          serviceId: id,
          providerId: String(match.providerId),
          groupKey: group.key,
          groupLabel,
          requirementLabel: item.requirement?.label || match.title,
        });
        if (out.length >= limit) return out;
      }
    }
  }

  return out;
}

type CartSuggestionsProps = {
  cartProviderId: string;
  cartServiceIds: string[];
};

export function CartSuggestions({ cartProviderId, cartServiceIds }: CartSuggestionsProps) {
  const { addToCart, clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [data, setData] = useState<SuggestionsResponse | null>(null);
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [showMismatch, setShowMismatch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const cartIdSet = useMemo(() => new Set(cartServiceIds.map(String)), [cartServiceIds]);

  const fetchSuggestions = useCallback(
    async (activityIds?: string[]) => {
      if (!getAuthToken() || cartServiceIds.length === 0) {
        setHasFetched(true);
        return;
      }
      setLoading(true);
      setFetchError(null);
      try {
        const res = await api.cart.getSuggestions({
          serviceIds: cartServiceIds,
          selectedActivityIds: activityIds?.length ? activityIds : undefined,
        });
        if (res.success && res.data) {
          const payload = res.data as SuggestionsResponse;
          setData(payload);
          if (payload.needsUserSelection && !activityIds?.length) {
            setActivityDialogOpen(true);
          }
        } else {
          setFetchError(res.error?.message || "Could not load suggestions.");
        }
      } catch {
        setFetchError("Could not load suggestions. Please try again.");
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    },
    [cartServiceIds]
  );

  const cartItemsKey = cartServiceIds.join(",");

  useEffect(() => {
    setIsLoggedIn(Boolean(getAuthToken()));
    const onAuthChanged = () => setIsLoggedIn(Boolean(getAuthToken()));
    window.addEventListener("auth-token-changed", onAuthChanged);
    return () => window.removeEventListener("auth-token-changed", onAuthChanged);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || cartServiceIds.length === 0) {
      setHasFetched(true);
      return;
    }
    const stored = loadStoredActivityIds();
    setSelectedActivityIds(stored);
    void fetchSuggestions(stored.length ? stored : undefined);
  }, [fetchSuggestions, cartItemsKey, isLoggedIn]);

  const suggestions = useMemo(
    () => flattenSuggestionGroups(data?.groups, cartIdSet),
    [data?.groups, cartIdSet]
  );

  const prompts = data?.prompts || [];
  const primaryPrompt = prompts[0];

  const handleSelectActivity = (activityId: string) => {
    const next = [activityId];
    setSelectedActivityIds(next);
    saveActivityIds(next);
    setActivityDialogOpen(false);
    void fetchSuggestions(next);
  };

  const handleAdd = (serviceId: string, providerId: string) => {
    if (cartProviderId && providerId && cartProviderId !== providerId) {
      setPendingServiceId(serviceId);
      setShowMismatch(true);
      return;
    }
    void addToCart(serviceId, 1);
  };

  const handleClearAndAdd = async () => {
    if (!pendingServiceId) return;
    try {
      await clearCart();
      await addToCart(pendingServiceId, 1);
      setShowMismatch(false);
      setPendingServiceId(null);
    } catch (error: unknown) {
      toast({
        title: "Unable to add",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!cartServiceIds.length) return null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            You might also need
          </CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Related materials and items based on what&apos;s in your cart
          </p>
        </CardHeader>
        <CardContent>
          {!isLoggedIn ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sign in to see related materials and services for your cart items.
            </p>
          ) : fetchError ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-sm text-destructive">{fetchError}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => void fetchSuggestions(selectedActivityIds)}>
                Try again
              </Button>
            </div>
          ) : (
            <>
          {data?.needsUserSelection && primaryPrompt && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 sm:p-4">
              <p className="text-sm font-medium mb-2">{primaryPrompt.promptTitle}</p>
              <div className="flex flex-wrap gap-2">
                {primaryPrompt.candidates.map((c) => (
                  <Button
                    key={c.activityId}
                    type="button"
                    size="sm"
                    variant={selectedActivityIds.includes(c.activityId) ? "default" : "outline"}
                    onClick={() => handleSelectActivity(c.activityId)}
                  >
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {!hasFetched
                ? "Loading suggestions…"
                : data?.needsUserSelection
                  ? "Select the type of work above to see related items."
                  : "No related items found right now. Try adding a mason, plumber, or material service."}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((s) => {
                const sameProvider = !cartProviderId || s.providerId === cartProviderId;
                const priceText = formatServicePrice({
                  price: s.price,
                  priceType: s.priceType,
                });
                return (
                  <div
                    key={s.serviceId}
                    className="flex gap-3 border rounded-lg p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-muted">
                      {s.image ? (
                        <Image
                          src={s.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ShoppingCart className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="flex flex-wrap gap-1 mb-1">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {s.groupLabel}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 leading-snug">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{priceText}</p>
                      <div className="mt-auto pt-2 flex flex-wrap gap-2">
                        {sameProvider ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => handleAdd(s.serviceId, s.providerId)}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => {
                              setPendingServiceId(s.serviceId);
                              setShowMismatch(true);
                            }}
                          >
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        )}
                        <Button type="button" size="sm" variant="ghost" className="h-8 text-xs px-2" asChild>
                          <Link href={`/service/${s.slug || s.serviceId}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{primaryPrompt?.promptTitle || "What work do you need?"}</DialogTitle>
            <DialogDescription>
              This helps us show the right materials and items for your booking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-2">
            {primaryPrompt?.candidates.map((c) => (
              <Button key={c.activityId} type="button" onClick={() => handleSelectActivity(c.activityId)}>
                {c.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setActivityDialogOpen(false)}>
              Skip for now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProviderMismatchDialog
        open={showMismatch}
        onCancel={() => {
          setShowMismatch(false);
          setPendingServiceId(null);
        }}
        onClearAndAdd={handleClearAndAdd}
      />
    </>
  );
}
