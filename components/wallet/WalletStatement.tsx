"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";
import { IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";
import {
  buildWalletStatementCsv,
  downloadWalletStatementCsv,
  formatInrFromPoints,
  formatWalletStatementDate,
  formatWalletTxnDetail,
  formatWalletTxnReference,
  formatWalletTxnTitle,
  type WalletStatementSummary,
  type WalletStatementTxn,
} from "@/lib/wallet-statement";

type FilterType = "all" | "credit" | "debit";

interface WalletStatementProps {
  creditInrValue?: number;
  isProvider?: boolean;
  ordersHref?: string;
}

export function WalletStatement({
  creditInrValue = 1,
  isProvider = false,
  ordersHref,
}: WalletStatementProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");
  const [summary, setSummary] = useState<WalletStatementSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletStatementTxn[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSummary = useCallback(async () => {
    const res = await api.wallet.getSummary();
    if (res.success && res.data?.summary) {
      setSummary(res.data.summary as WalletStatementSummary);
    }
  }, []);

  const loadTransactions = useCallback(
    async (pageNum: number, append: boolean, activeFilter: FilterType) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await api.wallet.getTransactions({
          page: pageNum,
          limit: 25,
          entryType: activeFilter === "all" ? undefined : activeFilter,
        });
        if (res.success && res.data) {
          const data = res.data as {
            transactions?: WalletStatementTxn[];
            pagination?: { pages?: number; total?: number };
          };
          setTransactions((prev) =>
            append ? [...prev, ...(data.transactions ?? [])] : data.transactions ?? []
          );
          setTotalPages(data.pagination?.pages ?? 1);
          setTotalCount(data.pagination?.total ?? 0);
          setPage(pageNum);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await Promise.all([loadSummary(), loadTransactions(1, false, filter)]);
  }, [filter, loadSummary, loadTransactions]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadTransactions(1, false, filter);
  }, [filter, loadTransactions]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.wallet.exportStatement();
      if (!res.success || !res.data) {
        throw new Error("Could not export statement");
      }
      const data = res.data as {
        summary: WalletStatementSummary;
        transactions: WalletStatementTxn[];
        truncated?: boolean;
      };
      const csv = buildWalletStatementCsv(
        data.transactions,
        data.summary,
        creditInrValue
      );
      downloadWalletStatementCsv(csv);
      toast({
        title: "Statement downloaded",
        description: data.truncated
          ? "Showing latest 500 entries. Contact support for older records."
          : `${data.transactions.length} entries exported as CSV.`,
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: err instanceof Error ? err.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const ordersLink =
    ordersHref ?? (isProvider ? "/dashboard/provider/bookings" : "/dashboard/buyer/orders");

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-emerald-200/60 bg-emerald-50/40 dark:bg-emerald-950/20">
            <CardHeader className="pb-1 pt-4">
              <CardDescription className="text-xs">Current balance</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {summary.currentBalance.toLocaleString("en-IN")}
                <span className="ml-1 text-sm font-normal text-muted-foreground">pts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-xs text-muted-foreground">
              ≈ {formatInrFromPoints(summary.currentBalance, creditInrValue)} at checkout
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardDescription className="text-xs">Total earned</CardDescription>
              <CardTitle className="text-2xl tabular-nums text-emerald-600">
                +{summary.totalCredited.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-xs text-muted-foreground">
              {summary.creditCount} credit {summary.creditCount === 1 ? "entry" : "entries"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardDescription className="text-xs">Total redeemed</CardDescription>
              <CardTitle className="text-2xl tabular-nums text-amber-600">
                −{summary.totalDebited.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-xs text-muted-foreground">
              {summary.debitCount} debit {summary.debitCount === 1 ? "entry" : "entries"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-4">
              <CardDescription className="text-xs">All-time entries</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {summary.transactionCount.toLocaleString("en-IN")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4 pt-0 text-xs text-muted-foreground">
              Append-only ledger — every change is recorded
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statement table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Account statement
            </CardTitle>
            <CardDescription className="mt-1">
              Complete {IMAGINEERING_WALLET.name} ledger — credits in, redemptions out, running
              balance after each entry.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || exporting}
              onClick={() => void refresh()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-1.5">Refresh</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={exporting || (summary?.transactionCount ?? 0) === 0}
              onClick={() => void handleExport()}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="ml-1.5">Download CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as FilterType)}
          >
            <TabsList>
              <TabsTrigger value="all">All ({summary?.transactionCount ?? totalCount})</TabsTrigger>
              <TabsTrigger value="credit">Earned (+)</TabsTrigger>
              <TabsTrigger value="debit">Redeemed (−)</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <p className="text-sm font-medium text-foreground">No entries yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "credit"
                  ? "Earn credits via referrals or provider goals — they will appear here."
                  : filter === "debit"
                    ? "Redemptions at checkout will show here after you pay."
                    : "Your wallet statement will list every credit and debit."}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-lg border md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Particulars</TableHead>
                      <TableHead className="hidden lg:table-cell">Reference</TableHead>
                      <TableHead className="text-right text-emerald-700">Credit</TableHead>
                      <TableHead className="text-right text-amber-700">Debit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => {
                      const { date, time } = formatWalletStatementDate(tx.occurredAt);
                      const ref = formatWalletTxnReference(tx);
                      const bookingId =
                        tx.metadata?.bookingId != null
                          ? String(tx.metadata.bookingId)
                          : tx.sourceType.startsWith("booking")
                            ? tx.sourceId
                            : undefined;

                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="align-top text-xs">
                            <p className="font-medium text-foreground">{date}</p>
                            <p className="text-muted-foreground">{time}</p>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex items-start gap-2">
                              {tx.entryType === "credit" ? (
                                <ArrowDownLeft className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              )}
                              <div>
                                <p className="text-sm font-medium leading-snug">
                                  {formatWalletTxnTitle(tx)}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {formatWalletTxnDetail(tx)}
                                </p>
                                <Badge variant="outline" className="mt-1.5 text-[10px] font-normal">
                                  {tx.entryType === "credit" ? "Credit" : "Debit"}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden align-top text-xs text-muted-foreground lg:table-cell">
                            {ref ? (
                              bookingId ? (
                                <Link
                                  href={ordersLink}
                                  className="hover:text-primary hover:underline"
                                >
                                  {ref}
                                </Link>
                              ) : (
                                ref
                              )
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="align-top text-right tabular-nums text-emerald-700">
                            {tx.entryType === "credit" ? (
                              <>
                                +{tx.amount.toLocaleString("en-IN")}
                                <p className="text-[10px] text-muted-foreground">
                                  {formatInrFromPoints(tx.amount, creditInrValue)}
                                </p>
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="align-top text-right tabular-nums text-amber-700">
                            {tx.entryType === "debit" ? (
                              <>
                                −{tx.amount.toLocaleString("en-IN")}
                                <p className="text-[10px] text-muted-foreground">
                                  {formatInrFromPoints(tx.amount, creditInrValue)}
                                </p>
                              </>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <p className="font-semibold tabular-nums">
                              {tx.balanceAfter.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-muted-foreground">pts</p>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {transactions.map((tx) => {
                  const { date, time } = formatWalletStatementDate(tx.occurredAt);
                  const ref = formatWalletTxnReference(tx);
                  return (
                    <div key={tx.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          {tx.entryType === "credit" ? (
                            <ArrowDownLeft className="mt-0.5 h-4 w-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="mt-0.5 h-4 w-4 text-amber-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">{formatWalletTxnTitle(tx)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatWalletTxnDetail(tx)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {date} · {time}
                            </p>
                            {ref ? (
                              <p className="mt-0.5 text-[11px] text-muted-foreground">Ref: {ref}</p>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={
                              tx.entryType === "credit"
                                ? "font-semibold text-emerald-600"
                                : "font-semibold text-amber-600"
                            }
                          >
                            {tx.entryType === "credit" ? "+" : "−"}
                            {tx.amount}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Bal {tx.balanceAfter}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {page < totalPages && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={loadingMore}
                  onClick={() => void loadTransactions(page + 1, true, filter)}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Load more (${transactions.length} of ${totalCount})`
                  )}
                </Button>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            1 point = ₹{creditInrValue} at checkout. Credits are not cash and cannot be withdrawn.
            Statement shows append-only ledger entries — newest first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
