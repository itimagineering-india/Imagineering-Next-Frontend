import type { Metadata } from "next";
import { Suspense } from "react";
import SignupCompleteContent from "./SignupCompleteContent";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/signup/complete` },
  robots: { index: false, follow: true },
};

export default function SignupCompletePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-gray-600">Loading...</p></div>}>
      <SignupCompleteContent />
    </Suspense>
  );
}
