"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, Phone, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signUpWithEmail, signInWithGoogle, signInWithFacebook } from "@/lib/firebaseAuth";
import api, { setAuthToken } from "@/lib/api-client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export async function getServerSideProps() { return { props: {} }; }

export default function Signup() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const defaultType = searchParams?.get("type") === "provider" ? "provider" : "buyer";
  const initialReferralCode =
    (searchParams?.get("ref") || searchParams?.get("referral") || "").trim();
  
  const [signupMode, setSignupMode] = useState<"email" | "phone">("phone");
  const [userType, setUserType] = useState(defaultType);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Email flow
  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneChecking, setPhoneChecking] = useState(false);
  const [phoneAlreadyRegistered, setPhoneAlreadyRegistered] = useState(false);

  // Phone flow (reuses step + otp when signupMode === "phone")
  const [phone, setPhone] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
    phone: "",
    email: "",
  });
  const [referralCode, setReferralCode] = useState(initialReferralCode);

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithGoogle(userType as 'buyer' | 'provider');
      
      if (result.success && result.isNewUser) {
        // Pass through to signup completion screen; preselected userType can be reused there if needed
        toast({
          title: "Complete your signup",
          description: "Please confirm your role and accept the terms to finish creating your account.",
        });
        router.push("/signup/complete?provider=google");
        return;
      }

      if (result.success && result.user) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to ServiceHub!",
        });

        router.push("/");
      } else {
        setError(result.error || "Google signup failed");
        toast({
          title: "Signup failed",
          description: result.error || "Failed to sign up with Google",
          variant: "destructive",
        });
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

  const handleFacebookSignup = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const result = await signInWithFacebook(userType as 'buyer' | 'provider');
      
      if (result.success && result.user) {
        toast({
          title: "Account created successfully!",
          description: "Welcome to ServiceHub!",
        });

        router.push("/");
      } else {
        setError(result.error || "Facebook signup failed");
        toast({
          title: "Signup failed",
          description: result.error || "Failed to sign up with Facebook",
          variant: "destructive",
        });
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

  // Step 1: Send OTP to email
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
        toast({
          title: "OTP Sent!",
          description: "Please check your email for the verification code.",
        });
      } else {
        const errorMsg = response.error?.message || "Failed to send OTP. Please try again.";
        setError(errorMsg);
        
        // If email already exists, suggest to sign in
        if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive",
            duration: 5000,
          });
          // Auto redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
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
      setIsSendingOTP(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Clean and validate OTP
    const cleanOtp = otp.trim().replace(/\s/g, ''); // Remove any spaces

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    // Validate OTP is numeric
    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("OTP must contain only numbers");
      return;
    }

    if (!email || !email.trim()) {
      setError("Email is required");
      return;
    }

    setIsVerifyingOTP(true);

    try {
      console.log('Verifying OTP:', { 
        email: email.trim().toLowerCase(), 
        otpLength: cleanOtp.length,
        otpFormat: /^\d{6}$/.test(cleanOtp) ? 'valid' : 'invalid'
      });

      const response = await api.auth.verifyOTP(email.trim().toLowerCase(), cleanOtp);

      console.log('OTP verification response:', response);

      if (response.success) {
        setEmailVerified(true);
        setStep("details");
        toast({
          title: "Email Verified!",
          description: "Please complete your account details.",
        });
      } else {
        const errorMsg = response.error?.message || "Invalid OTP. Please try again.";
        setError(errorMsg);
        toast({
          title: "Verification Failed",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMsg = err.message || "Something went wrong. Please try again.";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  // Step 3: Create account (after OTP verification)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!emailVerified) {
      setError("Please verify your email first");
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    // Check if phone is already registered (before creating Firebase user)
    const phoneCheck = await api.auth.checkPhoneAvailability(formData.phone.trim());
    const phoneCheckData = phoneCheck as { success?: boolean; available?: boolean; message?: string };
    if (phoneCheckData.success && phoneCheckData.available === false) {
      setError(phoneCheckData.message || "This phone number is already registered.");
      toast({
        title: "Phone already registered",
        description: "Please sign in or use a different phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.password) {
      setError("Please enter a password");
      return;
    }

    if (formData.password.length < 6) {
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
        userType as 'buyer' | 'provider',
        formData.phone.trim(),
        referralCode || undefined
      );

      if (result.success && result.user) {
        // Verify token is saved
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('❌ Token not saved after signup');
          setError("Account created but authentication token not saved. Please try logging in.");
          toast({
            title: "Authentication Error",
            description: "Account created but login failed. Please try logging in.",
            variant: "destructive",
          });
          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push("/login");
          }, 2000);
          return;
        }

        toast({
          title: "Account created successfully!",
          description: "Welcome to ServiceHub!",
        });

        // Redirect to home
        router.push("/");
      } else {
        const errorMessage = result.error || "Signup failed. Please try again.";
        setError(errorMessage);
        
        // If email already exists, suggest to sign in
        if (errorMessage.includes('already registered') || errorMessage.includes('email-already-in-use')) {
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please sign in instead or use a different email.",
            variant: "destructive",
            duration: 5000,
          });
          // Auto redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          toast({
            title: "Signup failed",
            description: errorMessage,
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

  // Phone signup: Check availability first, then Send OTP
  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim().replace(/\D/g, '');
    if (trimmed.length < 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setIsSendingOTP(true);
    try {
      // Step 1: Check if phone is already registered (pahle check)
      const checkRes = await api.auth.checkPhoneAvailability(phone.trim());
      const checkData = checkRes as { success?: boolean; available?: boolean; message?: string; error?: { message?: string } };
      if (checkData.success && checkData.available === false) {
        const msg = checkData.message || "This phone number is already registered.";
        setError(msg);
        toast({
          title: "Phone already registered",
          description: "Please sign in instead.",
          variant: "destructive",
        });
        setIsSendingOTP(false);
        return;
      }
      if (!checkRes.success && (checkRes as { error?: { message?: string } }).error?.message) {
        setError((checkRes as { error: { message: string } }).error.message);
        setIsSendingOTP(false);
        return;
      }

      // Step 2: Phone available – send OTP
      const res = await api.auth.sendPhoneOTP(phone.trim(), 'signup');
      if (res.success) {
        setOtpSent(true);
        setStep("otp");
        toast({ title: "OTP Sent", description: "Check your phone for the verification code." });
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Failed to send OTP";
        setError(msg);
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to send OTP";
      setError(msg);
      if (msg.includes("already exists") || msg.includes("sign in")) {
        toast({
          title: "Phone already registered",
          description: "Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Phone signup: Validate OTP and go to details (don't call backend here – OTP is verified only in register-with-phone so it isn't consumed twice)
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

  // Phone signup: Register with phone + OTP
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
        role: userType as 'buyer' | 'provider',
        password: formData.password || undefined,
        email: emailVal,
        referralCode: referralCode || undefined,
      });
      if (res.success && (res as { data?: { token?: string } }).data?.token) {
        const token = (res as { data: { token: string } }).data.token;
        setAuthToken(token);
        toast({ title: "Account created!", description: "Welcome to ServiceHub!" });
        router.push("/");
      } else {
        const msg = (res as { error?: { message?: string } }).error?.message || "Signup failed";
        setError(msg);
        toast({ title: "Signup failed", description: msg, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.message || "Signup failed";
      setError(msg);
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-md">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1 px-0 pb-4 sm:pb-6 justify-start items-center">
              <CardTitle className="text-xl sm:text-2xl font-bold">Create an account</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Join ServiceHub to connect with professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex rounded-lg border p-1 mb-4">
                <button
                  type="button"
                  onClick={() => { setSignupMode("phone"); setError(""); setStep("email"); setOtp(""); setOtpSent(false); setEmailVerified(false); setPhone(""); setPhoneAlreadyRegistered(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${signupMode === "phone" ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setSignupMode("email"); setError(""); setStep("email"); setOtp(""); setOtpSent(false); setEmailVerified(false); }}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${signupMode === "email" ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
                >
                  Email
                </button>
              </div>

              {/* User Type Selection - Only show in email/phone step */}
              {step === "email" && (
                <div className="mb-4 sm:mb-6">
                  <Label className="text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">I want to sign up as:</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType("buyer")}
                      className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        userType === "buyer"
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                          : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          userType === "buyer"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <User className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base ${
                            userType === "buyer" ? "text-primary" : "text-foreground"
                          }`}>
                            I'm a Buyer
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            Looking for services
                          </p>
                        </div>
                        {userType === "buyer" && (
                          <div className="absolute top-2 right-2">
                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary flex items-center justify-center">
                              <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType("provider")}
                      className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        userType === "provider"
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                          : "border-border bg-background hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                          userType === "provider"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm sm:text-base ${
                            userType === "provider" ? "text-primary" : "text-foreground"
                          }`}>
                            I'm a Provider
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            Offering services
                          </p>
                        </div>
                        {userType === "provider" && (
                          <div className="absolute top-2 right-2">
                            <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary flex items-center justify-center">
                              <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Email or Phone Input */}
              {step === "email" && signupMode === "phone" && (
                <form onSubmit={handleSendPhoneOTP} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                        onBlur={async () => {
                          const trimmed = phone.trim().replace(/\D/g, '');
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
                        className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                        disabled={isSendingOTP}
                        maxLength={14}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {phoneChecking ? "Checking availability..." : phoneAlreadyRegistered ? "This number is already registered. Please sign in." : "We'll send a verification code to this number"}
                    </p>
                  </div>
                  {error && (
                    <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" size="lg" disabled={isSendingOTP || phoneAlreadyRegistered}>
                    {isSendingOTP ? "Sending OTP..." : phoneAlreadyRegistered ? "Phone already registered" : "Send Verification Code"}
                  </Button>
                </form>
              )}

              {step === "email" && signupMode === "email" && (
                <form onSubmit={handleSendOTP} className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                        required
                        disabled={isSendingOTP}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll send a verification code to this email
                    </p>
                  </div>

                  {error && (
                    <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" size="lg" disabled={isSendingOTP}>
                    {isSendingOTP ? "Sending OTP..." : "Send Verification Code"}
                  </Button>
                </form>
              )}

              {/* Step 2: OTP Verification (Email or Phone) */}
              {step === "otp" && signupMode === "phone" && (
                <form onSubmit={handleVerifyPhoneOTP} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setOtpSent(false);
                        setError("");
                      }}
                      aria-label="Go back to email step"
                      title="Go back to email step"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Verification Code</p>
                      <p className="text-xs text-muted-foreground truncate">{phone}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Enter 6-digit OTP</Label>
                    <div className="flex justify-center px-2">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        className="gap-1 sm:gap-2"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={1} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={2} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={3} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={4} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={5} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-green-600 flex items-center gap-1 justify-center">
                      <ShieldCheck className="h-3 w-3" /> OTP sent to your phone
                    </p>
                  </div>
                  {error && (
                    <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                      {error}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" size="lg" disabled={isVerifyingOTP || otp.length !== 6}>
                    {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                  </Button>
                </form>
              )}

              {step === "otp" && signupMode === "email" && (
                <form onSubmit={handleVerifyOTP} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10"
                      onClick={() => {
                        setStep("email");
                        setOtp("");
                        setOtpSent(false);
                        setError("");
                      }}
                      aria-label="Go back to email step"
                      title="Go back to email step"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">Verification Code</p>
                      <p className="text-xs text-muted-foreground truncate">{email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm sm:text-base">Enter 6-digit OTP</Label>
                    <div className="flex justify-center px-2">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                        className="gap-1 sm:gap-2"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={1} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={2} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={3} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={4} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                          <InputOTPSlot index={5} className="h-10 w-10 sm:h-12 sm:w-12 text-sm sm:text-base" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {otpSent && (
                      <p className="text-xs text-green-600 flex items-center gap-1 justify-center">
                        <ShieldCheck className="h-3 w-3" /> OTP sent to your email
                      </p>
                    )}
                    <div className="flex justify-center gap-2 mt-2">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={async (e) => {
                          e.preventDefault();
                          setError("");
                          setIsSendingOTP(true);
                          
                          try {
                            const response = await api.auth.sendOTP(email.trim().toLowerCase());
                            
                            if (response.success) {
                              setOtpSent(true);
                              toast({
                                title: "OTP Resent!",
                                description: "Please check your email for the new verification code.",
                              });
                            } else {
                              setError(response.error?.message || "Failed to resend OTP");
                            }
                          } catch (err) {
                            setError("Something went wrong. Please try again.");
                          } finally {
                            setIsSendingOTP(false);
                          }
                        }}
                        disabled={isSendingOTP}
                        className="text-xs h-auto p-1"
                      >
                        {isSendingOTP ? "Sending..." : "Resend OTP"}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" size="lg" disabled={isVerifyingOTP || otp.length !== 6}>
                    {isVerifyingOTP ? "Verifying..." : "Verify OTP"}
                  </Button>
                </form>
              )}

              {/* Step 3: Account Details (After OTP Verification) */}
              {step === "details" && (
                <form onSubmit={signupMode === "phone" ? handleRegisterWithPhone : handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-green-600 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>{signupMode === "phone" ? "Phone Verified" : "Email Verified"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{signupMode === "phone" ? phone : email}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                  </div>

                  {signupMode === "email" && (
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm sm:text-base">Phone Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="e.g., 9876543210"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                          required
                          minLength={10}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Required for OTP login and account recovery</p>
                    </div>
                  )}

                  {/* Referral code (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="text-sm sm:text-base flex items-center justify-between">
                      <span>Referral code (optional)</span>
                    </Label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="referralCode"
                        type="text"
                        placeholder="Enter referral code if you have one"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.trim())}
                        className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  {signupMode === "phone" && (
                  <div className="space-y-2">
                    <Label htmlFor="email-required" className="text-sm sm:text-base">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email-required"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Required for account recovery and login</p>
                  </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm sm:text-base">
                      Password {signupMode === "phone" && "(Optional – you can login with OTP)"}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="pl-9 pr-9 h-10 sm:h-11 text-sm sm:text-base"
                        required={signupMode === "email"}
                        minLength={signupMode === "email" ? 6 : undefined}
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
                    <p className="text-xs text-muted-foreground">
                      Must be at least 6 characters long
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="pl-9 pr-9 h-10 sm:h-11 text-sm sm:text-base"
                        required={signupMode === "email"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-xs sm:text-sm text-destructive bg-destructive/10 p-2 sm:p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" required className="mt-1" />
                    <Label htmlFor="terms" className="text-xs sm:text-sm font-normal leading-snug">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>

                  <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" size="lg" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              )}

              {/* OAuth Buttons - Only show in email step */}
              {step === "email" && (
                <>
                  <div className="relative my-4 sm:my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                      or continue with
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Button variant="outline" className="w-full h-10 sm:h-11 text-sm sm:text-base" type="button" onClick={handleGoogleSignup} disabled={isLoading}>
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
                      Google
                    </Button>
                    <Button variant="outline" className="w-full h-10 sm:h-11 text-sm sm:text-base" type="button" onClick={handleFacebookSignup} disabled={isLoading}>
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.34 2 1.86 6.48 1.86 12.07c0 4.86 3.44 8.9 7.94 9.8v-6.93H7.64v-2.87h2.16V9.83c0-2.14 1.27-3.33 3.22-3.33.93 0 1.9.17 1.9.17v2.1h-1.07c-1.05 0-1.38.65-1.38 1.32v1.59h2.35l-.38 2.87h-1.97v6.93c4.5-.9 7.94-4.94 7.94-9.8Z" />
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="px-0 pt-4 sm:pt-6">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
        </div>

        {/* Right Side - Image/Branding */}
        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8 xl:p-12">
          <div className="max-w-md text-center text-primary-foreground">
            {userType === "buyer" ? (
              <>
                <h2 className="text-2xl xl:text-3xl font-bold mb-3 xl:mb-4">
                  Find the Perfect Service Provider
                </h2>
                <p className="text-base xl:text-lg opacity-90">
                  Browse thousands of verified professionals, compare prices, and
                  hire with confidence.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-2xl xl:text-3xl font-bold mb-3 xl:mb-4">
                  Grow Your Business with Us
                </h2>
                <p className="text-base xl:text-lg opacity-90">
                  Reach thousands of potential clients, showcase your skills, and
                  build your professional reputation.
                </p>
              </>
            )}
            <div className="mt-6 xl:mt-8 grid grid-cols-3 gap-3 xl:gap-4">
              <div className="text-center">
                <p className="text-2xl xl:text-3xl font-bold">Free</p>
                <p className="text-xs xl:text-sm opacity-80">To Start</p>
              </div>
              <div className="text-center">
                <p className="text-2xl xl:text-3xl font-bold">24/7</p>
                <p className="text-xs xl:text-sm opacity-80">Support</p>
              </div>
              <div className="text-center">
                <p className="text-2xl xl:text-3xl font-bold">Secure</p>
                <p className="text-xs xl:text-sm opacity-80">Payments</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
