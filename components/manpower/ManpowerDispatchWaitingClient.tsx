"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { MANPOWER_CANVAS, MANPOWER_TEAL } from "@/components/manpower/ManpowerHireModeTabs";

type Props = { bookingId: string };

function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function ManpowerDispatchWaitingClient({ bookingId }: Props) {
  const { t } = useTranslation("manpower");
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.bookings.getManpowerDispatch(bookingId);
      if (res.success && res.data) {
        const row = res.data as Record<string, unknown>;
        setData(row);
        setSecondsLeft(Number(row.secondsRemaining || 0));
      }
    } catch {
      /* ignore poll errors */
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = String(data?.status || "");
  const matched =
    Boolean(data?.provider) ||
    ["ACCEPTED", "IN_PROGRESS", "COMPLETED", "CONFIRMED"].includes(status);
  const cancelled = status.includes("CANCEL");
  const searching = !matched && !cancelled && (status === "PENDING_PROVIDER" || status === "PENDING" || !status);

  const onRetry = async () => {
    setRetrying(true);
    try {
      const res = await api.bookings.retryManpowerDispatchSearch(bookingId);
      if (!res.success) throw new Error(res.error?.message || "Retry failed");
      await load();
    } catch (err) {
      toast({
        title: t("checkoutError"),
        description: err instanceof Error ? err.message : "Retry failed",
        variant: "destructive",
      });
    } finally {
      setRetrying(false);
    }
  };

  const onCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.bookings.cancelByBuyer(bookingId, "Cancelled from manpower dispatch search");
      if (!res.success) throw new Error(res.error?.message || "Cancel failed");
      toast({ title: t("waitingCancel") });
      router.push("/dashboard/buyer/orders");
    } catch (err) {
      toast({
        title: t("checkoutError"),
        description: err instanceof Error ? err.message : "Cancel failed",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const provider = data?.provider as { businessName?: string; name?: string } | undefined;
  const providerName = provider?.businessName || provider?.name || "Provider";

  return (
    <div className="min-h-screen" style={{ backgroundColor: MANPOWER_CANVAS }}>
      <div className="layout-shell flex max-w-lg flex-col items-center py-16 text-center">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
        ) : matched ? (
          <>
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
              style={{ backgroundColor: MANPOWER_TEAL }}
            >
              ✓
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">{t("waitingMatched")}</h1>
            <p className="mt-2 text-sm text-slate-600">{providerName}</p>
            <Button asChild className="mt-8 h-11 rounded-xl" style={{ backgroundColor: MANPOWER_TEAL }}>
              <Link href="/dashboard/buyer/orders">{t("waitingViewBookings")}</Link>
            </Button>
          </>
        ) : (
          <>
            <div
              className="relative flex h-28 w-28 items-center justify-center rounded-full"
              style={{ backgroundColor: `${MANPOWER_TEAL}22` }}
            >
              <div
                className="absolute inset-2 animate-pulse rounded-full opacity-40"
                style={{ backgroundColor: MANPOWER_TEAL }}
              />
              <Loader2 className="relative h-10 w-10 animate-spin text-teal-800" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">{t("waitingTitle")}</h1>
            <p className="mt-2 max-w-sm text-sm text-slate-600">{t("waitingBody")}</p>
            {searching && secondsLeft > 0 ? (
              <p className="mt-4 font-mono text-3xl font-bold text-teal-900">
                {formatCountdown(secondsLeft)}
              </p>
            ) : null}
            {!searching || secondsLeft <= 0 ? (
              <p className="mt-4 text-sm text-amber-800">{t("waitingExpired")}</p>
            ) : null}
            <div className="mt-8 flex w-full flex-col gap-3 sm:max-w-xs">
              <Button
                type="button"
                disabled={retrying}
                className="h-11 rounded-xl text-white"
                style={{ backgroundColor: MANPOWER_TEAL }}
                onClick={() => void onRetry()}
              >
                {retrying ? <Loader2 className="h-4 w-4 animate-spin" /> : t("waitingRetry")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={cancelling}
                className="h-11 rounded-xl"
                onClick={() => void onCancel()}
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : t("waitingCancel")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
