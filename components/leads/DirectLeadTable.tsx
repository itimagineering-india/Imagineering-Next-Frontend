import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  Crown,
} from "lucide-react";

interface DirectLead {
  id: string;
  buyerName: string;
  buyerAvatar?: string;
  buyerEmail: string;
  buyerPhone: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: "new" | "contacted" | "converted";
  isPremium?: boolean;
}

interface DirectLeadTableProps {
  leads: DirectLead[];
  isLoading: boolean;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onChatClick: (lead: DirectLead) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "new":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          New
        </Badge>
      );
    case "contacted":
      return (
        <Badge className="bg-blue-500 text-white">
          <MessageSquare className="h-3 w-3 mr-1" />
          Contacted
        </Badge>
      );
    case "converted":
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Converted
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function DirectLeadTable({
  leads,
  isLoading,
  onStatusChange,
  onChatClick,
}: DirectLeadTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Direct Leads (Premium Benefit)</CardTitle>
            <CardDescription>
              Leads from Premium buyers who contacted you directly
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Crown className="h-3 w-3 text-warning" />
            Premium Feature
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No direct leads found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Service Required</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={lead.buyerAvatar} />
                        <AvatarFallback>
                          {lead.buyerName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{lead.buyerName}</p>
                          {lead.isPremium && (
                            <Crown className="h-3 w-3 text-warning" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {lead.buyerEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{lead.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {lead.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{lead.buyerPhone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs">{lead.buyerEmail}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span>{lead.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{new Date(lead.date).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(lead.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={lead.status}
                        onValueChange={(value) => onStatusChange(lead.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChatClick(lead)}
                        aria-label="Chat with lead"
                        title="Chat with lead"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

