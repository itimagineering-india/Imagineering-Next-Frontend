"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IMAGINEERING_CREDIT, IMAGINEERING_WALLET, PRODUCT_COMPARE } from "@/lib/imagineering-product-labels";

type Props = {
  /** Which product page is the user on — highlights that column */
  highlight?: "pay-later" | "rewards";
  className?: string;
};

export function ImagineeringProductCompare({ highlight, className }: Props) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Not the same thing</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          <strong className="text-foreground">{IMAGINEERING_CREDIT.name}</strong> and{" "}
          <strong className="text-foreground">{IMAGINEERING_WALLET.name}</strong> are
          two different products on Imagineering India.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {PRODUCT_COMPARE.map((row) => {
            const isPayLater = row.key === "pay-later";
            const active = highlight === row.key;
            return (
              <div
                key={row.key}
                className={`rounded-xl border p-4 ${
                  active
                    ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-950/30"
                    : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isPayLater ? (
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <Wallet className="h-4 w-4 text-emerald-600" />
                  )}
                  <p className="font-semibold">{row.name}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{row.tagline}</p>
                <dl className="mt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">At checkout</dt>
                    <dd className="text-right font-medium">{row.checkout}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Covers</dt>
                    <dd className="text-right font-medium">{row.pays}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Repayment</dt>
                    <dd className="text-right font-medium">{row.repay}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">How you get it</dt>
                    <dd className="text-right font-medium">{row.earn}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {highlight !== "pay-later" && (
            <Button asChild variant="outline" size="sm">
              <Link href={IMAGINEERING_CREDIT.href}>
                {IMAGINEERING_CREDIT.name}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {highlight !== "rewards" && (
            <Button asChild variant="outline" size="sm">
              <Link href={IMAGINEERING_WALLET.href}>
                {IMAGINEERING_WALLET.name}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
