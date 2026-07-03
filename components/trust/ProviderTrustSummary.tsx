"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ImagineScorePanel,
  type ImagineScoreData,
} from "@/components/trust/ImagineScorePanel";
import { AchievementBadges, type ProviderAchievement } from "@/components/trust/AchievementBadges";
import { cn } from "@/lib/utils";

/** Single compact row for public provider profile — score + achievement chips */
export function ProviderTrustSummary({
  score,
  achievements,
  className,
}: {
  score?: ImagineScoreData | null;
  achievements?: ProviderAchievement[];
  className?: string;
}) {
  const hasScore = !!score;
  const hasAchievements = (achievements?.length ?? 0) > 0;
  if (!hasScore && !hasAchievements) return null;

  return (
    <Card className={cn("border border-primary/10 shadow-sm", className)}>
      <CardContent className="p-3 sm:p-4 space-y-3">
        {hasScore && <ImagineScorePanel score={score} variant="compact" />}
        {hasScore && hasAchievements && <Separator />}
        {hasAchievements && (
          <AchievementBadges achievements={achievements} variant="compact" />
        )}
      </CardContent>
    </Card>
  );
}
