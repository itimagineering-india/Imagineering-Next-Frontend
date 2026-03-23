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
import { Button } from "@/components/ui/button";
import { Download, Receipt, ExternalLink } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: string;
  bookingId: string;
  invoiceType: string;
  downloadUrl?: string;
  pdfUrl?: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
  isLoading: boolean;
  onDownload: (invoiceId: string) => void;
  onView?: (invoice: { _id: string; pdfUrl?: string }) => void;
}

export function InvoicesTable({ invoices, isLoading, onDownload, onView }: InvoicesTableProps) {
  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-base md:text-lg">Invoices</CardTitle>
        <CardDescription className="text-xs md:text-sm">Download your invoices</CardDescription>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        {isLoading ? (
          <div className="text-center py-8 md:py-12 px-4">
            <p className="text-sm md:text-base text-muted-foreground">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8 md:py-12 px-4">
            <p className="text-sm md:text-base text-muted-foreground">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Invoice ID</TableHead>
                  <TableHead className="text-xs md:text-sm">Date</TableHead>
                  <TableHead className="text-xs md:text-sm">Amount</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                  <TableHead className="text-xs md:text-sm">Booking ID</TableHead>
                  <TableHead className="text-xs md:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="text-xs md:text-sm">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <Receipt className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[10px] md:text-xs break-all font-semibold">{invoice.invoiceNumber}</span>
                        </div>
                        <span className="text-[9px] md:text-[10px] text-muted-foreground ml-5 md:ml-6">{invoice.invoiceType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm whitespace-nowrap">
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <span className="font-semibold">
                        ₹{invoice.amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <Badge
                        variant={
                          invoice.status === "paid" || invoice.status === "generated"
                            ? "default"
                            : invoice.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-[10px] md:text-xs capitalize"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <span className="text-[10px] md:text-xs text-muted-foreground font-mono break-all">
                        {invoice.bookingId}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs md:text-sm">
                      <div className="flex items-center gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs md:text-sm h-7 md:h-9"
                            onClick={() => onView({ _id: invoice.id, pdfUrl: invoice.pdfUrl })}
                          >
                            <ExternalLink className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">View</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs md:text-sm h-7 md:h-9"
                          onClick={() => onDownload(invoice.id)}
                        >
                          <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">DL</span>
                        </Button>
                      </div>
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

