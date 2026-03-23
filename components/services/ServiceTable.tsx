"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Image as ImageIcon, MapPin, Crown, CheckCircle2, Clock, XCircle } from "lucide-react";

interface Service {
  _id: string;
  title: string;
  description: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  subcategory?: string;
  price: number;
  priceType: string;
  image?: string;
  images?: string[];
  isActive: boolean;
  featured: boolean;
  rating: number;
  reviewCount: number;
  location?: {
    address: string;
    city: string;
    state: string;
  };
  verificationStatus?: "approved" | "pending" | "rejected";
}

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

const getStatusBadge = (service: Service) => {
  const status = service.verificationStatus || (service.isActive ? "approved" : "pending");
  
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-success text-success-foreground">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

function ServiceImage({ service }: { service: Service }) {
  const [imageError, setImageError] = useState(false);
  
  const getServiceImage = (): string | null => {
    // Priority: images array first, then image field
    if (service.images && service.images.length > 0) {
      return service.images[0];
    }
    if (service.image) {
      return service.image;
    }
    return null;
  };

  const imageUrl = getServiceImage();

  if (imageError || !imageUrl) {
    return (
      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
      <img
        src={imageUrl}
        alt={service.title}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}

export function ServiceTable({ services, onEdit, onDelete }: ServiceTableProps) {

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg">All Services ({services.length})</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Manage your service listings</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ServiceImage service={service} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{service.title}</p>
                          {service.featured && (
                            <Crown className="h-4 w-4 text-warning flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {service.category?.name || "Uncategorized"}
                    </Badge>
                    {service.subcategory && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {service.subcategory}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">
                        ₹{service.price.toLocaleString()}
                      </p>
                    <p className="text-xs text-muted-foreground">
                      {service.priceType === "hourly" && "/ hour"}
                      {service.priceType === "daily" && "/ day"}
                      {service.priceType === "fixed" && "fixed"}
                      {service.priceType === "monthly" && "/ month"}
                      {service.priceType === "per_minute" && "/ minute"}
                      {service.priceType === "per_article" && "/ article"}
                      {service.priceType === "per_kg" && "/ kg"}
                      {service.priceType === "per_litre" && "/ litre"}
                      {service.priceType === "per_unit" && "/ unit"}
                      {service.priceType === "metric_ton" && "/ metric ton"}
                      {service.priceType === "per_sqft" && "/ sqft"}
                      {service.priceType === "per_sqm" && "/ sqm"}
                      {service.priceType === "per_load" && "/ load"}
                      {service.priceType === "per_trip" && "/ trip"}
                      {service.priceType === "lumpsum" && "lumsum"}
                      {service.priceType === "per_project" && "/ project"}
                      {service.priceType === "negotiable" && "negotiable"}
                    </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(service)}
                    {service.featured && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-warning">
                        <Crown className="h-3 w-3" />
                        <span>Premium</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.location ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {service.location.city || service.location.address || "N/A"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No location</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => onEdit(service)}
                        aria-label={`Edit ${service.title}`}
                        title={`Edit ${service.title}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(service._id)}
                        aria-label={`Delete ${service.title}`}
                        title={`Delete ${service.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3">
          {services.map((service) => (
            <Card key={service._id} className="border">
              <CardContent className="p-4 space-y-3">
                {/* Header with Image and Title */}
                <div className="flex items-start gap-3">
                  <ServiceImage service={service} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm line-clamp-2">{service.title}</h3>
                          {service.featured && (
                            <Crown className="h-4 w-4 text-warning flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {service.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(service)}
                          aria-label={`Edit ${service.title}`}
                          title={`Edit ${service.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDelete(service._id)}
                          aria-label={`Delete ${service.title}`}
                          title={`Delete ${service.title}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(service)}
                  <Badge variant="outline" className="text-xs">
                    {service.category?.name || "Uncategorized"}
                  </Badge>
                  {service.featured && (
                    <Badge className="bg-warning text-warning-foreground text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="font-semibold text-base">
                      ₹{service.price.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.priceType === "hourly" && "/ hour"}
                      {service.priceType === "daily" && "/ day"}
                      {service.priceType === "fixed" && "fixed"}
                      {service.priceType === "monthly" && "/ month"}
                      {service.priceType === "per_minute" && "/ minute"}
                      {service.priceType === "per_article" && "/ article"}
                      {service.priceType === "per_kg" && "/ kg"}
                      {service.priceType === "per_litre" && "/ litre"}
                      {service.priceType === "per_unit" && "/ unit"}
                      {service.priceType === "metric_ton" && "/ metric ton"}
                      {service.priceType === "per_sqft" && "/ sqft"}
                      {service.priceType === "per_sqm" && "/ sqm"}
                      {service.priceType === "per_load" && "/ load"}
                      {service.priceType === "per_trip" && "/ trip"}
                      {service.priceType === "lumpsum" && "lumsum"}
                      {service.priceType === "per_project" && "/ project"}
                      {service.priceType === "negotiable" && "negotiable"}
                    </p>
                  </div>
                  {service.location && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">
                        {service.location.city || service.location.address || "Location set"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

