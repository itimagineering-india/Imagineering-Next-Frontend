"use client";

import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Construction Business Owner",
    location: "Mumbai",
    rating: 5,
    text: "Finding reliable machinery rentals used to take hours. Imagineering India connected me with verified providers nearby — fast and hassle-free.",
    avatar: "",
  },
  {
    name: "Priya Sharma",
    role: "Homeowner",
    location: "Delhi",
    rating: 5,
    text: "The map-based search and verification gave me confidence in choosing the right contractor.",
    avatar: "",
  },
  {
    name: "Amit Patel",
    role: "Logistics Manager",
    location: "Bangalore",
    rating: 5,
    text: "All logistics providers in one place with transparent pricing — a game-changer for daily operations.",
    avatar: "",
  },
  {
    name: "Sneha Reddy",
    role: "Real Estate Developer",
    location: "Hyderabad",
    rating: 5,
    text: "Quick access to land and construction services helped us move faster on projects.",
    avatar: "",
  },
  {
    name: "Vikram Singh",
    role: "Small Business Owner",
    location: "Pune",
    rating: 5,
    text: "From finding vendors to renting space, this platform has everything I need. The verified provider system gives me peace of mind when making business decisions.",
    avatar: "",
  },
  {
    name: "Anjali Mehta",
    role: "Event Organizer",
    location: "Chennai",
    rating: 5,
    text: "Finding rental services for events used to be stressful. Now I can compare multiple providers, see their locations on a map, and contact them directly. It's revolutionized my workflow.",
    avatar: "",
  },
];

const TestimonialsSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation({ threshold: 0.1 });

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
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Real experiences from people who found trusted services through our platform
          </p>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {testimonials.map((testimonial, index) => (
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
                <div className="flex items-center gap-1 mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-[hsl(var(--red-accent))] text-[hsl(var(--red-accent))] group-hover:scale-110 transition-transform duration-300"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
                <Quote className="h-6 w-6 sm:h-8 sm:w-8 text-[hsl(var(--red-accent))]/20 mb-3 sm:mb-4 group-hover:text-[hsl(var(--red-accent))]/40 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300" />
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 group-hover:text-foreground transition-colors duration-300">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-2 sm:gap-3 group-hover:translate-x-1 transition-transform duration-300">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 group-hover:scale-110 group-hover:ring-2 group-hover:ring-[hsl(var(--red-accent))]/30 transition-all duration-300">
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback className="bg-[hsl(var(--red-accent))]/10 text-[hsl(var(--red-accent))] text-xs sm:text-sm">
                      {testimonial.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-[hsl(var(--red-accent))] transition-colors duration-300">
                      {testimonial.name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors duration-300">
                      {testimonial.role} • {testimonial.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

