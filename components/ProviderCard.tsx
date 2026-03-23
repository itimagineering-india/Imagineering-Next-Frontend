import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, CheckCircle2, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderCardProps {
  id: string;
  slug?: string;
  name: string;
  avatar: string;
  tagline: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  verified?: boolean;
  topRated?: boolean;
  responseTime: string;
  skills: string[];
  className?: string;
}

export function ProviderCard({
  id,
  slug,
  name,
  avatar,
  tagline,
  rating,
  reviewCount,
  hourlyRate,
  location,
  verified,
  topRated,
  responseTime,
  skills,
  className,
}: ProviderCardProps) {
  const providerUrl = `/provider/${slug || id}`;
  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        className
      )}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Link href={providerUrl}>
            <Avatar className="h-16 w-16 ring-2 ring-border">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={providerUrl}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {name}
              </Link>
              {verified && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              {topRated && (
                <Badge className="bg-warning text-warning-foreground">
                  <Award className="h-3 w-3 mr-1" />
                  Top Rated
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {tagline}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 py-4 border-y">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-semibold">{rating}</span>
            </div>
            <p className="text-xs text-muted-foreground">{reviewCount} reviews</p>
          </div>
          <div className="text-center">
            <p className="font-semibold">${hourlyRate}</p>
            <p className="text-xs text-muted-foreground">per hour</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">{responseTime}</span>
            </div>
            <p className="text-xs text-muted-foreground">response</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mt-4 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mt-3">
          {skills.slice(0, 4).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-xs font-normal">
              {skill}
            </Badge>
          ))}
          {skills.length > 4 && (
            <Badge variant="outline" className="text-xs font-normal">
              +{skills.length - 4} more
            </Badge>
          )}
        </div>

        {/* Action */}
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" asChild>
            <Link href={providerUrl}>View Profile</Link>
          </Button>
          <Button variant="outline" className="flex-1">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
