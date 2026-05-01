import type { Metadata } from "next";
import { HomeRequirementPopup } from "@/components/home/HomeRequirementPopup";
import { HeroSection } from "@/components/home/HeroSection";
import { SearchBarSection } from "@/components/home/SearchBarSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { JobsSection } from "@/components/home/JobsSection";
import { BulkHireLabourCta } from "@/components/home/BulkHireLabourCta";
import { TopProvidersSection } from "@/components/home/TopProvidersSection";
import { CategorySections } from "@/components/home/CategorySections";
import { PlatformAudienceSection } from "@/components/home/PlatformAudienceSection";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
  openGraph: {
    url: BASE_URL,
    title: "Imagineering India - Find Verified Service Providers Near You",
    description:
      "Connect with verified service providers for machines, contractors, logistics, and spaces. Transparent pricing and real reviews.",
  },
};

/** Home layout matches Vite/React app: Hero → Search → Services → Jobs → Top providers → Categories */
export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeRequirementPopup />
      <main className="flex-1">
        <HeroSection />
        <SearchBarSection />
        <ServicesSection />
        <JobsSection />
        <BulkHireLabourCta />
        <TopProvidersSection />
        <CategorySections />
        <PlatformAudienceSection />
      </main>
    </div>
  );
}
