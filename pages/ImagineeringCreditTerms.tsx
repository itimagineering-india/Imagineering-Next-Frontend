"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CreditCard, FileCheck, Shield } from "lucide-react";
import {
  IMAGINEERING_CREDIT,
  formatCreditInterestPercent,
} from "@/lib/imagineering-product-labels";
import api from "@/lib/api-client";

export async function getServerSideProps() {
  return { props: {} };
}

type ProgramRepayment = {
  tenuresMonths?: number[];
  interestPercentByTenure?: Record<string, number>;
  lateFeeInr?: number;
  processingFeeInr?: number;
  overdueGraceDays?: number;
};

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const sections = [
  {
    title: "1. About Imagineering Credit",
    points: [
      `${IMAGINEERING_CREDIT.name} is a Build Now, Pay Later facility offered by Imagineering India that lets eligible buyers pay for eligible orders using an approved credit limit and repay later in one payment.`,
      "It is not a bank loan, credit card, or wallet balance. Your credit limit is set by Imagineering India after eligibility review and KYC.",
      "Using Imagineering Credit at checkout means you accept these Terms in addition to Imagineering India’s general Terms of Service and Privacy Policy.",
    ],
  },
  {
    title: "2. Eligibility & application",
    points: [
      "You must be a registered Imagineering India buyer or provider acting as a buyer, with a valid account.",
      "Eligibility may require completed orders, admin approval to apply, and successful KYC (including PAN and Aadhaar front and back). Physical copies of documents may also be required as stated below.",
      "Imagineering India may approve, reject, suspend, or revoke eligibility or credit at its sole discretion, including after KYC review or if physical documents are not submitted.",
      "You must provide true, complete, and up-to-date information. False documents or misrepresentation may lead to rejection, account freeze, or legal action.",
    ],
  },
  {
    title: "3. Credit limit & activation",
    points: [
      "Your approved credit limit, tier, and status (invited, active, frozen, blocked, or deactivated) are shown on your Imagineering Credit page.",
      "Available credit = credit limit minus outstanding used credit. You cannot use more than available credit on an order.",
      "Imagineering India may change, freeze, block, or deactivate your limit for overdue repayment, risk, fraud, or policy reasons.",
    ],
  },
  {
    title: "4. Using credit at checkout",
    points: [
      "When you select Imagineering Credit, the order amount (or a portion of it) may be paid using your available credit.",
      "If credit does not cover the full order, you must pay the remaining balance online through the selected payment gateway in the same checkout.",
      "Imagineering Credit cannot be combined with Imagineering Wallet / rewards discount on the same payment.",
      "Before first use (and as required thereafter), you must upload a cheque image/PDF. The same cheque must also be submitted physically. The cheque is stored against your credit account and may be linked to each credit purchase bill.",
      "You must choose a repayment tenure (for example 1, 2, or 3 months) where offered. Flat interest for that tenure applies as shown at checkout and in the fees table on this page.",
    ],
  },
  {
    title: "5. Interest, fees & repayment",
    points: [
      "Each credit purchase creates a separate bill: principal used + flat interest for the chosen tenure (+ late fee if overdue, as configured).",
      "Current interest %, late fee, processing fee, and grace days are published in the “Current fees & interest” table below and at checkout. Imagineering India may update these rates for future purchases.",
      "You must repay the full amount due for each bill in one payment by the due date shown on your bill.",
      "A processing fee may apply when you repay online or via approved repayment methods.",
      "Overdue bills may attract a late fee after the grace period and can block new credit usage until cleared.",
    ],
  },
  {
    title: "6. Cheque & physical documents",
    points: [
      "The cheque you upload online is security / recovery documentation for Imagineering Credit usage. You confirm it is genuine, current, and related to an account you control.",
      "Digital upload alone is not complete. You must also submit the physical (original or wet-signed) cheque that matches the uploaded document, as directed by Imagineering India.",
      "Imagineering India may also require physical submission of other KYC or supporting documents (for example self-attested PAN / Aadhaar copies or additional forms) after online approval or first credit use.",
      "You agree to courier or hand over physical documents to the address and within the timeline shared by Imagineering India. Failure to submit physical documents may lead to freeze, block, or revocation of credit.",
      "Imagineering India may store, review, and use digital and physical cheque and KYC documents for verification, collections, dispute handling, and legal compliance.",
      "You authorize Imagineering India to present or use the cheque (including the physical cheque) as permitted by law if you default on repayment, after applicable notice.",
      "Uploading or submitting someone else’s cheque or forged documents is prohibited.",
    ],
  },
  {
    title: "7. Orders, cancellations & reversals",
    points: [
      "Credit is applied when the order is successfully confirmed under Imagineering Credit (including split payments after the gateway leg succeeds, where applicable).",
      "If an order is cancelled or payment reversed per platform rules, Imagineering India may reverse the related credit usage and cancel or adjust the purchase bill.",
      "Refunds, cancellations, and disputes follow Imagineering India’s general order and payment policies; credit adjustments may take processing time.",
    ],
  },
  {
    title: "8. Your responsibilities",
    points: [
      "Repay all open bills on time and keep your contact details, bank, and tax information updated.",
      "Submit physical cheque and any other requested KYC / supporting documents within the timeline given by Imagineering India.",
      "Do not share your account or allow others to use your credit line.",
      "Monitor your Imagineering Credit page for bills, due dates, and account status.",
      "Notify Imagineering India promptly of unauthorized use or suspected fraud.",
    ],
  },
  {
    title: "9. Collections & default",
    points: [
      "If you miss a due date, Imagineering India may send reminders (email, SMS, push, in-app), apply late fees, freeze or block credit, and pursue recovery as allowed by law.",
      "Default may affect your ability to use Imagineering Credit and other platform privileges.",
      "Outstanding amounts remain due even if your account is deactivated.",
    ],
  },
  {
    title: "10. Communications",
    points: [
      "You consent to receive transactional messages about eligibility, KYC, credit use, bills, repayments, and overdue notices via email, SMS, push, or in-app notifications.",
    ],
  },
  {
    title: "11. Privacy",
    points: [
      "KYC documents, cheque images, and credit usage data are processed under Imagineering India’s Privacy Policy and applicable Indian law.",
      "Data may be shared with payment processors, verification partners, and authorities where legally required.",
    ],
  },
  {
    title: "12. Disclaimers & liability",
    points: [
      "Imagineering Credit is provided on an as-available basis. Eligibility and limits are not guaranteed.",
      "To the maximum extent permitted by law, Imagineering India’s liability related to Imagineering Credit is limited as stated in the general Terms of Service.",
      "You remain responsible for taxes, statutory dues, and compliance related to your purchases.",
    ],
  },
  {
    title: "13. Changes to these Terms",
    points: [
      "Imagineering India may update these Terms. The latest version will be posted at this page with an updated date.",
      "Continued use of Imagineering Credit after changes means you accept the updated Terms. Material changes may be notified on the platform.",
    ],
  },
  {
    title: "14. Governing law",
    points: [
      "These Terms are governed by the laws of India. Disputes are subject to the courts in India as set out in Imagineering India’s general Terms of Service, unless otherwise required by law.",
    ],
  },
];

