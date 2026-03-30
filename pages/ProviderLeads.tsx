"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Crown, Phone, Mail, MapPin, Calendar, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import api from "@/lib/api-client";
import {
  LeadFilters,
  DirectLeadTable,
  PlatformLeadCard,
  LeadChatDialog,
} from "@/components/leads";

export async function getServerSideProps() { return { props: {} }; }

interface Lead {
  id: string;
  type: 'direct' | 'platform';
  title: string;
  description: string;
  budget?: number;
  location: string;
  status: string;
  date: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAvatar?: string;
  serviceTitle: string;
  priority: 'low' | 'medium' | 'high';
}

export default function ProviderLeads() {
  const { status: kycStatus } = useProviderKycStatus();
  const isLocked = kycStatus !== "KYC_APPROVED";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, [searchQuery, statusFilter]);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const response = await api.leads.getAll({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success && response.data) {
        setLeads(response.data.map((lead: any) => ({
          ...lead,
          date: new Date(lead.date).toISOString().split('T')[0],
        })));
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await api.leads.updateStatus(leadId, newStatus);
      if (response.success) {
        toast({
          title: "Success",
          description: "Request status updated",
        });
        // Refresh leads
        await fetchLeads();
      } else {
        throw new Error(response.error?.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Update status error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
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
              Manage your customer leads and enquiries in one place
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <LeadFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
        />

        <Card>
          <CardHeader className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg">All Requests</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Showing {leads.length} request{leads.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            {isLoading ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-sm md:text-base text-muted-foreground">Loading requests...</p>
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <p className="text-sm md:text-base text-muted-foreground">No requests found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leads.map((lead) => (
                  <div key={lead.id} className="relative">
                    {lead.type === 'direct' ? (
                      <div className="border rounded-lg p-4 bg-warning/5 border-warning/20">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={lead.buyerAvatar} />
                              <AvatarFallback>{lead.buyerName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm md:text-base">{lead.buyerName}</h4>
                                <Badge variant="outline" className="bg-warning/10 text-warning text-[10px] h-5 gap-1">
                                  <Crown className="h-2.5 w-2.5" /> Direct
                                </Badge>
                              </div>
                              <h3 className="font-medium text-sm mb-1">{lead.title}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{lead.description}</p>
                              
                              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] md:text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {lead.buyerPhone}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {lead.buyerEmail}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {lead.location}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> {new Date(lead.date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <Badge className={
                              lead.status === 'new' ? 'bg-blue-500' : 
                              lead.status === 'contacted' ? 'bg-warning' : 'bg-success'
                            }>
                              {lead.status}
                            </Badge>
                            <div className="flex gap-2">
                              <Select value={lead.status} onValueChange={(val) => updateLeadStatus(lead.id, val)}>
                                <SelectTrigger className="h-8 w-28 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="contacted">Contacted</SelectItem>
                                  <SelectItem value="converted">Converted</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8" 
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setChatDialogOpen(true);
                                }}
                                aria-label="Open chat for this lead"
                                title="Open chat for this lead"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <PlatformLeadCard
                        lead={lead as any}
                        onStatusChange={(leadId, newStatus) => updateLeadStatus(leadId, newStatus)}
                        onChatClick={(lead) => {
                          setSelectedLead(lead as any);
                          setChatDialogOpen(true);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Dialog */}
        <LeadChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          leadName={selectedLead?.buyerName || "Buyer"}
          messageText={messageText}
          onMessageChange={setMessageText}
          onSendMessage={() => {
            setMessageText("");
          }}
        />
      </div>
  );
}
