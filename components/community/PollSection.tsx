"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const pollOptions = [
  { label: "Verified contractors with fixed bids", value: 48 },
  { label: "Faster response times", value: 32 },
  { label: "More equipment rental options", value: 20 },
];

const PollSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="container px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400">
              Community Poll
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Help shape our platform's future
            </p>
          </div>
        </div>
        <Card className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-3xl bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/10">
          <CardHeader className="p-5 sm:p-6 bg-gradient-to-r from-green-50/50 to-teal-50/50 dark:from-green-950/20 dark:to-teal-950/20 border-b-2 border-gray-200/50 dark:border-gray-700/50">
            <CardTitle className="text-lg sm:text-xl leading-snug font-bold">
              What should we improve next for service providers and customers?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 p-5 sm:p-6">
            {pollOptions.map((opt, idx) => (
              <div key={opt.label} className="space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="pr-2 font-medium text-foreground">{opt.label}</span>
                  <span className="font-bold text-green-600 dark:text-green-400">{opt.value}%</span>
                </div>
                <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-500 shadow-lg"
                    style={{ 
                      width: `${opt.value}%`,
                      animationDelay: `${idx * 100}ms`
                    }}
                  />
                </div>
              </div>
            ))}
            <Button className="w-full mt-4 text-sm sm:text-base h-11 sm:h-12 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/30 font-bold text-lg">
              Cast Your Vote
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PollSection;

