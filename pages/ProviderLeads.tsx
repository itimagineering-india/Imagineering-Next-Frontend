"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Calendar, Clock, Package, Loader2, ImagePlus, X, Navigation, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import api from "@/lib/api-client";
import { quoteLineKey, quoteOfferItems, quoteRequestHeadline, quoteRequestItems, isTimedQuoteWindow } from "@/lib/b2b/quoteRequestDisplay";
import { parseQuoteQuantity } from "@/lib/quoteQuantity";
import { formatQuoteQtyLabel, getQuantityUnitNoun } from "@/lib/priceTypeDisplay";
import {
  parseQuoteGstAmount,
  parseQuoteGstPercent,
  QUOTE_GST_SLABS,
  suggestedQuoteGstAmount,
} from "@/lib/quoteGst";

export async function getServerSideProps() { return { props: {} }; }

function formatCountdown(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function formatINR(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export default function ProviderLeads() {
  const { status: kycStatus } = useProviderKycStatus();
  const isLocked = kycStatus !== "KYC_APPROVED";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [manpowerInvites, setManpowerInvites] = useState<any[]>([]);
  const [isManpowerLoading, setIsManpowerLoading] = useState(true);
  const { toast } = useToast();

  const [quoteRequests, setQuoteRequests] = useState<any[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [activeQuote, setActiveQuote] = useState<any>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteLineRates, setQuoteLineRates] = useState<Record<string, string>>({});
  const [quoteNotes, setQuoteNotes] = useState("");
  const [quoteDelivery, setQuoteDelivery] = useState("");
  const [quoteDeliveryOption, setQuoteDeliveryOption] = useState<"free" | "paid" | "not_available">("free");
  const [quoteDeliveryCharge, setQuoteDeliveryCharge] = useState("");
  const [quoteSampleImages, setQuoteSampleImages] = useState<string[]>([]);
  const [quoteGstPercent, setQuoteGstPercent] = useState<number | null>(null);
  const [quoteGstAmount, setQuoteGstAmount] = useState("");
  const [quoteGstAmountEdited, setQuoteGstAmountEdited] = useState(false);
  const [quoteImageUploading, setQuoteImageUploading] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteSecondsLeft, setQuoteSecondsLeft] = useState(0);
  const [quoteSummaryExpanded, setQuoteSummaryExpanded] = useState(false);

  const fetchQuoteRequests = useCallback(async () => {
    setQuotesLoading(true);
    try {
      const res = await api.quoteRequests.providerInbox();
      if (res.success && Array.isArray((res as any).data)) {
        setQuoteRequests((res as any).data);
      } else {
        setQuoteRequests([]);
      }
    } catch {
      setQuoteRequests([]);
    } finally {
      setQuotesLoading(false);
    }
  }, []);

  const openQuoteDialog = useCallback(
    async (quoteRequestId: string, fromList?: any) => {
      try {
        let row = fromList;
        if (!row) {
          const res = await api.quoteRequests.providerGetById(quoteRequestId);
          if (!res.success) throw new Error((res as any)?.error?.message || "Failed to load");
          row = (res as any).data;
        }
        setActiveQuote(row);
        setQuoteSecondsLeft(Number(row?.secondsRemaining || 0));
        const requestLines = quoteRequestItems(row);
        const offered = quoteOfferItems(row?.myOffer);
        const rates: Record<string, string> = {};
        requestLines.forEach((line, idx) => {
          const key = quoteLineKey(line, idx);
          const match =
            offered.find((o) => o.serviceId && o.serviceId === line.serviceId) ||
            offered.find((o) => o.title && o.title === line.title);
          rates[key] = match?.unitPrice != null ? String(match.unitPrice) : "";
        });
        setQuoteLineRates(rates);
        setQuoteAmount(row?.myOffer?.amount != null ? String(row.myOffer.amount) : "");
        setQuoteNotes(row?.myOffer?.notes || "");
        setQuoteDelivery(row?.myOffer?.estimatedDelivery || "");
        setQuoteDeliveryOption(
          row?.myOffer?.deliveryOption === "paid" || row?.myOffer?.deliveryOption === "not_available"
            ? row.myOffer.deliveryOption
            : "free"
        );
        setQuoteDeliveryCharge(
          row?.myOffer?.deliveryOption === "paid" && row?.myOffer?.deliveryCharge != null
            ? String(row.myOffer.deliveryCharge)
            : ""
        );
        setQuoteSampleImages(
          Array.isArray(row?.myOffer?.sampleImages) ? row.myOffer.sampleImages.filter(Boolean) : []
        );
        const savedPercent = parseQuoteGstPercent(row?.myOffer?.gstPercent);
        setQuoteGstPercent(savedPercent ?? null);
        const savedGstAmount = parseQuoteGstAmount(row?.myOffer?.gstAmount);
        setQuoteGstAmount(savedGstAmount != null ? String(savedGstAmount) : "");
        setQuoteGstAmountEdited(savedGstAmount != null);
        setQuoteSummaryExpanded(false);
        setQuoteDialogOpen(true);
      } catch (err: any) {
        toast({
          title: "Could not open quote request",
          description: err?.message || "Try again",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchManpowerInvites();
    fetchQuoteRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep link from notification: /dashboard/provider/leads?quoteRequestId=...
  useEffect(() => {
    const qid = searchParams?.get("quoteRequestId");
    if (!qid) return;
    void openQuoteDialog(qid).then(() => {
      router.replace("/dashboard/provider/leads", { scroll: false });
    });
  }, [searchParams, openQuoteDialog, router]);

  useEffect(() => {
    if (!quoteDialogOpen || !activeQuote?.windowOpen || !isTimedQuoteWindow(activeQuote)) return;
    const t = setInterval(() => setQuoteSecondsLeft((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [quoteDialogOpen, activeQuote?.windowOpen, activeQuote?.expiresAt, activeQuote]);

  const activeQuoteLines = useMemo(() => quoteRequestItems(activeQuote), [activeQuote]);
  const lineQuoteTotal = useMemo(
    () =>
      activeQuoteLines.reduce((sum, line, idx) => {
        const rate = Number(quoteLineRates[quoteLineKey(line, idx)] || 0);
        const qty = parseQuoteQuantity(line.quantity);
        if (!Number.isFinite(rate) || rate < 0.01) return sum;
        return sum + rate * qty;
      }, 0),
    [activeQuoteLines, quoteLineRates]
  );

  const taxableForGst = activeQuoteLines.length > 0 ? lineQuoteTotal : Number(quoteAmount) || 0;

  useEffect(() => {
    if (quoteGstPercent == null || quoteGstAmountEdited) return;
    const suggested = suggestedQuoteGstAmount(taxableForGst, quoteGstPercent);
    setQuoteGstAmount(suggested > 0 ? String(suggested) : "0");
  }, [quoteGstPercent, taxableForGst, quoteGstAmountEdited]);

  const submitQuoteOffer = async () => {
    if (!activeQuote?.id) return;
    const requestLines = quoteRequestItems(activeQuote);
    const offerItems =
      requestLines.length > 0
        ? requestLines.map((line, idx) => ({
            serviceId: String(line.serviceId || ""),
            unitPrice: Number(quoteLineRates[quoteLineKey(line, idx)] || 0),
            title: String(line.title || "Product"),
            quantity: parseQuoteQuantity(line.quantity),
          }))
        : [];
    const missing = offerItems.filter((line) => !line.serviceId || !Number.isFinite(line.unitPrice) || line.unitPrice < 0.01);
    if (requestLines.length > 0 && missing.length) {
      toast({
        title: "Enter a rate for each product",
        description: missing.map((m) => m.title).join(", "),
        variant: "destructive",
      });
      return;
    }
    const amount =
      offerItems.length > 0
        ? Math.round(offerItems.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100
        : Number(quoteAmount);
    if (!Number.isFinite(amount) || amount < 1) {
      toast({ title: "Enter a valid price (min ₹1)", variant: "destructive" });
      return;
    }
    if (!activeQuote.windowOpen) {
      toast({ title: "Quote window closed", description: "You can no longer submit a price.", variant: "destructive" });
      return;
    }
    if (quoteGstPercent == null) {
      toast({
        title: "Select GST slab",
        description: "Choose 0%, 5%, 12%, 18% or 28%. GST amount fills in automatically.",
        variant: "destructive",
      });
      return;
    }
    const gstAmount = Number(quoteGstAmount);
    if (!Number.isFinite(gstAmount) || gstAmount < 0) {
      toast({ title: "Enter a valid GST amount (₹0 or more)", variant: "destructive" });
      return;
    }
    if (quoteDeliveryOption === "paid") {
      const charge = Number(quoteDeliveryCharge);
      if (!Number.isFinite(charge) || charge < 1) {
        toast({ title: "Enter delivery charge (min ₹1)", variant: "destructive" });
        return;
      }
    }
    setQuoteSubmitting(true);
    try {
      const res = await api.quoteRequests.submitOffer(String(activeQuote.id), {
        amount,
        items:
          offerItems.length > 0
            ? offerItems.map((line) => ({ serviceId: line.serviceId, unitPrice: line.unitPrice }))
            : undefined,
        notes: quoteNotes.trim() || undefined,
        estimatedDelivery: quoteDelivery.trim() || undefined,
        deliveryOption: quoteDeliveryOption,
        deliveryCharge: quoteDeliveryOption === "paid" ? Number(quoteDeliveryCharge) : 0,
        sampleImages: quoteSampleImages,
        gstPercent: quoteGstPercent,
        gstAmount,
      });
      if (!res.success) throw new Error((res as any)?.error?.message || "Failed to submit");
      toast({ title: "Quote sent", description: "Buyer will see your price on Imagineering India." });
      setQuoteDialogOpen(false);
      await fetchQuoteRequests();
    } catch (err: any) {
      toast({
        title: "Submit failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const fetchManpowerInvites = async () => {
    setIsManpowerLoading(true);
    try {
      const response = await api.manpowerCrew.listWorkerInvites({ limit: 50 });
      const invites =
        (response as any)?.data?.invites ??
        (response as any)?.data?.data?.invites ??
        [];

      if (response.success && Array.isArray(invites)) {
        setManpowerInvites(invites);
      } else {
        setManpowerInvites([]);
      }
    } catch (error) {
      console.error("Failed to fetch manpower invites:", error);
      setManpowerInvites([]);
    } finally {
      setIsManpowerLoading(false);
    }
  };

  const respondManpowerInvite = async (inviteId: string, action: "accept" | "decline") => {
    try {
      const response = await api.manpowerCrew.respondInvite(inviteId, action);
      if (response.success) {
        toast({
          title: action === "accept" ? "Accepted" : "Declined",
          description: "Labour Hire invitation updated",
        });
        await fetchManpowerInvites();
      } else {
        throw new Error(response.error?.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Update manpower invite error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update manpower request",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
      {isLocked && (
        <div className="border border-amber-200 bg-amber-50 text-amber-900/90 px-4 py-3 rounded-lg text-sm">
          Your KYC is not approved yet. You can still view requests.
        </div>
      )}
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Requests
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Manage quote requests and labour hire invites in one place
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">Best Quote Requests</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Nearby buyers asking for your price
                </CardDescription>
              </div>
              {!quotesLoading ? (
                <Badge variant="secondary">{quoteRequests.length}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {quotesLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading quote requests…
              </div>
            ) : quoteRequests.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No open quote requests right now</p>
              </div>
            ) : (
              <div className="space-y-3">
                {quoteRequests.map((item: any) => {
                  const title = quoteRequestHeadline(item);
                  const lines = quoteRequestItems(item);
                  const closed = !item?.windowOpen;
                  const timed = isTimedQuoteWindow(item);
                  return (
                    <div
                      key={String(item.id)}
                      className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-semibold text-sm md:text-base">{title}</h3>
                          {item.myOffer ? (
                            <Badge className="bg-emerald-600">Quoted {formatINR(item.myOffer.amount)}</Badge>
                          ) : closed ? (
                            <Badge variant="secondary">Window closed</Badge>
                          ) : (
                            <Badge className="bg-blue-500">Needs quote</Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-col gap-1.5 text-[11px] text-muted-foreground md:text-xs">
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="inline-flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {lines.length > 1 ? `${lines.length} products` : `Qty ${item.quantity}`}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {item.preferredDate} · {item.preferredTime}
                            </span>
                            {!closed && timed ? (
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <Clock className="h-3 w-3" />
                                {formatCountdown(Number(item.secondsRemaining || 0))} left
                              </span>
                            ) : null}
                            {item.distanceKm != null ? (
                              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                                <Navigation className="h-3 w-3" />
                                {Number(item.distanceKm).toFixed(1)} km from your shop
                              </span>
                            ) : null}
                          </div>
                          <span className="inline-flex items-start gap-1">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            <span className="min-w-0 break-words">
                              {item.addressLabel ||
                                [item.address?.address, item.address?.city, item.address?.state, item.address?.zipCode]
                                  .filter(Boolean)
                                  .join(", ") ||
                                "—"}
                            </span>
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={item.myOffer ? "outline" : "default"}
                        onClick={() => void openQuoteDialog(String(item.id), item)}
                      >
                        {item.myOffer ? (closed ? "View" : "Update quote") : closed ? "View" : "Submit quote"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">Labour Hire Requests</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Invites to you (Labour Hire)
                </CardDescription>
              </div>
              {isManpowerLoading ? null : (
                <Badge variant="secondary">{manpowerInvites.length}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {isManpowerLoading ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">Loading invitations...</p>
              </div>
            ) : manpowerInvites.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No labour hire invites found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {manpowerInvites.map((inv: any) => {
                  const crew = inv.crewRequest || {};
                  const city = crew.location?.city || crew.location?.address || "";
                  const start = crew.startDate ? new Date(crew.startDate).toLocaleDateString() : "";
                  return (
                    <div key={inv._id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {crew.title || "Labour requirement"}
                            </h3>
                            <Badge
                              className={
                                inv.status === "pending"
                                  ? "bg-blue-500"
                                  : inv.status === "accepted"
                                    ? "bg-success"
                                    : "bg-destructive"
                              }
                            >
                              {inv.status}
                            </Badge>
                          </div>
                          {crew.description ? (
                            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mt-1">{crew.description}</p>
                          ) : null}
                          <div className="text-[11px] md:text-xs text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                            {crew.headcount != null ? <span>{crew.headcount} workers needed</span> : null}
                            {city ? <span>{city}</span> : null}
                            {start ? <span>{start}</span> : null}
                          </div>
                        </div>
                        {inv.status === "pending" ? (
                          <div className="flex gap-2 flex-col sm:flex-row sm:items-center">
                            <Button size="sm" onClick={() => respondManpowerInvite(inv._id, "accept")}>
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondManpowerInvite(inv._id, "decline")}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground pt-2">No action</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {activeQuote ? quoteRequestHeadline(activeQuote) : "Submit quote"}
              </DialogTitle>
              <DialogDescription>
                {activeQuoteLines.length > 0
                  ? "Enter a rate for each product. Buyer will see item-wise prices."
                  : isTimedQuoteWindow(activeQuote)
                    ? "Share your total price for this buyer request. Window closes after 30 minutes."
                    : "Share your total price for this buyer request."}
              </DialogDescription>
            </DialogHeader>

            {activeQuote ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground space-y-1">
                  {activeQuoteLines.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 text-left font-medium text-foreground"
                        onClick={() => setQuoteSummaryExpanded((open) => !open)}
                        aria-expanded={quoteSummaryExpanded}
                      >
                        <span>
                          {activeQuoteLines.length} products
                          {!quoteSummaryExpanded ? " · tap to view" : ""}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform ${
                            quoteSummaryExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {quoteSummaryExpanded ? (
                        <ul className="space-y-1 text-foreground">
                          {activeQuoteLines.map((line, idx) => (
                            <li key={`${line.title}-${idx}`}>
                              {line.title} · {formatQuoteQtyLabel(parseQuoteQuantity(line.quantity), line.priceType)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p>
                        {activeQuote.preferredDate} · {activeQuote.preferredTime}
                      </p>
                    </>
                  ) : (
                    <p>
                      {formatQuoteQtyLabel(
                        parseQuoteQuantity(activeQuote.quantity),
                        activeQuoteLines[0]?.priceType
                      )}{" "}
                      · {activeQuote.preferredDate} · {activeQuote.preferredTime}
                    </p>
                  )}
                  <p>
                    {activeQuote.addressLabel ||
                      [activeQuote.address?.address, activeQuote.address?.city, activeQuote.address?.state, activeQuote.address?.zipCode]
                        .filter(Boolean)
                        .join(", ")}
                  </p>
                  {activeQuote.distanceKm != null ? (
                    <p className="font-medium text-foreground">
                      {Number(activeQuote.distanceKm).toFixed(1)} km from your shop
                    </p>
                  ) : null}
                  {activeQuote.notes ? <p>Notes: {activeQuote.notes}</p> : null}
                  {isTimedQuoteWindow(activeQuote) ? (
                    <p className="font-mono text-base font-semibold text-foreground">
                      {activeQuote.windowOpen
                        ? `${formatCountdown(quoteSecondsLeft)} left`
                        : "Quote window closed"}
                    </p>
                  ) : !activeQuote.windowOpen ? (
                    <p className="font-semibold text-foreground">Request closed</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {activeQuoteLines.length > 0 ? (
                    <>
                      <Label>Rate per unit (₹)</Label>
                      <div className="space-y-2 rounded-lg border p-3">
                        {activeQuoteLines.map((line, idx) => {
                          const key = quoteLineKey(line, idx);
                          const qty = parseQuoteQuantity(line.quantity);
                          const unit = getQuantityUnitNoun(line.priceType);
                          const rate = Number(quoteLineRates[key] || 0);
                          const lineTotal =
                            Number.isFinite(rate) && rate > 0 ? Math.round(rate * qty * 100) / 100 : 0;
                          return (
                            <div key={key} className="grid grid-cols-[1fr_7.5rem] items-center gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{line.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatQuoteQtyLabel(qty, line.priceType)}
                                  {lineTotal > 0 ? ` · ${formatINR(lineTotal)}` : ""}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <Input
                                  type="number"
                                  min={0.01}
                                  step="0.01"
                                  placeholder={unit ? `₹/${unit}` : "Rate"}
                                  value={quoteLineRates[key] || ""}
                                  onChange={(e) =>
                                    setQuoteLineRates((prev) => ({ ...prev, [key]: e.target.value }))
                                  }
                                  disabled={!activeQuote.windowOpen}
                                  aria-label={`Rate for ${line.title}${unit ? ` per ${unit}` : ""}`}
                                />
                                {unit ? (
                                  <p className="text-center text-[10px] font-medium text-muted-foreground">
                                    per {unit}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                        <p className="border-t pt-2 text-sm font-semibold text-foreground">
                          Materials total {formatINR(lineQuoteTotal)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Label htmlFor="quote-amount">Your price (₹)</Label>
                      <Input
                        id="quote-amount"
                        type="number"
                        min={1}
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        disabled={!activeQuote.windowOpen}
                      />
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>GST slab</Label>
                  <p className="text-xs text-muted-foreground">
                    <i>
                      GST amount fills in from this slab. You can edit the amount if needed. Buyer
                      will see GST and a total that includes it.
                    </i>
                  </p>
                  <Select
                    value={quoteGstPercent == null ? undefined : String(quoteGstPercent)}
                    onValueChange={(v) => {
                      setQuoteGstPercent(Number(v));
                      setQuoteGstAmountEdited(false);
                    }}
                    disabled={!activeQuote.windowOpen}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GST %" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUOTE_GST_SLABS.map((pct) => (
                        <SelectItem key={pct} value={String(pct)}>
                          {pct === 0 ? "0% (Without GST)" : `${pct}%`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label htmlFor="quote-gst-amount">GST amount (₹)</Label>
                  <Input
                    id="quote-gst-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={quoteGstAmount}
                    onChange={(e) => {
                      setQuoteGstAmount(e.target.value);
                      setQuoteGstAmountEdited(true);
                    }}
                    disabled={!activeQuote.windowOpen || quoteGstPercent == null}
                    placeholder={quoteGstPercent == null ? "Select a slab first" : "e.g. 1800"}
                  />
                  {quoteGstPercent != null && taxableForGst > 0 ? (
                    <p className="text-sm font-semibold text-foreground">
                      Materials {formatINR(taxableForGst)}
                      {" + "}
                      GST {formatINR(Number(quoteGstAmount) || 0)}
                      {" = "}
                      {formatINR(taxableForGst + (Number(quoteGstAmount) || 0))}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-notes">Notes (optional)</Label>
                  <Textarea
                    id="quote-notes"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    disabled={!activeQuote.windowOpen}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote-delivery">Estimated delivery timeline (optional)</Label>
                  <Input
                    id="quote-delivery"
                    value={quoteDelivery}
                    onChange={(e) => setQuoteDelivery(e.target.value)}
                    disabled={!activeQuote.windowOpen}
                    placeholder="e.g. 2 days"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Delivery</Label>
                  <Select
                    value={quoteDeliveryOption}
                    onValueChange={(v) =>
                      setQuoteDeliveryOption(v as "free" | "paid" | "not_available")
                    }
                    disabled={!activeQuote.windowOpen}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select delivery option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free delivery</SelectItem>
                      <SelectItem value="paid">Paid delivery</SelectItem>
                      <SelectItem value="not_available">Delivery not available</SelectItem>
                    </SelectContent>
                  </Select>
                  {quoteDeliveryOption === "paid" ? (
                    <div className="space-y-2 pt-1">
                      <Label htmlFor="quote-delivery-charge">Delivery charge (₹)</Label>
                      <Input
                        id="quote-delivery-charge"
                        type="number"
                        min={1}
                        value={quoteDeliveryCharge}
                        onChange={(e) => setQuoteDeliveryCharge(e.target.value)}
                        disabled={!activeQuote.windowOpen}
                        placeholder="e.g. 500"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Sample images (optional)</Label>
                  <p className="text-xs text-muted-foreground">
                    Add up to 5 photos of your product / stock for the buyer.
                  </p>
                  {quoteSampleImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {quoteSampleImages.map((url) => (
                        <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Sample" className="h-full w-full object-cover" />
                          {activeQuote.windowOpen ? (
                            <button
                              type="button"
                              className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white"
                              aria-label="Remove image"
                              onClick={() =>
                                setQuoteSampleImages((prev) => prev.filter((u) => u !== url))
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {activeQuote.windowOpen && quoteSampleImages.length < 5 ? (
                    <div>
                      <input
                        id="quote-sample-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={quoteImageUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          if (quoteSampleImages.length >= 5) return;
                          setQuoteImageUploading(true);
                          try {
                            const res = await api.quoteRequests.uploadSampleImage(file);
                            const url = (res as any)?.data?.url;
                            if (!res.success || !url) {
                              throw new Error((res as any)?.error?.message || "Upload failed");
                            }
                            setQuoteSampleImages((prev) => [...prev, String(url)].slice(0, 5));
                          } catch (err: any) {
                            toast({
                              title: "Image upload failed",
                              description: err?.message || "Please try again",
                              variant: "destructive",
                            });
                          } finally {
                            setQuoteImageUploading(false);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={quoteImageUploading}
                        onClick={() => document.getElementById("quote-sample-upload")?.click()}
                      >
                        {quoteImageUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImagePlus className="h-4 w-4" />
                        )}
                        {quoteImageUploading ? "Uploading…" : "Add sample image"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                Close
              </Button>
              <Button
                type="button"
                onClick={() => void submitQuoteOffer()}
                disabled={quoteSubmitting || !activeQuote?.windowOpen}
              >
                {quoteSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : activeQuote?.myOffer ? (
                  "Update quote"
                ) : (
                  "Submit quote"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
}
