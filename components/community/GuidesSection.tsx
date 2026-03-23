"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const guides = [
  {
    title: "How to scope a renovation project in 7 steps",
    description: "Templates, timelines, and checks to avoid budget creep.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Choosing the right excavator for your site",
    description: "Capacity, attachments, and transport considerations explained simply.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Maintenance playbook for rental equipment",
    description: "Preventive schedules, spares planning, and audit checklists.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  },
];

const GuidesSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-purple-50 dark:from-gray-950 dark:to-purple-950/20">
      <div className="container px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              Tips & Guides
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Learn from community experts and success stories
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide, idx) => (
            <Card 
              key={guide.title} 
              className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-gray-900 group overflow-hidden"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardHeader className="space-y-3 sm:space-y-4 p-0">
                <div className="overflow-hidden relative">
                  <img 
                    src={guide.image} 
                    alt={guide.title} 
                    className="w-full h-40 sm:h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="px-4 sm:px-5">
                  <CardTitle className="text-base sm:text-lg lg:text-xl leading-snug group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-bold">
                    {guide.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm sm:text-base text-muted-foreground px-4 sm:px-5 pb-3">
                {guide.description}
              </CardContent>
              <CardFooter className="px-4 sm:px-5 pb-4 sm:pb-5">
                <Button 
                  variant="link" 
                  className="px-0 gap-2 text-purple-600 dark:text-purple-400 text-sm sm:text-base h-auto font-semibold group-hover:gap-3 transition-all"
                >
                  Read More
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GuidesSection;

