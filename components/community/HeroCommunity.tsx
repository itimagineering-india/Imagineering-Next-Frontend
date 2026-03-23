"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users, MessageSquare, TrendingUp, Sparkles } from "lucide-react";

const HeroCommunity = () => {
  return (
    <section className="relative overflow-hidden py-10 sm:py-16 md:py-24">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2400&q=80')",
        }}
      />
      
      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-purple-900/85 to-pink-900/90 dark:from-blue-950/95 dark:via-purple-950/90 dark:to-pink-950/95" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2),transparent_40%),radial-gradient(circle_at_70%_60%,rgba(168,85,247,0.15),transparent_40%),radial-gradient(circle_at_50%_80%,rgba(236,72,153,0.15),transparent_35%)]" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid-white/5" style={{ backgroundSize: "60px 60px" }} />
      
      {/* Floating shapes */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10 mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col items-center text-center gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight px-4 drop-shadow-2xl">
              Connect. Learn. Grow Together.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-50 dark:text-blue-100 leading-relaxed max-w-3xl mx-auto px-4 font-medium drop-shadow-lg">
              Join thousands of service professionals and customers sharing knowledge, experiences, and success stories.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4 animate-fade-in-up delay-200">
            <Button asChild size="lg" className="gap-2 w-full sm:w-auto bg-white text-purple-700 hover:bg-blue-50 shadow-2xl shadow-black/30 hover:shadow-3xl hover:scale-105 transition-all duration-300 text-base font-bold">
              <Link href="/community/new">
                <Plus className="h-5 w-5" />
                Create Post
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-2 border-white/40 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/60 transition-all duration-300 font-semibold">
              <Link href="/community">
                <MessageSquare className="h-5 w-5" />
                Browse Discussions
              </Link>
            </Button>
          </div>
          
          {/* Stats with icons */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 w-full max-w-4xl text-xs sm:text-sm px-4 mt-4 animate-fade-in-up delay-300">
            {[
              { label: "Active members", value: "12K+", icon: Users, color: "from-blue-400 to-cyan-400" },
              { label: "Answers shared", value: "48K+", icon: MessageSquare, color: "from-purple-400 to-pink-400" },
              { label: "Projects showcased", value: "3.2K", icon: TrendingUp, color: "from-orange-400 to-red-400" },
            ].map((item, idx) => (
              <div
                key={item.label}
                className="group rounded-2xl border-2 border-white/30 bg-white/20 dark:bg-white/10 backdrop-blur-xl p-4 sm:p-5 shadow-2xl hover:shadow-3xl hover:bg-white/30 dark:hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                      {item.value}
                    </div>
                    <div className="text-xs sm:text-sm text-blue-100 dark:text-blue-200 font-medium">
                      {item.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroCommunity;

