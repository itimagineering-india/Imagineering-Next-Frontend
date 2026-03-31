"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient, setAuthToken } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";

export default function SignupCompleteContent() {
  const [profile, setProfile] = useState<{ email: string; name: string; photoURL?: string } | null>(null);
  const [role, setRole] = useState<"buyer" | "provider" | "">("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();

  const redirectUrl = searchParams?.get("redirect") || "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem("googleProfile");
      if (!stored) {
        router.replace("/login");
        return;
      }
      const parsed = JSON.parse(stored);
      if (!parsed?.email) {
        router.replace("/login");
        return;
      }
      setProfile(parsed);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!profile) {
      setError("Session expired. Please sign in with Google again.");
      router.replace("/login");
      return;
    }

    if (!role) {
      setError("Please select your role.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms of Service and Privacy Policy.");
      return;
    }

    const tempToken = typeof window !== "undefined" ? sessionStorage.getItem("googleTempToken") || "" : "";
    if (!tempToken) {
      setError("Session expired. Please sign in with Google again.");
      router.replace("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.auth.googleCompleteSignup({
        tempToken,
        role,
        acceptTerms: true,
        name: profile.name,
      });

      if (res.success && (res as any).data?.token) {
        setAuthToken((res as any).data.token);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("googleTempToken");
          sessionStorage.removeItem("googleProfile");
        }
        await refresh();
        router.push(redirectUrl);
      } else {
        setError((res as any).error?.message || "Failed to complete signup. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <div className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header />
      <div className="mx-auto max-w-md flex-1 px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Complete your signup</h1>
      <p className="text-gray-600 mb-6">
        Welcome, {profile.name}! Choose your role to continue.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">I am a</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="buyer"
                checked={role === "buyer"}
                onChange={() => setRole("buyer")}
                className="rounded-full"
              />
              <span>Buyer</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="provider"
                checked={role === "provider"}
                onChange={() => setRole("provider")}
                className="rounded-full"
              />
              <span>Provider</span>
            </label>
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 rounded"
          />
          <span className="text-sm text-gray-600">
            I accept the{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#111827] px-4 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isSubmitting ? "Completing..." : "Complete signup"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
    </div>
  );
}
