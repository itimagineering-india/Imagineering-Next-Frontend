import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  Tag,
} from "lucide-react";

interface Ticket {
  id?: string;
  _id?: string;
  subject: string;
  category: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  createdAt: string;
  updatedAt: string;
  lastReply?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  onView: (ticket: Ticket) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "open":
      return (
        <Badge variant="default">
          <AlertCircle className="h-3 w-3 mr-1" />
          Open
        </Badge>
      );
    case "in-progress":
      return (
        <Badge className="bg-blue-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          In Progress
        </Badge>
      );
    case "resolved":
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Resolved
        </Badge>
      );
    case "closed":
      return (
        <Badge variant="secondary">
          <XCircle className="h-3 w-3 mr-1" />
          Closed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const getPriorityBadge = (priority?: string) => {
  if (!priority) return null;
  
  switch (priority) {
    case "urgent":
      return <Badge variant="destructive">Urgent</Badge>;
    case "high":
      return <Badge className="bg-orange-500 text-white">High</Badge>;
    case "medium":
      return <Badge variant="secondary">Medium</Badge>;
    case "low":
      return <Badge variant="outline">Low</Badge>;
    default:
      return null;
  }
};

export function TicketCard({ ticket, onView }: TicketCardProps) {
  const ticketId = ticket.id || ticket._id || 'N/A';
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView(ticket)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono text-xs">
                #{ticketId.slice(-8)}
              </Badge>
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {ticket.category}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-lg line-clamp-2">{ticket.subject}</h3>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              {ticket.lastReply && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>Last reply: {new Date(ticket.lastReply).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            aria-label="View ticket messages"
            title="View ticket messages"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

