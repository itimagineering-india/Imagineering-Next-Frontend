"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useCountUp } from "@/hooks/useCountUp";
import { TrendingUp, ShieldCheck, Globe2, Users } from "lucide-react";

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  index: number;
  isVisible: boolean;
}

const StatItem = ({ value, suffix, label, index, isVisible }: StatItemProps) => {
  const { count, ref } = useCountUp({ end: value, duration: 2000 });

  return (
    <div 
      ref={ref}
      className={`relative rounded-xl sm:rounded-2xl border bg-background/70 backdrop-blur shadow-sm p-3 sm:p-4 md:p-6 text-center transition-all duration-700 hover:scale-105 hover:shadow-xl hover:border-primary/30 group overflow-hidden ${
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none group-hover:from-primary/10 group-hover:to-primary/20 transition-all duration-500" />
      <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-1 sm:mb-2 relative z-10 group-hover:scale-110 transition-transform duration-300">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-muted-foreground text-xs sm:text-sm md:text-base relative z-10 leading-tight group-hover:text-foreground transition-colors duration-300">
        {label}
      </div>
    </div>
  );
};

const stats = [
  {
    value: 10,
    suffix: "+",
    label: "Service categories",
  },
  {
    value: 1000,
    suffix: "+",
    label: "Verified providers",
  },
  {
    value: 10000,
    suffix: "+",
    label: "Happy customers",
  },
  {
    value: 50,
    suffix: "+",
    label: "Cities covered",
  },
];

const StatsSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({ threshold: 0.3 });
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background via-muted/40 to-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div 
          ref={headerRef}
          className={`text-center mb-6 sm:mb-8 md:mb-10 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
            Building trust at scale
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Operational rigor, verified partners, and a location-first network that grows daily.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-2">
            Statistics as of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              index={index}
              isVisible={statsVisible}
            />
          ))}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10 grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs sm:text-sm text-muted-foreground">
          {[
            { icon: TrendingUp, text: "Measured growth with weekly quality audits." },
            { icon: ShieldCheck, text: "Verification across documents, licenses, and reviews." },
            { icon: Globe2, text: "Local coverage with standardized experiences." },
            { icon: Users, text: "Support teams for providers and buyers." }
          ].map((item, index) => (
            <div 
              key={index}
              className="flex items-start sm:items-center gap-2 hover:text-foreground transition-all duration-300 hover:translate-x-1 group"
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5 sm:mt-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
