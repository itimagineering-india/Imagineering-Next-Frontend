"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signInWithEmail, signInWithGoogle } from "@/lib/firebaseAuth";
import { useAuth, AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import api, { setAuthToken } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import type { LucideIcon } from "lucide-react";
import {
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronRight,
  Check,
  ShieldCheck,
} from "lucide-react";

const LOGO_URL = "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png";
const LOGIN_PANEL_BG_URL =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80";
const STORAGE_KEY = "ii-onboarding-login-v1";
const PRIMARY = "#ef4444";
const BG = "#f9fafb";

type LoginMethod = "phone" | "email" | "google";

export function OnboardingLoginFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refresh } = useAuth();

  const redirectUrl = searchParams?.get("redirect") || "/";
  const signupHref =
    redirectUrl !== "/" ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/signup";

  const signupCompleteHref =
    redirectUrl !== "/"
      ? `/signup/complete?redirect=${encodeURIComponent(redirectUrl)}`
      : "/signup/complete";

  const syncSessionAfterToken = async () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-token-changed"));
    }
    await new Promise((r) => setTimeout(r, 0));
    await queryClient.refetchQueries({ queryKey: AUTH_ME_QUERY_KEY });
  };

  const handleRedirect = () => {
    if (redirectUrl && redirectUrl !== "/") {
      router.push(redirectUrl);
    } else {
      router.push("/");
    }
  };

  const [hydrated, setHydrated] = useState(false);
  const [mainStep, setMainStep] = useState<1 | 2>(1);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Record<string, unknown>;
        if (p.mainStep === 1 || p.mainStep === 2) setMainStep(p.mainStep);
        if (p.loginMethod === "phone" || p.loginMethod === "email" || p.loginMethod === "google") {
          setLoginMethod(p.loginMethod);
        }
        if (typeof p.email === "string") setEmail(p.email);
        if (typeof p.phone === "string") setPhone(p.phone);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ mainStep, loginMethod, email, phone })
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, mainStep, loginMethod, email, phone]);

  useEffect(() => {
    persist();
  }, [persist]);

  const resetOtpState = () => {
    setOtp("");
    setPhoneOtpSent(false);
    setEmailOtpSent(false);
    setError("");
  };

  const goBack = () => {
    setError("");
    if (mainStep === 2) {
      setMainStep(1);
      resetOtpState();
      return;
    }
    router.push("/");
  };

  const onContinueMethod = () => {
    setError("");
    setMainStep(2);
    resetOtpState();
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signInWithEmail(trimmedEmail, password);
      if (result.success) {
        await syncSessionAfterToken();
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        toast({ title: "Welcome back!", description: "You're signed in." });
        handleRedirect();
      } else {
        if (result.error === "ADMIN_RESTRICTED") {
          toast({
            title: "Admin access required",
            description: "Please use the admin panel to log in.",
            variant: "destructive",
          });
          window.location.href = "/admin/login";
          return;
        }
        const errorMsg = result.error || "Login failed.";
        const lower = errorMsg.toLowerCase();
        if (lower.includes("too many") || lower.includes("rate limit") || lower.includes("429")) {
          setError("Too many attempts. Please wait a few minutes.");
          toast({ title: "Too many requests", variant: "destructive", duration: 5000 });
        } else {
          setError(errorMsg);
          toast({ title: "Login failed", description: errorMsg, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong.");
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    setError("");
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.sendEmailLoginOTP(trimmed.toLowerCase());
      if (res.success) {
        setEmailOtpSent(true);
        toast({ title: "OTP sent", description: "Check your email." });
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Failed to send OTP";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.loginWithEmailOtp(email.trim().toLowerCase(), otp.trim());
      const data = res as { success?: boolean; data?: { token?: string }; error?: { message?: string } };
      if (data.success && data.data?.token) {
        setAuthToken(data.data.token);
        await syncSessionAfterToken();
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        toast({ title: "Welcome back!" });
        await refresh().catch(() => {});
        handleRedirect();
      } else {
        const msg = data.error?.message || "Login failed";
        setError(msg);
        toast({ title: "Login failed", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim().replace(/\D/g, "");
    if (trimmed.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.sendPhoneOTP(phone.trim(), "login");
      if (res.success) {
        setPhoneOtpSent(true);
        toast({ title: "OTP sent", description: "Check your phone." });
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Failed to send OTP";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginWithPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.loginWithPhone(phone.trim(), otp.trim());
      const data = res as { success?: boolean; data?: { token?: string }; error?: { message?: string } };
      if (data.success && data.data?.token) {
        setAuthToken(data.data.token);
        await syncSessionAfterToken();
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        toast({ title: "Welcome back!" });
        await refresh().catch(() => {});
        handleRedirect();
      } else {
        const msg = data.error?.message || "Login failed";
        setError(msg);
        toast({ title: "Login failed", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success && result.needsSignupCompletion) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        router.push(signupCompleteHref);
        return;
      }
      if (result.success) {
        await syncSessionAfterToken();
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        toast({ title: "Welcome back!" });
        handleRedirect();
        return;
      }
      if (result.error === "ADMIN_RESTRICTED") {
        toast({ title: "Admin access required", variant: "destructive" });
        window.location.href = "/admin/login";
        return;
      }
      const msg = result.error || "Google sign-in failed";
      setError(msg);
      toast({ title: "Google sign-in failed", description: msg, variant: "destructive" });
    } catch {
      setError("Something went wrong.");
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const methodCard = (method: LoginMethod, title: string, subtitle: string, Icon: LucideIcon) => {
    const selected = loginMethod === method;
    return (
      <button
        type="button"
        onClick={() => setLoginMethod(method)}
        className={cn(
          "relative w-full rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-300",
          "hover:scale-[1.01] hover:shadow-md",
          selected
            ? "border-red-500 bg-red-50/80 shadow-md ring-1 ring-red-500/20"
            : "border-gray-200 bg-white hover:border-red-100"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Icon className="h-5 w-5 text-red-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          {selected && <Check className="h-5 w-5 shrink-0 text-red-500" />}
        </div>
      </button>
    );
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center" style={{ backgroundColor: BG }}>
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row" style={{ backgroundColor: BG }}>
      <div
        className="hidden lg:flex lg:w-[46%] max-w-xl flex-col justify-center bg-cover bg-center bg-no-repeat px-10 py-14 text-white xl:px-14"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.62), rgba(0, 0, 0, 0.48)), url(${LOGIN_PANEL_BG_URL})`,
        }}
      >
        <Link href="/" className="mb-10 inline-flex items-center gap-4 opacity-95 hover:opacity-100">
          <img src={LOGO_URL} alt="" className="h-16 w-16 shrink-0 object-contain" />
          <span className="text-2xl font-bold">Imagineering India</span>
        </Link>
        <h2 className="text-3xl font-bold leading-tight xl:text-4xl">Welcome back</h2>
        <p className="mt-4 max-w-md text-lg text-zinc-300">
          Sign in to book services, manage bookings, and connect with verified professionals across India.
        </p>
        <div className="mt-12 grid max-w-sm grid-cols-3 gap-6 border-t border-white/10 pt-10">
          {[
            ["10K+", "Providers"],
            ["50K+", "Bookings"],
            ["4.8★", "Rated"],
          ].map(([a, b]) => (
            <div key={a} className="text-center">
              <p className="text-2xl font-bold">{a}</p>
              <p className="text-xs text-zinc-400">{b}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:px-8 lg:py-14">
        <div className="w-full max-w-lg">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {mainStep === 1 ? "Home" : "Back"}
            </button>
            <p className="text-sm font-medium text-gray-500">
              Step {mainStep} of 2
            </p>
          </div>

          <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-500 ease-out"
              style={{ width: `${(mainStep / 2) * 100}%` }}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mainStep === 1 && (
            <div className="space-y-6 transition-all duration-300">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">How do you want to sign in?</h1>
                <p className="mt-2 text-gray-500">Choose one option to continue.</p>
              </div>
              <div className="space-y-3">
                {methodCard("phone", "Mobile number", "We’ll send a one-time code via SMS", Phone)}
                {methodCard("email", "Email", "Password or email OTP", Mail)}
                <button
                  type="button"
                  onClick={() => setLoginMethod("google")}
                  className={cn(
                    "relative w-full rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-md",
                    loginMethod === "google"
                      ? "border-red-500 bg-red-50/80 shadow-md ring-1 ring-red-500/20"
                      : "border-gray-200 bg-white hover:border-red-100"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-5 w-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">Google</p>
                      <p className="text-sm text-gray-500">One tap — fast and secure</p>
                    </div>
                    {loginMethod === "google" && <Check className="h-5 w-5 shrink-0 text-red-500" />}
                  </div>
                </button>
              </div>
              <Button
                type="button"
                onClick={onContinueMethod}
                className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-lg shadow-red-500/25"
                style={{ backgroundColor: PRIMARY }}
              >
                Continue
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          )}

          {mainStep === 2 && loginMethod === "google" && (
            <div className="space-y-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900">Sign in with Google</h1>
              <p className="text-gray-500">Use your Google account to access Imagineering India.</p>
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                    <p className="text-sm text-gray-600">Opening Google…</p>
                  </div>
                ) : (
                  <Button
                    type="button"
                    className="mx-auto flex h-12 w-full max-w-sm rounded-xl font-semibold text-white"
                    style={{ backgroundColor: PRIMARY }}
                    onClick={() => void handleGoogleSignIn()}
                  >
                    Continue with Google
                  </Button>
                )}
              </div>
            </div>
          )}

          {mainStep === 2 && loginMethod === "phone" && (
            <form
              onSubmit={phoneOtpSent ? handleLoginWithPhone : handleSendPhoneOTP}
              className="space-y-5"
            >
              <h1 className="text-2xl font-bold text-gray-900">Sign in with mobile</h1>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 rounded-xl pl-10"
                    disabled={phoneOtpSent}
                    maxLength={14}
                  />
                </div>
              </div>
              {phoneOtpSent && (
                <div className="space-y-2">
                  <Label>6-digit OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup className="gap-2">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-12 w-10 rounded-lg sm:h-14 sm:w-11" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="flex items-center justify-center gap-1 text-xs text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Sent to {phone}
                  </p>
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline"
                    onClick={() => {
                      setPhoneOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Change number
                  </button>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-xl font-semibold text-white"
                style={{ backgroundColor: PRIMARY }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : phoneOtpSent ? (
                  "Verify & sign in"
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          )}

          {mainStep === 2 && loginMethod === "email" && (
            <div className="space-y-5">
              <h1 className="text-2xl font-bold text-gray-900">Sign in with email</h1>
              {!emailOtpSent ? (
                <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl pl-10"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-sm font-medium text-red-600 hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl pl-10 pr-10"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:bg-gray-100"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal text-gray-600">
                      Remember me for 30 days
                    </Label>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl font-semibold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-sm font-medium text-red-600 hover:underline"
                    onClick={() => void handleSendEmailOTP()}
                    disabled={isLoading}
                  >
                    Use email OTP instead
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLoginWithEmailOTP} className="space-y-4">
                  <p className="text-sm text-gray-500 truncate">Code sent to {email}</p>
                  <div className="space-y-2">
                    <Label>6-digit OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                        <InputOTPGroup className="gap-2">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="h-12 w-10 rounded-lg sm:h-14 sm:w-11" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="h-12 w-full rounded-xl font-semibold text-white"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-red-600 hover:underline"
                    onClick={() => {
                      setEmailOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Back to password sign-in
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href={signupHref} className="font-semibold text-red-600 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
