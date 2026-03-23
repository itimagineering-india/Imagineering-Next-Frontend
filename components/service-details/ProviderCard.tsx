import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Star,
  Heart,
  Briefcase,
  Award,
  Shield,
  Camera,
} from "lucide-react";

interface ProviderCardProps {
  provider: {
    id: string;
    name: string;
    avatar?: string;
    isVerified: boolean;
    experience: number;
    completedJobs: number;
    rating: number;
    trustBadges?: string[];
  };
  onSave?: () => void;
  isSaved?: boolean;
}

export function ProviderCard({
  provider,
  onSave,
  isSaved = false,
}: ProviderCardProps) {
  const defaultBadges = [
    "ID Verified",
    "On-site Photo",
    "Background Checked",
  ];

  const badges = provider.trustBadges || defaultBadges;

  const badgeIcons: Record<string, any> = {
    "ID Verified": Shield,
    "On-site Photo": Camera,
    "Background Checked": CheckCircle2,
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        {/* Provider Header */}
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
            <AvatarImage src={provider.avatar} />
            <AvatarFallback className="text-sm sm:text-lg">
              {provider.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <h3 className="font-semibold text-base sm:text-lg truncate">{provider.name}</h3>
              {provider.isVerified && (
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-warning text-warning" />
              <span className="font-medium">{provider.rating}</span>
              <span className="text-muted-foreground">Provider Rating</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSave}
            className={cn(
              "h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0",
              isSaved && "text-destructive"
            )}
            aria-label={isSaved ? "Remove provider from favorites" : "Add provider to favorites"}
            title={isSaved ? "Remove provider from favorites" : "Add provider to favorites"}
          >
            <Heart
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                isSaved && "fill-destructive text-destructive"
              )}
            />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium">{provider.experience} Years</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Experience</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium">{provider.completedJobs}+</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Jobs Completed</p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-3 sm:pt-4 border-t space-y-1.5 sm:space-y-2">
          <p className="text-xs sm:text-sm font-medium">Trust Badges</p>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {badges.map((badge, index) => {
              const Icon = badgeIcons[badge] || CheckCircle2;
              return (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1"
                >
                  <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  {badge}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

