"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

const experts = [
  {
    name: "Sarah Johnson",
    category: "Contractor",
    rating: 4.9,
    avatar: "",
  },
  {
    name: "Amit Patel",
    category: "Electrician",
    rating: 4.8,
    avatar: "",
  },
  {
    name: "Priya Verma",
    category: "Trainer",
    rating: 4.7,
    avatar: "",
  },
  {
    name: "Michael Chen",
    category: "Logistics",
    rating: 4.9,
    avatar: "",
  },
];

const ExpertsSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-blue-50 dark:from-gray-950 dark:to-blue-950/20">
      <div className="container px-4 sm:px-6 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
              Featured Experts
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Top-rated providers trusted by our community
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs w-fit bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
          >
            ⭐ Curated
          </Badge>
        </div>
        <div className="grid gap-4 sm:gap-5 grid-cols-2 lg:grid-cols-4">
          {experts.map((expert, idx) => (
            <Card 
              key={expert.name} 
              className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white dark:bg-gray-900 group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <CardHeader className="flex flex-col items-center text-center space-y-3 sm:space-y-4 p-4 sm:p-6">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-blue-500/20 group-hover:ring-blue-500/40 transition-all">
                  {expert.avatar ? (
                    <AvatarImage src={expert.avatar} alt={expert.name} />
                  ) : (
                    <AvatarFallback className="text-sm sm:text-base bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                      {expert.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-2">
                  <CardTitle className="text-sm sm:text-base lg:text-lg line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {expert.name}
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] sm:text-xs bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300"
                  >
                    {expert.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center gap-2 text-xs sm:text-sm text-foreground p-3 sm:p-4 pt-0">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-500 text-yellow-500" />
                <span className="font-bold text-lg">{expert.rating}</span>
                <span className="text-muted-foreground text-xs">rating</span>
              </CardContent>
              <CardFooter className="flex justify-center p-4 sm:p-6 pt-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full text-xs sm:text-sm h-9 sm:h-10 border-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300 dark:hover:border-blue-700 transition-all font-semibold"
                >
                  View Profile
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExpertsSection;

