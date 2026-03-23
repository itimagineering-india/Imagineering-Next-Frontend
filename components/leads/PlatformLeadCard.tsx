import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  MapPin,
  MessageSquare,
  Eye,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

interface PlatformLead {
  id: string;
  title: string;
  buyerName: string;
  buyerAvatar?: string;
  description: string;
  budget?: number;
  location?: string;
  date: string;
  status: "new" | "quoted" | "accepted" | "in_progress" | "completed";
  quotationNeeded?: boolean;
  quotationAmount?: number;
  adminTasks?: string[];
}

interface PlatformLeadCardProps {
  lead: PlatformLead;
  onStatusChange: (leadId: string, newStatus: string) => void;
  onChatClick: (lead: PlatformLead) => void;
  onViewDetails?: (lead: PlatformLead) => void;
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
    case "quoted":
      return (
        <Badge className="bg-warning text-warning-foreground">
          <DollarSign className="h-3 w-3 mr-1" />
          Quoted
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-primary text-primary-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Accepted
        </Badge>
      );
    case "in_progress":
      return (
        <Badge className="bg-blue-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function PlatformLeadCard({
  lead,
  onStatusChange,
  onChatClick,
  onViewDetails,
}: PlatformLeadCardProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar>
                    <AvatarImage src={lead.buyerAvatar} />
                    <AvatarFallback>
                      {lead.buyerName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{lead.buyerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {lead.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {lead.description}
                </p>
              </div>
              {getStatusBadge(lead.status)}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {lead.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Budget: <strong>₹{lead.budget.toLocaleString()}</strong>
                  </span>
                </div>
              )}
              {lead.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.location}</span>
                </div>
              )}
            </div>

            {lead.quotationNeeded && (
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Quotation Required</p>
                    {lead.quotationAmount && (
                      <p className="text-sm text-muted-foreground">
                        Your Quote: ₹{lead.quotationAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {!lead.quotationAmount && (
                    <Button size="sm" variant="outline">
                      Add Quotation
                    </Button>
                  )}
                </div>
              </div>
            )}

            {lead.adminTasks && lead.adminTasks.length > 0 && (
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-sm mb-2">Admin Tasks:</p>
                <ul className="space-y-1">
                  {lead.adminTasks.map((task, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Select
              value={lead.status}
              onValueChange={(value) => onStatusChange(lead.id, value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => onChatClick(lead)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Buyer
            </Button>
            {onViewDetails && (
              <Button className="w-full" variant="outline" onClick={() => onViewDetails(lead)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

