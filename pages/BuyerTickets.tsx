"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Plus,
  MessageSquare,
  Calendar,
  Tag,
  Send,
  User,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { sanitizeString } from "@/utils/validation";

export async function getServerSideProps() { return { props: {} }; }

const TICKET_CATEGORIES = [
  "Payment Issue",
  "Service Complaint",
  "Refund",
  "Account Problem",
  "Technical Issue",
  "Other",
];
const TICKET_PRIORITIES = ["Low", "Medium", "High"] as const;

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof AlertCircle }> = {
  Open: { label: "Open", variant: "default", icon: AlertCircle },
  "In Progress": { label: "In Progress", variant: "default", icon: Clock },
  "Waiting for User": { label: "Waiting", variant: "secondary", icon: Clock },
  Resolved: { label: "Resolved", variant: "outline", icon: CheckCircle2 },
  Closed: { label: "Closed", variant: "secondary", icon: XCircle },
  Escalated: { label: "Escalated", variant: "destructive", icon: ArrowUpCircle },
};

interface TicketReply {
  _id?: string;
  message: string;
  sender: "buyer" | "provider" | "admin";
  senderId: string;
  senderName?: string;
  timestamp: string;
  isInternal?: boolean;
}

interface Ticket {
  _id: string;
  ticketId: string;
  orderId?: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  createdBy?: { name?: string; email?: string };
  assignedTo?: { name?: string; email?: string };
  replies?: TicketReply[];
  metadata?: { orderAmount?: number; paymentId?: string; providerId?: string };
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: "outline" as const, icon: AlertCircle };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function BuyerTickets() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);

  // Raise ticket form
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "Other",
    priority: "Medium" as const,
  });

  // Next.js: state passed via URL query params (from BuyerBookings openSupportPage)
  const prefillOrderId = searchParams?.get("orderId") || undefined;
  const prefillSubject = searchParams?.get("subject") || undefined;

  // Prefill form when navigating from booking with subject
  useEffect(() => {
    if (prefillSubject && !raiseOpen) {
      setForm((f) => ({ ...f, subject: prefillSubject }));
      setRaiseOpen(true);
    }
  }, [prefillSubject]);

  const fetchTickets = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.tickets.getMy({ page, limit: 20 });
      const data = res.data as { tickets?: Ticket[] } | undefined;
      if (res.success && data?.tickets) {
        setTickets(data.tickets);
        setPagination((res as { pagination?: { page: number; limit: number; total: number; pages: number } }).pagination || null);
      } else {
        setTickets([]);
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to load tickets" });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleRaiseTicket = async () => {
    const subject = sanitizeString(form.subject);
    const description = sanitizeString(form.description);
    if (!subject.trim() || !description.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Subject and description are required" });
      return;
    }
    setLoading(true);
    try {
      const payload: Parameters<typeof api.tickets.create>[0] = {
        subject: subject.trim(),
        description: description.trim(),
        category: form.category,
        priority: form.priority,
      };
      if (prefillOrderId) payload.orderId = prefillOrderId;

      const res = await api.tickets.create(payload);
      const createData = res.data as { ticket?: Ticket } | undefined;
      if (res.success && createData?.ticket) {
        setTickets((prev) => [createData.ticket!, ...prev]);
        setRaiseOpen(false);
        setForm({ subject: "", description: "", category: "Other", priority: "Medium" });
        toast({ title: "Ticket created", description: `Ticket ${createData.ticket?.ticketId ?? ""} has been raised.` });
      } else {
        throw new Error(res.error?.message || "Failed to create ticket");
      }
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (e as Error)?.message || "Failed to create ticket",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await api.tickets.getById(ticket._id);
      const detailData = res.data as { ticket?: Ticket } | undefined;
      if (res.success && detailData?.ticket) {
        setSelectedTicket(detailData.ticket);
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to load ticket details" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReply = async (message: string) => {
    if (!selectedTicket) return;
    const sanitized = sanitizeString(message);
    if (!sanitized.trim()) return;
    setReplyLoading(true);
    try {
      const res = await api.tickets.addReply(selectedTicket._id, sanitized.trim());
      const replyData = res.data as { ticket?: Ticket } | undefined;
      if (res.success && replyData?.ticket) {
        setSelectedTicket(replyData.ticket);
        setTickets((prev) =>
          prev.map((t) => (t._id === selectedTicket._id ? replyData.ticket! : t))
        );
      } else {
        throw new Error(res.error?.message || "Failed to send reply");
      }
    } catch (e: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (e as Error)?.message || "Failed to send reply",
      });
    } finally {
      setReplyLoading(false);
    }
  };

  const canReply = selectedTicket && !["Closed", "Resolved"].includes(selectedTicket.status);

  return (
    <DashboardLayout type="buyer">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Support Tickets</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track and manage your support requests
            </p>
          </div>
          <Button onClick={() => setRaiseOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Raise Ticket
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No tickets yet</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                Raise a ticket if you need help with payments, refunds, or any issue.
              </p>
              <Button onClick={() => setRaiseOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Raise your first ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Card
                key={ticket._id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewTicket(ticket)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {ticket.ticketId}
                        </Badge>
                        <StatusBadge status={ticket.status} />
                        <Badge variant="outline" className="gap-1">
                          <Tag className="h-3 w-3" />
                          {ticket.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg line-clamp-2">{ticket.subject}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                        {ticket.lastReplyAt && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Last reply: {new Date(ticket.lastReplyAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="View ticket">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Raise Ticket Dialog */}
        <Dialog open={raiseOpen} onOpenChange={setRaiseOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Raise Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue. Our support team will respond shortly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger id="category" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your issue"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v as typeof form.priority }))}
                >
                  <SelectTrigger id="priority" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleRaiseTicket} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Ticket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Ticket Detail Dialog */}
        <TicketDetailDialog
          ticket={selectedTicket}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          loading={detailLoading}
          replyLoading={replyLoading}
          canReply={canReply ?? false}
          onReply={handleReply}
        />
      </div>
    </DashboardLayout>
  );
}

interface TicketDetailDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  replyLoading: boolean;
  canReply: boolean;
  onReply: (message: string) => Promise<void>;
}

function TicketDetailDialog({
  ticket,
  open,
  onOpenChange,
  loading,
  replyLoading,
  canReply,
  onReply,
}: TicketDetailDialogProps) {
  const [replyText, setReplyText] = useState("");

  const handleSend = async () => {
    if (!replyText.trim()) return;
    await onReply(replyText);
    setReplyText("");
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm">{ticket.ticketId}</span>
            <StatusBadge status={ticket.status} />
          </DialogTitle>
          <DialogDescription>{ticket.subject}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{ticket.category}</Badge>
              <Badge variant="outline">Priority: {ticket.priority}</Badge>
            </div>

            <ScrollArea className="flex-1 min-h-[200px] max-h-[320px] pr-4">
              <div className="space-y-3">
                {/* Initial message */}
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {ticket.createdBy?.name || "You"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">{ticket.description}</div>
                  </div>
                </div>

                {ticket.replies?.map((r) => {
                  if (r.isInternal) return null;
                  return (
                    <div key={r._id || r.timestamp} className="flex gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback>
                          {r.sender === "admin" ? "SA" : r.sender === "provider" ? "P" : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {r.senderName || r.sender}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(r.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-sm">{r.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {canReply && (
              <div className="space-y-2 border-t pt-4">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) handleSend();
                  }}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">Ctrl+Enter to send</p>
                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!replyText.trim() || replyLoading}
                  >
                    {replyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
