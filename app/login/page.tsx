import type { Metadata } from "next";
import { Suspense } from "react";
import LoginContent from "./LoginContent";
import { Loader2 } from "lucide-react";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Log in | Imagineering India",
  description: "Sign in with phone, email, or Google to your Imagineering India account.",
  alternates: { canonical: `${BASE_URL}/login` },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

