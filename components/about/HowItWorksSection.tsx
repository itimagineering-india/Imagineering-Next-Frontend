"use client";

import { Grid3X3, MapPin, Users, Phone } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  {
    icon: Grid3X3,
    title: "Choose a Category",
    description: "Select from 16+ service categories.",
    step: 1,
  },
  {
    icon: MapPin,
    title: "Enter Your Location",
    description: "Search by, my location, city, area, or postal code.",
    step: 2,
  },
  {
    icon: Users,
    title: "Compare Providers",
    description: "Review verified providers, ratings, and proximity.",
    step: 3,
  },
  {
    icon: Phone,
    title: "Contact or Book",
    description: "Connect directly or book through the platform.",
    step: 4,
  },
];

const HowItWorksSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: stepsRef, isVisible: stepsVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={headerRef}
          className={`text-center mb-8 sm:mb-10 md:mb-12 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
          Find the Right Provider in Four Simple Steps
          </p>
        </div>
        <div ref={stepsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`relative text-center transition-all duration-700 hover:scale-105 group ${
                stepsVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-[hsl(var(--red-accent))] to-border transition-all duration-1000 ${
                  stepsVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                }`} style={{ transitionDelay: `${(index + 1) * 200}ms`, transformOrigin: 'left' }} />
              )}
              
              {/* Step circle */}
              <div className="relative mx-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[hsl(var(--red-accent))] flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 group-hover:rotate-6">
                <div className="absolute inset-0 rounded-full bg-[hsl(var(--red-accent))] opacity-0 group-hover:opacity-20 animate-ping" />
                <step.icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-[hsl(var(--red-accent-foreground))] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-foreground text-background text-[10px] sm:text-xs font-bold flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-md">
                  {step.step}
                </span>
              </div>
              
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2 group-hover:text-[hsl(var(--red-accent))] transition-colors duration-300">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm group-hover:text-foreground transition-colors duration-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
