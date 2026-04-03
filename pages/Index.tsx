"use client";
import { HomeRequirementPopup } from "@/components/home/HomeRequirementPopup";
import { HeroSection } from "@/components/home/HeroSection";
import { SearchBarSection } from "@/components/home/SearchBarSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { JobsSection } from "@/components/home/JobsSection";
import { TopProvidersSection } from "@/components/home/TopProvidersSection";
import { CategorySections } from "@/components/home/CategorySections";
import { AppDownloadSection } from "@/components/home/AppDownloadSection";

export async function getServerSideProps() {
  return { props: {} };
}

/** Same section order as Vite/React `src/pages/Index.tsx` */
const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HomeRequirementPopup />
      <main className="flex-1">
        <HeroSection />
        <SearchBarSection />
        <ServicesSection />
        <JobsSection />
        <TopProvidersSection />
        <CategorySections />
        <AppDownloadSection />
      </main>
    </div>
  );
};

export default Index;
