"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, CreditCard, FileCheck, Shield } from "lucide-react";
import { IMAGINEERING_CREDIT } from "@/lib/imagineering-product-labels";

export async function getServerSideProps() {
  return { props: {} };
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
      "Eligibility may require completed orders, admin approval to apply, and successful KYC (including PAN and Aadhaar front and back).",
      "Imagineering India may approve, reject, suspend, or revoke eligibility or credit at its sole discretion, including after KYC review.",
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
      "Before first use (and as required thereafter), you must upload a cheque image/PDF. The cheque is stored against your credit account and may be linked to each credit purchase bill.",
      "You must choose a repayment tenure (for example 1, 2, or 3 months) where offered. Flat interest for that tenure applies as shown at checkout.",
    ],
  },
  {
    title: "5. Interest, fees & repayment",
    points: [
      "Each credit purchase creates a separate bill: principal used + flat interest for the chosen tenure (+ late fee if overdue, as configured).",
      "Interest rates and processing fees are set by Imagineering India and shown in the product / checkout UI. Rates may change for future purchases.",
      "You must repay the full amount due for each bill in one payment by the due date shown on your bill.",
      "A processing fee may apply when you repay online or via approved repayment methods.",
      "Overdue bills may attract a late fee and can block new credit usage until cleared.",
    ],
  },
  {
    title: "6. Cheque & security documents",
    points: [
      "The cheque you upload is security / recovery documentation for Imagineering Credit usage. You confirm it is genuine, current, and related to an account you control.",
      "Imagineering India may store, review, and use the cheque and KYC documents for verification, collections, dispute handling, and legal compliance.",
      "You authorize Imagineering India to present or use the cheque information as permitted by law if you default on repayment, after applicable notice.",
      "Uploading someone else’s cheque or forged documents is prohibited.",
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
                PAN and Aadhaar for verification; cheque collected when you use credit at checkout.
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
              <a href="/terms" className="font-medium text-indigo-700 underline-offset-2 hover:underline">
                platform Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="font-medium text-indigo-700 underline-offset-2 hover:underline">
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
