"use client";
import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import {
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Tag,
  Calendar,
  User,
  Send,
} from "lucide-react";

export async function getServerSideProps() { return { props: {} }; }

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  description: string;
  createdAt: string;
  updatedAt: string;
  lastReply?: string;
  replies?: TicketReply[];
  provider?: { name?: string; email?: string };
}

interface TicketReply {
  id: string;
  message: string;
  sender: "provider" | "support";
  senderName: string;
  timestamp: string;
}

export default function AdminSupport() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState("tickets");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.support.admin.getAll();
      if (res.success && res.data) {
        setTickets((res.data as any).tickets || []);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
      toast({ title: "Error", description: "Failed to load tickets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (ticketId: string, status: SupportTicket["status"]) => {
    api.support.admin
      .updateStatus(ticketId, status)
      .then((res) => {
        if (res.success && res.data) {
          const ticket = (res.data as any).ticket as SupportTicket;
          setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)));
          if (selectedTicket?.id === ticket.id) setSelectedTicket(ticket);
          toast({ title: "Status updated" });
        } else {
          throw new Error("Failed to update status");
        }
      })
      .catch((error) => {
        console.error(error);
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
      });
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.provider?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      open: { variant: "default", icon: AlertCircle },
      "in-progress": { variant: "default", icon: Clock },
      resolved: { variant: "default", icon: CheckCircle2 },
      closed: { variant: "secondary", icon: XCircle },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    );
  };

  return (
    <DashboardLayout type="admin">
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground mt-1">View and manage provider support tickets</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by subject, description, or provider email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">Loading tickets...</p>
                  </CardContent>
                </Card>
              ) : filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No tickets found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{ticket.subject}</h3>
                                {getStatusBadge(ticket.status)}
                                <Badge>{ticket.priority.toUpperCase()}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{ticket.description}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {ticket.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(ticket.createdAt).toLocaleDateString()}
                                </span>
                                {ticket.provider && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {ticket.provider.name || ticket.provider.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Select
                            value={ticket.status}
                            onValueChange={(value) =>
                              handleStatusChange(ticket.id, value as SupportTicket["status"])
                            }
                          >
                            <SelectTrigger className="w-32 h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTicket(ticket)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Ticket Details Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Ticket Details</DialogTitle>
              <DialogDescription>View and manage this ticket</DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="outline">{selectedTicket.id}</Badge>
                    {getStatusBadge(selectedTicket.status)}
                    <Badge>{selectedTicket.priority.toUpperCase()}</Badge>
                  </div>
                  <h3 className="text-lg font-semibold">{selectedTicket.subject}</h3>
                  <p className="text-muted-foreground text-sm">{selectedTicket.description}</p>
                  <div className="text-xs text-muted-foreground flex gap-4 flex-wrap">
                    <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                    <span>Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}</span>
                    <span>Category: {selectedTicket.category}</span>
                    {selectedTicket.provider && (
                      <span>Provider: {selectedTicket.provider.name || selectedTicket.provider.email}</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {(selectedTicket.replies || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">No replies yet.</p>
                  )}
                  {(selectedTicket.replies || []).map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg border ${reply.sender === "support" ? "bg-muted" : "bg-primary/5"}`}
                    >
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{reply.senderName}</span>
                          <Badge variant="secondary" className="capitalize">
                            {reply.sender}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{reply.message}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) =>
                      handleStatusChange(selectedTicket.id, value as SupportTicket["status"])
                    }
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <label className="text-sm font-medium">Add Reply (admin)</label>
                  <Textarea
                    placeholder="Type your message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-end">
                    <Button
                      onClick={() => {
                        if (!replyText.trim()) return;
                        // Admin reply not implemented in backend; show info
                        toast({
                          title: "Not implemented",
                          description: "Admin reply endpoint not yet implemented.",
                        });
                      }}
                      disabled={!replyText.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}



