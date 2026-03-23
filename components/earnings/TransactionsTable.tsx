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
import { Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  type: "earning" | "commission" | "payout" | "refund";
  description: string;
  amount: number;
  bookingId?: string;
  invoiceId?: string;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case "earning":
      return <ArrowDownRight className="h-4 w-4 text-success" />;
    case "commission":
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case "payout":
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    case "refund":
      return <ArrowUpRight className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
};

export function TransactionsTable({ transactions, isLoading }: TransactionsTableProps) {
  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Transaction History</CardTitle>
        <CardDescription className="text-xs md:text-sm">All your earnings and deductions</CardDescription>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {isLoading ? (
          <div className="text-center py-8 md:py-12 px-4">
            <p className="text-sm md:text-base text-muted-foreground">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4">
            <p className="text-sm md:text-base text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Date</TableHead>
                  <TableHead className="text-xs md:text-sm">Type</TableHead>
                  <TableHead className="text-xs md:text-sm">Description</TableHead>
                  <TableHead className="text-right text-xs md:text-sm">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-xs md:text-sm">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span className="whitespace-nowrap">{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        {getTransactionIcon(transaction.type)}
                        <Badge variant="outline" className="capitalize text-[10px] md:text-xs">
                          {transaction.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <div>
                        <p className="font-medium text-xs md:text-sm">{transaction.description}</p>
                        {transaction.bookingId && (
                          <p className="text-[10px] md:text-xs text-muted-foreground">
                            Booking ID: {transaction.bookingId}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-xs md:text-sm">
                      <span
                        className={`font-semibold ${
                          transaction.amount > 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        ₹{Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

