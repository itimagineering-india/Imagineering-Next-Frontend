"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export type DailyGoalItem = {
  id: string;
  label: string;
  target: number;
  current: number;
  reputationPoints: number;
  completed: boolean;
};

export type DailyGoalsData = {
  dateKey?: string;
  goals?: DailyGoalItem[];
  totalEarnable?: number;
  totalEarned?: number;
};

export function DailyGoalsWidget({
  data,
  className,
}: {
  data?: DailyGoalsData | null;
  className?: string;
}) {
  if (!data?.goals?.length) return null;

  const earned = data.totalEarned ?? 0;
  const earnable = data.totalEarnable ?? 0;
  const pct = earnable > 0 ? Math.round((earned / earnable) * 100) : 0;

  return (
    <Card className={cn("border-primary/15", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Today&apos;s goals
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            +{earned}/{earnable} reputation pts
          </span>
        </div>
        <Progress value={pct} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {data.goals.map((goal) => {
          const progress =
            goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
          return (
            <div
              key={goal.id}
              className={cn(
                "rounded-lg border p-3",
                goal.completed && "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {goal.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                  )}
                  <p className="text-sm font-medium">{goal.label}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  +{goal.reputationPoints} pts
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {goal.current}/{goal.target}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
