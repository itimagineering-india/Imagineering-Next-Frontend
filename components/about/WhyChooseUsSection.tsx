"use client";

import { BadgeCheck, MapPin, Zap, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const reasons = [
  {
    icon: BadgeCheck,
    title: "Verified Partners",
    description: "All providers undergo thorough verification to ensure quality and reliability.",
  },
  {
    icon: MapPin,
    title: "Real-Time Map Search",
    description: "Find services near you instantly with our interactive map-based discovery.",
  },
  {
    icon: Zap,
    title: "Fast & Transparent Process",
    description: "Clear pricing, quick responses, and no hidden fees throughout your journey.",
  },
  {
    icon: MessageSquare,
    title: "Flexible Contact Options",
    description: "Choose between direct provider contact or platform-assisted service booking.",
  },
];

const WhyChooseUsSection = () => {
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
          Why Teams Choose Imagineering India
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            We're committed to making your service discovery experience seamless and trustworthy
          </p>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {reasons.map((reason, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden ${
                cardsVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--red-accent))]/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardContent className="p-4 sm:p-6 flex gap-3 sm:gap-4 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[hsl(var(--red-accent))]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[hsl(var(--red-accent))]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <reason.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(var(--red-accent))] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-[hsl(var(--red-accent))] transition-colors duration-300">
                    {reason.title}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm group-hover:text-foreground transition-colors duration-300">
                    {reason.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSection;
