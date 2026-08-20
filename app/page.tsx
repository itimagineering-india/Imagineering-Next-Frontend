import type { Metadata } from "next";
import { HomeRequirementPopup } from "@/components/home/HomeRequirementPopup";
import { HeroSection } from "@/components/home/HeroSection";
import { SearchBarSection } from "@/components/home/SearchBarSection";
import { FeaturedCategoryCardsSection } from "@/components/home/FeaturedCategoryCardsSection";
import { TrustStatsSection } from "@/components/home/TrustStatsSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { HomePromoBannersSection } from "@/components/home/HomePromoBannersSection";
import { ConstructionCalculatorBannerSection } from "@/components/home/ConstructionCalculatorBannerSection";
import { TopProvidersSection } from "@/components/home/TopProvidersSection";
import { CategorySections } from "@/components/home/CategorySections";
import { PlatformAudienceSection } from "@/components/home/PlatformAudienceSection";
import { ImagineeringCreditHomeSection } from "@/components/home/ImagineeringCreditHomeSection";
import { BASE_URL } from "@/lib/constants";
import {
  getHomeBanners,
  getHomeCategorySections,
  getHomeProviderGlobeMarkers,
  getHomeTopProviders,
} from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
  openGraph: {
    url: BASE_URL,
    title: "Imagineering India - Find Verified Service Providers Near You",
    description:
      "Connect with verified service providers for machines, contractors, logistics, and spaces. Transparent pricing and real reviews.",
  },
};

/** Home layout: Hero → Search → Featured categories → Services → Top providers → Categories → Imagineering Credit */
export default async function Home() {
  const [banners, categorySections, topProviders, globeMarkers] = await Promise.all([
    getHomeBanners("home"),
    getHomeCategorySections({ limit: 9 }),
    getHomeTopProviders(10),
    getHomeProviderGlobeMarkers(),
  ]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeRequirementPopup />
      <main className="flex-1">
        <HeroSection initialBanners={banners} />
        <SearchBarSection />
        <FeaturedCategoryCardsSection />
        <TrustStatsSection globeMarkers={globeMarkers} />
        <ServicesSection />
        <ConstructionCalculatorBannerSection />
        <HomePromoBannersSection />
        <TopProvidersSection initialProviders={topProviders} />
        <CategorySections initialSections={categorySections} />
        <ImagineeringCreditHomeSection />
        <PlatformAudienceSection />
      </main>
    </div>
  );
}
