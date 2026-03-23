"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { signInWithEmail } from "@/lib/firebaseAuth";
import { useAuth, AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";
import api, { setAuthToken } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, Phone, AlertCircle } from "lucide-react";

const LOGO_URL = "https://dwkazjggpovin.cloudfront.net/imagineeringLogoRBG.png";

export default function LoginContent() {
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const redirectUrl = searchParams?.get("redirect") || "/";

  const handleRedirect = () => {
    if (redirectUrl && redirectUrl !== "/") {
      router.push(redirectUrl);
    } else {
      router.push("/");
    }
  };

  const syncSessionAfterToken = async () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-token-changed"));
    }
    await new Promise((r) => setTimeout(r, 0));
    await queryClient.refetchQueries({ queryKey: AUTH_ME_QUERY_KEY });
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
        toast({ title: "Login successful!", description: "Welcome back!" });
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
        const errorMsg = result.error || "Login failed. Please check your credentials.";
        const lower = errorMsg.toLowerCase();
        if (lower.includes("too many") || lower.includes("rate limit") || lower.includes("429")) {
          setError("Too many login attempts. Please wait a few minutes and try again.");
          toast({
            title: "Too many requests",
            description: "Please wait a few minutes before trying again.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setError(errorMsg);
          toast({ title: "Login failed", description: errorMsg, variant: "destructive" });
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast({ title: "Error", description: "Failed to connect", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
        toast({ title: "OTP sent", description: "Check your email for the verification code." });
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Failed to send OTP";
        setError(msg);
        if (msg.includes("No account") || msg.includes("sign up")) {
          toast({ title: "No account found", description: "Please sign up first.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" });
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
        toast({ title: "Login successful!", description: "Welcome back!" });
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
        toast({ title: "OTP sent", description: "Check your phone for the verification code." });
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Failed to send OTP";
        setError(msg);
        if (msg.includes("No account") || msg.includes("sign up")) {
          toast({
            title: "No account found",
            description: "Please sign up first.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Error", description: msg, variant: "destructive" });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
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
        toast({ title: "Login successful!", description: "Welcome back!" });
        await refresh().catch(() => {});
        handleRedirect();
      } else {
        const msg = data.error?.message || "Login failed";
        setError(msg);
        if (msg.includes("No account") || msg.includes("404")) {
          toast({
            title: "No account found",
            description: "Please sign up first.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Login failed", description: msg, variant: "destructive" });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast({ title: "Login failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToPhone = () => {
    setAuthMode("phone");
    setError("");
    setPhoneOtpSent(false);
    setEmailOtpSent(false);
    setOtp("");
  };

  const switchToEmail = () => {
    setAuthMode("email");
    setError("");
    setPhoneOtpSent(false);
    setOtp("");
  };

  const signupHref = redirectUrl !== "/" ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/signup";

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row">
      {/* Left: branding (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-center p-10 xl:p-14">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-foreground/95 mb-8 hover:opacity-90">
          <img src={LOGO_URL} alt="" className="h-10 w-10 object-contain shrink-0" />
          <span className="text-xl font-bold">Imagineering India</span>
        </Link>
        <h2 className="text-3xl xl:text-4xl font-bold mb-4">Connect with top professionals</h2>
        <p className="text-lg opacity-90 max-w-md">
          Book trusted construction and home services, post jobs for providers, and manage everything in one place.
        </p>
        <div className="mt-10 flex flex-wrap gap-8">
          <div>
            <p className="text-3xl font-bold">10K+</p>
            <p className="text-sm opacity-80">Providers</p>
          </div>
          <div>
            <p className="text-3xl font-bold">50K+</p>
            <p className="text-sm opacity-80">Services</p>
          </div>
          <div>
            <p className="text-3xl font-bold">100K+</p>
            <p className="text-sm opacity-80">Happy clients</p>
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 mb-2">
            <img src={LOGO_URL} alt="" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold">Imagineering India</span>
          </Link>

          <Card className="border shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center sm:text-left">Welcome back</CardTitle>
              <CardDescription className="text-center sm:text-left">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex rounded-lg border p-1">
                <button
                  type="button"
                  onClick={switchToPhone}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === "phone" ? "bg-primary text-primary-foreground" : "bg-transparent"
                  }`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={switchToEmail}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    authMode === "email" ? "bg-primary text-primary-foreground" : "bg-transparent"
                  }`}
                >
                  Email
                </button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {authMode === "phone" ? (
                <form
                  onSubmit={phoneOtpSent ? handleLoginWithPhone : handleSendPhoneOTP}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9"
                        disabled={phoneOtpSent}
                        maxLength={14}
                      />
                    </div>
                  </div>
                  {phoneOtpSent && (
                    <div className="space-y-2">
                      <Label htmlFor="otp">OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="font-mono text-lg tracking-widest"
                      />
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => {
                          setPhoneOtpSent(false);
                          setOtp("");
                        }}
                      >
                        Change number / Resend OTP
                      </button>
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {phoneOtpSent
                      ? isLoading
                        ? "Verifying..."
                        : "Verify & Log in"
                      : isLoading
                        ? "Sending OTP..."
                        : "Send OTP"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    No account?{" "}
                    <Link href={signupHref} className="text-primary font-medium hover:underline">
                      Sign up
                    </Link>
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={emailOtpSent ? handleLoginWithEmailOTP : handleEmailPasswordSubmit}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                        disabled={emailOtpSent}
                      />
                    </div>
                  </div>

                  {emailOtpSent ? (
                    <div className="space-y-2">
                      <Label htmlFor="email-otp">OTP</Label>
                      <Input
                        id="email-otp"
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        maxLength={6}
                        className="font-mono text-lg tracking-widest"
                      />
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => {
                          setEmailOtpSent(false);
                          setOtp("");
                        }}
                      >
                        Change email / Resend OTP
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <Link href="/forgot-password" className="text-primary hover:underline">
                              Forgot password?
                            </Link>
                            <span className="text-muted-foreground hidden sm:inline">|</span>
                            <button
                              type="button"
                              className="text-primary hover:underline"
                              onClick={() => handleSendEmailOTP()}
                            >
                              Use OTP instead
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-9 pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                          Remember me for 30 days
                        </Label>
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {emailOtpSent
                      ? isLoading
                        ? "Verifying..."
                        : "Verify & Log in"
                      : isLoading
                        ? "Signing in..."
                        : "Sign in"}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    No account?{" "}
                    <Link href={signupHref} className="text-primary font-medium hover:underline">
                      Sign up
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2 border-t pt-4">
              <p className="text-sm text-muted-foreground text-center w-full">
                Don&apos;t have an account?{" "}
                <Link href={signupHref} className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
