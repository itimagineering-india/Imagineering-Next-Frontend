"use client";

import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Crown, Globe } from "lucide-react";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";

interface ContactVisibilitySectionProps {
  contactMode: "platform" | "direct";
  visibility: "normal" | "featured";
  onContactModeChange: (mode: "platform" | "direct") => void;
  onVisibilityChange: (visibility: "normal" | "featured") => void;
  isPremium?: boolean;
}

export function ContactVisibilitySection({
  contactMode,
  visibility,
  onContactModeChange,
  onVisibilityChange,
  isPremium = false,
}: ContactVisibilitySectionProps) {
  const { status: kycStatus } = useProviderKycStatus();
  const isKycApproved = kycStatus === "KYC_APPROVED";

  useEffect(() => {
    onContactModeChange("platform");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Contact via platform chat only (OLX-style) */}
      <div className="space-y-3">
        <Label>Contact</Label>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">Platform Chat</div>
            <p className="text-xs text-muted-foreground">
              All contact goes through our in-app chat
            </p>
          </div>
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <Label>Visibility</Label>
        <RadioGroup
          value={visibility}
          onValueChange={(value) => onVisibilityChange(value as "normal" | "featured")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="normal" />
            <Label htmlFor="normal" className="font-normal cursor-pointer flex-1">
              <div>
                <div className="font-medium">Normal</div>
                <p className="text-xs text-muted-foreground">
                  Standard listing visibility
                </p>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="featured"
              id="featured"
              disabled={!isPremium || !isKycApproved}
            />
            <Label
              htmlFor="featured"
              className="font-normal cursor-pointer flex-1"
            >
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-warning" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Featured</span>
                    {isPremium && isKycApproved && (
                      <Badge variant="secondary" className="text-xs">
                        Premium
                      </Badge>
                    )}
                    {(!isPremium || !isKycApproved) && (
                      <Badge variant="outline" className="text-xs">
                        Premium Only
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get highlighted in search results and featured sections
                    {!isPremium && " (Upgrade to Premium)"}
                    {!isKycApproved && " (KYC Required)"}
                  </p>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}





















