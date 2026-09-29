"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useCountUp } from "@/hooks/useCountUp";

const stats = [
  { value: 10, suffix: "+", label: "Service categories" },
  { value: 1000, suffix: "+", label: "Verified providers" },
  { value: 10000, suffix: "+", label: "Customers served" },
  { value: 50, suffix: "+", label: "Cities" },
] as const;

function StatItem({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const { count, ref } = useCountUp({ end: value, duration: 1600 });

  return (
    <div ref={ref} className="px-2 py-4 text-center sm:px-4 sm:py-2">
      <p className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {count.toLocaleString("en-IN")}
        <span className="text-[hsl(var(--red-accent))]">{suffix}</span>
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{label}</p>
    </div>
  );
}

const StatsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="border-b border-border/60 bg-background py-12 sm:py-14 md:py-16">
      <div
        ref={ref}
        className={`container mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Where we stand today
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Numbers from our live network across India — updated as of{" "}
            {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 divide-y divide-border sm:mt-10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <StatItem
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
