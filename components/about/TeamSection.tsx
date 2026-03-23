"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import type { StaticImageData } from "next/image";
import rakeshAvatar from "@/assets/RAKESH CHOUBEY 1.jpg";
import kiranAvatar from "@/assets/KIRAN.jpg"; 
import aniketAvatar from "@/assets/Aniket.jpeg";

type TeamMember = { name: string; role: string; avatar?: StaticImageData; bio: string };

const team: TeamMember[] = [
  {
    name: "Mr. Rakesh Kumar Choubey",
    role: "Founder & CEO",
    avatar: rakeshAvatar,
    bio: "Entrepreneur and industry professional with experience across construction, platforms, and operations.",
  },
  {
    name: "Mrs. Kiran Choubey",
    role: "Co-Founder",
    avatar: kiranAvatar,
    bio: "Leads vision, growth strategy, and user-focused initiatives.",
  },
  {
    name: "Mr. Anup Singh",
    role: "Chartered Accountant",
    //avatar: rakeshAvatar,
    bio: "Oversees finance, compliance, and regulatory frameworks.",
  },
  {
    name: "Mr. Aniket Verma",
    role: "Head of Technology",
    avatar: aniketAvatar,
    bio: "Leads platform architecture, scalability, and product development.",
  },
  
];

const TeamSection = () => {
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
            Meet Our Team
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            The passionate people behind our mission to simplify service discovery
          </p>
        </div>
        <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <Card 
              key={index} 
              className={`border-0 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 text-center group overflow-hidden ${
                cardsVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--red-accent))]/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardContent className="p-4 sm:p-6 relative z-10">
                <div className="relative mx-auto w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mb-3 sm:mb-4">
                  <Avatar className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mx-auto group-hover:scale-110 group-hover:ring-4 group-hover:ring-[hsl(var(--red-accent))]/30 transition-all duration-300">
                    <AvatarImage src={member.avatar?.src} alt={member.name} />
                    <AvatarFallback className="text-sm sm:text-base md:text-lg bg-[hsl(var(--red-accent))]/10 text-[hsl(var(--red-accent))]">
                      {member.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-[hsl(var(--red-accent))] opacity-0 group-hover:opacity-20 animate-ping" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 group-hover:text-[hsl(var(--red-accent))] transition-colors duration-300">
                  {member.name}
                </h3>
                <p className="text-[hsl(var(--red-accent))] text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 group-hover:scale-105 transition-transform duration-300">
                  {member.role}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed group-hover:text-foreground transition-colors duration-300">
                  {member.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;