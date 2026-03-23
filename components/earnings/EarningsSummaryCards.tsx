import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, Wallet } from "lucide-react";

interface Earnings {
  totalEarnings: number;
  withdrawableBalance: number;
  totalCommission: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  premiumRevenue: number;
  pendingPayouts: number;
}

interface EarningsSummaryCardsProps {
  earnings: Earnings;
}

export function EarningsSummaryCards({
  earnings,
}: EarningsSummaryCardsProps) {
  const earningsGrowth = earnings.lastMonthEarnings > 0
    ? ((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium">Total Earnings</CardTitle>
          <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold">₹{earnings.totalEarnings.toLocaleString()}</div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            All time earnings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium">Withdrawable Balance</CardTitle>
          <Wallet className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-success">
            ₹{earnings.withdrawableBalance.toLocaleString()}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            Payouts are released after completion approval
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium">This Month</CardTitle>
          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold">₹{earnings.thisMonthEarnings.toLocaleString()}</div>
          <div className="flex items-center gap-1 text-[10px] md:text-xs mt-1">
            {earningsGrowth > 0 ? (
              <span className="text-success">
                +{earningsGrowth.toFixed(1)}% from last month
              </span>
            ) : (
              <span className="text-destructive">
                {earningsGrowth.toFixed(1)}% from last month
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6">
          <CardTitle className="text-xs md:text-sm font-medium">Total Commission</CardTitle>
          <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-xl md:text-2xl font-bold text-warning">
            ₹{earnings.totalCommission.toLocaleString()}
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
            Platform commission deducted
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

