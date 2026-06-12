import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MapPin, Crown, Star, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatServicePrice, isRangePricedService } from "@/lib/formatServicePrice";

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
 priceMode?: "exact" | "range";
 priceMin?: number;
 priceMax?: number;
 priceType: string;
 image?: string;
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

interface ServiceCardProps {
 service: Service;
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

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
 return (
  <Card className={service.featured ? "border-warning border-2" : ""}>
   <div className="relative">
    {service.image ? (
     <img
      src={service.image}
      alt={service.title}
      className="aspect-square w-full object-cover rounded-t-lg"
     />
    ) : (
     <div className="flex h-40 w-full items-center justify-center rounded-t-lg bg-muted px-2 text-center text-sm text-muted-foreground sm:h-48">
      No Image
     </div>
    )}
    {service.featured && (
     <div className="absolute top-2 right-2">
      <Badge className="bg-warning text-warning-foreground caption">
       <Crown className="h-3 w-3 mr-1" />
       <span className="hidden sm:inline">Premium</span>
      </Badge>
     </div>
    )}
    <div className="absolute top-2 left-2">
     {getStatusBadge(service)}
    </div>
   </div>
   <CardHeader className="p-3 sm:p-6">
    <CardTitle className="line-clamp-2 body">{service.title}</CardTitle>
    <CardDescription className="line-clamp-2 caption">
     {service.description}
    </CardDescription>
   </CardHeader>
   <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
    <div className="flex items-center justify-between flex-wrap gap-2">
     <Badge variant="outline" className="caption">
      {service.category?.name || "Uncategorized"}
     </Badge>
     <p className="subtitle listing-title">
      {formatServicePrice(service)}
     </p>
     {isRangePricedService(service) && (
      <Badge variant="outline" className="text-[10px]">Enquiry only</Badge>
     )}
    </div>

    {service.location && (
     <div className="flex items-center gap-1 caption ">
      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
      <span className="line-clamp-1">
       {service.location.city || service.location.address || "Location set"}
      </span>
     </div>
    )}

    <div className="flex items-center justify-between pt-2 border-t gap-2">
     <div className="flex items-center gap-1 caption min-w-0">
      <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-warning text-warning flex-shrink-0" />
      <span className="body">{service.rating || 0}</span>
      <span className="text-muted-foreground hidden sm:inline">
       ({service.reviewCount || 0} reviews)
      </span>
      <span className="text-muted-foreground sm:hidden">
       ({service.reviewCount || 0})
      </span>
     </div>
     <div className="flex gap-1 sm:gap-2 flex-shrink-0">
      <Button 
       variant="ghost" 
       size="icon"
       className="h-8 w-8 sm:h-10 sm:w-10"
       onClick={() => onEdit(service)}
       aria-label={`Edit ${service.title}`}
       title={`Edit ${service.title}`}
      >
       <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </Button>
      <Button
       variant="ghost"
       size="icon"
       className="h-8 w-8 sm:h-10 sm:w-10"
       onClick={() => onDelete(service._id)}
       aria-label={`Delete ${service.title}`}
       title={`Delete ${service.title}`}
      >
       <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
      </Button>
     </div>
    </div>
   </CardContent>
  </Card>
 );
}

