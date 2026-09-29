"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const highlights = [
  {
    title: "Verified providers, not a random listing",
    description:
      "We check documents, licenses, and past work before a provider goes live — so you’re not starting from scratch on trust.",
  },
  {
    title: "Nearby first",
    description:
      "Search is built around your location. You see who can actually reach the site — materials, manpower, machines, or contractors.",
  },
  {
    title: "Quotes and bookings in one place",
    description:
      "Request a quote, compare offers, or book directly. Payments, status, and invoices stay on the platform instead of scattered chats.",
  },
  {
    title: "Support when the job gets messy",
    description:
      "Routine flows are automated. For complex requirements, our team helps coordinate so the work doesn’t stall.",
  },
] as const;

const HighlightsSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section id="why" className="border-b border-border/60 bg-background py-12 sm:py-16 md:py-20">
      <div
        ref={ref}
        className={`container mx-auto px-4 sm:px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            Why people use Imagineering India
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Construction work needs the right people and materials near the site. That’s what this platform is built for.
          </p>
        </div>

        <ul className="mt-10 grid gap-8 sm:mt-12 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
          {highlights.map((item) => (
            <li key={item.title} className="border-t border-border pt-5">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HighlightsSection;
