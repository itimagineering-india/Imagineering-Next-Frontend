import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Calendar, CreditCard } from "lucide-react";

interface Payout {
  id: string;
  date: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  method: string;
  transactionId?: string;
  description: string;
}

interface PayoutsTableProps {
  payouts: Payout[];
  isLoading: boolean;
  showOnlyCompleted?: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return (
        <Badge className="bg-success text-success-foreground text-[10px] md:text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case "processing":
      return (
        <Badge className="bg-blue-500 text-white text-[10px] md:text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Processing
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="text-[10px] md:text-xs">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="text-[10px] md:text-xs">
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary" className="text-[10px] md:text-xs">{status}</Badge>;
  }
};

export function PayoutsTable({ payouts, isLoading, showOnlyCompleted = false }: PayoutsTableProps) {
  const filteredPayouts = showOnlyCompleted
    ? payouts.filter((p) => p.status !== "pending")
    : payouts.filter((p) => p.status === "pending" || p.status === "processing");

  const title = showOnlyCompleted ? "Payout History" : "Upcoming Payouts";
  const description = showOnlyCompleted
    ? "All your completed and processing payouts"
    : "Pending and scheduled payouts";

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
        <CardDescription className="text-xs md:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {isLoading ? (
          <div className="text-center py-8 md:py-12 px-4">
            <p className="text-sm md:text-base text-muted-foreground">Loading payouts...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4">
            <p className="text-sm md:text-base text-muted-foreground">
              {showOnlyCompleted ? "No payout history" : "No upcoming payouts"}
            </p>
          </div>
        ) : showOnlyCompleted ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Date</TableHead>
                  <TableHead className="text-xs md:text-sm">Amount</TableHead>
                  <TableHead className="text-xs md:text-sm">Method</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-xs md:text-sm">Transaction ID</TableHead>
                  <TableHead className="text-xs md:text-sm">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-xs md:text-sm whitespace-nowrap">
                      {new Date(payout.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <span className="font-semibold">
                        ₹{payout.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">{payout.method}</TableCell>
                    <TableCell className="text-xs md:text-sm">{getStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-xs md:text-sm">
                      {payout.transactionId ? (
                        <span className="text-[10px] md:text-xs text-muted-foreground font-mono break-all">
                          {payout.transactionId}
                        </span>
                      ) : (
                        <span className="text-[10px] md:text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <p className="text-xs md:text-sm">{payout.description}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4 p-4 md:p-0">
            {filteredPayouts.map((payout) => (
              <Card key={payout.id} className="border-l-4 border-l-primary">
                <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 md:gap-3 mb-2">
                        <div>
                          <p className="font-semibold text-base md:text-lg">
                            ₹{payout.amount.toLocaleString()}
                          </p>
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {payout.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span className="whitespace-nowrap">
                            {new Date(payout.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 shrink-0" />
                          <span>{payout.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      {getStatusBadge(payout.status)}
                      {payout.status === "pending" && (
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-2">
                          Scheduled payout
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

