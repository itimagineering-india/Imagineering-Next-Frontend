import type { Metadata } from "next";
import CityServicesPage from "@/pages/CityServicesPage";
import { getCityBySlug, isCitySlug } from "@/constants/cities";
import { getCitySeoContent } from "@/constants/citySeoContent";
import { BASE_URL } from "@/lib/constants";

type Params = { citySlug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { citySlug } = await params;
  const slug = String(citySlug || "").trim().toLowerCase();
  const canonical = `${BASE_URL}/${slug}`;

  if (!isCitySlug(slug)) {
    return {
      // Layout title.template appends `| Imagineering India`
      title: "City not found",
      robots: { index: false, follow: true },
      alternates: { canonical },
    };
  }

  const city = getCityBySlug(slug);
  const seo = getCitySeoContent(slug);
  const cityName = city?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  // Layout title.template appends `| Imagineering India` — do not include brand here.
  const title = seo?.metaTitle || `Contractors & Local Services in ${cityName}`;
  const description =
    seo?.metaDescription ||
    `Find verified contractors and local services in ${cityName}. Compare quotes and book construction services on Imagineering India.`;

  return {
    title,
    description,
    keywords: seo?.metaKeywords,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Page() {
  return <CityServicesPage />;
}
