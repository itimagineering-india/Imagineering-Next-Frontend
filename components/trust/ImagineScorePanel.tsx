"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle2, Shield, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImagineScoreData = {
  trustScore: number | null;
  imagineScore: number | null;
  activityScore?: number | null;
  businessScore?: number | null;
  rank?: "bronze" | "silver" | "gold" | "platinum";
  statusLabel?: string;
  isImagineeringVerified?: boolean;
  scoreVisible?: boolean;
  breakdown?: {
    onTimeDeliveryPct?: number;
    fulfillmentRatePct?: number;
    reviewAvg?: number;
    reviewCount?: number;
    completedOrders?: number;
    cancellationRatePct?: number;
    kycApproved?: boolean;
    gstVerified?: boolean;
  };
  improvementHints?: Array<{
    id: string;
    message: string;
    priority?: "high" | "medium" | "low";
  }>;
};

const RANK_STYLES: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200",
  silver: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-100",
  gold: "bg-yellow-100 text-yellow-900 border-yellow-400 dark:bg-yellow-950/40 dark:text-yellow-200",
  platinum: "bg-violet-100 text-violet-900 border-violet-400 dark:bg-violet-950/40 dark:text-violet-200",
};

const RANK_LABELS: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
};

export function ImagineVerifiedBadge({
  score,
  className,
}: {
  score?: Partial<ImagineScoreData> | null;
  className?: string;
}) {
  if (!score?.isImagineeringVerified) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200",
        className
      )}
    >
      <Shield className="h-3 w-3" />
      Imagineering Verified
    </Badge>
  );
}

export function ImagineScorePanel({
  score,
  variant = "public",
  className,
}: {
  score?: ImagineScoreData | null;
  variant?: "public" | "dashboard" | "compact";
  className?: string;
}) {
  if (!score) return null;

  const rank = score.rank ?? "bronze";
  const visible = score.scoreVisible !== false && score.trustScore != null;
  const trust = score.trustScore ?? 0;
  const orders = score.breakdown?.completedOrders ?? 0;
  const onTime = Math.round(
    score.breakdown?.onTimeDeliveryPct ?? score.breakdown?.fulfillmentRatePct ?? 0
  );
  const reviews =
    score.breakdown?.reviewCount && score.breakdown.reviewCount > 0
      ? `${score.breakdown.reviewAvg?.toFixed(1) ?? "—"}★ (${score.breakdown.reviewCount})`
      : null;
  const compliance = score.breakdown?.kycApproved
    ? score.breakdown?.gstVerified
      ? "KYC+GST"
      : "KYC"
    : null;

  if (variant === "compact") {
    return (
      <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {visible ? Math.round(trust) : "—"}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-semibold">Imagine Score</span>
              <Badge variant="outline" className={cn("text-[10px] capitalize h-5", RANK_STYLES[rank])}>
                {RANK_LABELS[rank] ?? rank}
              </Badge>
              <ImagineVerifiedBadge score={score} className="text-[10px] h-5" />
            </div>
            <p className="text-xs text-muted-foreground truncate">{score.statusLabel ?? "Supplier"}</p>
          </div>
        </div>
        {visible ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:justify-end">
            {score.imagineScore != null && (
              <span>
                Overall <span className="font-medium text-foreground">{Math.round(score.imagineScore)}</span>
              </span>
            )}
            <span>
              <span className="font-medium text-foreground">{orders}</span> orders
            </span>
            {reviews && <span>{reviews}</span>}
            <span>
              <span className="font-medium text-foreground">{onTime}%</span> on-time
            </span>
            {compliance && (
              <span className="inline-flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {compliance}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {Math.max(0, 5 - orders)} more orders to unlock public score
          </p>
        )}
      </div>
    );
  }

  return (
    <Card className={cn("border-2 border-primary/10", className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Imagine Score
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("capitalize", RANK_STYLES[rank])}>
              {RANK_LABELS[rank] ?? rank}
            </Badge>
            <ImagineVerifiedBadge score={score} />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{score.statusLabel ?? "Supplier"}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {visible ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreTile label="Trust" value={score.trustScore} highlight />
              {variant === "dashboard" && score.activityScore != null && (
                <ScoreTile label="Activity" value={score.activityScore} />
              )}
              {variant === "dashboard" && score.businessScore != null && (
                <ScoreTile label="Business" value={score.businessScore} />
              )}
              {variant === "dashboard" && score.imagineScore != null && (
                <ScoreTile label="Imagine" value={score.imagineScore} />
              )}
              {variant === "public" && score.imagineScore != null && (
                <ScoreTile label="Overall" value={score.imagineScore} />
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <MetricRow
                label="On-time fulfillment"
                value={`${Math.round(score.breakdown?.onTimeDeliveryPct ?? score.breakdown?.fulfillmentRatePct ?? 0)}%`}
              />
              <MetricRow
                label="Completed orders"
                value={String(score.breakdown?.completedOrders ?? 0)}
              />
              <MetricRow
                label="Reviews"
                value={
                  score.breakdown?.reviewCount
                    ? `${score.breakdown.reviewAvg?.toFixed(1) ?? "—"} ★ (${score.breakdown.reviewCount})`
                    : "—"
                }
              />
              <MetricRow
                label="Compliance"
                value={
                  score.breakdown?.kycApproved
                    ? score.breakdown?.gstVerified
                      ? "KYC + GST"
                      : "KYC verified"
                    : "Pending KYC"
                }
                icon={score.breakdown?.kycApproved ? CheckCircle2 : undefined}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">New Supplier</p>
            <p>
              Complete {Math.max(0, 5 - (score.breakdown?.completedOrders ?? 0))} more orders to
              unlock your public Trust Score on Imagineering India.
            </p>
            <p className="mt-2 text-xs">
              Completed so far: {score.breakdown?.completedOrders ?? 0}
            </p>
          </div>
        )}

        {variant === "dashboard" && (score.improvementHints?.length ?? 0) > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Today&apos;s goals
            </p>
            <ul className="space-y-2">
              {score.improvementHints?.map((hint) => (
                <li
                  key={hint.id}
                  className="text-sm rounded-md bg-primary/5 px-3 py-2 border border-primary/10"
                >
                  {hint.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | null | undefined;
  highlight?: boolean;
}) {
  const n = value ?? 0;
  return (
    <div className="rounded-lg border p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", highlight && "text-primary")}>
        {value != null ? Math.round(n) : "—"}
      </p>
      <Progress value={n} className="h-1.5 mt-2" />
    </div>
  );
}

function MetricRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof CheckCircle2;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5 text-emerald-600" />}
        {value}
      </span>
    </div>
  );
}
