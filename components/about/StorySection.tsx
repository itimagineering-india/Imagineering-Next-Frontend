"use client";

import { Building2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import awardImage from "@/assets/awardimagerkc.jpeg";

const StorySection = () => {
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: textRef, isVisible: textVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          <div
            ref={imageRef}
            className={`flex items-center justify-center order-2 md:order-1 transition-all duration-1000 delay-100 group ${imageVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-8 scale-95"
              }`}
          >
            <div className="w-full max-w-md aspect-[4/3] bg-gradient-to-br from-[hsl(var(--red-accent))]/10 via-muted/50 to-[hsl(var(--red-accent))]/5 rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500">
              <img
                src={typeof awardImage === "string" ? awardImage : awardImage.src}
                alt="Award"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl relative z-10 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-grid-pattern opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--red-accent))]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </div>
          <div
            ref={textRef}
            className={`order-1 md:order-2 transition-all duration-1000 delay-200 ${textVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 hover:text-primary transition-colors duration-300">
              Our Story
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 hover:text-foreground transition-colors duration-300">
              The idea of building a digital solution for the construction marketplace first took shape in 2016. Over the years, we closely observed the industry, studied its challenges, and worked to understand what a truly effective platform would require. After extensive groundwork and real-world learning, development began in 2023.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 hover:text-foreground transition-colors duration-300">
            Founded in September 2025, Imagineering India was built on a simple yet powerful insight:
            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 hover:text-foreground transition-colors duration-300">
            Finding reliable service providers shouldn’t be this difficult.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed hover:text-foreground transition-colors duration-300">
            Across construction, logistics, rentals, and real estate, the process was fragmented, time-consuming, and often inconsistent. Service seekers struggled to find trusted providers, while genuine providers lacked a reliable way to reach the right customers. Imagineering India was created to bridge this gap—bringing essential services together on one trusted, location-first platform.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed hover:text-foreground transition-colors duration-300">
            In our first year, we connected thousands of customers with verified providers across 50+ cities. Today, we continue to expand our network and service categories, guided by real customer needs and on-ground execution challenges.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed hover:text-foreground transition-colors duration-300">We are proud to support businesses, contractors, developers, and individuals with a platform built on trust, transparency, and reliability—designed to simplify service discovery and deliver confidence at every step.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;
