"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, UserPlus } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-background">
      <div 
        ref={ref}
        className={`container mx-auto px-4 sm:px-6 text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
        }`}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8">
          Join thousands of satisfied customers and trusted providers on our platform today.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button 
            asChild 
            size="lg" 
            className="bg-[hsl(var(--red-accent))] hover:bg-[hsl(var(--red-accent))]/90 text-[hsl(var(--red-accent-foreground))] w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
          >
            <Link href="/services">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Find Services Near You</span>
            </Link>
          </Button>
          <Button 
            asChild 
            size="lg" 
            variant="outline"
            className="border-2 border-[hsl(var(--red-accent))] text-[hsl(var(--red-accent))] hover:bg-[hsl(var(--red-accent))]/10 w-full sm:w-auto text-sm sm:text-base h-10 sm:h-11 hover:scale-105 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group"
          >
            <Link href="/signup?type=provider">
              <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              Become a Provider
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
