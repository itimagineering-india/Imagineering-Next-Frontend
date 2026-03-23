"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import api from "@/lib/api-client";
import { resetPasswordWithOTP } from "@/lib/firebaseAuth";

export async function getServerSideProps() { return { props: {} }; }

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const email = searchParams?.get("email") || "";
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please start from the forgot password page",
        variant: "destructive",
      });
      router.push("/forgot-password");
    }
  }, [email, router, toast]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    const cleanOtp = otp.trim().replace(/\s/g, '');

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("OTP must contain only numbers");
      return;
    }

    setIsVerifyingOTP(true);

    try {
      const response = await api.auth.verifyPasswordResetOTP(email, cleanOtp);

      if (response.success) {
        setOtpVerified(true);
        toast({
          title: "OTP Verified!",
          description: "Please enter your new password.",
        });
      } else {
        setError(response.error?.message || "Invalid OTP. Please try again.");
        toast({
          title: "Verification Failed",
          description: response.error?.message || "Invalid OTP",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: err.message || "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsResetting(true);

    try {
      const result = await resetPasswordWithOTP(email, password);

      if (result.success) {
        toast({
          title: "Password Reset Successful!",
          description: "Your password has been reset successfully. Please login with your new password.",
        });
        router.push("/login");
      } else {
        setError(result.error || "Failed to reset password. Please try again.");
        toast({
          title: "Reset Failed",
          description: result.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: err.message || "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription>
                {otpVerified 
                  ? "Enter your new password" 
                  : "Verify OTP sent to your email"}
              </CardDescription>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
                <Mail className="h-4 w-4" />
                <span>{email}</span>
              </div>
            </CardHeader>
            <CardContent>
              {!otpVerified ? (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Enter 6-digit OTP</Label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Check your email for the OTP code
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={isVerifyingOTP || otp.length !== 6}>
                    {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                  </Button>

                  <div className="text-center text-sm">
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={async () => {
                        setError("");
                        try {
                          const response = await api.auth.sendPasswordResetOTP(email);
                          if (response.success) {
                            toast({
                              title: "OTP Resent!",
                              description: "Please check your email for the new verification code.",
                            });
                          } else {
                            setError(response.error?.message || "Failed to resend OTP");
                          }
                        } catch (err) {
                          setError("Something went wrong. Please try again.");
                        }
                      }}
                    >
                      Resend OTP
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={isResetting || !password || !confirmPassword}>
                    {isResetting ? "Resetting Password..." : "Reset Password"}
                  </Button>

                  <div className="text-center text-sm">
                    <Link
                      href="/login"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to Login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}




































