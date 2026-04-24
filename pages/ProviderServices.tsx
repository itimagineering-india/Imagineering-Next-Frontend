"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import api from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ServiceFilters,
  ServiceTable,
  ServiceGrid,
} from "@/components/services";
import { MultiStepServiceForm } from "@/components/services/form";

export async function getServerSideProps() { return { props: {} }; }

function isProviderBusinessProfileComplete(provider: unknown): boolean {
  if (!provider || typeof provider !== "object") return false;
  const p = provider as { businessName?: string; bio?: string };
  return Boolean(String(p.businessName ?? "").trim() && String(p.bio ?? "").trim());
}

async function fetchProviderRecordForUser(userId: string): Promise<unknown | null> {
  const providerResponse = await api.providers.getByUserId(userId);
  let provider: unknown =
    providerResponse.success && providerResponse.data
      ? ((providerResponse.data as { provider?: unknown }).provider ?? providerResponse.data)
      : null;
  if (!provider) {
    const fallbackResponse = await api.providers.getById(userId, 0);
    if (fallbackResponse.success && fallbackResponse.data) {
      provider = (fallbackResponse.data as { provider?: unknown }).provider ?? fallbackResponse.data;
    }
  }
  return provider || null;
}

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
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  verificationStatus?: "approved" | "pending" | "rejected";
}

