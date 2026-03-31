"use client";

import { OnboardingSignupFlow } from "@/components/signup/OnboardingSignupFlow";

/**
 * Multi-step onboarding: role → signup method → verification → basic details.
 * See `components/signup/OnboardingSignupFlow.tsx`.
 */
export default function SignupContent() {
  return <OnboardingSignupFlow />;
}
