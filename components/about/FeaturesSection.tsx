"use client";

import { Grid3X3, MapPin, Phone, Shield, BadgeCheck, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    icon: Grid3X3,
    title: "All Services in One Place",
    description: "Access 16+ service categories from a single platform.",
  },
  {
    icon: MapPin,
    title: "Map-Based Discovery",
    description: "Find providers near your project location using real-time maps.",
  },
  {
    icon: Phone,
    title: "Direct Contact (Premium)",
    description: "Connect directly with providers through premium access options.",
  },
  {
    icon: Shield,
    title: "Secure Bookings",
    description: "Platform-assisted, secure booking workflows for peace of mind.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Providers",
    description: "Every provider undergoes a structured verification process.",
  },
  {
    icon: DollarSign,
    title: "Transparent Pricing",
    description: "Clear, upfront pricing with no hidden costs.",
  },
];

const FeaturesSection = () => {
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
            What We Offer
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
          Everything You Need to Connect with Trusted Service Providers
          </p>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden ${
                cardsVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--red-accent))]/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-[hsl(var(--red-accent))]/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-[hsl(var(--red-accent))]/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(var(--red-accent))] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2 group-hover:text-[hsl(var(--red-accent))] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm group-hover:text-foreground transition-colors duration-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
