"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api-client";
import { Loader2, RefreshCw } from "lucide-react";

export async function getServerSideProps() {
  return { props: {} };
}

type SettlementPosition = {
  openPosition?: number;
  outstandingDue?: number;
  totalPaid?: number;
  totalPayoutOffsets?: number;
  netPosition?: number;
  currency?: string;
  notice?: string;
};

type SettlementEntry = {
  id: string;
  type: string;
  direction: string;
  amount: number;
  status: string;
  description?: string;
  bookingId?: string;
  orderId?: string;
  createdAt?: string;
};

function formatInr(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortId(value: unknown): string | undefined {
  const s = String(value ?? "").trim();
  if (!s) return undefined;
  return s.length > 10 ? s.slice(-8) : s;
}

function typeLabel(type: string) {
  const u = String(type || "").toUpperCase();
  if (u === "COD_DUE") return "COD due";
  if (u === "COD_DISCOUNT_TOPUP") return "Offer/wallet top-up";
  if (u === "PAYOUT_OFFSET") return "Auto offset (payout)";
  if (u === "ADMIN_ADJUSTMENT") return "Admin adjustment";
  if (u === "PROVIDER_SETTLEMENT_PAYMENT") return "Settlement payment";
  return type || "—";
}

function statusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  const s = String(status || "").toUpperCase();
  if (s === "OPEN") return "destructive";
  if (s === "SETTLED") return "secondary";
  return "outline";
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window !== "undefined" && (window as any).Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const src = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const check = setInterval(() => {
        if ((window as any).Razorpay) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        if ((window as any).Razorpay) resolve();
        else reject(new Error("Razorpay failed to load"));
      }, 8000);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });
}

function mapEntries(rows: any[]): SettlementEntry[] {
  return (rows || []).map((e: any) => ({
    id: String(e._id || e.id),
    type: String(e.type || ""),
    direction: String(e.direction || ""),
    amount: Number(e.amount) || 0,
    status: String(e.status || ""),
    description: e.description ? String(e.description) : undefined,
    bookingId: shortId(e.bookingId?._id || e.bookingId),
    orderId: shortId(e.orderId?._id || e.orderId),
    createdAt: e.createdAt ? String(e.createdAt) : undefined,
  }));
}

export default function ProviderSettlement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [position, setPosition] = useState<SettlementPosition | null>(null);
  const [entries, setEntries] = useState<SettlementEntry[]>([]);

  const load = useCallback(async () => {
    const [posRes, entriesRes] = await Promise.all([
      api.payout.provider.getSettlement(),
      api.payout.provider.getSettlementEntries({ limit: 50 }),
    ]);
    if (posRes.success && posRes.data) {
      setPosition(posRes.data as SettlementPosition);
    } else {
      setPosition(null);
    }
    const entryData = entriesRes.data as { entries?: any[] } | undefined;
    setEntries(mapEntries(entryData?.entries || []));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e: any) {
        if (alive) {
          toast({
            title: "Could not load settlement",
            description: e?.message || "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [load, toast]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      /* ignore */
    } finally {
      setRefreshing(false);
    }
  };

  const outstanding = Number(position?.outstandingDue ?? position?.openPosition ?? 0);
  const totalPaid = Number(position?.totalPaid ?? 0);
  const netPosition = Number(position?.netPosition ?? outstanding);

  const onPayNow = async () => {
    if (!(outstanding > 0) || paying) return;
    setPaying(true);
    try {
      await loadRazorpayScript();
      if (!(window as any).Razorpay) {
        throw new Error("Payment window could not be opened");
      }

      const orderRes = await api.payout.provider.createSettlementPayOrder({ amount: outstanding });
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error?.message || "Failed to start settlement payment");
      }

      const order = orderRes.data as {
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        key: string;
      };

      await new Promise<void>((resolve, reject) => {
        const rzp = new (window as any).Razorpay({
          key: order.key,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "Imagineering India",
          description: "Settlement due payment (COD dues)",
          order_id: order.orderId,
          image: "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png",
          theme: { color: "#e74c3c" },
          prefill: {
            name: typeof user?.name === "string" ? user.name : undefined,
            email: typeof user?.email === "string" ? user.email : undefined,
            contact: typeof (user as any)?.phone === "string" ? (user as any).phone : undefined,
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await api.payout.provider.verifySettlementPayment({
                razorpayOrderId: response.razorpay_order_id || order.orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                paymentId: order.paymentId,
              });
              if (!verifyRes.success) {
                throw new Error(verifyRes.error?.message || "Settlement payment verification failed");
              }
              if (verifyRes.data) {
                setPosition(verifyRes.data as SettlementPosition);
              }
              await load();
              toast({
                title: "Payment successful",
                description: "Settlement payment successful. Ledger updated.",
              });
              resolve();
            } catch (err: any) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("PAYMENT_CANCELLED")),
          },
        });
        rzp.open();
      });
    } catch (e: any) {
      if (String(e?.message || "") === "PAYMENT_CANCELLED") return;
      toast({
        title: "Payment failed",
        description: e?.message || "Could not complete settlement payment",
        variant: "destructive",
      });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading settlement…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground md:text-2xl lg:text-3xl">Settlement</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-base">
            Settlement ledger between you and Imagineering India — not spendable credits. COD jobs
            add amounts you owe the platform; online payouts can clear them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void onRefresh()} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/provider/payouts">Payouts</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/provider/earnings">Earnings</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outstanding settlement due</CardTitle>
          <CardDescription>
            This payment settles your outstanding COD dues. It is not a wallet recharge or spendable
            balance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-extrabold tabular-nums text-foreground md:text-4xl">
              {formatInr(outstanding)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Due to Imagineering India</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Already paid</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatInr(totalPaid)}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Net position</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatInr(netPosition)}</p>
            </div>
          </div>
          {outstanding > 0 ? (
            <Button onClick={() => void onPayNow()} disabled={paying} className="w-full sm:w-auto">
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening payment…
                </>
              ) : (
                `Pay Now · ${formatInr(outstanding)}`
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">No outstanding settlement due.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ledger history</CardTitle>
          <CardDescription>Settlement events for your account</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No settlement entries yet.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{typeLabel(item.type)}</TableCell>
                        <TableCell className="max-w-sm text-muted-foreground">
                          <div className="space-y-0.5">
                            {item.description ? (
                              <p className="line-clamp-2 text-sm text-foreground">{item.description}</p>
                            ) : null}
                            <p className="text-xs">
                              {[
                                item.bookingId ? `Booking: ${item.bookingId}` : null,
                                item.orderId ? `Order: ${item.orderId}` : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatInr(item.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={statusVariant(item.status)}>{item.status || "—"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {entries.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{typeLabel(item.type)}</p>
                        {item.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[
                            item.bookingId ? `Booking: ${item.bookingId}` : null,
                            item.orderId ? `Order: ${item.orderId}` : null,
                            item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums">{formatInr(item.amount)}</p>
                        <Badge variant={statusVariant(item.status)} className="mt-1">
                          {item.status || "—"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
