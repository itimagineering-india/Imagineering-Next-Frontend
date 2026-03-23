import { ServiceCard } from "./ServiceCard";

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

interface ServiceGridProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
}

export function ServiceGrid({ services, onEdit, onDelete }: ServiceGridProps) {
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service._id}
          service={service}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

