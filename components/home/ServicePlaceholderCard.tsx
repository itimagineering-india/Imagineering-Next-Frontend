import Link from "next/link";
import {
  ContractorsIcon,
  MachinesIcon,
  LandIcon,
  HomesIcon,
  SpaceIcon,
  ManufacturerIcon,
  LogisticsIcon,
  VendorsIcon,
  RentalServicesIcon,
  ConstructionIcon,
  ConstructionMaterialsIcon,
  ManpowerIcon,
  TechnicalManpowerIcon,
  FinancingIcon,
  ConstructionCompaniesIcon,
  ElectricalServicesIcon,
  PlumbingIcon,
  PaintingIcon,
  MaintenanceIcon,
} from "./CategoryIcons";

// Category images mapping - using Unsplash placeholder images
const categoryImages: Record<string, string> = {
  "contractors": "https://img.icons8.com/color/96/worker-male--v1.png",
  "machines": "https://img.icons8.com/color/96/crane.png",
  "consultants": "https://img.icons8.com/external-flaticons-flat-flat-icons/64/external-consultant-gig-economy-flaticons-flat-flat-icons-2.png",
  "real-estate": "https://img.icons8.com/color/96/mansion.png",
  "tools": "https://img.icons8.com/color/96/maintenance.png",
  "manufacturer": "https://img.icons8.com/color/96/factory.png",
  "logistics": "https://img.icons8.com/color/96/delivery--v1.png",
  "traders": "https://img.icons8.com/color/96/supplier.png",
  "rental-services": "https://img.icons8.com/color/96/key-exchange.png",
  "furniture": "https://img.icons8.com/color/96/furniture.png",
  "construction-materials": "https://img.icons8.com/color/96/steel-i-beam.png",
  "manpower": "https://img.icons8.com/color/96/workers-male--v1.png",
  "technical-manpower": "https://img.icons8.com/color/96/engineer-skin-type-2.png",
  "finance": "https://img.icons8.com/color/96/bank-building.png",
  "construction-companies": "https://img.icons8.com/color/96/group-of-companies.png",
  "electrical-lighting": "https://img.icons8.com/color/96/light.png",
};

// All 19 service categories with colorful custom icons
const serviceCategories = [
  { name: "Contractors", icon: ContractorsIcon, slug: "contractors", useCustomIcon: true },
  { name: "Machines Resale", icon: MachinesIcon, slug: "machines", useCustomIcon: true },
  { name: "Consultants", icon: LandIcon, slug: "consultants", useCustomIcon: true },
  { name: "Real Estate", icon: HomesIcon, slug: "real-estate", useCustomIcon: true },
  //{ name: "Tools", icon: SpaceIcon, slug: "tools", useCustomIcon: true },
  { name: "Manufacturer", icon: ManufacturerIcon, slug: "manufacturer", useCustomIcon: true },
  { name: "Logistics", icon: LogisticsIcon, slug: "logistics", useCustomIcon: true },
  { name: "Traders", icon: VendorsIcon, slug: "traders", useCustomIcon: true },
  { name: "Machine Rental", icon: RentalServicesIcon, slug: "rental-services", useCustomIcon: true },
  //{ name: "Furniture", icon: ConstructionIcon, slug: "furniture", useCustomIcon: true },
 
  { name: "Manpower", icon: ManpowerIcon, slug: "manpower", useCustomIcon: true },
  { name: "Technical Manpower", icon: TechnicalManpowerIcon, slug: "technical-manpower", useCustomIcon: true },
  { name: "Finance & Insurance", icon: FinancingIcon, slug: "finance", useCustomIcon: true },
  { name: "Construction Companies", icon: ConstructionCompaniesIcon, slug: "construction-companies", useCustomIcon: true },
  { name: "Construction Materials", icon: ConstructionMaterialsIcon, slug: "construction-materials", useCustomIcon: true },
 // { name: "Electrical & Lighting", icon: ElectricalServicesIcon, slug: "electrical-lighting", useCustomIcon: true },
  //{ name: "Tools", icon: PlumbingIcon, slug: "plumbing", useCustomIcon: true },
 //{ name: "Painting", icon: PaintingIcon, slug: "painting", useCustomIcon: true },
 // { name: "Maintenance", icon: MaintenanceIcon, slug: "maintenance", useCustomIcon: true },
];

interface ServicePlaceholderCardProps {
  index: number;
  /** Larger text for featured/top row cards on desktop */
  size?: "default" | "large";
}

export function ServicePlaceholderCard({ index, size = "default" }: ServicePlaceholderCardProps) {
  const category = serviceCategories[index];

  if (!category) {
    return (
        <div className="aspect-square bg-slate-100 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-2 cursor-pointer flex items-center justify-center border border-slate-200">
        <span className="text-slate-400 text-xs font-medium">Coming Soon</span>
      </div>
    );
  }

  const IconComponent = category.icon;
  const useCustomIcon = category.useCustomIcon || false;

  const categoryImage = categoryImages[category.slug] || null;

  return (
    <Link href={`/services?category=${category.slug}`} className="block min-w-0">
      {/* flex-col + icon area must not use h-full or it steals space from the label on narrow cards */}
      <div className="group relative aspect-square bg-white rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105 cursor-pointer flex flex-col items-stretch min-h-0 gap-1 px-1.5 py-2 sm:px-2 sm:pt-4 sm:pb-4 border border-slate-200 hover:border-red-400 overflow-hidden">
        {/* Image / icon — flex-1 min-h-0 keeps the title row visible */}
        {categoryImage ? (
          <div className="relative z-10 flex flex-1 min-h-0 items-center justify-center p-0.5 sm:p-1 md:p-2 transition-all duration-300 group-hover:scale-110">
            <div className="max-w-[44px] max-h-[44px] w-full aspect-square sm:max-w-[56px] sm:max-h-[56px] md:max-w-[64px] md:max-h-[64px] lg:max-w-[72px] lg:max-h-[72px] xl:max-w-[80px] xl:max-h-[80px] rounded-md sm:rounded-lg overflow-hidden shadow-sm group-hover:shadow-lg transition-shadow duration-300">
              <img
                src={categoryImage}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : useCustomIcon ? (
          <div className="relative z-10 flex flex-1 min-h-0 items-center justify-center p-0.5 sm:p-1 md:p-2 transition-all duration-300 group-hover:scale-110">
            <div className="max-w-[32px] max-h-[32px] w-full aspect-square sm:max-w-[38px] sm:max-h-[38px] md:max-w-[45px] md:max-h-[45px] lg:max-w-[50px] lg:max-h-[50px] xl:max-w-[55px] xl:max-h-[55px] flex items-center justify-center">
              <IconComponent className="w-full h-full" />
            </div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-1 min-h-0 items-center justify-center">
            <div className="p-2 rounded-lg bg-slate-100 transition-all duration-300 group-hover:bg-red-500 group-hover:scale-110 shadow-sm">
              <IconComponent className="h-4 w-4 md:h-5 md:w-5 text-slate-700 group-hover:text-white transition-colors duration-300" />
            </div>
          </div>
        )}

        <span
          className={`relative z-10 shrink-0 w-full text-slate-800 font-semibold text-center leading-snug group-hover:text-red-500 transition-colors duration-300 line-clamp-2 [overflow-wrap:anywhere] ${
            size === "large"
              ? "text-[11px] leading-[1.25] sm:text-xs md:text-sm"
              : "text-[10px] leading-[1.25] sm:text-[10px] md:text-xs"
          }`}
        >
          {category.name}
        </span>
      </div>
    </Link>
  );
}

export { serviceCategories };
