"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hammer,
  Wrench,
  Home,
  Building2,
  Paintbrush,
  LayoutDashboard,
  BookOpen,
  Leaf,
  Settings2,
} from "lucide-react";

const topics = [
  { title: "Contractors", icon: Hammer },
  { title: "Machines", icon: Wrench },
  { title: "Home Services", icon: Home },
  { title: "Real Estate", icon: Building2 },
  { title: "Renovation", icon: Paintbrush },
  { title: "Interior", icon: LayoutDashboard },
  { title: "Training", icon: BookOpen },
  { title: "Gardening", icon: Leaf },
  { title: "Maintenance", icon: Settings2 },
];

const TopicsSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-gray-950">
      <div className="container px-4 sm:px-6 space-y-8 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400">
              Explore by Topic
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Discover conversations in your area of interest
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {["Contractors", "Machines", "Interiors", "Logistics", "Home Repair"].map((pill) => (
                <Badge 
                  key={pill} 
                  variant="outline" 
                  className="rounded-full px-3 py-1 text-xs border-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all"
                >
                  {pill}
                </Badge>
              ))}
            </div>
          </div>
          <Badge 
            variant="secondary" 
            className="hidden sm:inline-flex text-xs bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800"
          >
            🔥 Trending
          </Badge>
        </div>
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {topics.map((topic, idx) => (
            <Card
              key={topic.title}
              className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-md hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 cursor-pointer group bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:-translate-y-2"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <CardContent className="p-5 sm:p-6 flex items-center gap-3 sm:gap-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg flex-shrink-0">
                  <topic.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {topic.title}
                  </p>
                  <p className="text-xs text-muted-foreground">Browse discussions</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopicsSection;

