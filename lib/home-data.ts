/** Shared types and normalizers for homepage SSR + client hydration. */

export type CmsBanner = {
  _id: string;
  title: string;
  imageUrl: string;
  link?: string;
  order: number;
};

export type HomeService = {
  id: string;
  name: string;
  image: string;
  location: string;
  price: number;
  priceMode?: "exact" | "range";
  priceMin?: number;
  priceMax?: number;
  priceType?: string;
  mrp?: number;
  priceLabel: string;
  rating: number;
  reviewCount: number;
};

export type HomeCategorySection = {
  title: string;
  categorySlug: string;
  services: HomeService[];
};

export type HomeTopProvider = {
  id: string;
  slug?: string;
  name: string;
  avatar: string;
  businessName?: string;
  businessLogo?: string;
  verified?: boolean;
  topRated?: boolean;
  imagineScore?: {
    trustScore?: number | null;
    imagineScore?: number | null;
    isImagineeringVerified?: boolean;
  } | null;
};

const DUMMY_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'%3E%3Crect fill='%23e2e8f0' width='240' height='180'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='14' font-family='sans-serif'%3EService%3C/text%3E%3C/svg%3E";

type ApiService = {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  images?: string[];
  image?: string;
  location?:
    | string
    | {
        city?: string;
        address?: string;
      }
    | null;
  price?: number | string | null;
  priceMode?: "exact" | "range";
  priceMin?: number | string | null;
  priceMax?: number | string | null;
  priceType?: string;
  mrp?: number | string | null;
  priceLabel?: string;
  rating?: number | string | null;
  reviewCount?: number | string | null;
};

type ApiCategoryGroup = {
  category?: {
    name?: string;
    slug?: string;
  };
  services?: ApiService[];
};

type ProviderApiItem = {
  _id?: string;
  slug?: string;
  businessName?: string;
  businessLogo?: string;
  verified?: boolean;
  topRated?: boolean;
  imagineScore?: {
    trustScore?: number | null;
    imagineScore?: number | null;
    isImagineeringVerified?: boolean;
  } | null;
  user?: {
    _id?: string;
    name?: string;
    avatar?: string;
    verified?: boolean;
  };
};

export function normalizeHomeService(s: ApiService): HomeService {
  const id = s?.id ?? s?._id ?? "";
  const name = s?.name ?? s?.title ?? "Service";
  const image =
    (Array.isArray(s?.images) && s.images.length > 0 ? s.images[0] : null) ||
    s?.image ||
    DUMMY_IMAGE;
  let location = s?.location;
  if (typeof location === "object" && location !== null) {
    location = location?.city ?? location?.address ?? "Location not available";
  }
  location = typeof location === "string" ? location : "Location not available";
  return {
    id: String(id),
    name: String(name),
    image: String(image),
    location,
    price: Number(s?.price) || 0,
    priceMode: s?.priceMode,
    priceMin: s?.priceMin != null ? Number(s.priceMin) : undefined,
    priceMax: s?.priceMax != null ? Number(s.priceMax) : undefined,
    priceType: s?.priceType,
    mrp: s?.mrp != null ? Number(s.mrp) : undefined,
    priceLabel: s?.priceLabel ?? "/ project",
    rating: Number(s?.rating) ?? 0,
    reviewCount: Number(s?.reviewCount) ?? 0,
  };
}

export function normalizeHomeCategorySections(
  rawCategories: ApiCategoryGroup[],
): HomeCategorySection[] {
  return rawCategories.map((cat) => ({
    title: cat.category?.name ?? "Unknown",
    categorySlug: cat.category?.slug ?? "",
    services: (cat.services ?? []).map(normalizeHomeService),
  }));
}

export function normalizeHomeTopProviders(
  items: Array<HomeTopProvider | ProviderApiItem>,
): HomeTopProvider[] {
  return items
    .map((provider) => {
      const normalized = provider as HomeTopProvider;
      if (normalized.id && normalized.name !== undefined) {
        return {
          id: normalized.id,
          slug: normalized.slug,
          name: normalized.name || "Provider",
          avatar: normalized.avatar || "",
          businessName: normalized.businessName,
          businessLogo: normalized.businessLogo,
          verified: normalized.verified,
          topRated: normalized.topRated,
          imagineScore: normalized.imagineScore,
        };
      }

      const apiItem = provider as ProviderApiItem;
      const id = apiItem._id || apiItem.user?._id || "";
      if (!id) return null;
      return {
        id,
        slug: apiItem.slug,
        name: apiItem.user?.name || "Provider",
        avatar: apiItem.user?.avatar || "",
        businessName: apiItem.businessName,
        businessLogo: apiItem.businessLogo,
        verified: apiItem.verified ?? apiItem.user?.verified,
        topRated: apiItem.topRated,
        imagineScore: apiItem.imagineScore,
      };
    })
    .filter(Boolean) as HomeTopProvider[];
}

export function normalizeCmsBanners(raw: unknown[]): CmsBanner[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const b = item as Partial<CmsBanner>;
      if (!b._id || !b.imageUrl) return null;
      return {
        _id: String(b._id),
        title: String(b.title ?? "Banner"),
        imageUrl: String(b.imageUrl),
        link: b.link ? String(b.link) : undefined,
        order: Number(b.order) || 0,
      };
    })
    .filter(Boolean) as CmsBanner[];
}
