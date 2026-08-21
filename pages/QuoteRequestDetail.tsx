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
import { quoteOfferItems, quoteRequestHeadline, quoteRequestItems, isTimedQuoteWindow } from "@/lib/b2b/quoteRequestDisplay";
import { formatQuoteQtyLabel } from "@/lib/priceTypeDisplay";
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
  const material = Number(offer.materialAmount ?? (offer.amount || 0));
  const delivery = Number(offer.deliveryCharge || 0);
  const score = Number(offer.offerScore || 0);
  const recommended = Boolean(offer.isRecommended);
  const lineItems = quoteOfferItems(offer);

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
        <p className="mt-1 text-xs text-stone-500">
          {Number(offer.gstAmount) > 0 ? "Total · material + GST + delivery" : "Total · material + delivery"}
        </p>
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
          {offer.gstLabel ? (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
              {offer.gstLabel}
            </span>
          ) : null}
        </div>
      </button>

      {Array.isArray(offer.sampleImages) && offer.sampleImages.length > 0 ? (
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
            Sample images
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {offer.sampleImages
              .filter((url: unknown) => typeof url === "string" && url.trim())
              .map((url: string) => (
                <img
                  key={url}
                  src={url}
                  alt="Offer sample"
                  className="h-20 w-20 shrink-0 rounded-xl border border-stone-200 object-cover"
                />
              ))}
          </div>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-4 space-y-2 border-t border-stone-200 pt-3 text-sm">
          {lineItems.length > 0 ? (
            <ul className="space-y-1.5 pb-2">
              {lineItems.map((item, idx) => (
                <li key={`${item.serviceId || item.title}-${idx}`} className="flex justify-between gap-3">
                  <span className="min-w-0 text-stone-600">
                    <span className="block truncate font-medium text-stone-800">{item.title}</span>
                    <span className="text-xs text-stone-500">
                      Qty {item.quantity ?? 1} × {formatINR(Number(item.unitPrice || 0))}
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-stone-900">
                    {formatINR(Number(item.lineTotal || (item.unitPrice || 0) * (item.quantity || 1)))}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
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
            <span className="text-stone-500">
              GST{offer.gstPercent != null && Number(offer.gstPercent) > 0 ? ` (${offer.gstPercent}%)` : ""}
            </span>
            <span className="font-semibold tabular-nums text-stone-900">
              {Number(offer.gstAmount) > 0
                ? formatINR(Number(offer.gstAmount))
                : offer.gstLabel || "Without GST"}
            </span>
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
          <Link href="/buyer/orders">View order</Link>
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
          serviceTitle: quoteRequestHeadline(row),
          persistent: !isTimedQuoteWindow(row),
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
    if (!data?.windowOpen || !isTimedQuoteWindow(data)) return;
    const t = setInterval(() => setSecondsLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(t);
  }, [data?.windowOpen, data?.expiresAt, data]);

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

  const serviceTitle = useMemo(() => quoteRequestHeadline(data), [data]);
  const requestItems = useMemo(() => quoteRequestItems(data), [data]);

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
  const timed = isTimedQuoteWindow(data);
  const windowClosed = Boolean(
    data && timed && (!data.windowOpen || data.status === "expired")
  );
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

  const statusHeadline = isOrdered
    ? "Order in progress"
    : data.status === "cancelled"
      ? "Request cancelled"
      : windowClosed
        ? "Quote window closed"
        : timed
          ? null
          : "Open — waiting for quotes";

  const materials =
    requestItems.length > 0
      ? requestItems
      : [{ title: serviceTitle, quantity: data.quantity, priceType: data?.service?.priceType }];

  const cancelRequest = async () => {
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
  };

  const cancelActions = (data.status === "open" || data.status === "expired") && (
    <Button
      variant="ghost"
      className="w-full text-[#B91C1C] hover:bg-red-50 hover:text-[#991B1B]"
      onClick={() => void cancelRequest()}
    >
      Cancel request
    </Button>
  );

  return (
    <main className="min-h-screen bg-[#F6F4F1]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        {liveBanner ? (
          <div className="mb-5 rounded-xl bg-stone-900 px-4 py-3 text-center text-sm font-semibold text-white">
            {liveBanner}
          </div>
        ) : null}

        <header className="mb-6 flex flex-col gap-4 border-b border-stone-300/70 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              Live quotes
            </p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
              {serviceTitle}
            </h1>
            <p className="mt-2 text-sm text-stone-600">
              {shortLocation(data)}
              {data.createdAt ? (
                <span className="text-stone-400"> · Requested {formatCreatedAt(data.createdAt)}</span>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4 sm:gap-6">
            <div>
              {statusHeadline ? (
                <p className="text-sm font-semibold text-stone-900">{statusHeadline}</p>
              ) : (
                <p className="font-mono text-3xl font-extrabold tabular-nums tracking-tight text-[#B91C1C]">
                  {formatCountdown(secondsLeft)}
                </p>
              )}
              <p className="mt-0.5 text-xs text-stone-500">
                {isOrdered || data.status === "cancelled" || windowClosed
                  ? "Status"
                  : timed
                    ? "Window open · auto-closes"
                    : "No time limit"}
              </p>
            </div>
            <div className="h-10 w-px bg-stone-300" aria-hidden />
            <div className="min-w-[7.5rem]">
              <p className="text-sm font-semibold tabular-nums text-stone-900">
                {received} / {notified || "—"}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">Quotes received</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <section>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-bold text-stone-900">Your materials</h2>
                <span className="text-xs tabular-nums text-stone-500">
                  {materials.length} {materials.length === 1 ? "item" : "items"}
                </span>
              </div>
              <ul className="divide-y divide-stone-200 border-y border-stone-200 bg-white/60">
                {materials.map((item, idx) => (
                  <li
                    key={`${item.title}-${idx}`}
                    className="flex items-start justify-between gap-4 px-1 py-3"
                  >
                    <span className="min-w-0 text-sm font-medium leading-snug text-stone-800">
                      {item.title}
                    </span>
                    <span className="shrink-0 text-right text-xs font-semibold tabular-nums text-stone-500">
                      {formatQuoteQtyLabel(Number(item.quantity ?? 1), item.priceType)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
                Supplier details unlock after you confirm through Imagineering India.
              </p>
            </section>

            <div className="hidden space-y-2 lg:block">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/services">Back to services</Link>
              </Button>
              {cancelActions}
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-bold text-stone-900">Offers</h2>
              {offers.length > 0 ? (
                <span className="text-xs tabular-nums text-stone-500">{offers.length} received</span>
              ) : null}
            </div>

            {offers.length === 0 ? (
              <div className="border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-700" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Searching listed suppliers…</p>
                <p className="mt-1 text-sm text-stone-500">
                  {notified} listed suppliers notified. Waiting for responses…
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer: any) => {
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
                })}
              </div>
            )}

            <p className="mt-6 text-center text-xs text-stone-500 lg:text-left">
              Live updates arrive automatically. Refresh if needed.
            </p>

            <div className="mt-4 space-y-2 pb-8 lg:hidden">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/services">Back to services</Link>
              </Button>
              {cancelActions}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
