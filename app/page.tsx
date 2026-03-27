import type { Metadata } from "next";
import { HeroSection } from "@/components/home/HeroSection";
import { SearchBarSection } from "@/components/home/SearchBarSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { JobsSection } from "@/components/home/JobsSection";
import { BulkHireLabourCta } from "@/components/home/BulkHireLabourCta";
import { TopProvidersSection } from "@/components/home/TopProvidersSection";
import { CategorySections } from "@/components/home/CategorySections";
import { AppDownloadSection } from "@/components/home/AppDownloadSection";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: BASE_URL },
};

/** Home layout matches Vite/React app: Hero → Search → Services → Jobs → Top providers → Categories → App banner */
export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <SearchBarSection />
        <ServicesSection />
        <JobsSection />
        <BulkHireLabourCta />
        <TopProvidersSection />
        <CategorySections />
        <AppDownloadSection />
      </main>
    </div>
  );
}
