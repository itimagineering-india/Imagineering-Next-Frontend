"use client";
import { useState, useEffect, useMemo } from "react";
import DOMPurify from "dompurify";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  MessageSquare,
  FileText,
  BookOpen,
  Plus,
  Search,
  Filter,
  Send,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import api from "@/lib/api-client";
import {
  TicketCard,
  CreateTicketDialog,
  TicketDetailsDialog,
} from "@/components/support";

export async function getServerSideProps() { return { props: {} }; }

interface SupportTicket {
  id?: string;
  _id?: string;
  subject: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in-progress" | "resolved" | "closed";
  description: string;
  createdAt: string;
  updatedAt: string;
  lastReply?: string;
  replies?: TicketReply[];
}

interface TicketReply {
  id: string;
  message: string;
  sender: "provider" | "support";
  senderName: string;
  timestamp: string;
  attachments?: string[];
}

interface ChatMessage {
  id: string;
  text: string;
  sender: "provider" | "support";
  senderName: string;
  timestamp: string;
  isTyping?: boolean;
}

const faqCategories = [
  {
    category: "Account & Profile",
    questions: [
      {
        question: "How do I update my business profile?",
        answer:
          "Go to Settings > Profile & KYC to update your business name, description, contact information, and upload documents. Changes are reviewed within 24-48 hours.",
      },
      {
        question: "How do I verify my business?",
        answer:
          "Upload your business registration documents, GST certificate, and KYC documents in the Profile & KYC section. Our team will review and verify within 2-3 business days.",
      },
      {
        question: "Can I change my business category?",
        answer:
          "Yes, you can update your category in Settings. Note that changing categories may require re-verification of your business documents.",
      },
    ],
  },
  {
    category: "Services & Listings",
    questions: [
      {
        question: "How do I add a new service listing?",
        answer:
          "Navigate to My Services > Add New Service. Fill in the service details, upload images, set pricing, and submit for review. Services are typically approved within 24 hours.",
      },
      {
        question: "Why was my service listing rejected?",
        answer:
          "Listings may be rejected if they violate our policies, contain inappropriate content, or lack required information. Check your email for specific reasons and resubmit after making corrections.",
      },
      {
        question: "How do I make my service featured?",
        answer:
          "Featured services are available for Premium subscribers. Upgrade to Premium to get your services highlighted in search results and category pages.",
      },
      {
        question: "Can I edit a service after it's published?",
        answer:
          "Yes, you can edit your services anytime from My Services. Major changes may require re-approval before going live.",
      },
    ],
  },
  {
    category: "Leads & Bookings",
    questions: [
      {
        question: "What's the difference between Direct Leads and Platform Leads?",
        answer:
          "Direct Leads come from Premium buyers. Platform Leads are assigned by our team and require commission-based payment. Both appear in your Leads & Enquiries section. All contact happens through the in-app chat.",
      },
      {
        question: "How do I respond to a lead?",
        answer:
          "Click on the lead in your Leads & Enquiries page. Use the in-app chat to contact the buyer and submit quotations through the platform.",
      },
      {
        question: "What happens if I don't respond to a lead?",
        answer:
          "Timely responses improve your ranking and buyer trust. If you don't respond within 24 hours, the lead may be reassigned to another provider.",
      },
      {
        question: "How are jobs assigned to me?",
        answer:
          "Jobs are assigned based on your service category, location, ratings, and availability. Premium providers get priority in job assignments.",
      },
    ],
  },
  {
    category: "Payments & Earnings",
    questions: [
      {
        question: "When do I receive payments?",
        answer:
          "Payments are processed after job completion and buyer confirmation. For Platform Leads, commission is deducted before payout. Payouts are processed weekly on Fridays.",
      },
      {
        question: "What commission does the platform charge?",
        answer:
          "Commission rates vary by subscription plan. Free plan: 15%, Premium plan: 10%. Commission is deducted from Platform Lead bookings only.",
      },
      {
        question: "How do I withdraw my earnings?",
        answer:
          "Go to Earnings > Payout History. Once your balance reaches the minimum threshold (₹5,000), you can request a payout. Payments are transferred to your registered bank account within 3-5 business days.",
      },
      {
        question: "Why is my payment on hold?",
        answer:
          "Payments may be held if there's a dispute, incomplete job, or pending verification. Contact support for specific details about your payment status.",
      },
    ],
  },
  {
    category: "Subscription & Premium",
    questions: [
      {
        question: "What are the benefits of Premium subscription?",
        answer:
          "Premium benefits include: priority in search results, featured service listings, lower commission rates (10% vs 15%), analytics dashboard, and priority support.",
      },
      {
        question: "How do I upgrade to Premium?",
        answer:
          "Go to Subscription page and click 'Upgrade to Premium'. Choose your billing cycle (monthly or yearly) and complete payment via Razorpay.",
      },
      {
        question: "Can I cancel my subscription?",
        answer:
          "Yes, you can cancel anytime from the Subscription page. Your Premium benefits will continue until the end of your current billing period.",
      },
      {
        question: "What happens if my subscription expires?",
        answer:
          "You'll revert to the Free plan. Your services remain active, but you'll lose Premium benefits like featured listings.",
      },
    ],
  },
  {
    category: "Platform Policies",
    questions: [
      {
        question: "What is the refund policy?",
        answer:
          "Refunds are handled on a case-by-case basis. If a job is cancelled before completion due to platform or buyer issues, you may be eligible for compensation. Contact support for refund requests.",
      },
      {
        question: "What happens if a buyer cancels a booking?",
        answer:
          "If cancelled before work begins, no charges apply. If cancelled after work starts, you'll be compensated for completed work based on our cancellation policy.",
      },
      {
        question: "What are the platform's terms of service?",
        answer:
          "Our Terms of Service outline acceptable use, payment terms, dispute resolution, and platform rules. You can view the full terms at /terms.",
      },
      {
        question: "How do I report inappropriate behavior?",
        answer:
          "Report any violations through the support ticket system or contact our Trust & Safety team directly. We take all reports seriously and investigate promptly.",
      },
    ],
  },
];

