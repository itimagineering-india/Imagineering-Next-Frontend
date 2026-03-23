"use client";

import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// All values must be set via env vars. Never hardcode API keys (Google Cloud AUP / suspension risk).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Allow build to succeed when env is missing; runtime will fail if auth is used without config
const hasValidConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(
    hasValidConfig
      ? firebaseConfig
      : { apiKey: "build-placeholder", authDomain: "", projectId: "build", storageBucket: "", messagingSenderId: "", appId: "" }
  );
} else {
  app = getApps()[0] as FirebaseApp;
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const db: Firestore = getFirestore(app);
