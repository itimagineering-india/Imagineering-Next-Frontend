"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  User,
  Calendar,
  Tag,
} from "lucide-react";
import { sanitizeString } from "@/utils/validation";

interface TicketReply {
  id: string;
  message: string;
  sender: string;
  senderName: string;
  timestamp: string;
}

interface Ticket {
  id?: string;
  _id?: string;
  subject: string;
  category: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "urgent";
  description: string;
  createdAt: string;
  updatedAt: string;
  replies?: TicketReply[];
}

interface TicketDetailsDialogProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (message: string) => Promise<void>;
  isLoading?: boolean;
  canChangeStatus?: boolean;
  onStatusChange?: (status: Ticket["status"]) => void;
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

export function TicketDetailsDialog({
  ticket,
  open,
  onOpenChange,
  onReply,
  isLoading = false,
  canChangeStatus = false,
  onStatusChange,
}: TicketDetailsDialogProps) {
  const [replyText, setReplyText] = useState("");

  if (!ticket) return null;

  const ticketId = ticket.id || ticket._id || 'N/A';

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    const sanitizedMessage = sanitizeString(replyText);
    await onReply(sanitizedMessage);
    setReplyText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Ticket Details</DialogTitle>
          <DialogDescription>
            View conversation and reply to support
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2 items-center">
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
            <h3 className="text-lg font-semibold">{ticket.subject}</h3>
            <p className="text-muted-foreground text-sm">{ticket.description}</p>
            <div className="text-xs text-muted-foreground flex gap-4 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created: {new Date(ticket.createdAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated: {new Date(ticket.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>

          <Separator />

          <ScrollArea className="h-72 pr-4">
            <div className="space-y-3">
              {/* Initial message */}
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">You</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    {ticket.description}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {ticket.replies && ticket.replies.length > 0 && (
                <>
                  {ticket.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {reply.sender === "provider" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            "SA"
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{reply.senderName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(reply.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-sm">
                          {reply.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </ScrollArea>

          <Separator />

          {/* Reply section */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleReply();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to send
              </p>
              <Button onClick={handleReply} disabled={!replyText.trim() || isLoading}>
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

