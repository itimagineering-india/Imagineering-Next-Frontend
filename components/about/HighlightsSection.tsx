"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ShieldCheck, MapPin, Clock3, Headphones, ClipboardCheck } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const highlights = [
  {
    title: "Verified Network, Not a Directory",
    description: "Every provider is vetted for documentation, licenses, responsiveness, and customer feedback before onboarding.",
    icon: ShieldCheck,
    badge: "Quality First",
  },
  {
    title: "Location-First Matching",
    description: "Identify who can serve you fastest with map-based discovery, proximity matching, and indicative ETAs.",
    icon: MapPin,
    badge: "Speed",
  },
  {
    title: "Transparent Engagement",
    description: "Clear scope, indicative pricing, and verified reviews — so you decide with confidence.",
    icon: ClipboardCheck,
    badge: "Clarity",
  },
  {
    title: "Human Help + Automation",
    description: "Concierge support for complex requirements, automated coordination for routine workflows.",
    icon: Headphones,
    badge: "Support",
  },
  {
    title: "Built for On-Time Delivery",
    description: "Milestones, reminders, and real-time status visibility help keep projects and rentals on track.",
    icon: Clock3,
    badge: "Reliability",
  },
  {
    title: "Built with User Feedback",
    description: "We roll out continuous improvements based on real feedback from buyers and providers.",
    icon: Sparkles,
    badge: "Iteration",
  },
];

const HighlightsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section id="why" className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container px-4 sm:px-6">
        <div 
          ref={ref}
          className={`text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Badge variant="outline" className="px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs uppercase tracking-wide">
          Why Teams Choose Imagineering India
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-3 sm:mt-4">
          A Professional, Trustworthy Way to Get Services Done
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg mt-2 sm:mt-3">
          From heavy machinery to logistics and real estate, we bring structure, transparency, and speed to every engagement.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item, index) => (
            <Card 
              key={item.title}
              className={`border-0 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden ${
                isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
              }`}
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[hsl(var(--red-accent))]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardHeader className="space-y-2 sm:space-y-3 p-4 sm:p-6 relative z-10">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                  <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:rotate-12 transition-transform duration-300" />
                  {item.badge}
                </div>
                <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors duration-300">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed p-4 sm:p-6 pt-0 relative z-10 group-hover:text-foreground transition-colors duration-300">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HighlightsSection;

