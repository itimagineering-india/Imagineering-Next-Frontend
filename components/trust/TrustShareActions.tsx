"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Linkedin, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type TrustSharePayload = {
  shareText: string;
  profileUrl: string;
  whatsappUrl: string;
  linkedInUrl: string;
  isImagineeringVerified?: boolean;
};

export function TrustShareActions({
  share,
  compact = false,
}: {
  share: TrustSharePayload | null;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const [copying, setCopying] = useState(false);

  if (!share) return null;

  const onCopy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(share.shareText);
      toast({
        title: "Copied",
        description: "Trust card link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "flex flex-col sm:flex-row gap-2"}>
      <Button variant="outline" size="sm" className="gap-2" asChild>
        <a href={share.whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      </Button>
      <Button variant="outline" size="sm" className="gap-2" asChild>
        <a href={share.linkedInUrl} target="_blank" rel="noopener noreferrer">
          <Linkedin className="h-4 w-4" />
          LinkedIn
        </a>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="gap-2"
        onClick={() => void onCopy()}
        disabled={copying}
      >
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
    </div>
  );
}
