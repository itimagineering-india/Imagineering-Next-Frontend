import type { Metadata } from "next";
import ImagineeringCreditTerms from "@/pages/ImagineeringCreditTerms";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imagineering Credit Terms & Conditions | Imagineering India",
  description:
    "Terms and conditions for Imagineering Credit — eligibility, KYC, cheque, interest, repayment, and overdue policy on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/imagineering-credit/terms` },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <ImagineeringCreditTerms />;
}
