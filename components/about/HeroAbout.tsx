"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import heroBackground from "@/assets/20945858.jpg";
import { Shield, MapPin, CheckCircle2, Sparkles } from "lucide-react";

const HeroAbout = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section 
      className="relative py-12 sm:py-16 md:py-20 lg:py-32 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/75 to-background/90" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.12),transparent_28%)]" />
      
      <div 
        ref={ref}
        className={`container mx-auto px-4 sm:px-6 text-center relative z-10 transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-background/70 backdrop-blur border text-xs sm:text-sm font-medium text-primary mb-4 sm:mb-6 transition-all duration-700 delay-200 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}>
          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
          <span className="whitespace-nowrap">Trusted service discovery for India</span>
        </div>
        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-6 max-w-4xl mx-auto leading-tight px-2 transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          Built to Make Finding Reliable Services Effortless
        </h1>
        <p className={`text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
         Imagineering India connects businesses and individuals with verified service providers across construction, machinery, contractors, logistics, real estate, and allied services — all through a location-first, transparent, and execution-ready platform.
        </p>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2 transition-all duration-1000 delay-500">Whether it’s sourcing heavy equipment, hiring a contractor, arranging logistics, or finding project-ready infrastructure, we help you connect with the right provider, at the right location, at the right time.</p>
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 transition-all duration-1000 delay-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <a
            href="/services"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[hsl(var(--red-accent))] text-[hsl(var(--red-accent-foreground))] font-semibold text-sm sm:text-base shadow-md hover:shadow-xl hover:translate-y-[-2px] hover:scale-105 transition-all duration-300 w-full sm:w-auto group relative overflow-hidden"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative z-10">Explore services</span>
          </a>
          <a
            href="/about#why"
            className="inline-flex items-center justify-center px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg border-2 border-border text-foreground font-semibold text-sm sm:text-base hover:bg-foreground/10 hover:border-primary/50 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
          >
            Why customers trust us
          </a>
        </div>
        <div className={`mt-6 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto transition-all duration-1000 delay-900 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          {[
            { icon: MapPin, text: "Location-first matching across 50+ cities" },
            { icon: CheckCircle2, text: "Verified providers & transparent pricing" },
            { icon: Sparkles, text: "Human support plus smart automation" }
          ].map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-2 sm:gap-3 justify-center rounded-lg sm:rounded-xl border bg-background/70 backdrop-blur px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-muted-foreground hover:bg-background/90 hover:border-primary/30 hover:scale-105 hover:shadow-lg transition-all duration-300 group"
              style={{ transitionDelay: `${900 + index * 100}ms` }}
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
              <span className="text-center">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroAbout;
