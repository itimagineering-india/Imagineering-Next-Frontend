"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const stories = [
  {
    title: "Before/After: Factory floor resurfacing",
    description: "Reduced downtime by 30% with staged execution and night shifts.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Logistics turnaround in 48 hours",
    description: "Coordinated containers and cranes for an urgent move across cities.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Home renovation done right",
    description: "Verified contractors, transparent pricing, and milestone-based payments.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
  },
];

const StoriesCarousel = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-pink-50 dark:from-gray-950 dark:to-pink-950/20">
      <div className="container px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400">
              Success Stories
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Real transformations from our community
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-3">
          {stories.map((story, idx) => (
            <Card 
              key={story.title} 
              className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-gray-900 group overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardHeader className="space-y-3 p-0">
                <div className="overflow-hidden relative">
                  <img 
                    src={story.image} 
                    alt={story.title} 
                    className="w-full h-44 sm:h-52 object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="text-white font-bold text-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      ✨ Featured
                    </div>
                  </div>
                </div>
                <div className="px-4 sm:px-5 pt-2">
                  <CardTitle className="text-base sm:text-lg lg:text-xl leading-snug group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors font-bold">
                    {story.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm sm:text-base text-muted-foreground px-4 sm:px-5 pb-2">
                {story.description}
              </CardContent>
              <CardContent className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                <Button 
                  variant="link" 
                  className="px-0 gap-2 text-pink-600 dark:text-pink-400 text-sm sm:text-base h-auto font-semibold group-hover:gap-3 transition-all"
                >
                  Read Full Story
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoriesCarousel;

