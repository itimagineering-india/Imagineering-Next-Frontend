"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const leaders = [
  { name: "Anjali Mehta", points: 1280, rank: 1 },
  { name: "Raj Logistics", points: 1120, rank: 2 },
  { name: "Priya Verma", points: 980, rank: 3 },
  { name: "Karan Singh", points: 860, rank: 4 },
];

const Leaderboard = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-yellow-50 dark:from-gray-950 dark:to-yellow-950/20">
      <div className="container px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400">
              Top Contributors
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Community champions making a difference
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="text-xs w-fit bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
          >
            📅 This Week
          </Badge>
        </div>
        <Card className="border-2 border-gray-200/50 dark:border-gray-700/50 shadow-xl max-w-3xl bg-white dark:bg-gray-900">
          <CardHeader className="p-5 sm:p-6 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/20 dark:to-orange-950/20 border-b-2 border-gray-200/50 dark:border-gray-700/50">
            <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              🏆 Hall of Fame
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3 p-5 sm:p-6">
            {leaders.map((leader, idx) => (
              <div 
                key={leader.name} 
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                  leader.rank === 1 
                    ? 'border-yellow-400 dark:border-yellow-600 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 shadow-lg' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700 bg-white dark:bg-gray-800/50'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <Badge 
                  variant={leader.rank === 1 ? "default" : "outline"} 
                  className={`w-10 sm:w-12 h-10 sm:h-12 justify-center text-base sm:text-lg font-bold ${
                    leader.rank === 1 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-lg' 
                      : 'text-foreground'
                  }`}
                >
                  #{leader.rank}
                </Badge>
                <Avatar className={`h-10 w-10 sm:h-12 sm:w-12 ${
                  leader.rank === 1 ? 'ring-4 ring-yellow-400/50 dark:ring-yellow-600/50' : 'ring-2 ring-gray-300 dark:ring-gray-700'
                }`}>
                  <AvatarFallback className={`text-sm sm:text-base font-bold ${
                    leader.rank === 1 
                      ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' 
                      : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
                  }`}>
                    {leader.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base font-bold truncate ${
                    leader.rank === 1 
                      ? 'text-yellow-700 dark:text-yellow-300' 
                      : 'text-foreground'
                  }`}>
                    {leader.name}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    🎯 {leader.points.toLocaleString()} points
                  </p>
                </div>
                {leader.rank === 1 && (
                  <div className="hidden sm:block text-2xl animate-pulse">
                    👑
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Leaderboard;

