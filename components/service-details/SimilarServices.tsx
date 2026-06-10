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
    <div className="min-w-0 overflow-x-clip space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h2>
        <Button variant="secondary" asChild className="hover:bg-primary/5">
          <Link href="/services" className="flex items-center gap-1">
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Carousel className="w-full max-w-full overflow-x-clip">
        <CarouselContent className="-ml-2 md:-ml-4">
          {services.map((service) => (
            <CarouselItem
              key={service.id}
              className="basis-3/4 pl-2 sm:basis-1/2 md:pl-4 lg:basis-1/4 xl:basis-1/5"
            >
              <Link href={`/service/${service.slug || service.id}`}>
                <Card className="group h-full cursor-pointer overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-white to-rose-50/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-rose-50">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <CardContent className="space-y-3 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="rounded-full px-2 py-0.5 leading-tight">
                        {service.category}
                      </Badge>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary lg:text-base">
                          ₹{service.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
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

                    <h3 className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-tight lg:text-[15px]">{service.title}</h3>

                    <div className="flex items-center gap-1 text-xs lg:text-sm">
                      <Star className="h-2 w-2 fill-warning text-warning" />
                      <span className="font-medium">{service.rating}</span>
                      <span className="text-muted-foreground">
                        ({service.reviewCount})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground lg:text-sm">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{service.location}</span>
                    </div>

                    <p className="line-clamp-1 text-xs text-muted-foreground lg:text-sm">
                      by {service.providerName}
                    </p>
                    <div className="flex h-8 w-full items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-xs font-semibold text-primary transition-colors group-hover:bg-primary group-hover:text-white lg:text-sm">
                      Quick View
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 hidden sm:inline-flex xl:-left-12" />
        <CarouselNext className="right-2 hidden sm:inline-flex xl:-right-12" />
      </Carousel>
    </div>
  );
}

