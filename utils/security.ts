/**
 * Security utilities for API calls and data protection
 */

import {
  getAuthToken,
  removeAuthToken,
} from "@/lib/auth-token";

export const isTokenExpired = (token: string): boolean => {
  try {
    if (token.split(".").length < 3) return false;
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return false;
  }
};

let tokenValidationCache: { token: string | null; isValid: boolean; timestamp: number } | null = null;
const TOKEN_VALIDATION_CACHE_TTL = 5000;

export const validateToken = (): boolean => {
  const token = getAuthToken();
  if (!token) {
    tokenValidationCache = null;
    return false;
  }
  // HttpOnly cookie session – no JWT in client to validate
  if (token === "cookie") {
    tokenValidationCache = { token, isValid: true, timestamp: Date.now() };
    return true;
  }
  if (
    tokenValidationCache &&
    tokenValidationCache.token === token &&
    Date.now() - tokenValidationCache.timestamp < TOKEN_VALIDATION_CACHE_TTL
  ) {
    return tokenValidationCache.isValid;
  }
  const isValid = !isTokenExpired(token);
  tokenValidationCache = { token, isValid, timestamp: Date.now() };
  if (!isValid) {
    removeAuthToken();
    tokenValidationCache = null;
  }
  return isValid;
};
