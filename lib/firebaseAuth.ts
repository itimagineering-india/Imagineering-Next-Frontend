"use client";

/**
 * Email/password, OTP, and password reset — backend API only (no Firebase Auth).
 * Google (and future Facebook) social sign-in uses Firebase Auth only to obtain an ID token, then the API session (JWT).
 */
import { signInWithPopup, signOut } from "firebase/auth";
import api, { setAuthToken, removeAuthToken } from "./api-client";
import { auth, googleProvider, isFirebaseAuthConfigured } from "./firebase";

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
  /** True when backend returned tempToken — client should navigate to /signup/complete */
  needsSignupCompletion?: boolean;
}> {
  if (!isFirebaseAuthConfigured()) {
    return {
      success: false,
      error: "Google sign-in is not configured. Set NEXT_PUBLIC_FIREBASE_* in your environment.",
    };
  }

  try {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;
    const email = user.email?.trim().toLowerCase();
    if (!email) {
      await signOut(auth).catch(() => {});
      return {
        success: false,
        error: "Your Google account has no email address. Use another sign-in method.",
      };
    }

    const firebaseToken = await user.getIdToken();
    const res = await api.auth.googleLogin({
      firebaseUid: user.uid,
      email,
      name: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
      emailVerified: user.emailVerified,
      firebaseToken,
    });

    await signOut(auth).catch(() => {});

    if (!res.success) {
      const msg =
        (res as { error?: { message?: string } }).error?.message || "Google sign-in failed";
      return { success: false, error: msg };
    }

    const data = res.data as
      | {
          isNewUser?: boolean;
          token?: string;
          tempToken?: string;
          user?: { role?: string; email?: string };
          profile?: { email?: string; name?: string; photoURL?: string };
        }
      | undefined;

    if (data?.isNewUser && data.tempToken && data.profile?.email) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("googleTempToken", data.tempToken);
        sessionStorage.setItem(
          "googleProfile",
          JSON.stringify({
            email: data.profile.email,
            name: data.profile.name || data.profile.email.split("@")[0] || "User",
            photoURL: data.profile.photoURL,
          })
        );
      }
      return { success: true, isNewUser: true, needsSignupCompletion: true };
    }

    const token = data?.token;
    const role = data?.user?.role;
    if (role === "admin") {
      removeAuthToken();
      return { success: false, error: "ADMIN_RESTRICTED" };
    }
    if (token) {
      setAuthToken(token);
      return {
        success: true,
        user: { email: data?.user?.email || email },
        userRole: role,
      };
    }

    return { success: false, error: "Unexpected response from server" };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Sign-in cancelled" };
    }
    return {
      success: false,
      error: err?.message || "Google sign-in failed",
    };
  }
}

export async function signInWithFacebook(
  _role: "buyer" | "provider" = "buyer"
): Promise<{ success: boolean; user?: AuthSessionUser; error?: string }> {
  return {
    success: false,
    error: "Facebook sign-in is not available yet. Use Google, email, or phone.",
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
