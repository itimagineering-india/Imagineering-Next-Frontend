import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  TrendingUp,
  DollarSign,
  CreditCard,
} from "lucide-react";

interface BookingStats {
  total: number;
  new: number;
  ongoing: number;
  completed: number;
  cancelled: number;
  totalEarnings: number;
  totalCommission: number;
}

interface BookingStatsCardsProps {
  stats: BookingStats;
  isLoading?: boolean;
}

export function BookingStatsCards({ stats, isLoading }: BookingStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
              <div className="h-3 sm:h-4 w-16 sm:w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-3 sm:h-4 sm:w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="h-6 sm:h-8 w-12 sm:w-16 bg-muted animate-pulse rounded mb-1 sm:mb-2" />
              <div className="h-2.5 sm:h-3 w-16 sm:w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
          <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Total Bookings</CardTitle>
          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{stats.total}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">All time bookings</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
          <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Ongoing Jobs</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{stats.ongoing}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Active projects</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
          <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Total Earnings</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">₹{stats.totalEarnings.toLocaleString()}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Net earnings</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:pb-2">
          <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight">Commission</CardTitle>
          <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">₹{stats.totalCommission.toLocaleString()}</div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Platform fees</p>
        </CardContent>
      </Card>
    </div>
  );
}