const platformPolicies = [
  {
    title: "Service Provider Agreement",
    description:
      "Terms and conditions for service providers using our platform",
    content: `
      <h3>1. Provider Responsibilities</h3>
      <p>As a service provider, you agree to:</p>
      <ul>
        <li>Provide accurate service descriptions and pricing</li>
        <li>Respond to leads and enquiries within 24 hours</li>
        <li>Complete assigned jobs as per agreed terms</li>
        <li>Maintain professional conduct with buyers</li>
        <li>Upload required business documents for verification</li>
      </ul>

      <h3>2. Service Standards</h3>
      <p>All services must:</p>
      <ul>
        <li>Meet quality standards as described</li>
        <li>Be delivered within agreed timelines</li>
        <li>Comply with local laws and regulations</li>
        <li>Not violate any third-party rights</li>
      </ul>

      <h3>3. Payment Terms</h3>
      <p>Payment processing:</p>
      <ul>
        <li>Payments are processed after job completion</li>
        <li>Commission is deducted from Platform Lead bookings</li>
        <li>Payouts are processed weekly (Fridays)</li>
        <li>Minimum payout threshold: ₹5,000</li>
      </ul>
    `,
  },
  {
    title: "Commission & Fees Policy",
    description: "Understanding platform fees and commission structure",
    content: `
      <h3>Commission Rates</h3>
      <ul>
        <li><strong>Free Plan:</strong> 15% commission on Platform Lead bookings</li>
        <li><strong>Premium Plan:</strong> 10% commission on Platform Lead bookings</li>
        <li><strong>Direct Leads:</strong> No commission (Premium feature)</li>
      </ul>

      <h3>Fee Structure</h3>
      <ul>
        <li>No setup fees</li>
        <li>No monthly fees for Free plan</li>
        <li>Premium subscription: ₹999/month or ₹9,999/year</li>
        <li>Commission only charged on successful bookings</li>
      </ul>

      <h3>Payment Processing</h3>
      <ul>
        <li>Payments held in escrow until job completion</li>
        <li>Commission deducted before payout</li>
        <li>Processing time: 3-5 business days</li>
      </ul>
    `,
  },
  {
    title: "Quality & Review Policy",
    description: "How reviews and ratings work on the platform",
    content: `
      <h3>Review Guidelines</h3>
      <ul>
        <li>Buyers can leave reviews after job completion</li>
        <li>Reviews must be honest and based on actual experience</li>
        <li>Providers can respond to reviews</li>
        <li>Fake or misleading reviews are prohibited</li>
      </ul>

      <h3>Rating System</h3>
      <ul>
        <li>5-star rating system (1-5 stars)</li>
        <li>Overall rating calculated from all reviews</li>
        <li>Ratings affect search ranking and visibility</li>
        <li>Minimum 3.5 stars required for Premium eligibility</li>
      </ul>

      <h3>Dispute Resolution</h3>
      <ul>
        <li>Disputes handled by platform support team</li>
        <li>Both parties can provide evidence</li>
        <li>Resolution within 5-7 business days</li>
        <li>Fair and impartial review process</li>
      </ul>
    `,
  },
  {
    title: "Code of Conduct",
    description: "Expected behavior and professional standards",
    content: `
      <h3>Professional Conduct</h3>
      <ul>
        <li>Maintain professional communication at all times</li>
        <li>Respect buyer privacy and confidentiality</li>
        <li>Provide accurate information about services</li>
        <li>Honor commitments and agreements</li>
      </ul>

      <h3>Prohibited Activities</h3>
      <ul>
        <li>Sharing contact information to bypass platform chat</li>
        <li>Requesting payments outside the platform</li>
        <li>Misrepresenting services or qualifications</li>
        <li>Harassment or inappropriate behavior</li>
        <li>Spam or unsolicited communications</li>
      </ul>

      <h3>Consequences</h3>
      <ul>
        <li>Violations may result in warnings, suspension, or account termination</li>
        <li>Serious violations reported to authorities if necessary</li>
        <li>Appeal process available for disputed actions</li>
      </ul>
    `,
  },
];

