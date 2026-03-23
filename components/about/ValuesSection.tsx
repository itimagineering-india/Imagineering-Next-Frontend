"use client";

import { Heart, Shield, Users, Zap, Target, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const values = [
  {
    icon: Shield,
    title: "Trust & Reliability",
    description: "Every provider is verified to ensure dependable service quality.",
  },
  {
    icon: Users,
    title: "Customer First",
    description: "Your requirements guide every decision we make.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We continuously improve our platform using smart, scalable technology.",
  },
  {
    icon: Heart,
    title: "Transparency",
    description: "Clear pricing, honest reviews, and open communication — always.",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "High standards in every interaction, without compromise.",
  },
  {
    icon: Award,
    title: "Integrity",
    description: "We operate with honesty, fairness, and ethical practices.",
  },
];

const ValuesSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={headerRef}
          className={`text-center mb-8 sm:mb-10 md:mb-12 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Our Core Values
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            The principles that guide us in building a trusted service marketplace
          </p>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {values.map((value, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden ${
                cardsVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--red-accent))]/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardContent className="p-4 sm:p-6 text-center relative z-10">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[hsl(var(--red-accent))]/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-[hsl(var(--red-accent))]/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 relative">
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--red-accent))] opacity-0 group-hover:opacity-20 animate-ping" />
                  <value.icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-[hsl(var(--red-accent))] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2 group-hover:text-[hsl(var(--red-accent))] transition-colors duration-300">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuesSection;

