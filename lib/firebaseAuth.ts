"use client";

/**
 * Email/password and password-reset helpers backed by the API only (no Firebase Auth).
 * File name kept for minimal import churn; chat may still use Firestore via firebase.ts separately.
 */
import api, { setAuthToken, removeAuthToken } from "./api-client";

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) || "http://localhost:5000";

export type AuthSessionUser = { email?: string | null };

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
  try {
    const res = await api.auth.login({
      email: email.trim().toLowerCase(),
      password,
    });
    const payload = res.data as { user?: { role?: string }; token?: string } | undefined;
    if (res.success && payload?.token) {
      setAuthToken(payload.token);
      if (payload.user?.role === "admin") {
        removeAuthToken();
        return { success: false, error: "ADMIN_RESTRICTED" };
      }
      return { success: true, user: { email: email.trim().toLowerCase() } };
    }
    return {
      success: false,
      error: (res as { error?: { message?: string } }).error?.message || "Login failed",
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Sign in failed",
    };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  role: "buyer" | "provider" = "buyer",
  phone?: string,
  referralCode?: string
): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
  try {
    const res = await api.auth.register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      phone,
      referralCode: referralCode?.trim(),
    });
    const payload = res.data as { user?: { role?: string }; token?: string } | undefined;
    if (res.success && payload?.token) {
      setAuthToken(payload.token);
      return { success: true, user: { email: email.trim().toLowerCase() } };
    }
    return {
      success: false,
      error: (res as { error?: { message?: string } }).error?.message || "Sign up failed",
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Sign up failed",
    };
  }
}

export async function signInWithGoogle(
  _role?: "buyer" | "provider"
): Promise<{
  success: boolean;
  user?: AuthSessionUser;
  error?: string;
  isNewUser?: boolean;
  userRole?: string;
}> {
  return {
    success: false,
    error: "Google sign-in is not available. Please use email or phone.",
  };
}

export async function signInWithFacebook(
  _role: "buyer" | "provider" = "buyer"
): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
  return {
    success: false,
    error: "Facebook sign-in is not available. Please use email or phone.",
  };
}

export async function signOutUser(): Promise<void> {
  removeAuthToken();
}

/** Sends backend OTP for password reset (not a Firebase email link). */
export async function sendPasswordResetEmailToUser(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const res = await api.auth.sendPasswordResetOTP(email.trim().toLowerCase());
  if (res.success) return { success: true };
  return {
    success: false,
    error: (res as { error?: { message?: string } }).error?.message || "Failed to send OTP",
  };
}

export async function resetPasswordWithOTP(
  email: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.toLowerCase(),
        newPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message || `HTTP ${res.status}`,
      };
    }
    if (data.success) return { success: true };
    return {
      success: false,
      error: data?.error?.message || "Failed to reset password",
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to reset password",
    };
  }
}
