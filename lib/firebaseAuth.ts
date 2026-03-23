"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  UserCredential,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "./firebase";
import { setAuthToken, removeAuthToken } from "./api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

async function syncUserWithBackend(
  firebaseUser: User,
  role: "buyer" | "provider" = "buyer",
  name?: string,
  phone?: string,
  referralCode?: string
): Promise<{ success: boolean; token?: string; error?: string; userRole?: string }> {
  try {
    const firebaseToken = await firebaseUser.getIdToken();
    const userName = name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";

    const res = await fetch(`${API_BASE}/api/auth/firebase-sync`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email,
        name: userName,
        phone: phone || undefined,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        role,
        firebaseToken,
        referralCode: referralCode?.trim() || undefined,
      }),
    });

    const data = await res.json();

    if (res.status === 401) {
      removeAuthToken();
      return { success: false, error: "Session expired. Please log in again." };
    }

    if (!res.ok) {
      return {
        success: false,
        error: data?.error?.message || `HTTP ${res.status}`,
      };
    }

    if (data.success && data.data?.token) {
      setAuthToken(data.data.token);
      return {
        success: true,
        token: data.data.token,
        userRole: data.data.user?.role,
      };
    }

    return {
      success: false,
      error: data?.error?.message || "Failed to sync with backend",
    };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || "Failed to connect to backend",
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
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user).catch(() => {});

    const syncResult = await syncUserWithBackend(
      userCredential.user,
      role,
      name,
      phone,
      referralCode
    );

    if (!syncResult.success) {
      return { success: false, error: syncResult.error };
    }

    return { success: true, user: userCredential.user };
  } catch (e: any) {
    if (e?.code === "auth/email-already-in-use") {
      return { success: false, error: "This email is already registered. Please sign in instead." };
    }
    if (e?.code === "auth/weak-password") {
      return { success: false, error: "Password is too weak." };
    }
    return { success: false, error: e?.message || "Sign up failed" };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const syncResult = await syncUserWithBackend(userCredential.user, "buyer");

    if (!syncResult.success) {
      await signOut(auth);
      return { success: false, error: syncResult.error };
    }

    if (syncResult.userRole === "admin") {
      await signOut(auth);
      removeAuthToken();
      return { success: false, error: "ADMIN_RESTRICTED" };
    }

    return { success: true, user: userCredential.user };
  } catch (e: any) {
    if (e?.code === "auth/user-not-found") {
      return { success: false, error: "No account found. Please sign up first." };
    }
    if (e?.code === "auth/wrong-password" || e?.code === "auth/invalid-credential") {
      return { success: false, error: "Incorrect password." };
    }
    return { success: false, error: e?.message || "Sign in failed" };
  }
}

export async function signInWithGoogle(_role?: "buyer" | "provider"): Promise<{
  success: boolean;
  user?: User;
  error?: string;
  isNewUser?: boolean;
  userRole?: string;
}> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    const firebaseToken = await firebaseUser.getIdToken();
    const email = firebaseUser.email;

    if (!email) {
      await signOut(auth);
      return { success: false, error: "Google account has no email." };
    }

    const res = await fetch(`${API_BASE}/api/auth/google/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebaseUid: firebaseUser.uid,
        email,
        name: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        firebaseToken,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      await signOut(auth);
      return { success: false, error: data?.error?.message || "Google sign in failed" };
    }

    if (data.data?.isNewUser) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("googleTempToken", data.data.tempToken || "");
          sessionStorage.setItem("googleProfile", JSON.stringify(data.data.profile || { email, name: firebaseUser.displayName }));
        } catch {
          /* ignore */
        }
      }
      return {
        success: true,
        user: firebaseUser,
        isNewUser: true,
      };
    }

    if (data.data?.token) {
      setAuthToken(data.data.token);
    }

    if (data.data?.user?.role === "admin") {
      await signOut(auth);
      removeAuthToken();
      return { success: false, error: "ADMIN_RESTRICTED" };
    }

    return { success: true, user: firebaseUser, userRole: data.data?.user?.role };
  } catch (e: any) {
    if (e?.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Sign in cancelled." };
    }
    return { success: false, error: e?.message || "Google sign in failed" };
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
  removeAuthToken();
}

export async function sendPasswordResetEmailToUser(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || "Failed to send reset email" };
  }
}

/** Reset password after OTP verification (calls backend API). */
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

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: data?.error?.message || "Failed to reset password",
    };
  } catch (e: any) {
    return {
      success: false,
      error: e?.message || "Failed to reset password",
    };
  }
}

export async function signInWithFacebook(
  _role: "buyer" | "provider" = "buyer"
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const userCredential = await signInWithPopup(auth, facebookProvider);
    const syncResult = await syncUserWithBackend(userCredential.user, _role);

    if (!syncResult.success) {
      await signOut(auth);
      return { success: false, error: syncResult.error };
    }

    if (syncResult.userRole === "admin") {
      await signOut(auth);
      removeAuthToken();
      return { success: false, error: "ADMIN_RESTRICTED" };
    }

    return { success: true, user: userCredential.user };
  } catch (e: any) {
    if (e?.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Sign in cancelled." };
    }
    return { success: false, error: e?.message || "Facebook sign in failed" };
  }
}
