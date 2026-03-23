"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmailToUser } from "@/lib/firebaseAuth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await sendPasswordResetEmailToUser(trimmed);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(trimmed)}`);
        }, 1200);
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          <p className="font-medium">OTP sent</p>
          <p className="mt-1 text-sm">
            We&apos;ve sent a 6-digit code to <strong>{email}</strong>. Redirecting you to enter the code and set a new
            password…
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold mb-2">Forgot password?</h1>
      <p className="text-gray-600 mb-6">
        Enter your email and we&apos;ll send a one-time code to reset your password.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="you@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-[#111827] px-4 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {isLoading ? "Sending…" : "Send OTP"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
