"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import api, { setAuthToken } from "@/lib/api-client";

export async function getServerSideProps() { return { props: {} }; }

interface SocialProfile {
  email: string;
  name: string;
  photoURL?: string;
}

export default function SignupComplete() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [role, setRole] = useState<"buyer" | "provider" | "">("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const storedProfile = sessionStorage.getItem("googleProfile");
      if (!storedProfile) {
        router.push("/login");
        return;
      }
      const parsed: SocialProfile = JSON.parse(storedProfile);
      if (!parsed.email) {
        router.push("/login");
        return;
      }
      setProfile(parsed);
    } catch {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!profile) {
      setError("Session expired. Please sign in with Google again.");
      router.push("/login");
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

    const tempToken = sessionStorage.getItem("googleTempToken") || "";
    if (!tempToken) {
      setError("Session expired. Please sign in with Google again.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.auth.googleCompleteSignup({
        tempToken,
        role,
        acceptTerms: true,
        name: profile.name,
      });

      if (!response.success || !response.data) {
        const msg = response.error?.message || "Failed to complete signup. Please try again.";
        setError(msg);
        toast({
          title: "Signup failed",
          description: msg,
          variant: "destructive",
        });
        return;
      }

      const { user, token } = response.data as any;

      if (token) {
        setAuthToken(token);
      }

      // Cleanup temp data
      sessionStorage.removeItem("googleTempToken");
      sessionStorage.removeItem("googleProfile");

      toast({
        title: "Account created!",
        description: "Welcome to Imagineering India.",
      });

      if (user.role === "provider") {
        router.push("/dashboard/provider/kyc");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong. Please try again.";
      setError(msg);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Complete your signup</CardTitle>
              <CardDescription>
                You&apos;re almost done. Please confirm your details and choose how you want to use Imagineering India.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} readOnly className="bg-muted cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                  <Label>I want to use Imagineering India as:</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "buyer" | "provider")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="buyer" id="role-buyer" />
                      <Label htmlFor="role-buyer">Buyer (I need services)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="provider" id="role-provider" />
                      <Label htmlFor="role-provider">Provider (I offer services)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </Label>
                </div>

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Completing signup..." : "Complete Signup"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-xs text-muted-foreground">
                Not you?{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    sessionStorage.removeItem("googleTempToken");
                    sessionStorage.removeItem("googleProfile");
                    router.push("/login");
                  }}
                >
                  Use a different account
                </button>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}