export default function ImagineeringCreditTerms() {
  const [repayment, setRepayment] = useState<ProgramRepayment | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.imagineeringCredit
      .getProgram()
      .then((res) => {
        if (cancelled || !res.success) return;
        const data = res.data as { repayment?: ProgramRepayment } | undefined;
        if (data?.repayment) setRepayment(data.repayment);
      })
      .catch(() => {
        /* keep null — table shows em dash until loaded */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tenures = repayment?.tenuresMonths?.length ? repayment.tenuresMonths : [1, 2, 3];
  const byTenure = repayment?.interestPercentByTenure || {};

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <section className="border-b bg-gradient-to-br from-indigo-50 via-background to-blue-50 py-14 md:py-18 dark:from-indigo-950/40 dark:to-blue-950/30">
          <div className="container max-w-5xl space-y-5 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
              <CreditCard className="h-4 w-4" />
              {IMAGINEERING_CREDIT.name}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
              Terms &amp; Conditions
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground md:text-lg">
              Rules for applying, using, and repaying {IMAGINEERING_CREDIT.name} on Imagineering
              India — including KYC, cheque, interest, and overdue policies.
            </p>
            <p className="text-sm text-muted-foreground">
              Last updated:{" "}
              {new Date().toLocaleDateString("en-IN", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="container max-w-5xl grid gap-4 md:grid-cols-3">
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCheck className="h-4 w-4 text-indigo-600" />
                  KYC & cheque
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                PAN and Aadhaar online for verification; cheque upload at checkout plus mandatory
                physical cheque / document submission.
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  One-time repay
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Each order gets its own bill with flat tenure interest — pay in full by the due date.
              </CardContent>
            </Card>
            <Card className="shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  Overdue & recovery
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Late fees, credit freeze, and recovery steps may apply if bills are not paid on time.
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-10">
          <div className="container max-w-5xl">
            <Card className="shadow-none overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current fees &amp; interest</CardTitle>
                <CardDescription>
                  Flat one-time interest by repayment tenure. Rates below are current program
                  settings and may change; checkout always shows the rate applied to that order.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Repay after</th>
                        <th className="px-4 py-3 font-medium">Interest (flat %)</th>
                        <th className="px-4 py-3 font-medium">How it works</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenures.map((months) => {
                        const pct = byTenure[String(months)];
                        return (
                          <tr key={months} className="border-b last:border-0">
                            <td className="px-4 py-3 font-medium">
                              {months} month{months === 1 ? "" : "s"}
                            </td>
                            <td className="px-4 py-3 tabular-nums">
                              {pct != null && Number.isFinite(Number(pct))
                                ? `${formatCreditInterestPercent(Number(pct))}%`
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              One-time interest on credit used; full principal + interest due by end
                              of tenure
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                        <th className="px-4 py-3 font-medium">Fee / rule</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">When it applies</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="px-4 py-3 font-medium">Late fee</td>
                        <td className="px-4 py-3 tabular-nums">
                          {repayment?.lateFeeInr != null
                            ? formatInr(Number(repayment.lateFeeInr))
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          Fixed fee after the due date + grace period if the bill remains unpaid
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-3 font-medium">Overdue grace</td>
                        <td className="px-4 py-3 tabular-nums">
                          {repayment?.overdueGraceDays != null
                            ? `${Number(repayment.overdueGraceDays)} day${
                                Number(repayment.overdueGraceDays) === 1 ? "" : "s"
                              }`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          Days after due date before the bill becomes overdue and late fee may apply
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-medium">Processing fee</td>
                        <td className="px-4 py-3 tabular-nums">
                          {repayment?.processingFeeInr != null
                            ? formatInr(Number(repayment.processingFeeInr))
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          May be charged per repayment (online / approved methods), as shown at pay
                          time
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Example: if you use ₹10,000 credit for 1 month at{" "}
                  {byTenure["1"] != null
                    ? `${formatCreditInterestPercent(Number(byTenure["1"]))}%`
                    : "the listed rate"}
                  , interest is that % of ₹10,000 (flat), due with principal by the due date. Late fee
                  is a fixed ₹ amount, not a percentage of outstanding.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-16">
          <div className="container max-w-5xl space-y-6">
            {sections.map((section) => (
              <Card key={section.title} className="shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {section.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
            <Separator />
            <p className="text-sm text-muted-foreground">
              Also see our{" "}
              <a
                href="/terms"
                className="font-medium text-indigo-700 underline-offset-2 hover:underline"
              >
                platform Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="font-medium text-indigo-700 underline-offset-2 hover:underline"
              >
                Privacy Policy
              </a>
              . For help, contact Imagineering India support.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
