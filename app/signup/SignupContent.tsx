"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signUpWithEmail, signInWithGoogle, signInWithFacebook } from "@/lib/firebaseAuth";
import { useAuth, AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import api, { setAuthToken } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
} from "lucide-react";

const LOGO_URL = "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function SignupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const defaultType = searchParams?.get("type") === "provider" ? "provider" : "buyer";
  const initialReferralCode = (searchParams?.get("ref") || searchParams?.get("referral") || "").trim();
  const redirectAfterAuth = searchParams?.get("redirect")?.trim() || "/";
  const loginHref =
    redirectAfterAuth && redirectAfterAuth !== "/"
      ? `/login?redirect=${encodeURIComponent(redirectAfterAuth)}`
      : "/login";

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

  const [signupMode, setSignupMode] = useState<"email" | "phone">("phone");
  const [userType, setUserType] = useState<"buyer" | "provider">(defaultType);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneAlreadyRegistered, setPhoneAlreadyRegistered] = useState(false);
  const [phone, setPhone] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    phone: "",
    email: "",
  });
  const [referralCode, setReferralCode] = useState(initialReferralCode);

  const resetFlow = () => {
    setError("");
    setStep("email");
    setOtp("");
    setOtpSent(false);
    setEmailVerified(false);
    setPhone("");
    setPhoneAlreadyRegistered(false);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithGoogle(userType);
      if (result.success && result.isNewUser) {
        toast({
          title: "Complete your signup",
          description: "Please confirm your role and accept the terms to finish creating your account.",
        });
        router.push("/signup/complete?provider=google");
        return;
      }
      if (result.success && result.user) {
        await syncSessionAfterToken();
        toast({ title: "Account created!", description: "Welcome to Imagineering India!" });
        await refresh().catch(() => {});
        goHome();
      } else {
        if (result.error === "ADMIN_RESTRICTED") {
          toast({
            title: "Admin access required",
            description: "Please use the admin panel to sign in.",
            variant: "destructive",
          });
          window.location.href = "/admin/login";
          return;
        }
        const errorMsg = result.error || "Google signup failed";
        if (errorMsg.includes("Too many requests") || errorMsg.includes("rate limit")) {
          setError("Too many attempts. Please wait a few minutes and try again.");
          toast({
            title: "Too many requests",
            description: "Please wait a few minutes before trying again.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setError(errorMsg);
          toast({ title: "Signup failed", description: errorMsg, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithFacebook(userType);
      if (result.success && result.user) {
        await syncSessionAfterToken();
        toast({ title: "Account created!", description: "Welcome to Imagineering India!" });
        await refresh().catch(() => {});
        goHome();
      } else {
        if (result.error === "ADMIN_RESTRICTED") {
          toast({
            title: "Admin access required",
            description: "Please use the admin panel to sign in.",
            variant: "destructive",
          });
          window.location.href = "/admin/login";
          return;
        }
        const errorMsg = result.error || "Facebook signup failed";
        if (errorMsg.includes("Too many requests") || errorMsg.includes("rate limit")) {
          setError("Too many attempts. Please wait a few minutes and try again.");
          toast({
            title: "Too many requests",
            description: "Please wait a few minutes before trying again.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setError(errorMsg);
          toast({ title: "Signup failed", description: errorMsg, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
        setOtpSent(true);
        setStep("otp");
        toast({ title: "OTP Sent!", description: "Please check your email for the verification code." });
      } else {
        const errorMsg = response.error?.message || "Failed to send OTP. Please try again.";
        setError(errorMsg);
        if (errorMsg.includes("already exists") || errorMsg.includes("already registered")) {
          toast({ title: "Email Already Registered", description: "This email is already registered. Please sign in instead.", variant: "destructive", duration: 5000 });
          setTimeout(() => router.push(loginHref), 3000);
        } else {
          toast({ title: "Error", description: errorMsg, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanOtp = otp.trim().replace(/\s/g, "");
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError("Please enter the 6-digit OTP");
      return;
    }
    if (!email?.trim()) {
      setError("Email is required");
      return;
    }
    setIsVerifyingOTP(true);
    try {
      const response = await api.auth.verifyOTP(email.trim().toLowerCase(), cleanOtp);
      if (response.success) {
        setEmailVerified(true);
        setStep("details");
        toast({ title: "Email Verified!", description: "Please complete your account details." });
      } else {
        const errorMsg = response.error?.message || "Invalid OTP. Please try again.";
        setError(errorMsg);
        toast({ title: "Verification Failed", description: errorMsg, variant: "destructive" });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(errorMsg);
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailVerified) {
      setError("Please verify your email first");
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
      setError(phoneCheckData.message || "This phone number is already registered.");
      toast({ title: "Phone already registered", description: "Please sign in or use a different phone number.", variant: "destructive" });
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
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
        userType,
        formData.phone.trim(),
        referralCode || undefined
      );
      if (result.success && result.user) {
        await syncSessionAfterToken();
        toast({ title: "Account created successfully!", description: "Welcome to Imagineering India!" });
        await refresh().catch(() => {});
        goHome();
      } else {
        const errorMessage = result.error || "Signup failed. Please try again.";
        setError(errorMessage);
        if (errorMessage.includes("already registered") || errorMessage.includes("email-already-in-use")) {
          toast({ title: "Email Already Registered", description: "This email is already registered. Please sign in instead.", variant: "destructive", duration: 5000 });
          setTimeout(() => router.push(loginHref), 3000);
        } else {
          toast({ title: "Signup failed", description: errorMessage, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
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
    setIsSendingOTP(true);
    try {
      const checkRes = await api.auth.checkPhoneAvailability(phone.trim());
      const checkData = checkRes as { success?: boolean; available?: boolean; message?: string };
      if (checkData.success && checkData.available === false) {
        const msg = checkData.message || "This phone number is already registered.";
        setError(msg);
        toast({ title: "Phone already registered", description: "Please sign in instead.", variant: "destructive" });
        setIsSendingOTP(false);
        return;
      }
      if (!checkRes.success && (checkRes as { error?: { message?: string } }).error?.message) {
        setError((checkRes as { error: { message: string } }).error.message);
        setIsSendingOTP(false);
        return;
      }
      const res = await api.auth.sendPhoneOTP(phone.trim(), "signup");
      if (res.success) {
        setOtpSent(true);
        setStep("otp");
        toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
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
    if (otp.trim().length !== 6 || !/^\d{6}$/.test(otp.trim())) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setStep("details");
    setEmailVerified(true);
    toast({ title: "Enter your details", description: "Complete name and role, then submit." });
  };

  const handleRegisterWithPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    const emailVal = formData.email?.trim();
    if (!emailVal) {
      setError("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
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
        role: userType,
        password: formData.password || undefined,
        email: emailVal,
        referralCode: referralCode || undefined,
      });
      const data = res as { success?: boolean; data?: { token?: string }; error?: { message?: string } };
      if (data.success && data.data?.token) {
        setAuthToken(data.data.token);
        await syncSessionAfterToken();
        toast({ title: "Account created!", description: "Welcome to Imagineering India!" });
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

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-center p-10 xl:p-14">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-foreground/95 mb-8 hover:opacity-90">
          <img src={LOGO_URL} alt="" className="h-10 w-10 object-contain shrink-0" />
          <span className="text-xl font-bold">Imagineering India</span>
        </Link>
        {userType === "buyer" ? (
          <>
            <h2 className="text-2xl xl:text-3xl font-bold mb-3 xl:mb-4">Find the perfect service provider</h2>
            <p className="text-base xl:text-lg opacity-90 max-w-md">
              Browse verified professionals, compare options, and book with confidence.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl xl:text-3xl font-bold mb-3 xl:mb-4">Grow your business with us</h2>
            <p className="text-base xl:text-lg opacity-90 max-w-md">
              Reach clients, showcase your work, and build your reputation as a trusted provider.
            </p>
          </>
        )}
        <div className="mt-8 xl:mt-10 grid grid-cols-3 gap-4 max-w-sm">
          <div className="text-center">
            <p className="text-2xl xl:text-3xl font-bold">Free</p>
            <p className="text-xs xl:text-sm opacity-80">To start</p>
          </div>
          <div className="text-center">
            <p className="text-2xl xl:text-3xl font-bold">24/7</p>
            <p className="text-xs xl:text-sm opacity-80">Support</p>
          </div>
          <div className="text-center">
            <p className="text-2xl xl:text-3xl font-bold">Secure</p>
            <p className="text-xs xl:text-sm opacity-80">Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2">
            <img src={LOGO_URL} alt="" className="h-9 w-9 object-contain shrink-0" />
            <span className="text-lg font-bold text-foreground">Imagineering India</span>
          </Link>
          <Card className="border shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>Join Imagineering India to connect with professionals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phone / Email toggle */}
              <div className="flex rounded-lg border p-1">
                <button
                  type="button"
                  onClick={() => { setSignupMode("phone"); resetFlow(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${signupMode === "phone" ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setSignupMode("email"); resetFlow(); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${signupMode === "email" ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  Email
                </button>
              </div>

              {/* User Type - only in email step */}
              {step === "email" && (
                <div>
                  <Label className="text-sm font-semibold mb-2 block">I want to sign up as:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType("buyer")}
                      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                        userType === "buyer" ? "border-[hsl(var(--red-accent))] bg-[hsl(var(--red-accent))]/5" : "border-border hover:border-[hsl(var(--red-accent))]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${userType === "buyer" ? "bg-[hsl(var(--red-accent))] text-white" : "bg-muted"}`}>
                          <User className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">I&apos;m a Buyer</p>
                          <p className="text-xs text-muted-foreground">Looking for services</p>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType("provider")}
                      className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                        userType === "provider" ? "border-[hsl(var(--red-accent))] bg-[hsl(var(--red-accent))]/5" : "border-border hover:border-[hsl(var(--red-accent))]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${userType === "provider" ? "bg-[hsl(var(--red-accent))] text-white" : "bg-muted"}`}>
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">I&apos;m a Provider</p>
                          <p className="text-xs text-muted-foreground">Offering services</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step 1: Phone or Email input */}
              {step === "email" && signupMode === "phone" && (
                <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setPhoneAlreadyRegistered(false); setError(""); }}
                        onBlur={async () => {
                          const trimmed = phone.trim().replace(/\D/g, "");
                          if (trimmed.length < 10) return;
                          setPhoneChecking(true);
                          setError("");
                          try {
                            const checkRes = await api.auth.checkPhoneAvailability(phone.trim());
                            const d = checkRes as { success?: boolean; available?: boolean; message?: string };
                            if (d.success && d.available === false) {
                              setPhoneAlreadyRegistered(true);
                              setError(d.message || "This phone number is already registered. Please sign in instead.");
                            } else {
                              setPhoneAlreadyRegistered(false);
                            }
                          } catch {
                            setPhoneAlreadyRegistered(false);
                          } finally {
                            setPhoneChecking(false);
                          }
                        }}
                        className="pl-9 h-11"
                        disabled={isSendingOTP}
                        maxLength={14}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {phoneChecking ? "Checking availability..." : phoneAlreadyRegistered ? "This number is already registered. Please sign in." : "We'll send a verification code to this number"}
                    </p>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-[hsl(var(--red-accent))] hover:bg-red-600 text-white" disabled={isSendingOTP || phoneAlreadyRegistered}>
                    {isSendingOTP ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</> : phoneAlreadyRegistered ? "Phone already registered" : "Send Verification Code"}
                  </Button>
                </form>
              )}

              {step === "email" && signupMode === "email" && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" required disabled={isSendingOTP} />
                    </div>
                    <p className="text-xs text-muted-foreground">We'll send a verification code to this email</p>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-[hsl(var(--red-accent))] hover:bg-red-600 text-white" disabled={isSendingOTP}>
                    {isSendingOTP ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending OTP...</> : "Send Verification Code"}
                  </Button>
                </form>
              )}

              {/* Step 2: OTP Verification */}
              {step === "otp" && signupMode === "phone" && (
                <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => { setStep("email"); setOtp(""); setOtpSent(false); setError(""); }}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Verification Code</p>
                      <p className="text-xs text-muted-foreground truncate">{phone}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter 6-digit OTP</Label>
                    <div className="flex justify-center px-2">
                      <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} className="gap-2">
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="h-10 w-10 sm:h-12 sm:w-12" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-green-600 flex items-center gap-1 justify-center"><ShieldCheck className="h-3 w-3" /> OTP sent to your phone</p>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-[hsl(var(--red-accent))] hover:bg-red-600 text-white" disabled={otp.length !== 6}>
                    Verify OTP
                  </Button>
                </form>
              )}

              {step === "otp" && signupMode === "email" && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Button type="button" variant="ghost" size="icon" className="h-10 w-10" onClick={() => { setStep("email"); setOtp(""); setOtpSent(false); setError(""); }}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Verification Code</p>
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter 6-digit OTP</Label>
                    <div className="flex justify-center px-2">
                      <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} className="gap-2">
                        <InputOTPGroup>
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <InputOTPSlot key={i} index={i} className="h-10 w-10 sm:h-12 sm:w-12" />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-green-600 flex items-center gap-1 justify-center"><ShieldCheck className="h-3 w-3" /> OTP sent to your email</p>
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={async () => {
                          setError("");
                          setIsSendingOTP(true);
                          try {
                            const response = await api.auth.sendOTP(email.trim().toLowerCase());
                            if (response.success) {
                              setOtpSent(true);
                              toast({ title: "OTP Resent!", description: "Please check your email for the new verification code." });
                            } else {
                              setError(response.error?.message || "Failed to resend OTP");
                            }
                          } catch {
                            setError("Something went wrong. Please try again.");
                          } finally {
                            setIsSendingOTP(false);
                          }
                        }}
                        disabled={isSendingOTP}
                        className="text-xs"
                      >
                        {isSendingOTP ? "Sending..." : "Resend OTP"}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 bg-[hsl(var(--red-accent))] hover:bg-red-600 text-white" disabled={isVerifyingOTP || otp.length !== 6}>
                    {isVerifyingOTP ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Verify OTP"}
                  </Button>
                </form>
              )}

              {/* Step 3: Account Details */}
              {step === "details" && (
                <form onSubmit={signupMode === "phone" ? handleRegisterWithPhone : handleSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                    <ShieldCheck className="h-4 w-4" />
                    <span>{signupMode === "phone" ? "Phone Verified" : "Email Verified"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{signupMode === "phone" ? phone : email}</p>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="name" type="text" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="pl-9 h-11" required />
                    </div>
                  </div>

                  {signupMode === "email" && (
                    <div className="space-y-2">
                      <Label htmlFor="phone-detail">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="phone-detail" type="tel" placeholder="e.g., 9876543210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="pl-9 h-11" required minLength={10} />
                      </div>
                      <p className="text-xs text-muted-foreground">Required for OTP login and account recovery</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="flex items-center gap-1">
                      <Tag className="h-4 w-4" /> Referral code (optional)
                    </Label>
                    <Input id="referralCode" type="text" placeholder="Enter referral code if you have one" value={referralCode} onChange={(e) => setReferralCode(e.target.value.trim())} className="h-11" />
                  </div>

                  {signupMode === "phone" && (
                    <div className="space-y-2">
                      <Label htmlFor="email-required">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="email-required" type="email" placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-9 h-11" required />
                      </div>
                      <p className="text-xs text-muted-foreground">Required for account recovery and login</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password">Password {signupMode === "phone" && "(Optional – you can login with OTP)"}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-9 pr-9 h-11"
                        required={signupMode === "email"}
                        minLength={signupMode === "email" ? 6 : undefined}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pl-9 pr-9 h-11"
                        required={signupMode === "email"}
                      />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}>
                        {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" required className="mt-1" />
                    <Label htmlFor="terms" className="text-xs font-normal leading-snug">
                      I agree to the <Link href="/terms" className="text-[hsl(var(--red-accent))] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[hsl(var(--red-accent))] hover:underline">Privacy Policy</Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-11 bg-[hsl(var(--red-accent))] hover:bg-red-600 text-white" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</> : "Create Account"}
                  </Button>
                </form>
              )}

              {/* OAuth - only in email step */}
              {step === "email" && (
                <>
                  <div className="relative my-4">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                      or continue with
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full h-11" type="button" onClick={handleGoogleSignup} disabled={isLoading}>
                      <GoogleIcon />
                      Google
                    </Button>
                    <Button variant="outline" className="w-full h-11" type="button" onClick={handleFacebookSignup} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.34 2 1.86 6.48 1.86 12.07c0 4.86 3.44 8.9 7.94 9.8v-6.93H7.64v-2.87h2.16V9.83c0-2.14 1.27-3.33 3.22-3.33.93 0 1.9.17 1.9.17v2.1h-1.07c-1.05 0-1.38.65-1.38 1.32v1.59h2.35l-.38 2.87h-1.97v6.93c4.5-.9 7.94-4.94 7.94-9.8Z" />
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col border-t pt-4">
              <p className="text-sm text-muted-foreground text-center w-full">
                Already have an account?{" "}
                <Link href={loginHref} className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