export default function ProviderServices() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false);
  const [businessProfileRequiredOpen, setBusinessProfileRequiredOpen] = useState(false);
  const [isCheckingBusinessProfile, setIsCheckingBusinessProfile] = useState(false);
  const [editServiceDialogOpen, setEditServiceDialogOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    if (isAuthLoading) return;
    fetchServices();
  }, [isAuthLoading, user]);

  const fetchCategories = async () => {
    try {
      // Force refresh to bypass any cached categories without subcategories
      const response = await api.categories.getAll(true, { includeSubcategories: true });
      if (response.success && response.data) {
        const d = response.data as { categories?: any[] };
        setCategories(d.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const userId = (user as any)?._id || (user as any)?.id;
      if (!userId) return;
      // Fetch services by provider
      const response = await api.services.getByProvider(userId);
      if (response.success && response.data) {
        const d = response.data as { services?: any[] };
        setServices(d.services || []);
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (service: Service) => {
    setServiceToEdit(service);
    setEditServiceDialogOpen(true);
  };

  const handleServiceSuccess = () => {
    fetchServices();
  };

  const tryOpenAddServiceDialog = async () => {
    const userId = (user as { _id?: string; id?: string } | null)?._id || (user as { id?: string } | null)?.id;
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add a service.",
        variant: "destructive",
      });
      return;
    }
    setIsCheckingBusinessProfile(true);
    try {
      const provider = await fetchProviderRecordForUser(String(userId));
      if (!isProviderBusinessProfileComplete(provider)) {
        setBusinessProfileRequiredOpen(true);
        return;
      }
      setAddServiceDialogOpen(true);
    } catch {
      toast({
        title: "Could not verify profile",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingBusinessProfile(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;

    try {
      const response = await api.services.delete(serviceToDelete);
      if (response.success) {
        setServices(services.filter((s) => s._id !== serviceToDelete));
        toast({
          title: "Success",
          description: "Service deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete service",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
    }
  };



  const filteredServices = services.filter((service) =>
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              My Services
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Manage all your service listings
            </p>
          </div>
          <Button
            onClick={() => void tryOpenAddServiceDialog()}
            disabled={isCheckingBusinessProfile}
            size="sm"
            className="text-xs sm:text-sm self-start sm:self-auto w-full sm:w-auto h-9 sm:h-10"
          >
            {isCheckingBusinessProfile ? (
              <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">{isCheckingBusinessProfile ? "Checking…" : "Add New Service"}</span>
            <span className="sm:hidden">{isCheckingBusinessProfile ? "…" : "Add Service"}</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <ServiceFilters
          searchQuery={searchQuery}
          viewMode={viewMode}
          onSearchChange={setSearchQuery}
          onViewModeChange={setViewMode}
        />

        {/* Services List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-6 sm:py-8 md:py-12 text-center px-3 sm:px-6">
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Loading services...</p>
            </CardContent>
          </Card>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="py-6 sm:py-8 md:py-12 text-center px-3 sm:px-4">
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4">
                {searchQuery ? "No services found matching your search" : "No services yet"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => void tryOpenAddServiceDialog()}
                  disabled={isCheckingBusinessProfile}
                  size="sm"
                  className="text-xs sm:text-sm h-9 sm:h-10"
                >
                  {isCheckingBusinessProfile ? (
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isCheckingBusinessProfile ? "Checking…" : "Add Your First Service"}
                  </span>
                  <span className="sm:hidden">{isCheckingBusinessProfile ? "…" : "Add Service"}</span>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === "table" ? (
          <ServiceTable
            services={filteredServices}
            onEdit={handleEditClick}
            onDelete={(serviceId) => {
              setServiceToDelete(serviceId);
              setDeleteDialogOpen(true);
            }}
          />
        ) : (
          <ServiceGrid
            services={filteredServices}
            onEdit={handleEditClick}
            onDelete={(serviceId) => {
              setServiceToDelete(serviceId);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        {/* Add Service Dialog */}
        <MultiStepServiceForm
          open={addServiceDialogOpen}
          onOpenChange={(open) => {
            setAddServiceDialogOpen(open);
            if (!open) {
              setServiceToEdit(null);
            }
          }}
          categories={categories}
          onSuccess={handleServiceSuccess}
        />

        {/* Edit Service Dialog */}
        {serviceToEdit && serviceToEdit.category && (
          <MultiStepServiceForm
            open={editServiceDialogOpen}
            onOpenChange={(open) => {
              setEditServiceDialogOpen(open);
              if (!open) {
                setServiceToEdit(null);
              }
            }}
            categories={categories}
            onSuccess={handleServiceSuccess}
            editMode={true}
            serviceId={serviceToEdit._id}
            initialData={{
              category: (typeof serviceToEdit.category === "string" ? serviceToEdit.category : serviceToEdit.category?._id) ?? "",
              subcategory: serviceToEdit.subcategory || "",
              title: serviceToEdit.title || "",
              brandName: (serviceToEdit as any).brandName || "",
              shortDescription: serviceToEdit.description?.split('\n\n')[0] || "",
              detailedDescription: serviceToEdit.description?.split('\n\n').slice(1).join('\n\n') || serviceToEdit.description || "",
              skills: (serviceToEdit as any).tags ?? [],
              images: serviceToEdit.images || (serviceToEdit.image ? [serviceToEdit.image] : []),
              uploadedImages: [],
              location: serviceToEdit.location || {
                address: "",
                city: "",
                state: "",
                coordinates: { lat: 0, lng: 0 },
              },
              pricingType: (serviceToEdit.priceType || "fixed") as any,
              startingPrice: (serviceToEdit.price || 0).toString(),
              availability: {
                days: [],
                timeSlots: [{ start: "09:00", end: "18:00" }],
              },
              dynamicData: { ...((serviceToEdit as any).resumeUrl && { resumeUrl: (serviceToEdit as any).resumeUrl }) },
              contactMode: "platform",
              visibility: serviceToEdit.featured ? "featured" : "normal",
            }}
          />
        )}

        <AlertDialog open={businessProfileRequiredOpen} onOpenChange={setBusinessProfileRequiredOpen}>
          <AlertDialogContent className="mx-3 sm:mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Business profile required</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Add your business name and description under Business Profile first. After you save there, you can
                create service listings here.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto text-sm">Not now</AlertDialogCancel>
              <AlertDialogAction
                className="w-full sm:w-auto text-sm"
                onClick={() => {
                  setBusinessProfileRequiredOpen(false);
                  router.push("/dashboard/provider/business-profile");
                }}
              >
                Go to Business Profile
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="mx-3 sm:mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Delete Service</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Are you sure you want to delete this service? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel className="w-full sm:w-auto text-sm">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete} 
                className="bg-destructive text-destructive-foreground w-full sm:w-auto text-sm"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}


















