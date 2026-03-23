import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SimilarService {
  id: string;
  slug?: string;
  title: string;
  image: string;
  category: string;
  providerName: string;
  rating: number;
  reviewCount: number;
  price: number;
  priceType: "hourly" | "daily" | "fixed" | "monthly" | "per_minute" | "per_article" | "per_kg" | "per_litre" | "per_unit" | "metric_ton" | "per_sqft" | "per_sqm" | "per_load" | "per_trip";
  location: string;
}

interface SimilarServicesProps {
  services: SimilarService[];
  title?: string;
}

export function SimilarServices({
  services,
  title = "Similar Services",
}: SimilarServicesProps) {
  if (services.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h2>
        <Button variant="ghost" asChild className="hover:bg-primary/5">
          <Link href="/services" className="flex items-center gap-1">
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {services.map((service) => (
            <CarouselItem
              key={service.id}
              className="pl-2 md:pl-4 basis-1/3 lg:basis-1/6"
            >
              <Link href={`/service/${service.slug || service.id}`}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer border hover:border-primary/30 group">
                  <div className="aspect-square overflow-hidden rounded-t-lg relative">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <CardContent className="p-1.5 sm:p-2 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <Badge variant="outline" className="text-[8px] px-1 py-0 leading-tight">
                        {service.category}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold text-[10px] sm:text-xs">
                          ₹{service.price.toLocaleString()}
                        </p>
                        <p className="text-[8px] text-muted-foreground">
                          {service.priceType === "hourly" && "/hr"}
                          {service.priceType === "daily" && "/day"}
                          {service.priceType === "fixed" && "fixed"}
                          {service.priceType === "monthly" && "/month"}
                          {service.priceType === "per_minute" && "/min"}
                          {service.priceType === "per_article" && "/article"}
                          {service.priceType === "per_kg" && "/kg"}
                          {service.priceType === "per_litre" && "/litre"}
                          {service.priceType === "per_unit" && "/unit"}
                          {service.priceType === "metric_ton" && "/metric ton"}
                          {service.priceType === "per_sqft" && "/sqft"}
                          {service.priceType === "per_sqm" && "/sqm"}
                          {service.priceType === "per_load" && "/load"}
                          {service.priceType === "per_trip" && "/trip"}
                        </p>
                      </div>
                    </div>

                    <h3 className="font-semibold text-[10px] sm:text-xs line-clamp-2 leading-tight">{service.title}</h3>

                    <div className="flex items-center gap-0.5 text-[9px]">
                      <Star className="h-2 w-2 fill-warning text-warning" />
                      <span className="font-medium">{service.rating}</span>
                      <span className="text-muted-foreground">
                        ({service.reviewCount})
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                      <MapPin className="h-2 w-2" />
                      <span className="line-clamp-1">{service.location}</span>
                    </div>

                    <p className="text-[9px] text-muted-foreground line-clamp-1">
                      by {service.providerName}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

