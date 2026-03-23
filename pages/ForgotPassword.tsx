"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api-client";

export async function getServerSideProps() { return { props: {} }; }

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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

    setIsLoading(true);

    try {
      const response = await api.auth.sendPasswordResetOTP(email.trim().toLowerCase());

      if (response.success) {
        setOtpSent(true);
        toast({
          title: "OTP Sent!",
          description: "Please check your email for the password reset code.",
        });
        // Navigate to reset password page with email
        setTimeout(() => {
          router.push(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
        }, 1500);
      } else {
        const errorMsg = response.error?.message || "Failed to send OTP. Please try again.";
        setError(errorMsg);
        
        // If email not found, suggest to sign up
        if (errorMsg.includes('No account found') || errorMsg.includes('not found')) {
          toast({
            title: "Account Not Found",
            description: "No account found with this email. Please sign up first.",
            variant: "destructive",
            duration: 5000,
          });
        } else {
          toast({
            title: "Error",
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you an OTP to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {otpSent ? (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">OTP Sent Successfully!</h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset OTP to <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting to reset password page...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                    {isLoading ? "Sending OTP..." : "Send OTP"}
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




































