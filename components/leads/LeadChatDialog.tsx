import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LeadChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  messageText: string;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
}

export function LeadChatDialog({
  open,
  onOpenChange,
  leadName,
  messageText,
  onMessageChange,
  onSendMessage,
}: LeadChatDialogProps) {
  const { toast } = useToast();

  const handleSend = () => {
    if (!messageText.trim()) {
      return;
    }
    onSendMessage();
    toast({
      title: "Message sent",
      description: "Your message has been sent to the buyer",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat with {leadName}</DialogTitle>
          <DialogDescription>
            Send a message to the buyer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-muted/50">
            <div className="space-y-4">
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-lg p-2 max-w-[80%]">
                  <p className="text-sm">Hello, I'm interested in your service...</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-background border rounded-lg p-2 max-w-[80%]">
                  <p className="text-sm">Hi! Thank you for your interest. Let me provide you with more details...</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => onMessageChange(e.target.value)}
              className="min-h-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSend();
                }
              }}
            />
            <Button onClick={handleSend} disabled={!messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

