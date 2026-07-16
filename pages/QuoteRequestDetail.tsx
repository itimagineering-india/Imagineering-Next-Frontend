"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, MapPin, Package } from "lucide-react";
import api from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clearActiveQuoteRequest, setActiveQuoteRequest } from "@/lib/activeQuoteRequest";

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function QuoteRequestPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await api.quoteRequests.getById(id);
      if (!res.success) throw new Error((res as any)?.error?.message || "Failed to load");
      const row = (res as any).data;
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
    } catch (err: any) {
      toast({
        title: "Could not load request",
        description: err?.message || "Try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/quote-requests/${id}`)}`);
      return;
    }
    fetchDetail();
  }, [authLoading, isAuthenticated, fetchDetail, id, router]);

  useEffect(() => {
    if (!data?.windowOpen) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [data?.windowOpen, data?.expiresAt]);

  useEffect(() => {
    if (!id || !isAuthenticated) return;
    const shouldPoll = data?.status === "open" || (data?.windowOpen && !data?.booking);
    if (!shouldPoll && data?.status === "ordered") return;

    const interval = setInterval(() => {
      fetchDetail();
    }, 8000);
    return () => clearInterval(interval);
  }, [id, isAuthenticated, data?.status, data?.windowOpen, data?.booking, fetchDetail]);

  const serviceTitle = useMemo(() => {
    const s = data?.service;
    if (!s) return "your request";
    if (typeof s === "object") return s.title || "your request";
    return "your request";
  }, [data?.service]);

  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const windowClosed = Boolean(data && (!data.windowOpen || data.status === "expired"));
  const isOrdered = data?.status === "ordered" || Boolean(data?.booking);

  if (loading || authLoading) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Quote request not found</h1>
        <Button asChild className="mt-4">
          <Link href="/services">Browse services</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <div className="rounded-2xl border bg-gradient-to-b from-sky-50/80 to-white p-6 shadow-sm dark:from-slate-900 dark:to-slate-950">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Aapki requirement bhej di gayi hai
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nearby providers have received your request for{" "}
              <span className="font-medium text-foreground">{serviceTitle}</span>. They will share
              prices within this window.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border bg-background/80 px-4 py-3">
          <Clock className="h-5 w-5 text-blue-600" />
          {windowClosed || isOrdered ? (
            <div>
              <p className="text-sm font-semibold">
                {isOrdered ? "Order in progress" : "Quote window closed"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOrdered
                  ? "You selected a quote. Complete payment if still pending."
                  : "New quotes cannot be submitted. You can still select an existing quote below."}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-mono text-2xl font-bold tabular-nums tracking-tight">
                {formatCountdown(secondsLeft)}
              </p>
              <p className="text-xs text-muted-foreground">Time left for providers to quote</p>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <p className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Qty: {data.quantity}
          </p>
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {data.preferredDate} · {data.preferredTime}
          </p>
          <p className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {data.address?.address}, {data.address?.city}, {data.address?.state}
              {data.address?.zipCode ? ` ${data.address.zipCode}` : ""}
            </span>
          </p>
          <p className="text-xs sm:col-span-2">
            Sent to {data.notifiedProviderCount || 0} nearby provider
            {(data.notifiedProviderCount || 0) === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Quotes received ({offers.length})</h2>

        {offers.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {windowClosed
              ? "No quotes arrived in time. You can submit a new request from the product page."
              : "Waiting for providers to respond… This page updates automatically."}
          </div>
        ) : (
          offers.map((offer: any, index: number) => {
            const offerId = String(offer.id);
            const canSelect = offer.status === "active" && data.status !== "cancelled" && !isOrdered;

            return (
              <div key={offerId} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">Quote {index + 1}</p>
                    {offer.notes ? (
                      <p className="mt-1 text-sm text-muted-foreground">{offer.notes}</p>
                    ) : null}
                    {offer.estimatedDelivery ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Timeline: {offer.estimatedDelivery}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Delivery:{" "}
                      {offer.deliveryOption === "paid"
                        ? `Paid · ${formatINR(offer.deliveryCharge || 0)}`
                        : offer.deliveryOption === "not_available"
                          ? "Not available"
                          : "Free"}
                    </p>
                    {Array.isArray(offer.sampleImages) && offer.sampleImages.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {offer.sampleImages.map((url: string) => (
                          <a
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block h-16 w-16 overflow-hidden rounded-md border"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="Sample" className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {offer.status === "selected" ? (
                      <p className="mt-1 text-xs font-medium text-emerald-700">Selected</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold tabular-nums">{formatINR(offer.amount)}</p>
                    {offer.deliveryOption === "paid" && Number(offer.deliveryCharge || 0) > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        Total + delivery:{" "}
                        {formatINR(Number(offer.amount) + Number(offer.deliveryCharge || 0))}
                      </p>
                    ) : null}
                    {canSelect ? (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() =>
                          router.push(`/quote-requests/${id}/confirm?offerId=${encodeURIComponent(offerId)}`)
                        }
                      >
                        Select
                      </Button>
                    ) : null}
                    {isOrdered && offer.status === "selected" ? (
                      <Button size="sm" className="mt-2" asChild>
                        <Link href="/dashboard/buyer/orders">View order</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button variant="outline" asChild>
          <Link href="/services">Back to services</Link>
        </Button>
        {data.status === "open" || data.status === "expired" ? (
          <Button
            variant="ghost"
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
        ) : null}
      </div>
    </main>
  );
}