interface RelatedTicket {
  _id: string;
  ticketId: string;
  createdBy?: { name?: string; email?: string };
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  replies?: { message: string; sender: string; senderName?: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
  lastReplyAt?: string;
}

export default function ProviderSupport() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [relatedTickets, setRelatedTickets] = useState<RelatedTicket[]>([]);
  const [relatedTicketsLoading, setRelatedTicketsLoading] = useState(false);
  const [selectedRelatedTicket, setSelectedRelatedTicket] = useState<RelatedTicket | null>(null);
  const [relatedReplyText, setRelatedReplyText] = useState("");
  const [relatedReplyLoading, setRelatedReplyLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { toast } = useToast();

  const normalizeTicket = (t: any): SupportTicket => ({
    ...t,
    id: t.id || t._id,
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (chatOpen) {
      // Initialize chat with welcome message
      setChatMessages([
        {
          id: "1",
          text: "Hello! I'm here to help. How can I assist you today?",
          sender: "support",
          senderName: "Support Agent",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [chatOpen]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await api.support.getTickets();
      if (res.success && res.data) {
        const items = ((res.data as any).tickets || []).map(normalizeTicket);
        setTickets(items);
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load support tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData: {
    subject: string;
    category: string;
    description: string;
  }) => {
    try {
      const res = await api.support.createTicket({
        subject: ticketData.subject,
        category: ticketData.category,
        priority: "medium",
        description: ticketData.description,
      });
      
      if (res.success && res.data) {
        const ticket = normalizeTicket((res.data as any).ticket);
        setTickets([ticket, ...tickets]);
        toast({
          title: "Success",
          description: "Support ticket created successfully",
        });
      } else {
        throw new Error("Failed to create ticket");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput.trim(),
      sender: "provider",
      senderName: "You",
      timestamp: new Date().toISOString(),
    };

    setChatMessages([...chatMessages, userMessage]);
    setChatInput("");

    // Simulate support response
    setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message. Our support team will respond shortly. In the meantime, you can also create a support ticket for detailed assistance.",
        sender: "support",
        senderName: "Support Agent",
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, supportMessage]);
    }, 1500);
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    // Fetch full ticket details with replies
    try {
      const res = await api.support.getTicketById(ticket.id || ticket._id || '');
      if (res.success && res.data) {
        const fullTicket = normalizeTicket((res.data as any).ticket);
        setSelectedTicket(fullTicket);
        // Update ticket in list
        const updatedTickets = tickets.map((t) => 
          ((t.id || t._id) === fullTicket.id) ? fullTicket : t
        );
        setTickets(updatedTickets);
      }
    } catch (error) {
      console.error("Failed to fetch ticket details:", error);
    }
  };

  const handleAddReply = async (message: string) => {
    if (!selectedTicket) return;
    
    try {
      const res = await api.support.addReply(selectedTicket.id || selectedTicket._id || '', message);
      if (res.success && res.data) {
        const ticket = normalizeTicket((res.data as any).ticket);
        const updatedTickets = tickets.map((t) => ((t.id || t._id) === ticket.id ? ticket : t));
        setTickets(updatedTickets);
        setSelectedTicket(ticket);
        toast({ title: "Reply sent" });
      } else {
        throw new Error("Failed to send reply");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleStatusChange = (ticketId: string, status: SupportTicket["status"]) => {
    api.support
      .updateStatus(ticketId, status)
      .then((res) => {
        if (res.success && res.data) {
          const ticket = normalizeTicket((res.data as any).ticket);
          const updatedTickets = tickets.map((t) => ((t.id || t._id) === ticket.id ? ticket : t));
          setTickets(updatedTickets);
          if ((selectedTicket?.id || selectedTicket?._id) === ticket.id) setSelectedTicket(ticket);
          toast({ title: "Status updated" });
        } else {
          throw new Error("Failed to update status");
        }
      })
      .catch((error) => {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      });
  };

  const relatedTicketsCount = relatedTickets.filter((t) => !["Closed", "Resolved"].includes(t.status)).length;

  const fetchRelatedTickets = async () => {
    setRelatedTicketsLoading(true);
    try {
      const res = await api.tickets.provider.getRelated();
      const data = res.data as { tickets?: RelatedTicket[] } | undefined;
      if (res.success && data?.tickets) {
        setRelatedTickets(data.tickets);
      } else {
        setRelatedTickets([]);
      }
    } catch {
      setRelatedTickets([]);
      toast({ variant: "destructive", title: "Error", description: "Failed to load related tickets" });
    } finally {
      setRelatedTicketsLoading(false);
    }
  };

  const handleViewRelatedTicket = async (ticket: RelatedTicket) => {
    setSelectedRelatedTicket(ticket);
    setRelatedReplyText("");
    try {
      const res = await api.tickets.getById(ticket._id);
      const data = res.data as { ticket?: RelatedTicket } | undefined;
      if (res.success && data?.ticket) {
        setSelectedRelatedTicket(data.ticket);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load ticket" });
    }
  };

  const handleRelatedReply = async () => {
    if (!selectedRelatedTicket || !relatedReplyText.trim()) return;
    setRelatedReplyLoading(true);
    try {
      const res = await api.tickets.provider.addReply(selectedRelatedTicket._id, relatedReplyText.trim());
      const data = res.data as { ticket?: RelatedTicket } | undefined;
      if (res.success && data?.ticket) {
        setSelectedRelatedTicket(data.ticket);
        setRelatedTickets((prev) => prev.map((t) => (t._id === selectedRelatedTicket._id ? data.ticket! : t)));
        setRelatedReplyText("");
        toast({ title: "Success", description: "Reply sent" });
      } else {
        throw new Error(res.error?.message || "Failed");
      }
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Error", description: (e as Error)?.message || "Failed to send reply" });
    } finally {
      setRelatedReplyLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Support & Help Center
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Get help, raise tickets, and access resources
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setChatOpen(true)} size="sm" className="text-xs md:text-sm w-full sm:w-auto">
              <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              <span className="hidden sm:inline">Live Chat</span>
              <span className="sm:hidden">Chat</span>
            </Button>
            <Button onClick={() => setCreateTicketOpen(true)} size="sm" className="text-xs md:text-sm w-full sm:w-auto">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === "related") fetchRelatedTickets(); }} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1">
            <TabsTrigger value="tickets" className="text-xs md:text-sm">
              <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">My Tickets</span>
              <span className="sm:hidden">Tickets</span>
            </TabsTrigger>
            <TabsTrigger value="related" className="text-xs md:text-sm">
              <MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Related</span>
              {relatedTicketsCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1">{relatedTicketsCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs md:text-sm">
              <HelpCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="policies" className="text-xs md:text-sm">
              <BookOpen className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Policies
            </TabsTrigger>
            <TabsTrigger value="resources" className="text-xs md:text-sm">
              <FileText className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Resources
            </TabsTrigger>
          </TabsList>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 md:pl-10 text-xs md:text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-auto md:w-48 text-xs md:text-sm">
                      <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
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

            {/* Tickets List */}
            <div className="space-y-3 md:space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                    <p className="text-center text-sm md:text-base text-muted-foreground">Loading tickets...</p>
                  </CardContent>
                </Card>
              ) : filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                    <div className="text-center py-8 md:py-12">
                      <FileText className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                      <p className="text-sm md:text-base text-muted-foreground">No tickets found</p>
                      <Button
                        className="mt-3 md:mt-4 text-xs md:text-sm"
                        size="sm"
                        onClick={() => setCreateTicketOpen(true)}
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                        Create Your First Ticket
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id || ticket._id}
                    ticket={ticket}
                    onView={(t) => handleViewTicket(t as SupportTicket)}
                  />
                ))
              )}
            </div>

            {/* Create Ticket Dialog */}
            <CreateTicketDialog
              open={createTicketOpen}
              onOpenChange={setCreateTicketOpen}
              onSubmit={handleCreateTicket}
            />

            {/* Ticket Details Dialog */}
            <TicketDetailsDialog
              ticket={selectedTicket}
              open={!!selectedTicket}
              onOpenChange={(open) => !open && setSelectedTicket(null)}
              onReply={handleAddReply}
            />
          </TabsContent>

          {/* Related Tickets Tab - buyer tickets linked to provider's orders */}
          <TabsContent value="related" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Related Tickets</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Buyer tickets linked to your orders. You can view and reply.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {relatedTicketsLoading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : relatedTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No related tickets</p>
                    <p className="text-xs text-muted-foreground mt-1">Tickets from buyers about your orders will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {relatedTickets.map((t) => (
                      <Card key={t._id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewRelatedTicket(t)}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="font-mono text-xs">{t.ticketId}</Badge>
                                <Badge variant={["Closed","Resolved"].includes(t.status) ? "secondary" : "default"}>{t.status}</Badge>
                                <Badge variant="outline">{t.category}</Badge>
                              </div>
                              <h4 className="font-medium mt-2 line-clamp-1">{t.subject}</h4>
                              <p className="text-xs text-muted-foreground mt-1">By {t.createdBy?.name || "Buyer"} • {new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Related Ticket Detail Dialog */}
            <Dialog open={!!selectedRelatedTicket} onOpenChange={(open) => !open && setSelectedRelatedTicket(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedRelatedTicket?.ticketId}</DialogTitle>
                  <DialogDescription>{selectedRelatedTicket?.subject}</DialogDescription>
                </DialogHeader>
                {selectedRelatedTicket && (
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{selectedRelatedTicket.category}</Badge>
                      <Badge variant="secondary">{selectedRelatedTicket.priority}</Badge>
                      <Badge>{selectedRelatedTicket.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedRelatedTicket.description}</p>
                    <div className="border-t pt-4 space-y-3 max-h-[240px] overflow-y-auto">
                      <h4 className="font-medium">Conversation</h4>
                      {selectedRelatedTicket.replies?.map((r, i) => (
                        <div key={i} className={`p-3 rounded-lg ${r.sender === "provider" ? "bg-primary/10 ml-6" : "bg-muted"}`}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium">{r.senderName || r.sender}</span>
                            <span className="text-muted-foreground">{new Date(r.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-sm">{r.message}</p>
                        </div>
                      ))}
                    </div>
                    {!["Closed","Resolved"].includes(selectedRelatedTicket.status) && (
                      <div className="border-t pt-4 space-y-2">
                        <Textarea placeholder="Type your reply..." value={relatedReplyText} onChange={(e) => setRelatedReplyText(e.target.value)} rows={2} />
                        <Button onClick={handleRelatedReply} disabled={!relatedReplyText.trim() || relatedReplyLoading} size="sm">
                          {relatedReplyLoading ? "Sending..." : "Send Reply"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faq" className="space-y-4 md:space-y-6">
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-lg">Frequently Asked Questions</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Find answers to common questions about using the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <Accordion type="single" collapsible className="space-y-3 md:space-y-4">
                  {faqCategories.map((category, catIndex) => (
                    <div key={catIndex} className="space-y-3 md:space-y-4">
                      <h3 className="text-base md:text-lg font-semibold text-foreground">
                        {category.category}
                      </h3>
                      {category.questions.map((faq, faqIndex) => (
                        <AccordionItem
                          key={faqIndex}
                          value={`faq-${catIndex}-${faqIndex}`}
                          className="bg-card border rounded-lg px-3 md:px-6"
                        >
                          <AccordionTrigger className="text-left hover:no-underline text-xs md:text-sm">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-xs md:text-sm text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                      {catIndex < faqCategories.length - 1 && (
                        <Separator className="my-4 md:my-6" />
                      )}
                    </div>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-3 md:space-y-4">
            {platformPolicies.map((policy, index) => (
              <Card key={index}>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">{policy.title}</CardTitle>
                  <CardDescription className="text-xs md:text-sm">{policy.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div
                    className="prose prose-sm max-w-none text-xs md:text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(policy.content || "") }}
                  />
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Getting Started Guide</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Learn how to set up your provider account
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Button variant="outline" className="w-full text-xs md:text-sm" size="sm">
                    View Guide
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Best Practices</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Tips to maximize your success on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Button variant="outline" className="w-full text-xs md:text-sm" size="sm">
                    View Tips
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Video Tutorials</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Watch step-by-step video guides
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Button variant="outline" className="w-full text-xs md:text-sm" size="sm">
                    Watch Videos
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="text-base md:text-lg">Community Forum</CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Connect with other providers
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <Button variant="outline" className="w-full text-xs md:text-sm" size="sm">
                    Join Forum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>


        {/* Live Chat Dialog */}
        <Dialog open={chatOpen} onOpenChange={setChatOpen}>
          <DialogContent className="max-w-2xl h-[85vh] md:h-[600px] flex flex-col p-4 md:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">Live Chat Support</DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                Chat with our support team in real-time
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-2 md:pr-4">
              <div className="space-y-3 md:space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 md:gap-3 ${
                      message.sender === "provider" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender === "support" && (
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs md:text-sm font-semibold shrink-0">
                        <User className="h-3 w-3 md:h-4 md:w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] md:max-w-[70%] rounded-lg p-2.5 md:p-3 ${
                        message.sender === "provider"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-xs md:text-sm font-medium mb-1">{message.senderName}</p>
                      <p className="text-xs md:text-sm">{message.text}</p>
                      <p className="text-[10px] md:text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.sender === "provider" && (
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs md:text-sm font-semibold shrink-0">
                        <User className="h-3 w-3 md:h-4 md:w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-3 md:pt-4 border-t">
              <Input
                placeholder="Type your message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendChatMessage()}
                className="text-xs md:text-sm"
              />
              <Button onClick={handleSendChatMessage} size="sm" className="text-xs md:text-sm">
                <Send className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}













