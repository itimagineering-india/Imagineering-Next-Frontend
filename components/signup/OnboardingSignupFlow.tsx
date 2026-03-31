"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signUpWithEmail, signInWithGoogle } from "@/lib/firebaseAuth";
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
  User,
  Briefcase,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowLeft,
  Tag,
  ChevronRight,
  Check,
} from "lucide-react";

const LOGO_URL = "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png";
const STORAGE_KEY = "ii-onboarding-signup-v1";
const PRIMARY = "#ef4444";
const BG = "#f9fafb";

type UserRole = "buyer" | "provider";
type AuthMethod = "phone" | "email" | "google";
type VerifyInner = "collect" | "otp";

interface PersistedState {
  mainStep: 1 | 2 | 3 | 4;
  userType: UserRole | null;
  authMethod: AuthMethod | null;
  verifyInner: VerifyInner;
  email: string;
  phone: string;
  otp: string;
  formData: {
    name: string;
    password: string;
    confirmPassword: string;
    phone: string;
    email: string;
  };
  referralCode: string;
  emailVerified: boolean;
}

export function OnboardingSignupFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refresh } = useAuth();

  const typeParam = searchParams?.get("type");
  const initialRole: UserRole | null =
    typeParam === "provider" ? "provider" : typeParam === "buyer" ? "buyer" : null;
  const initialReferralCode = (searchParams?.get("ref") || searchParams?.get("referral") || "").trim();
  const redirectAfterAuth = searchParams?.get("redirect")?.trim() || "/";
  const loginHref =
    redirectAfterAuth && redirectAfterAuth !== "/"
      ? `/login?redirect=${encodeURIComponent(redirectAfterAuth)}`
      : "/login";

  const signupCompleteHref =
    redirectAfterAuth && redirectAfterAuth !== "/"
      ? `/signup/complete?redirect=${encodeURIComponent(redirectAfterAuth)}`
      : "/signup/complete";

  const syncSessionAfterToken = async () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-token-changed"));
    }
    await new Promise((r) => setTimeout(r, 0));
    await queryClient.refetchQueries({ queryKey: AUTH_ME_QUERY_KEY });
  };

  const goHome = () => {
    if (redirectAfterAuth && redirectAfterAuth !== "/") {
      router.push(redirectAfterAuth);
    } else {
      router.push("/");
    }
  };

  const [hydrated, setHydrated] = useState(false);
  const [mainStep, setMainStep] = useState<1 | 2 | 3 | 4>(1);
  const [userType, setUserType] = useState<UserRole | null>(initialRole);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>("phone");
  const [verifyInner, setVerifyInner] = useState<VerifyInner>("collect");

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    phone: "",
    email: "",
  });
  const [referralCode, setReferralCode] = useState(initialReferralCode);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [phoneAlreadyRegistered, setPhoneAlreadyRegistered] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<PersistedState>;
        if (typeof p.mainStep === "number" && p.mainStep >= 1 && p.mainStep <= 4) setMainStep(p.mainStep as 1 | 2 | 3 | 4);
        if ("userType" in p && (p.userType === "buyer" || p.userType === "provider" || p.userType === null)) {
          setUserType(p.userType);
        }
        if (p.authMethod === "phone" || p.authMethod === "email" || p.authMethod === "google") setAuthMethod(p.authMethod);
        if (p.verifyInner === "collect" || p.verifyInner === "otp") setVerifyInner(p.verifyInner);
        if (typeof p.email === "string") setEmail(p.email);
        if (typeof p.phone === "string") setPhone(p.phone);
        if (typeof p.otp === "string") setOtp(p.otp);
        if (p.formData && typeof p.formData === "object") {
          setFormData((f) => ({ ...f, ...p.formData }));
        }
        if (typeof p.referralCode === "string") setReferralCode(p.referralCode);
        if (typeof p.emailVerified === "boolean") setEmailVerified(p.emailVerified);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback(() => {
    if (!hydrated) return;
    try {
      const data: PersistedState = {
        mainStep,
        userType,
        authMethod,
        verifyInner,
        email,
        phone,
        otp,
        formData,
        referralCode,
        emailVerified,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [
    hydrated,
    mainStep,
    userType,
    authMethod,
    verifyInner,
    email,
    phone,
    otp,
    formData,
    referralCode,
    emailVerified,
  ]);

  useEffect(() => {
    persist();
  }, [persist]);

  const clearPersist = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const resetVerification = () => {
    setVerifyInner("collect");
    setOtp("");
    setEmailVerified(false);
    setError("");
    setPhoneAlreadyRegistered(false);
  };

  const goBack = () => {
    setError("");
    if (mainStep === 1) {
      router.push("/");
      return;
    }
    if (mainStep === 2) {
      setMainStep(1);
      return;
    }
    if (mainStep === 3) {
      if (authMethod === "google") {
        setMainStep(2);
        return;
      }
      if (verifyInner === "otp") {
        setVerifyInner("collect");
        setOtp("");
        return;
      }
      setMainStep(2);
      resetVerification();
      return;
    }
    if (mainStep === 4) {
      setMainStep(3);
      if (authMethod === "phone" || authMethod === "email") {
        setVerifyInner("otp");
      }
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    setIsSendingOTP(true);
    try {
      const response = await api.auth.sendOTP(email.trim().toLowerCase());
      if (response.success) {
        setVerifyInner("otp");
        toast({ title: "OTP sent", description: "Check your email for the code." });
      } else {
        const errorMsg = response.error?.message || "Failed to send OTP.";
        setError(errorMsg);
        if (errorMsg.includes("already exists") || errorMsg.includes("already registered")) {
          toast({ title: "Email already registered", description: "Please sign in instead.", variant: "destructive" });
          setTimeout(() => router.push(loginHref), 2500);
        } else {
          toast({ title: "Error", description: errorMsg, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong.");
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanOtp = otp.trim().replace(/\s/g, "");
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setIsVerifyingOTP(true);
    try {
      const response = await api.auth.verifyOTP(email.trim().toLowerCase(), cleanOtp);
      if (response.success) {
        setEmailVerified(true);
        setMainStep(4);
        toast({ title: "Email verified", description: "Add your details to finish." });
      } else {
        const errorMsg = response.error?.message || "Invalid OTP.";
        setError(errorMsg);
        toast({ title: "Verification failed", description: errorMsg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      setError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsVerifyingOTP(false);
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
    setIsSendingOTP(true);
    try {
      const checkRes = await api.auth.checkPhoneAvailability(phone.trim());
      const checkData = checkRes as { success?: boolean; available?: boolean; message?: string };
      if (checkData.success && checkData.available === false) {
        setError(checkData.message || "This phone number is already registered.");
        toast({ title: "Phone already registered", variant: "destructive" });
        setIsSendingOTP(false);
        return;
      }
      const res = await api.auth.sendPhoneOTP(phone.trim(), "signup");
      if (res.success) {
        setVerifyInner("otp");
        toast({ title: "OTP sent", description: "Check your phone for the code." });
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Failed to send OTP";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyPhoneOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setEmailVerified(true);
    setMainStep(4);
    toast({ title: "Verified", description: "Complete your profile below." });
  };

  const handleSubmitEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userType) {
      setError("Please go back and select Buyer or Provider.");
      return;
    }
    if (!emailVerified) {
      setError("Verify your email first");
      return;
    }
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }
    if (formData.phone.replace(/\D/g, "").length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    const phoneCheck = await api.auth.checkPhoneAvailability(formData.phone.trim());
    const phoneCheckData = phoneCheck as { success?: boolean; available?: boolean; message?: string };
    if (phoneCheckData.success && phoneCheckData.available === false) {
      setError(phoneCheckData.message || "Phone already registered");
      toast({ title: "Phone already registered", variant: "destructive" });
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUpWithEmail(
        email.trim().toLowerCase(),
        formData.password,
        formData.name.trim(),
        userType as UserRole,
        formData.phone.trim(),
        referralCode || undefined
      );
      if (result.success) {
        await syncSessionAfterToken();
        clearPersist();
        toast({ title: "Welcome!", description: "Your Imagineering India account is ready." });
        await refresh().catch(() => {});
        goHome();
      } else {
        const errorMessage = result.error || "Signup failed.";
        setError(errorMessage);
        toast({ title: "Signup failed", description: errorMessage, variant: "destructive" });
      }
    } catch {
      setError("Something went wrong.");
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterWithPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!userType) {
      setError("Please go back and select Buyer or Provider.");
      return;
    }
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    const emailVal = formData.email?.trim();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setError("Please enter a valid email address");
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.registerWithPhone({
        phone: phone.trim(),
        otp: otp.trim(),
        name: formData.name.trim(),
        role: userType as UserRole,
        password: formData.password || undefined,
        email: emailVal,
        referralCode: referralCode || undefined,
      });
      const data = res as { success?: boolean; data?: { token?: string }; error?: { message?: string } };
      if (data.success && data.data?.token) {
        setAuthToken(data.data.token);
        await syncSessionAfterToken();
        clearPersist();
        toast({ title: "Account created!", description: "Welcome to Imagineering India." });
        await refresh().catch(() => {});
        goHome();
      } else {
        const msg = data.error?.message || "Signup failed";
        setError(msg);
        toast({ title: "Signup failed", description: msg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Signup failed";
      setError(msg);
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithGoogle(userType ?? "buyer");
      if (result.success && result.needsSignupCompletion) {
        clearPersist();
        router.push(signupCompleteHref);
        return;
      }
      if (result.success) {
        await syncSessionAfterToken();
        clearPersist();
        toast({ title: "Welcome!", description: "You're signed in with Google." });
        await refresh().catch(() => {});
        goHome();
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

  const onContinueStep1 = () => {
    setError("");
    if (!userType) {
      setError("Please select Buyer or Provider to continue.");
      return;
    }
    setMainStep(2);
  };

  const onContinueStep2 = () => {
    setError("");
    if (!authMethod) {
      setError("Choose how you want to continue");
      return;
    }
    resetVerification();
    if (authMethod === "google") {
      setMainStep(3);
      return;
    }
    setMainStep(3);
    setVerifyInner("collect");
  };

  const stepLabel = `Step ${mainStep} of 4`;

  const roleCard = (role: UserRole, title: string, subtitle: string, Icon: LucideIcon) => {
    const selected = userType === role;
    return (
      <button
        type="button"
        onClick={() => setUserType(role)}
        className={cn(
          "relative w-full text-left rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300",
          "hover:scale-[1.02] hover:shadow-lg",
          selected
            ? "border-[color:var(--primary)] shadow-md ring-2 ring-red-500/20"
            : "border-gray-200 bg-white hover:border-red-200"
        )}
        style={{ ["--primary" as string]: PRIMARY }}
      >
        {selected && (
          <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow">
            <Check className="h-4 w-4" />
          </span>
        )}
        <div className="flex gap-4">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              selected ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </button>
    );
  };

  const methodCard = (method: AuthMethod, title: string, subtitle: string, icon: React.ReactNode) => {
    const selected = authMethod === method;
    return (
      <button
        type="button"
        onClick={() => setAuthMethod(method)}
        className={cn(
          "relative w-full rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-300",
          "hover:scale-[1.01] hover:shadow-md",
          selected
            ? "border-red-500 bg-red-50/80 shadow-md ring-1 ring-red-500/20"
            : "border-gray-200 bg-white hover:border-red-100"
        )}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">{icon}</div>
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
      <div className="hidden lg:flex lg:w-[46%] max-w-xl flex-col justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/45 px-10 py-14 text-white xl:px-14">
        <Link href="/" className="mb-10 inline-flex items-center gap-4 opacity-95 hover:opacity-100">
          <img src={LOGO_URL} alt="" className="h-16 w-16 shrink-0 object-contain" />
          <span className="text-2xl font-bold">Imagineering India</span>
        </Link>
        {(userType ?? "buyer") === "buyer" ? (
          <>
            <h2 className="text-3xl font-bold leading-tight xl:text-4xl">Find trusted services near you</h2>
            <p className="mt-4 max-w-md text-lg text-zinc-300">
              Book professionals, compare providers, and manage everything in one marketplace.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold leading-tight xl:text-4xl">Grow your business on our platform</h2>
            <p className="mt-4 max-w-md text-lg text-zinc-300">
              Reach new clients, showcase your work, and build your reputation—like UrbanCompany & OLX for services.
            </p>
          </>
        )}
        <div className="mt-12 grid max-w-sm grid-cols-3 gap-6 border-t border-white/10 pt-10">
          {[
            ["Free", "to start"],
            ["Secure", "payments"],
            ["24/7", "support"],
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
              Back
            </button>
            <p className="text-sm font-medium text-gray-500">{stepLabel}</p>
          </div>

          <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-red-500 transition-all duration-500 ease-out"
              style={{ width: `${(mainStep / 4) * 100}%` }}
            />
          </div>

          <div
            key={`${mainStep}-${verifyInner}-${authMethod}`}
            className="transition-all duration-300 ease-out"
          >
            {error && (
              <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {mainStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">How will you use Imagineering India?</h1>
                  <p className="mt-2 text-gray-500">Choose one option to personalize your experience.</p>
                </div>
                <div className="space-y-4">
                  {roleCard("buyer", "I'm a Buyer", "Looking for services", User)}
                  {roleCard("provider", "I'm a Provider", "Offering services", Briefcase)}
                </div>
                <Button
                  type="button"
                  disabled={!userType}
                  className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-lg shadow-red-500/25 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={onContinueStep1}
                >
                  Continue
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </div>
            )}

            {mainStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Create your account</h1>
                  <p className="mt-2 text-gray-500">Pick a sign-up method. Mobile is recommended for faster OTP login.</p>
                </div>
                <div className="space-y-3">
                  {methodCard(
                    "phone",
                    "Continue with Mobile",
                    "OTP verification on your phone",
                    <Phone className="h-5 w-5 text-red-500" />
                  )}
                  {methodCard("email", "Continue with Email", "We'll email you a verification code", <Mail className="h-5 w-5 text-red-500" />)}
                  <button
                    type="button"
                    onClick={() => setAuthMethod("google")}
                    className={cn(
                      "relative w-full rounded-2xl border-2 p-4 sm:p-5 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-md",
                      authMethod === "google"
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
                        <p className="font-semibold text-gray-900">Continue with Google</p>
                        <p className="text-sm text-gray-500">One tap — fast and secure</p>
                      </div>
                      {authMethod === "google" && <Check className="h-5 w-5 shrink-0 text-red-500" />}
                    </div>
                  </button>
                </div>
                <Button
                  type="button"
                  disabled={!authMethod}
                  className="h-12 w-full rounded-xl text-base font-semibold text-white shadow-lg shadow-red-500/25 disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                  onClick={onContinueStep2}
                >
                  Continue
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              </div>
            )}

            {mainStep === 3 && authMethod === "google" && (
              <div className="space-y-6 text-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Connect Google</h1>
                  <p className="mt-2 text-gray-500">We&apos;ll open Google sign-in in a secure window.</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <Loader2 className="h-10 w-10 animate-spin text-red-500" />
                      <p className="text-sm text-gray-600">Connecting to Google…</p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      className="mx-auto flex h-12 w-full max-w-sm rounded-xl font-semibold text-white"
                      style={{ backgroundColor: PRIMARY }}
                      onClick={() => void handleGoogleSignUp()}
                    >
                      Continue with Google
                    </Button>
                  )}
                </div>
              </div>
            )}

            {mainStep === 3 && authMethod === "phone" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Verify your mobile</h1>
                  <p className="mt-2 text-gray-500">
                    {verifyInner === "collect" ? "We’ll send a 6-digit code to your number." : "Enter the code we sent."}
                  </p>
                </div>
                {verifyInner === "collect" && (
                  <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            setPhoneAlreadyRegistered(false);
                            setError("");
                          }}
                          className="h-12 rounded-xl pl-10"
                          disabled={isSendingOTP}
                          maxLength={14}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {phoneAlreadyRegistered ? "Already registered — try signing in." : "We’ll send a 6-digit code via SMS"}
                      </p>
                    </div>
                    <Button
                      type="submit"
                      disabled={isSendingOTP || phoneAlreadyRegistered}
                      className="h-12 w-full rounded-xl font-semibold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {isSendingOTP ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending OTP…
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </form>
                )}
                {verifyInner === "otp" && (
                  <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
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
                    </div>
                    <Button
                      type="submit"
                      disabled={otp.length !== 6}
                      className="h-12 w-full rounded-xl font-semibold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      Verify & continue
                    </Button>
                  </form>
                )}
              </div>
            )}

            {mainStep === 3 && authMethod === "email" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
                  <p className="mt-2 text-gray-500">
                    {verifyInner === "collect" ? "We’ll send a code to your inbox." : "Enter the 6-digit code."}
                  </p>
                </div>
                {verifyInner === "collect" && (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 rounded-xl pl-10"
                          disabled={isSendingOTP}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isSendingOTP}
                      className="h-12 w-full rounded-xl font-semibold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {isSendingOTP ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  </form>
                )}
                {verifyInner === "otp" && (
                  <form onSubmit={handleVerifyEmailOTP} className="space-y-4">
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
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          className="text-xs text-red-600"
                          disabled={isSendingOTP}
                          onClick={async () => {
                            setIsSendingOTP(true);
                            try {
                              const response = await api.auth.sendOTP(email.trim().toLowerCase());
                              if (response.success) {
                                toast({ title: "OTP resent" });
                              } else {
                                setError(response.error?.message || "Failed");
                              }
                            } finally {
                              setIsSendingOTP(false);
                            }
                          }}
                        >
                          {isSendingOTP ? "Sending…" : "Resend OTP"}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={isVerifyingOTP || otp.length !== 6}
                      className="h-12 w-full rounded-xl font-semibold text-white"
                      style={{ backgroundColor: PRIMARY }}
                    >
                      {isVerifyingOTP ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
                        </>
                      ) : (
                        "Verify & continue"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {mainStep === 4 && (
              <form
                onSubmit={authMethod === "phone" ? handleRegisterWithPhone : handleSubmitEmailSignup}
                className="space-y-5"
              >
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Almost there</h1>
                  <p className="mt-2 text-gray-500">Add your details to finish creating your account.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>{authMethod === "phone" ? "Phone verified" : "Email verified"}</span>
                  <span className="truncate text-emerald-700/80">{authMethod === "phone" ? phone : email}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-12 rounded-xl pl-10"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>

                {authMethod === "email" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone-d">Phone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="phone-d"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="h-12 rounded-xl pl-10"
                        placeholder="10-digit number"
                        required
                      />
                    </div>
                  </div>
                )}

                {authMethod === "phone" && (
                  <div className="space-y-2">
                    <Label htmlFor="email-d">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="email-d"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-12 rounded-xl pl-10"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="ref" className="flex items-center gap-1">
                    <Tag className="h-4 w-4" /> Referral code (optional)
                  </Label>
                  <Input
                    id="ref"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.trim())}
                    className="h-12 rounded-xl"
                    placeholder="Code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pw">Password {authMethod === "phone" ? "(optional)" : ""}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="pw"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-12 rounded-xl pl-10 pr-10"
                      required={authMethod === "email"}
                      minLength={authMethod === "email" ? 6 : undefined}
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

                <div className="space-y-2">
                  <Label htmlFor="pw2">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="pw2"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-12 rounded-xl pl-10 pr-10"
                      required={authMethod === "email"}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 hover:bg-gray-100"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox id="terms" required className="mt-1" />
                  <Label htmlFor="terms" className="text-xs font-normal leading-snug text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="font-medium text-red-600 hover:underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="font-medium text-red-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="h-12 w-full rounded-xl font-semibold text-white shadow-lg shadow-red-500/20"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            )}
          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href={loginHref} className="font-semibold text-red-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
