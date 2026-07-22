"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clearActiveQuoteRequest, setActiveQuoteRequest } from "@/lib/activeQuoteRequest";
import { subscribeToQuoteRequest } from "@/lib/quoteRealtime";
import { cn } from "@/lib/utils";

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function formatCreatedAt(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortLocation(data: any) {
  const city = data?.address?.city || "";
  const state = data?.address?.state || "";
  const pin = data?.address?.zipCode || "";
  const line = [city, state, pin].filter(Boolean).join(", ");
  return line || data?.addressLabel || data?.address?.address || "Delivery location set";
}

function ScoreMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="mt-3">
      <p className="text-[11px] font-medium text-stone-500">Offer score</p>
      <div className="mt-1.5 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
          <div className="h-full rounded-full bg-stone-900" style={{ width: `${pct}%` }} />
        </div>
        <span className="min-w-[1.75rem] text-right text-sm font-bold tabular-nums text-stone-900">
          {pct}
        </span>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  expanded,
  onToggle,
  onSelect,
  canSelect,
  isOrdered,
}: {
  offer: any;
  expanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  canSelect: boolean;
  isOrdered: boolean;
}) {
  const total = Number(
    offer.totalAmount ?? Number(offer.amount || 0) + Number(offer.deliveryCharge || 0)
  );
  const material = Number(offer.materialAmount ?? offer.amount || 0);
  const delivery = Number(offer.deliveryCharge || 0);
  const score = Number(offer.offerScore || 0);
  const recommended = Boolean(offer.isRecommended);

  return (
    <article
      className={cn(
        "rounded-2xl border bg-white p-4 transition-shadow sm:p-5",
        recommended
          ? "border-amber-600/70 bg-[#FFFCF5] shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          : "border-stone-200"
      )}
    >
      <button type="button" className="w-full text-left" onClick={onToggle}>
        {recommended ? (
          <span className="mb-2.5 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
            Recommended
          </span>
        ) : null}
        <p className="text-[32px] font-extrabold leading-none tracking-tight text-stone-900 tabular-nums sm:text-4xl">
          {formatINR(total)}
        </p>
        <p className="mt-1 text-xs text-stone-500">Total · material + delivery</p>
        {score > 0 ? <ScoreMeter score={score} /> : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {offer.verified ? (
            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
              Verified
            </span>
          ) : null}
          {offer.rating != null ? (
            <span className="text-xs font-medium text-stone-500">
              ★ {Number(offer.rating).toFixed(1)}
            </span>
          ) : null}
          {offer.successfulDeliveries != null ? (
            <span className="text-xs font-medium text-stone-500">
              {offer.successfulDeliveries} deliveries
            </span>
          ) : null}
          {offer.onTimePercent != null ? (
            <span className="text-xs font-medium text-stone-500">
              {offer.onTimePercent}% on-time
            </span>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div className="mt-4 space-y-2 border-t border-stone-200 pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Material</span>
            <span className="font-semibold tabular-nums text-stone-900">{formatINR(material)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Delivery</span>
            <span className="font-semibold text-stone-900">
              {offer.deliveryOption === "not_available"
                ? "Not available"
                : delivery > 0
                  ? formatINR(delivery)
                  : "Free"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">GST</span>
            <span className="font-semibold text-stone-900">{offer.gstLabel || "GST Included"}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">Transport</span>
            <span className="font-semibold text-stone-900">
              {offer.transportLabel || "Supplier transport"}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-stone-500">ETA</span>
            <span className="max-w-[60%] text-right font-semibold text-stone-900">
              {offer.estimatedDelivery || "Confirm on select"}
            </span>
          </div>
          {offer.validitySecondsRemaining != null ? (
            <div className="flex justify-between gap-3">
              <span className="text-stone-500">Valid for</span>
              <span className="font-semibold tabular-nums text-stone-900">
                {formatCountdown(Number(offer.validitySecondsRemaining))}
              </span>
            </div>
          ) : null}
          {offer.notes ? <p className="pt-1 text-xs text-stone-500">{offer.notes}</p> : null}
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-stone-500">Tap for breakdown</p>
      )}

      {offer.status === "selected" ? (
        <p className="mt-2 text-xs font-bold text-teal-700">Selected</p>
      ) : null}

      {canSelect ? (
        <Button
          className="mt-4 h-11 w-full bg-[#B91C1C] text-base font-semibold hover:bg-[#991B1B]"
          onClick={onSelect}
        >
          Select offer
        </Button>
      ) : null}
      {isOrdered && offer.status === "selected" ? (
        <Button className="mt-4 h-11 w-full" asChild>
          <Link href="/dashboard/buyer/orders">View order</Link>
        </Button>
      ) : null}
    </article>
  );
}

export default function QuoteRequestPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [liveBanner, setLiveBanner] = useState<string | null>(null);
  const prevOfferCount = useRef(0);
  const prevRecommended = useRef<string | null>(null);

  const applyRow = useCallback(
    (row: any) => {
      if (!row) return;
      setData(row);
      setSecondsLeft(Number(row?.secondsRemaining || 0));
      if (row?.status === "cancelled" || row?.status === "ordered" || row?.booking) {
        clearActiveQuoteRequest(String(row.id || id));
      } else if (row?.id) {
        setActiveQuoteRequest({
          id: String(row.id),
          expiresAt: row.expiresAt,
          serviceTitle:
            typeof row.service === "object" && row.service?.title ? row.service.title : undefined,
        });
      }
    },
    [id]
  );

  const fetchDetail = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!id) return;
      const silent = Boolean(opts?.silent);
      try {
        const res = await api.quoteRequests.getById(id);
        if (!res.success) throw new Error((res as any)?.error?.message || "Failed to load");
        applyRow((res as any).data);
      } catch (err: any) {
        if (!silent) {
          toast({
            title: "Could not load request",
            description: err?.message || "Try again",
            variant: "destructive",
          });
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, toast, applyRow]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/quote-requests/${id}`)}`);
      return;
    }
    void fetchDetail();
  }, [authLoading, isAuthenticated, fetchDetail, id, router]);

  useEffect(() => {
    if (!data?.windowOpen) return;
    const t = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [data?.windowOpen, data?.expiresAt]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    return subscribeToQuoteRequest(id, (payload) => {
      if (payload?.data) {
        applyRow(payload.data);
        return;
      }
      void fetchDetail({ silent: true });
    });
  }, [id, isAuthenticated, applyRow, fetchDetail]);

  const serviceTitle = useMemo(() => {
    const s = data?.service;
    if (!s) return "Your request";
    if (typeof s === "object") return s.title || "Your request";
    return "Your request";
  }, [data?.service]);

  const offers = useMemo(() => (Array.isArray(data?.offers) ? data.offers : []), [data?.offers]);

  useEffect(() => {
    const count = offers.length;
    const recommendedId =
      data?.recommendedOfferId || offers.find((o: any) => o.isRecommended)?.id || null;
    if (prevOfferCount.current > 0 && count > prevOfferCount.current) {
      const msg =
        recommendedId && recommendedId !== prevRecommended.current
          ? "New best offer received"
          : "New offer received";
      setLiveBanner(msg);
      const t = setTimeout(() => setLiveBanner(null), 2800);
      return () => clearTimeout(t);
    }
    if (count > 0 && !expandedId) {
      const rec = offers.find((o: any) => o.isRecommended) || offers[0];
      if (rec?.id) setExpandedId(String(rec.id));
    }
    prevOfferCount.current = count;
    prevRecommended.current = recommendedId ? String(recommendedId) : null;
  }, [offers, data?.recommendedOfferId, expandedId]);

  const notified = Number(data?.notifiedProviderCount || 0);
  const received = Number(data?.offersReceived ?? offers.length);
  const progress = notified > 0 ? Math.min(100, Math.round((received / notified) * 100)) : 0;
  const windowClosed = Boolean(data && (!data.windowOpen || data.status === "expired"));
  const isOrdered = data?.status === "ordered" || Boolean(data?.booking);

  if (loading || authLoading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-[#F6F4F1]">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg bg-[#F6F4F1] px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-stone-900">Quote request not found</h1>
        <Button asChild className="mt-4">
          <Link href="/services">Browse services</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F4F1] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-xl">
        {liveBanner ? (
          <div className="mb-4 rounded-2xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg">
            {liveBanner}
          </div>
        ) : null}

        <header className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Live quotes</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            {serviceTitle}
          </h1>
          <p className="mt-2 text-sm font-medium text-stone-800">Qty {data.quantity}</p>
          <p className="mt-1 text-sm text-stone-600">{shortLocation(data)}</p>
          {data.createdAt ? (
            <p className="mt-1 text-xs text-stone-500">Requested {formatCreatedAt(data.createdAt)}</p>
          ) : null}
        </header>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          {windowClosed || isOrdered ? (
            <p className="text-base font-semibold text-stone-900">
              {isOrdered ? "Order in progress" : "Quote window closed"}
            </p>
          ) : (
            <>
              <p className="font-mono text-3xl font-extrabold tabular-nums tracking-tight text-[#B91C1C]">
                {formatCountdown(secondsLeft)}
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">Window open · auto-closes</p>
            </>
          )}
          <p className="mt-4 text-sm font-semibold text-stone-900">
            {received} / {notified || "—"} quotes received
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
            Supplier details unlock after you confirm through Imagineering India.
          </p>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-base font-bold text-stone-900">Offers</h2>

          {offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-700" />
              <p className="mt-3 text-sm font-semibold text-stone-900">
                Searching verified suppliers…
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {notified} suppliers notified.
                <br />
                Waiting for responses…
              </p>
            </div>
          ) : (
            offers.map((offer: any) => {
              const offerId = String(offer.id);
              return (
                <OfferCard
                  key={offerId}
                  offer={offer}
                  expanded={expandedId === offerId || Boolean(offer.isRecommended)}
                  onToggle={() => setExpandedId((cur) => (cur === offerId ? null : offerId))}
                  canSelect={
                    offer.status === "active" && data.status !== "cancelled" && !isOrdered
                  }
                  isOrdered={isOrdered}
                  onSelect={() =>
                    router.push(
                      `/quote-requests/${id}/confirm?offerId=${encodeURIComponent(offerId)}`
                    )
                  }
                />
              );
            })
          )}
        </section>

        <div className="mt-8 space-y-3 pb-8 text-center">
          <p className="text-xs text-stone-500">
            Live updates arrive automatically. Refresh if needed.
          </p>
          <Button variant="outline" asChild>
            <Link href="/services">Back to services</Link>
          </Button>
          {data.status === "open" || data.status === "expired" ? (
            <div>
              <Button
                variant="ghost"
                className="text-[#B91C1C] hover:bg-red-50 hover:text-[#991B1B]"
                onClick={async () => {
                  try {
                    await api.quoteRequests.cancel(id);
                    clearActiveQuoteRequest(id);
                    toast({ title: "Request cancelled" });
                    router.push("/services");
                  } catch (err: any) {
                    toast({
                      title: "Cancel failed",
                      description: err?.message,
                      variant: "destructive",
                    });
                  }
                }}
              >
                Cancel request
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
