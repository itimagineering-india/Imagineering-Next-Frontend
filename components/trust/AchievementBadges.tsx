"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Share2, Tag } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type ProviderAchievement = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  icon: string;
  tier?: string;
  unlockedAt?: string;
};

export function AchievementBadges({
  achievements,
  variant = "compact",
  className,
  showShare = false,
  onViewOffers,
  offersLabel = "Offers",
}: {
  achievements?: ProviderAchievement[];
  variant?: "compact" | "grid";
  className?: string;
  showShare?: boolean;
  onViewOffers?: () => void;
  offersLabel?: string;
}) {
  const { toast } = useToast();
  const [sharingId, setSharingId] = useState<string | null>(null);

  const hasAchievements = (achievements?.length ?? 0) > 0;
  if (!hasAchievements && !onViewOffers) return null;

  const onShare = async (id: string) => {
    setSharingId(id);
    try {
      const res = await api.trust.getAchievementShare(id);
      if (res.success && res.data) {
        const share = (res.data as { share?: { whatsappUrl?: string; shareText?: string } }).share;
        if (share?.whatsappUrl && typeof window !== "undefined") {
          window.open(share.whatsappUrl, "_blank", "noopener,noreferrer");
        } else if (share?.shareText && navigator.share) {
          await navigator.share({ text: share.shareText });
        } else if (share?.shareText) {
          await navigator.clipboard.writeText(share.shareText);
          toast({ title: "Copied", description: "Share text copied to clipboard." });
        }
      }
    } catch {
      toast({ title: "Share failed", variant: "destructive" });
    } finally {
      setSharingId(null);
    }
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {(achievements ?? []).slice(0, 6).map((a) => (
          <TooltipProvider key={a.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="gap-1 text-sm py-1">
                  <span>{a.icon}</span>
                  {a.title}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{a.description || a.title}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        {hasAchievements && (achievements?.length ?? 0) > 6 && (
          <Badge variant="outline">+{(achievements?.length ?? 0) - 6} more</Badge>
        )}
        {onViewOffers ? (
          <Badge
            asChild
            variant="secondary"
            className="gap-1 text-sm py-1 cursor-pointer border-amber-200/80 bg-amber-50 text-amber-900 hover:bg-amber-100"
          >
            <button type="button" onClick={onViewOffers}>
              <Tag className="h-3.5 w-3.5" />
              {offersLabel}
            </button>
          </Badge>
        ) : null}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Achievements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {(achievements ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20"
            >
              <span className="text-2xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {a.description}
                </p>
                {a.tier && (
                  <Badge variant="outline" className="mt-1 text-[10px] capitalize">
                    {a.tier}
                  </Badge>
                )}
              </div>
              {showShare && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  disabled={sharingId === a.id}
                  onClick={() => void onShare(a.id)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
