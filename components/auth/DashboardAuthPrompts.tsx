"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Spinner while GET /api/auth/me is in flight (token present). */
export function AuthLoadingSpinner() {
  return (
    <div className="p-8 flex justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

type SignInRequiredPromptProps = {
  message?: string;
};

/**
 * Sign-in CTA for protected dashboard routes. Uses current path for `redirect` after login.
 */
export function SignInRequiredPrompt({
  message = "Sign in with a provider account to continue.",
}: SignInRequiredPromptProps) {
  const pathname = usePathname() || "/dashboard";

  return (
    <div className="p-6 space-y-3 max-w-md">
      <p className="text-muted-foreground">{message}</p>
      <Button variant="default" asChild>
        <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>Sign in</Link>
      </Button>
    </div>
  );
}
