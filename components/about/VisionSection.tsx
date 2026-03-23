"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import visionImage from "@/assets/vision-image.jpg";

const VisionSection = () => {
  const { ref: textRef, isVisible: textVisible } = useScrollAnimation({ threshold: 0.2 });
  const { ref: imageRef, isVisible: imageVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 lg:gap-16 items-center">
          <div 
            ref={textRef}
            className={`transition-all duration-1000 delay-100 ${
              textVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4 sm:mb-6 hover:text-primary transition-colors duration-300">
              Our Vision
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 hover:text-foreground transition-colors duration-300">
            We envision a world where finding trusted service providers is as simple as a few clicks.
            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed hover:text-foreground transition-colors duration-300">
            Our mission is to simplify access to essential services by building a unified, verified platform that bridges the gap between service seekers and dependable providers.

            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed hover:text-foreground transition-colors duration-300">
            From construction machinery and contractors to logistics and real estate support, Imagineering India exists to remove friction, save time, and improve decision confidence — for every project, big or small.

            </p>
            <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed hover:text-foreground transition-colors duration-300">
            Our vision: Connecting people and projects with trusted services.

            </p>
          </div>
          <div 
            ref={imageRef}
            className={`flex items-center justify-center transition-all duration-1000 delay-200 group ${
              imageVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-8 scale-95"
            }`}
          >
            <div className="w-full max-w-md overflow-hidden rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-105 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              <img 
                src={typeof visionImage === "string" ? visionImage : visionImage.src} 
                alt="Our vision - connecting people with trusted services" 
                className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;
