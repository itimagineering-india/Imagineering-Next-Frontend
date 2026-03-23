import type { Metadata } from "next";
import { Suspense } from "react";
import SignupContent from "./SignupContent";
import { Loader2 } from "lucide-react";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign up | Imagineering India",
  description: "Create your Imagineering India account as a buyer or provider. Phone, email, or Google.",
  alternates: { canonical: `${BASE_URL}/signup` },
  robots: { index: false, follow: true },
};

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
