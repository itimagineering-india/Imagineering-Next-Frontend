"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProviderKycStatus } from "@/hooks/useProviderKycStatus";
import { KycLock } from "@/components/provider/KycLock";
import api from "@/lib/api-client";
import { EarningsSummaryCards, TransactionsTable, InvoicesTable, PayoutsTable } from "@/components/earnings";

export async function getServerSideProps() { return { props: {} }; }

interface Transaction {
  id: string;
  date: string;
  type: "earning" | "commission" | "payout" | "refund";
  description: string;
  amount: number;
  bookingId?: string;
  invoiceId?: string;
}

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

export default function ProviderEarnings() {
  const { status: kycStatus } = useProviderKycStatus();
  const isLocked = kycStatus !== "KYC_APPROVED";
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    withdrawableBalance: 0,
    totalCommission: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0,
    premiumRevenue: 0,
    pendingPayouts: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchEarningsData();
  }, [periodFilter]);

  const fetchEarningsData = async () => {
    setIsLoading(true);
    try {
      // Fetch data in parallel
      const [summaryResponse, transactionsResponse, invoicesResponse, payoutsResponse] = await Promise.all([
        api.earnings.getSummary(),
        api.earnings.getTransactions(periodFilter),
        api.earnings.getInvoices(),
        api.earnings.getPayouts()
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setEarnings(summaryResponse.data);
      }

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data.map((t: any) => ({
          ...t,
          date: new Date(t.date).toISOString().split('T')[0],
        })));
      }

      if (invoicesResponse.success && invoicesResponse.data) {
        setInvoices(invoicesResponse.data.map((inv: any) => ({
          ...inv,
          date: new Date(inv.date).toISOString().split('T')[0],
        })));
      }

      if (payoutsResponse.success && payoutsResponse.data) {
        setPayouts(payoutsResponse.data.map((p: any) => ({
          ...p,
          date: new Date(p.date).toISOString().split('T')[0],
        })));
      }
    } catch (error) {
      console.error("Failed to fetch earnings data:", error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };




  const handleDownloadInvoice = async (invoiceId: string) => {
    toast({
      title: "Download Started",
      description: "Preparing your invoice PDF...",
    });

    try {
      await api.invoices.downloadPdf(invoiceId);
      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error: any) {
      console.error("Failed to download invoice:", error);
      toast({
        title: "Download Failed",
        description: error.message || "Could not download the invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = async (invoice: { _id: string; pdfUrl?: string }) => {
    try {
      await api.invoices.viewPdf(invoice);
    } catch (error: any) {
      toast({
        title: "View Failed",
        description: error.message || "Could not open the invoice. Please try download instead.",
        variant: "destructive",
      });
    }
  };


  if (isLocked) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
          <KycLock status={kycStatus} title="Earnings are locked" message="Complete KYC to view and withdraw earnings." />
        </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Earnings
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Track your financial activity and earnings
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm" className="text-xs md:text-sm">
              <Link href="/dashboard/provider/payouts">Payouts</Link>
            </Button>
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-36 md:w-40 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-xs md:text-sm">
              <Download className="h-3 w-3 md:h-4 md:w-4 mr-2 md:mr-2" />
              <span className="hidden sm:inline">Export</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <EarningsSummaryCards
          earnings={earnings}
        />

        {/* Tabs for different sections */}
        <Tabs defaultValue="transactions" className="space-y-3 md:space-y-4">
          <TabsList className="flex-wrap h-auto p-1">
            <TabsTrigger value="transactions" className="text-xs md:text-sm">Transactions</TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs md:text-sm">Payouts</TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs md:text-sm">Invoices</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <TransactionsTable transactions={transactions} isLoading={isLoading} />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <PayoutsTable payouts={payouts} isLoading={isLoading} showOnlyCompleted={false} />
              <PayoutsTable payouts={payouts} isLoading={isLoading} showOnlyCompleted={true} />
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <InvoicesTable invoices={invoices} isLoading={isLoading} onDownload={handleDownloadInvoice} onView={handleViewInvoice} />
          </TabsContent>
        </Tabs>
      </div>
  );
}















