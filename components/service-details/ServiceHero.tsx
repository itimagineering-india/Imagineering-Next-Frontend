import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Phone, MessageCircle, Lock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ServiceHeroProps {
  service: {
    title: string;
    category: string;
    subcategory?: string;
    provider: {
      name: string;
      avatar?: string;
      isVerified?: boolean;
    };
    rating: number;
    reviewCount: number;
    location: {
      area: string;
      city: string;
    };
    price: number;
    priceType: "hourly" | "daily" | "fixed";
  };
  buyer: {
    isLoggedIn: boolean;
    isPremium: boolean;
  };
  onRequestViaPlatform: () => void;
  onContactDirectly?: () => void;
}

export function ServiceHero({
  service,
  buyer,
  onRequestViaPlatform,
  onContactDirectly,
}: ServiceHeroProps) {
  return (
    <Card className="p-3 sm:p-4 md:p-5 border-2 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6">
        {/* Left Section - Service Info */}
        <div className="flex-1 space-y-2 sm:space-y-3">
          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline" className="text-xs sm:text-sm border-primary/30 hover:border-primary/50 transition-colors">
              {service.category}
            </Badge>
            {service.subcategory && (
              <Badge variant="secondary" className="text-xs sm:text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                {service.subcategory}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
            {service.title}
          </h1>

          {/* Provider Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={service.provider.avatar} />
              <AvatarFallback className="text-sm sm:text-base">
                {service.provider.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="font-medium text-sm sm:text-base truncate">{service.provider.name}</span>
              {service.provider.isVerified && (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Rating & Location */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-warning text-warning" />
              <span className="font-semibold">{service.rating}</span>
              <span className="text-muted-foreground">
                ({service.reviewCount} reviews)
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="truncate">
                {service.location.area}, {service.location.city}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="pt-0.5 sm:pt-1">
            <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl md:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                ₹{service.price.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {service.priceType === "hourly" && "/hour"}
                {service.priceType === "daily" && "/day"}
                {service.priceType === "fixed" && "fixed"}
                {(service.priceType as string) === "monthly" && "/month"}
                {(service.priceType as string) === "per_minute" && "/min"}
                {(service.priceType as string) === "per_article" && "/article"}
                {(service.priceType as string) === "per_kg" && "/kg"}
                {(service.priceType as string) === "per_litre" && "/litre"}
                {(service.priceType as string) === "per_unit" && "/unit"}
                {(service.priceType as string) === "metric_ton" && "/metric ton"}
                {(service.priceType as string) === "per_sqft" && "/sqft"}
                {(service.priceType as string) === "per_sqm" && "/sqm"}
                {(service.priceType as string) === "per_load" && "/load"}
                {(service.priceType as string) === "per_trip" && "/trip"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
              Starting price
            </p>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="lg:w-72 space-y-2">
          {/* Primary Action */}
          <Button
            onClick={onRequestViaPlatform}
            className="w-full h-10 sm:h-11 text-xs sm:text-sm shadow-md hover:shadow-lg transition-all"
            size="lg"
            disabled={!buyer.isLoggedIn}
          >
            {buyer.isLoggedIn ? "Request via Platform" : "Login to Continue"}
          </Button>

          {/* Secondary Action */}
          {buyer.isPremium ? (
            <div className="space-y-1.5 sm:space-y-2">
              <Button
                onClick={onContactDirectly}
                variant="outline"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                Call Provider
              </Button>
              <Button
                onClick={onContactDirectly}
                variant="outline"
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                WhatsApp
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              disabled
            >
              <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Unlock Contact with Premium
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

