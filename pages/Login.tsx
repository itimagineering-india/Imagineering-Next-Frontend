"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmail, signInWithGoogle, signInWithFacebook } from "@/lib/firebaseAuth";
import api, { setAuthToken } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { AUTH_ME_QUERY_KEY } from "@/contexts/AuthContext";

export async function getServerSideProps() { return { props: {} }; }

export default function Login() {
  const [authMode, setAuthMode] = useState<"email" | "phone">("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { refresh } = useAuth();
  const queryClient = useQueryClient();

  // Get redirect URL from query params
  const redirectUrl = searchParams?.get('redirect') || '/';
  const openModal = searchParams?.get('openModal') === 'true';

  const handleRedirect = () => {
    if (redirectUrl && redirectUrl !== '/') {
      router.push(redirectUrl);
    } else {
      router.push('/');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithGoogle("buyer");
      
      if (result.success && result.isNewUser) {
        // New Google user – redirect to signup completion
        toast({
          title: "Complete your signup",
          description: "Please select your role and accept the terms to finish creating your account.",
        });
        router.push("/signup/complete?provider=google");
        return;
      }

      if (result.success && result.user) {
        toast({
          title: "Login successful!",
          description: "Welcome back!",
        });
        refresh().catch(() => {});
        handleRedirect();
      } else {
        // Check for admin restriction error
        if (result.error === 'ADMIN_RESTRICTED') {
          toast({
            title: "Admin Access Required",
            description: "Please use the admin panel to login",
            variant: "destructive",
          });
          // Redirect to admin login page
          window.location.href = '/admin/login';
          return;
        }
        
        // Check for rate limit error
        const errorMsg = result.error || "Google sign-in failed";
        if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit')) {
          setError("Too many login attempts. Please wait a few minutes and try again.");
          toast({
            title: "Too Many Requests",
            description: "Please wait a few minutes before trying again",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setError(errorMsg);
          toast({
            title: "Login failed",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: err?.message || "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithFacebook();
      
      if (result.success && result.user) {
        toast({
          title: "Login successful!",
          description: "Welcome back!",
        });
        refresh().catch(() => {});
        handleRedirect();
      } else {
        // Check for admin restriction error
        if (result.error === 'ADMIN_RESTRICTED') {
          toast({
            title: "Admin Access Required",
            description: "Please use the admin panel to login",
            variant: "destructive",
          });
          // Redirect to admin login page
          window.location.href = '/admin/login';
          return;
        }
        
        // Check for rate limit error
        const errorMsg = result.error || "Facebook sign-in failed";
        if (errorMsg.includes('Too many requests') || errorMsg.includes('rate limit')) {
          setError("Too many login attempts. Please wait a few minutes and try again.");
          toast({
            title: "Too Many Requests",
            description: "Please wait a few minutes before trying again",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setError(errorMsg);
          toast({
            title: "Login failed",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      if (result.success && result.user) {
        // Verify token is saved
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('❌ Token not saved after login');
          setError("Login successful but authentication token not saved. Please try again.");
          toast({
            title: "Authentication Error",
            description: "Please try logging in again",
            variant: "destructive",
          });
          return;
        }

        // Sync token into AuthContext and load user before navigating (fixes "not showing first time")
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-token-changed'));
        }
        await new Promise((r) => setTimeout(r, 0));
        await queryClient.refetchQueries({ queryKey: AUTH_ME_QUERY_KEY });

        toast({
          title: "Login successful!",
          description: "Welcome back!",
        });

        handleRedirect();
      } else {
        // Check for admin restriction error
        if (result.error === 'ADMIN_RESTRICTED') {
          toast({
            title: "Admin Access Required",
            description: "Please use the admin panel to login",
            variant: "destructive",
          });
          // Redirect to admin login page
          window.location.href = '/admin/login';
          return;
        }
        
        // Check for rate limit error
        const errorMsg = result.error || "Login failed. Please check your credentials.";
        const errorMsgLower = errorMsg.toLowerCase();
        if (errorMsgLower.includes('too many') || errorMsgLower.includes('rate limit') || errorMsgLower.includes('429')) {
          setError("Too many login attempts. Please wait a few minutes and try again.");
          toast({
            title: "Too Many Requests",
            description: "Please wait a few minutes before trying again",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          setError(errorMsg);
          toast({
            title: "Login failed",
            description: errorMsg,
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim().replace(/\D/g, '');
    if (trimmed.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.auth.sendPhoneOTP(phone.trim(), 'login');
      if (res.success) {
        setPhoneOtpSent(true);
        toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
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
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP");
      toast({ title: "Error", description: "Failed to send OTP", variant: "destructive" });
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
      if (res.success && (res as { data?: { token?: string } }).data?.token) {
        const token = (res as { data: { token: string } }).data.token;
        setAuthToken(token);
        toast({ title: "Login successful!", description: "Welcome back!" });
        refresh().catch(() => {});
        handleRedirect();
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Login failed";
        setError(msg);
        toast({ title: "Login failed", description: msg, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.message || "Login failed";
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1 px-0 justify-start items-center">
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex rounded-lg border p-1 mb-4">
                <button
                  type="button"
                  onClick={() => { setAuthMode("phone"); setError(""); setPhoneOtpSent(false); setOtp(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${authMode === "phone" ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("email"); setError(""); setPhoneOtpSent(false); setOtp(""); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${authMode === "email" ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  Email
                </button>
              </div>

              {authMode === "phone" ? (
                <form onSubmit={phoneOtpSent ? handleLoginWithPhone : handleSendPhoneOTP} className="space-y-4">
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
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="font-mono text-lg tracking-widest"
                      />
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => { setPhoneOtpSent(false); setOtp(""); }}
                      >
                        Change number / Resend OTP
                      </button>
                    </div>
                  )}
                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {phoneOtpSent
                      ? (isLoading ? "Verifying..." : "Verify & Login")
                      : (isLoading ? "Sending OTP..." : "Send OTP")}
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    No account?{" "}
                    <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
                  </p>
                </form>
              ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
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
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me for 30 days
                  </Label>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              )}

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  or continue with
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  type="button" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {isLoading ? "Loading..." : "Google"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  type="button" 
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.34 2 1.86 6.48 1.86 12.07c0 4.86 3.44 8.9 7.94 9.8v-6.93H7.64v-2.87h2.16V9.83c0-2.14 1.27-3.33 3.22-3.33.93 0 1.9.17 1.9.17v2.1h-1.07c-1.05 0-1.38.65-1.38 1.32v1.59h2.35l-.38 2.87h-1.97v6.93c4.5-.9 7.94-4.94 7.94-9.8Z" />
                  </svg>
                  Facebook
                </Button>
              </div>
            </CardContent>
            <CardFooter className="px-0">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Connect with Top Professionals
          </h2>
          <p className="text-lg opacity-90">
            Join thousands of businesses and professionals on Imagineering India to
            connect, collaborate, and succeed.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold">10K+</p>
              <p className="text-sm opacity-80">Providers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50K+</p>
              <p className="text-sm opacity-80">Services</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">100K+</p>
              <p className="text-sm opacity-80">Clients</p>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
