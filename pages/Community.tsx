"use client";
import { useEffect } from "react";
import HeroCommunity from "@/components/community/HeroCommunity";
import TopicsSection from "@/components/community/TopicsSection";
import FeedSection from "@/components/community/FeedSection";
import ExpertsSection from "@/components/community/ExpertsSection";
import QnASection from "@/components/community/QnASection";
import GuidesSection from "@/components/community/GuidesSection";
import PollSection from "@/components/community/PollSection";
import StoriesCarousel from "@/components/community/StoriesCarousel";
import Leaderboard from "@/components/community/Leaderboard";

export async function getServerSideProps() { return { props: {} }; }

const Community = () => {
  useEffect(() => {
    const title = "Community | Imagineering India";
    const description =
      "Join the Imagineering India community to ask questions, share experiences, and learn from other buyers and providers across construction, materials, logistics, and services.";

    document.title = title;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">
        <HeroCommunity />
        <TopicsSection />
        <FeedSection />
        <ExpertsSection />
        <QnASection />
        <GuidesSection />
        <PollSection />
        <StoriesCarousel />
        <Leaderboard />
      </main>
    </div>
  );
};

export default Community;

