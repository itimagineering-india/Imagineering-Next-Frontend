"use client";

// API Configuration and Helper Functions
import { retryRequest, formatErrorMessage } from "@/utils/apiHelpers";
import { validateToken } from "@/utils/security";
import {
  getAuthToken as getAuthTokenBase,
  setAuthToken as setAuthTokenBase,
  removeAuthToken as removeAuthTokenBase,
} from "@/lib/auth-token";

const API_BASE_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) ||
  "http://localhost:5000";

// Simple in-memory cache for API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const SEARCH_SUGGESTIONS_TTL_MS = 60_000;
const searchSuggestionsCache = new Map<string, { ts: number; data: any[] }>();
const inFlightSearchSuggestions = new Map<string, Promise<any[]>>();

// Get cached response if available and not expired
const getCachedResponse = <T>(key: string): ApiResponse<T> | null => {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    apiCache.delete(key);
  }
  return null;
};

// Set cache for a response
const setCachedResponse = <T>(key: string, data: ApiResponse<T>): void => {
  apiCache.set(key, { data, timestamp: Date.now() });
};

/** Clear all API response cache (call on logout to avoid stale user-specific data) */
export const clearApiCache = (): void => {
  apiCache.clear();
};

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const getAuthToken = getAuthTokenBase;
export const setAuthToken = setAuthTokenBase;

/** Bearer only when JWT is in localStorage; HttpOnly cookie sessions use credentials only */
function bearerAuthHeaders(token: string | null): Record<string, string> {
  if (token && token !== "cookie") {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const removeAuthToken = (): void => {
  clearApiCache();
  removeAuthTokenBase();
};

// Extended RequestInit type to support custom timeout
type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

// API Request helper with retry logic and security
export const apiRequest = async <T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  retryConfig?: { maxRetries?: number; retryDelay?: number }
): Promise<ApiResponse<T>> => {
  const token = getAuthToken();
  if (token && token !== "cookie" && !validateToken()) {
    removeAuthToken();
    // Redirect to login if token is invalid (but avoid loops on auth pages)
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup') {
        window.location.href = '/login';
      }
    }
    return {
      success: false,
      error: {
        message: 'Session expired. Please log in again.',
      },
    };
  }
  
  const { timeoutMs, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token && token !== "cookie") {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use retry logic for important requests
  const makeRequest = async (): Promise<ApiResponse<T>> => {
    try {
      // Add timeout to fetch request
      // Default: 10 seconds for most requests, can be overridden per-call
      const effectiveTimeout = timeoutMs ?? 10000;
      const controller = new AbortController();
      if (fetchOptions.signal) {
        if (fetchOptions.signal.aborted) {
          controller.abort();
        } else {
          fetchOptions.signal.addEventListener(
            'abort',
            () => controller.abort(),
            { once: true }
          );
        }
      }
      const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: "include",
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // If server returned HTML (error page), don't try to parse as JSON
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return {
          success: false,
          error: {
            message: response.ok
              ? 'Invalid response from server. Please try again.'
              : `Server error (${response.status}). Please try again in a moment.`,
          },
        };
      }

      // Handle 401 Unauthorized
      if (response.status === 401) {
        let errorMessage = 'Session expired. Please log in again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData?.error?.message || errorData?.message || errorMessage;
        } catch {
          // ignore parse errors
        }

        const isAuthEndpoint =
          endpoint.startsWith('/api/auth') ||
          endpoint.startsWith('/api/users/me') ||
          endpoint.startsWith('/api/auth/me');

        // Only auto-logout for explicit auth endpoints
        if (isAuthEndpoint) {
          removeAuthToken();
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path !== '/login' && path !== '/signup') {
              window.location.href = '/login';
            }
          }
        }

        return {
          success: false,
          error: {
            message: errorMessage,
          },
        };
      }

      // Handle 429 Too Many Requests
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        return {
          success: false,
          error: {
            message: `Too many requests. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`,
          },
        };
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = {};
        // JSON parse failed (e.g. server returned HTML error page)
        if (!response.ok) {
          throw new Error(
            `Server error (${response.status}). Please try again in a moment.`
          );
        }
      }

      if (!response.ok) {
        const msg =
          data.error?.message ??
          (typeof data.error === 'string' ? data.error : null) ??
          data.message ??
          `Request failed (${response.status})`;
        throw new Error(msg);
      }

      return data;
    } catch (error: any) {
      // Handle timeout/abort errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            message: 'Request timeout. The server is taking too long to respond. Please try again.',
          },
        };
      }
      
      // Handle network errors
      if (error.message?.includes('Failed to fetch') || 
          error.message?.includes('ERR_CONNECTION_CLOSED') ||
          error.message?.includes('NetworkError')) {
        return {
          success: false,
          error: {
            message: 'Cannot connect to server. Please check your internet connection and ensure the backend server is running.',
          },
        };
      }
      
      return {
        success: false,
        error: {
          message: formatErrorMessage(error),
        },
      };
    }
  };

  // Use retry logic if configured
  if (retryConfig && (retryConfig.maxRetries || retryConfig.retryDelay)) {
    return retryRequest(makeRequest, retryConfig);
  }

  return makeRequest();
};

/** Autocomplete for /search — aligned with Vite `fetchSearchSuggestions` */
export async function fetchSearchSuggestions(query: string, limit = 5): Promise<any[]> {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];
  const cacheKey = `${normalizedQuery}|${limit}`;
  const cached = searchSuggestionsCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < SEARCH_SUGGESTIONS_TTL_MS) {
    return cached.data;
  }
  const inFlight = inFlightSearchSuggestions.get(cacheKey);
  if (inFlight) return inFlight;

  const request = (async () => {
    const response = await apiRequest<any>(
      `/api/search/suggest?q=${encodeURIComponent(normalizedQuery)}&limit=${Math.max(1, limit)}`
    );
    if (!response.success || !response.data) return [];

    const data = response.data as any;
    if (Array.isArray(data.suggestions)) return data.suggestions;
    const services = data.services || [];
    const categories = data.categories || [];
    const providers = data.providers || [];
    const locations = data.locations || [];
    const suggestions: any[] = [];

    services.slice(0, 3).forEach((service: any) => {
      suggestions.push({
        type: "service",
        id: service._id || service.id,
        title: service.title,
        subtitle: service.category?.name || "Service",
        url: `/service/${service.slug || service._id || service.id}`,
      });
    });

    categories.slice(0, 2).forEach((category: any) => {
      suggestions.push({
        type: "category",
        id: category._id || category.id,
        title: category.name,
        subtitle: "Category",
        url: `/services?category=${category.slug || category._id}`,
      });
    });

    providers.slice(0, 2).forEach((provider: any) => {
      const providerId = provider._id || provider.id || provider.user?._id;
      suggestions.push({
        type: "provider",
        id: providerId,
        title: provider.businessName || provider.user?.name || provider.name || "Provider",
        subtitle: "Provider",
        url: `/provider/${provider.slug || providerId}`,
      });
    });

    locations.slice(0, 2).forEach((loc: any) => {
      const label = (loc?.label || "").toString().trim();
      if (!label) return;
      suggestions.push({
        type: "location",
        id: label,
        title: label,
        subtitle: "Location",
        url: `/services?locationText=${encodeURIComponent(label)}&view=services`,
      });
    });

    searchSuggestionsCache.set(cacheKey, { ts: Date.now(), data: suggestions });
    return suggestions;
  })().finally(() => {
    inFlightSearchSuggestions.delete(cacheKey);
  });

  inFlightSearchSuggestions.set(cacheKey, request);
  return request;
}

// API Endpoints
export const api = {
  // Auth
  auth: {
    sendOTP: (email: string) =>
      apiRequest('/api/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    
    verifyOTP: (email: string, otp: string) =>
      apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),
    
    register: (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
      phone?: string;
      referralCode?: string;
    }) =>
      apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    
    login: (credentials: { email: string; password: string }) =>
      apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    getMe: () => apiRequest('/api/auth/me'),

    getFirebaseCustomToken: () => apiRequest<{ success: boolean; data?: { customToken: string } }>('/api/auth/firebase-custom-token'),

    updateProfile: (profileData: any) =>
      apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      }),

    deleteMyAccount: () =>
      apiRequest('/api/auth/delete-my-account', {
        method: 'DELETE',
      }),

    changePassword: (passwordData: any) =>
      apiRequest('/api/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      }),

    updateNotifications: (notificationData: any) =>
      apiRequest('/api/auth/notifications', {
        method: 'PUT',
        body: JSON.stringify(notificationData),
      }),

    updatePrivacy: (privacyData: any) =>
      apiRequest('/api/auth/privacy', {
        method: 'PUT',
        body: JSON.stringify(privacyData),
      }),

    updatePreferences: (preferenceData: any) =>
      apiRequest('/api/auth/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferenceData),
      }),

    // Password reset via OTP can take slightly longer due to email sending,
    // so we allow a higher timeout specifically for these endpoints.
    sendPasswordResetOTP: (email: string) =>
      apiRequest('/api/auth/send-password-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
        timeoutMs: 20000, // 20 seconds
      }),

    verifyPasswordResetOTP: (email: string, otp: string) =>
      apiRequest('/api/auth/verify-password-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
        timeoutMs: 20000, // 20 seconds
      }),

    // Google social login: authenticate, but do NOT auto-create new users
    googleLogin: (payload: {
      firebaseUid: string;
      email: string;
      name?: string;
      photoURL?: string;
      emailVerified?: boolean;
      firebaseToken: string;
    }) =>
      apiRequest('/api/auth/google/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Complete signup for new Google users after role selection & terms
    googleCompleteSignup: (payload: {
      tempToken: string;
      role: 'buyer' | 'provider';
      acceptTerms: boolean;
      name?: string;
    }) =>
      apiRequest('/api/auth/google/complete-signup', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Phone OTP (Fast2SMS)
    checkPhoneAvailability: (phone: string) =>
      apiRequest<{ available: boolean; message?: string }>('/api/auth/check-phone-availability', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }),
    sendPhoneOTP: (phone: string, intent?: 'login' | 'signup') =>
      apiRequest('/api/auth/send-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, intent }),
      }),

    verifyPhoneOTP: (phone: string, otp: string) =>
      apiRequest('/api/auth/verify-phone-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      }),

    loginWithPhone: (phone: string, otp: string) =>
      apiRequest('/api/auth/login-with-phone', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      }),

    sendEmailLoginOTP: (email: string) =>
      apiRequest('/api/auth/send-email-login-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
        timeoutMs: 20000,
      }),

    loginWithEmailOtp: (email: string, otp: string) =>
      apiRequest('/api/auth/login-with-email', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      }),

    registerWithPhone: (payload: {
      phone: string;
      otp: string;
      name: string;
      role: 'buyer' | 'provider';
      password?: string;
      email?: string;
      referralCode?: string;
    }) =>
      apiRequest('/api/auth/register-with-phone', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
  payout: {
    provider: {
      submitKyc: (payload: {
        panNumber: string;
        gstNumber?: string;
        bankAccountNumber: string;
        ifsc: string;
        accountHolderName: string;
      }) =>
        apiRequest('/api/provider/kyc/submit', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      getKycStatus: () => apiRequest('/api/provider/kyc/status'),
      uploadBankDocument: async (file: File) => {
        const formData = new FormData();
        formData.append('bankDocument', file);
        const token = getAuthToken();
        const headers: HeadersInit = { ...bearerAuthHeaders(token) };
        return fetch(`${API_BASE_URL}/api/provider/kyc/upload-bank-document`, {
          method: 'POST',
          headers,
          credentials: "include",
          body: formData,
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error?.message || 'Upload failed');
          }
          return data;
        });
      },
      getPayouts: () => apiRequest('/api/provider/payouts'),
    },
    admin: {
      getKyc: () => apiRequest('/api/admin/kyc/payouts'),
      approveKyc: (payload: { providerId: string; status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
        apiRequest('/api/admin/kyc/approve', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      triggerPayout: (orderId: string) =>
        apiRequest('/api/admin/payout/trigger', {
          method: 'POST',
          body: JSON.stringify({ orderId }),
        }),
      holdPayout: (orderId: string) =>
        apiRequest('/api/admin/payout/hold', {
          method: 'POST',
          body: JSON.stringify({ orderId }),
        }),
      getPayouts: () => apiRequest('/api/admin/payouts'),
    },
  },

  // Categories (with shorter caching for getAll to reflect admin updates quickly)
  categories: {
    getAll: async (
      forceRefresh = false,
      options?: { includeSubcategories?: boolean; admin?: boolean }
    ) => {
      const queryParams = new URLSearchParams();
      if (options?.includeSubcategories) {
        queryParams.append('includeSubcategories', 'true');
      }
      if (options?.admin) {
        queryParams.append('admin', 'true');
      }
      const queryString = queryParams.toString();
      const cacheKey = `/api/categories${queryString ? `?${queryString}` : ''}`;
      
      // If force refresh, skip cache
      if (!forceRefresh) {
        const cached = getCachedResponse(cacheKey);
        if (cached) {
          return cached;
        }
      } else {
        // Clear cache if forcing refresh
        apiCache.delete(cacheKey);
      }
      
      const response = await apiRequest(
        `/api/categories${queryString ? `?${queryString}` : ''}`
      );
      if (response.success) {
        // Use shorter cache time for categories (1 minute instead of 5)
        const categoryCache = { data: response, timestamp: Date.now() };
        apiCache.set(cacheKey, categoryCache);
        
        // Auto-expire after 1 minute
        setTimeout(() => {
          apiCache.delete(cacheKey);
        }, 60 * 1000);
      }
      return response;
    },
    getById: (id: string) => apiRequest(`/api/categories/${id}`),
    getBySlug: (slug: string) => apiRequest(`/api/categories/slug/${slug}`),
    getSubcategories: (categorySlug: string) =>
      apiRequest(`/api/categories/subcategories/${categorySlug}`),
  },

  // Services
  services: {
    getAll: (params?: {
      category?: string;
      subcategory?: string;
      featured?: boolean;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      page?: number;
      limit?: number;
      sort?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/services${queryString ? `?${queryString}` : ''}`, {
        timeoutMs: 180000,
      });
    },
    getById: (id: string) => apiRequest(`/api/services/${id}`),
    getByCategories: (params?: {
      limit?: number;
      categoryLimit?: number;
      lat?: number;
      lng?: number;
      radiusKm?: number;
      location?: string;
      tile?: string;
      precise?: string | number | boolean;
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.limit) {
        queryParams.append('limit', String(params.limit));
      }
      if (params?.categoryLimit) {
        queryParams.append('categoryLimit', String(params.categoryLimit));
      }
      if (params?.location != null && String(params.location).trim()) {
        queryParams.append('location', String(params.location).trim());
      }
      if (params?.tile != null && String(params.tile).trim()) {
        queryParams.append('tile', String(params.tile).trim());
      }
      if (params?.precise != null && params.precise !== false && String(params.precise) !== '') {
        queryParams.append('precise', String(params.precise));
      }
      if (params?.lat != null && Number.isFinite(params.lat)) {
        queryParams.append('lat', String(params.lat));
      }
      if (params?.lng != null && Number.isFinite(params.lng)) {
        queryParams.append('lng', String(params.lng));
      }
      if (params?.radiusKm != null && Number.isFinite(params.radiusKm)) {
        queryParams.append('radiusKm', String(params.radiusKm));
      }
      const queryString = queryParams.toString();
      // Keep timeout reasonable while the endpoint is optimized
      return apiRequest(`/api/services/by-categories${queryString ? `?${queryString}` : ''}`, {
        timeoutMs: 30000,
      });
    },
    getByCategory: (categoryId: string) =>
      apiRequest(`/api/services/category/${categoryId}`),
    getByProvider: (providerId: string) =>
      apiRequest(`/api/services/provider/${providerId}`, {
        timeoutMs: 20000,
      }),
    uploadImage: (file: File): Promise<ApiResponse<{ url: string }>> => {
      const formData = new FormData();
      formData.append('image', file);
      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s for image upload

      return fetch(`${API_BASE_URL}/api/services/upload-image`, {
        method: 'POST',
        headers,
        credentials: "include",
        body: formData,
        signal: controller.signal,
      })
        .then(async (res) => {
          let data: any;
          try {
            data = await res.json();
          } catch {
            // Server returned HTML or non-JSON (e.g. 502/500 error page)
            throw new Error('Image upload failed. Please try again.');
          }
          if (!res.ok) {
            throw new Error(data?.error?.message || data?.message || 'Upload failed');
          }
          return data;
        })
        .catch((err) => ({
          success: false as const,
          error: {
            message:
              err?.name === 'AbortError'
                ? 'Image upload timed out. Please try again.'
                : err instanceof Error
                  ? err.message
                  : 'Upload failed',
          },
        }))
        .finally(() => clearTimeout(timeoutId));
    },
    uploadDocument: (file: File): Promise<ApiResponse<{ url: string }>> => {
      const formData = new FormData();
      formData.append('document', file);
      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      return fetch(`${API_BASE_URL}/api/services/upload-document`, {
        method: 'POST',
        headers,
        credentials: "include",
        body: formData,
        signal: controller.signal,
      })
        .then(async (res) => {
          let data: any;
          try {
            data = await res.json();
          } catch {
            throw new Error('Document upload failed. Please try again.');
          }
          if (!res.ok) {
            throw new Error(data?.error?.message || data?.message || 'Upload failed');
          }
          return data;
        })
        .catch((err) => ({
          success: false as const,
          error: {
            message:
              err?.name === 'AbortError'
                ? 'Document upload timed out. Please try again.'
                : err instanceof Error
                  ? err.message
                  : 'Upload failed',
          },
        }))
        .finally(() => clearTimeout(timeoutId));
    },
    generateDescription: (body: {
      locale?: "en" | "hi";
      title: string;
      categoryName: string;
      categorySlug?: string;
      formVariant?: string;
      contextLines: string[];
    }) =>
      apiRequest<{ description: string }>("/api/services/generate-description", {
        method: "POST",
        body: JSON.stringify({
          locale: body.locale === "hi" ? "hi" : "en",
          title: body.title,
          categoryName: body.categoryName,
          categorySlug: body.categorySlug,
          formVariant: body.formVariant ?? "provider_web",
          contextLines: body.contextLines,
        }),
        timeoutMs: 65000,
      }),
    generateTitle: (body: {
      locale?: "en" | "hi";
      title?: string;
      categoryName: string;
      categorySlug?: string;
      formVariant?: string;
      contextLines: string[];
    }) =>
      apiRequest<{ title: string }>("/api/services/generate-title", {
        method: "POST",
        body: JSON.stringify({
          locale: body.locale === "hi" ? "hi" : "en",
          title: body.title ?? "",
          categoryName: body.categoryName,
          categorySlug: body.categorySlug,
          formVariant: body.formVariant ?? "provider_web",
          contextLines: body.contextLines,
        }),
        timeoutMs: 65000,
      }),
    create: (serviceData: any) =>
      apiRequest("/api/services", {
        method: "POST",
        body: JSON.stringify(serviceData),
      }),
    update: (id: string, serviceData: any) =>
      apiRequest(`/api/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(serviceData),
      }),
    delete: (id: string) =>
      apiRequest(`/api/services/${id}`, {
        method: "DELETE",
      }),
  },

  // Search
  search: {
    search: (params: {
      q?: string;
      category?: string;
      subcategory?: string;
      location?: string;
      lat?: number;
      lng?: number;
      radius?: number;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      page?: number;
      limit?: number;
      sort?: string;
    }, options?: ApiRequestOptions) => {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      return apiRequest(`/api/search?${queryParams.toString()}`, options);
    },
  },

  // Providers
  providers: {
    getAll: (params?: {
      verified?: boolean;
      topRated?: boolean;
      page?: number;
      limit?: number;
      categorySlug?: string;
      categoryId?: string;
      subcategory?: string;
      lat?: number;
      lng?: number;
      radiusKm?: number;
      q?: string;
      mapMarkers?: number | boolean;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/providers${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id: string, servicesLimit = 20) =>
      apiRequest(`/api/providers/${id}${servicesLimit ? `?servicesLimit=${servicesLimit}` : ''}`),
    getServices: (id: string, page = 1, limit = 20) =>
      apiRequest(`/api/providers/${id}/services?page=${page}&limit=${limit}`),
    getByUserId: (userId: string) => apiRequest(`/api/providers/user/${userId}`),
    getDashboardStats: () => apiRequest('/api/providers/dashboard/stats'),
    getRecentLeads: (limit?: number) => {
      const query = limit ? `?limit=${limit}` : '';
      return apiRequest(`/api/providers/dashboard/recent-leads${query}`);
    },
    uploadOfferImage: (file: File): Promise<ApiResponse<{ url: string }>> => {
      const formData = new FormData();
      formData.append('image', file);
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/api/providers/upload-offer-image`, {
        method: 'POST',
        headers: bearerAuthHeaders(token),
        credentials: "include",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => (data.success ? { success: true, data: data.data } : { success: false, error: data.error }));
    },
    uploadProfileImage: (file: File, type: 'logo' | 'cover' = 'logo'): Promise<ApiResponse<{ url: string }>> => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/api/providers/upload-profile-image`, {
        method: 'POST',
        headers: bearerAuthHeaders(token),
        credentials: "include",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => (data.success ? { success: true, data: data.data } : { success: false, error: data.error }));
    },
    saveOffer: (payload: {
      title: string;
      description?: string;
      bannerImageUrl: string;
      validFrom?: string;
      validTo?: string;
    }) =>
      apiRequest('/api/providers/offer', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    create: (providerData: any) =>
      apiRequest('/api/providers', {
        method: 'POST',
        body: JSON.stringify(providerData),
      }),
    update: (id: string, providerData: any) =>
      apiRequest(`/api/providers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(providerData),
      }),
  },

  // Reviews
  reviews: {
    getAll: () => apiRequest('/api/reviews'),
    getById: (id: string) => apiRequest(`/api/reviews/${id}`),
    getByService: (serviceId: string) => apiRequest(`/api/reviews/service/${serviceId}`),
    getByProvider: (providerId: string) => apiRequest(`/api/reviews/provider/${providerId}`),
    create: (reviewData: { service: string; rating: number; content: string }) =>
      apiRequest('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }),
    update: (id: string, reviewData: any) =>
      apiRequest(`/api/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      }),
    delete: (id: string) =>
      apiRequest(`/api/reviews/${id}`, {
        method: 'DELETE',
      }),
  },

  // Community
  community: {
    getPosts: (params?: {
      type?: string;
      topic?: string;
      tag?: string;
      q?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/community/posts${queryString ? `?${queryString}` : ''}`);
    },
    getPostBySlug: (slug: string) =>
      apiRequest(`/api/community/posts/${encodeURIComponent(slug)}`),
    createPost: (data: {
      title: string;
      body: string;
      type?: string;
      topic?: string;
      tags?: string[];
    }) =>
      apiRequest('/api/community/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    addComment: (postId: string, body: string) =>
      apiRequest(`/api/community/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    likePost: (postId: string) =>
      apiRequest(`/api/community/posts/${postId}/like`, {
        method: 'POST',
      }),
    report: (data: { targetType: 'post' | 'comment' | 'user'; targetId: string; reason: string }) =>
      apiRequest('/api/community/report', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTopics: () => apiRequest('/api/community/topics'),
  },

  // Bookings
  bookings: {
    create: (bookingData: {
      service: string;
      date: string | Date; // Accept both string (YYYY-MM-DD) and Date
      time: string;
      requirementNote: string;
      paymentOption: "full" | "advance" | "later";
      paymentMethod?: string;
      advancePayment?: number;
    }) =>
      apiRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      }),
    createFromCart: (bookingData: {
      date?: string | Date;
      time?: string;
      location?: any;
      requirementNote?: string;
      notes?: string;
      buyerGST?: string;
      buyerPAN?: string;
      paymentMethod?: string;
      receiptUrl?: string;
    }) =>
      apiRequest('/api/bookings/cart', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      }),
    uploadNeftReceipt: (file: File) => {
      const formData = new FormData();
      formData.append('receipt', file);
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/api/bookings/upload-neft-receipt`, {
        method: 'POST',
        headers: bearerAuthHeaders(token),
        credentials: "include",
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: { message: data?.error?.message || data?.message || 'Upload failed' } };
        }
        return { success: true, data: data.data };
      }).catch((err) => ({
        success: false,
        error: { message: err instanceof Error ? err.message : 'Upload failed' },
      }));
    },
    uploadPaymentReceiptForBooking: (bookingId: string, file: File) => {
      const formData = new FormData();
      formData.append('receipt', file);
      const token = getAuthToken();
      return fetch(`${API_BASE_URL}/api/bookings/${bookingId}/upload-payment-receipt`, {
        method: 'POST',
        headers: bearerAuthHeaders(token),
        credentials: "include",
        body: formData,
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          return { success: false, error: { message: data?.error?.message || data?.message || 'Upload failed' } };
        }
        return { success: true, data: data.data };
      }).catch((err) => ({
        success: false,
        error: { message: err instanceof Error ? err.message : 'Upload failed' },
      }));
    },
    updatePayment: (id: string, paymentData: {
      paymentMethod: string;
      amount: number;
      paymentOption: "full" | "advance";
    }) =>
      apiRequest(`/api/bookings/${id}/payment`, {
        method: 'PUT',
        body: JSON.stringify(paymentData),
      }),
    getProviderBookings: (params?: { status?: string; paymentStatus?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/bookings/provider${queryString ? `?${queryString}` : ''}`);
    },
    getBuyerBookings: (
      params?: { status?: string; paymentStatus?: string; page?: number; limit?: number },
      options?: { timeoutMs?: number }
    ) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== 'all') {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/bookings/buyer${queryString ? `?${queryString}` : ''}`, options);
    },
    getById: (id: string) => apiRequest(`/api/bookings/${id}`),
    cancelByBuyer: (id: string, reason?: string) =>
      apiRequest(`/api/bookings/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    deletePending: (id: string) =>
      apiRequest(`/api/bookings/${id}`, {
        method: 'DELETE',
      }),
    updateStatus: (id: string, status: string) =>
      apiRequest(`/api/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
    // Provider actions for new status workflow
    acceptBooking: (bookingId: string) => apiRequest(`/api/bookings/${bookingId}/provider/accept`, {
      method: 'POST',
    }),
    rejectBooking: (bookingId: string, reason: string) => apiRequest(`/api/bookings/${bookingId}/provider/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    providerUpdateStatus: (
      bookingId: string,
      status: string,
      note?: string,
      deliveryOtp?: string,
      invoiceMode?: 'AUTO' | 'UPLOAD',
      offlinePaid?: boolean
    ) =>
      apiRequest(`/api/bookings/${bookingId}/provider/update-status`, {
        method: 'POST',
        body: JSON.stringify({ status, note, deliveryOtp, invoiceMode, offlinePaid }),
      }),
    providerResendDeliveryOtp: (bookingId: string) =>
      apiRequest(`/api/bookings/${bookingId}/provider/resend-delivery-otp`, {
        method: 'POST',
      }),
    requestModification: (bookingId: string, payload: {
      services: Array<{ service: string; quantity: number; price: number; priceType?: string }>;
      additionalServices?: Array<{ service: string; quantity: number; price: number; priceType?: string }>;
      note?: string;
      reason?: string;
    }) =>
      apiRequest(`/api/bookings/${bookingId}/provider/request-modification`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getModifications: (bookingId: string) =>
      apiRequest(`/api/bookings/${bookingId}/modifications`),
    uploadProviderInvoice: (bookingId: string, file: File) => {
      const formData = new FormData();
      formData.append('invoiceFile', file);
      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };

      return fetch(`${API_BASE_URL}/api/bookings/${bookingId}/provider/upload-invoice`, {
        method: 'POST',
        headers,
        credentials: "include",
        body: formData,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(
              data?.error?.message || data?.message || 'Failed to upload invoice'
            );
          }
          return data as ApiResponse<{
            invoice: { url: string; filename: string };
          }>;
        })
        .catch((err) => ({
          success: false as const,
          error: {
            message:
              err instanceof Error ? err.message : 'Failed to upload invoice',
          },
        }));
    },
    adminApproveModification: (bookingId: string, payload: {
      modificationRequestId: string;
      note?: string;
      revisionReason?: string;
    }) =>
      apiRequest(`/api/bookings/${bookingId}/admin/approve-modification`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    adminRejectModification: (bookingId: string, payload: {
      modificationRequestId: string;
      rejectionReason?: string;
    }) =>
      apiRequest(`/api/bookings/${bookingId}/admin/reject-modification`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    // Get status history
    getStatusHistory: (bookingId: string) => apiRequest(`/api/bookings/${bookingId}/status-history`),
  },

  // Subscriptions (public app)
  subscriptions: {
    // Get available subscriptions for a type (buyer/provider)
    getAvailable: (type: 'buyer' | 'provider') =>
      apiRequest(`/api/subscriptions/available/${type}`),

    // Get current user's subscription for a type
    getMy: (type: 'buyer' | 'provider') =>
      apiRequest(`/api/subscriptions/my/${type}`),

    // Activate subscription for current user
    activate: (payload: { subscriptionId: string; type: 'buyer' | 'provider'; autoRenew?: boolean }) =>
      apiRequest('/api/subscriptions/activate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Cancel subscription for current user
    cancel: (payload: { type: 'buyer' | 'provider' }) =>
      apiRequest('/api/subscriptions/cancel', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Coupons
  coupons: {
    validate: (payload: { code: string; amount: number; type?: 'booking' | 'subscription'; serviceId?: string; categoryId?: string; bookingId?: string }) =>
      apiRequest<{
        coupon: {
          code: string;
          discountType: 'PERCENTAGE' | 'FLAT';
          discountValue: number;
          description?: string;
        };
        originalAmount: number;
        discountAmount: number;
        finalAmount: number;
        usageId: string;
      }>('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    confirmUsage: (payload: { usageId: string; bookingId?: string; subscriptionId?: string }) =>
      apiRequest('/api/coupons/confirm-usage', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    cancelUsage: (usageId: string) =>
      apiRequest('/api/coupons/cancel-usage', {
        method: 'POST',
        body: JSON.stringify({ usageId }),
      }),
    /** Authenticated: active coupons for current user role (buyer/provider) */
    getActive: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page != null) q.set('page', String(params.page));
      if (params?.limit != null) q.set('limit', String(params.limit));
      const qs = q.toString();
      return apiRequest<{
        coupons: Array<{
          code: string;
          description?: string;
          discountType: 'PERCENTAGE' | 'FLAT';
          discountValue: number;
          maxDiscount?: number;
          minOrderValue?: number;
          interactionType?: string;
          applicableUserType?: string;
          startDate?: string;
          endDate?: string;
        }>;
        pagination: { page: number; limit: number; total: number; pages: number };
      }>(`/api/coupons/active${qs ? `?${qs}` : ''}`);
    },
  },

  bookingFields: {
    // Get field configs for a service
    getConfig: (params: { category: string; subcategory?: string; itemType?: string }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('category', params.category);
      if (params.subcategory) queryParams.append('subcategory', params.subcategory);
      if (params.itemType) queryParams.append('itemType', params.itemType);
      return apiRequest<{
        fields: Array<{
          _id: string;
          fieldKey: string;
          label: string;
          type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'textarea';
          required: boolean;
          placeholder?: string;
          options?: string[];
          min?: number;
          max?: number;
          validation?: {
            pattern?: string;
            message?: string;
          };
          displayOrder: number;
        }>;
      }>(`/api/booking-fields/config?${queryParams.toString()}`);

    },
    // Admin methods
    getAll: (params?: { category?: string; subcategory?: string; isActive?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/booking-fields${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/api/booking-fields/${id}`),
    create: (data: any) => apiRequest('/api/booking-fields', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => apiRequest(`/api/booking-fields/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => apiRequest(`/api/booking-fields/${id}`, {
      method: 'DELETE',
    }),
  },

  // Payments
  payments: {
    // Create Razorpay order for subscription payment
    createOrder: (payload: { subscriptionId: string; subscriptionType: 'buyer' | 'provider' }) =>
      apiRequest<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        key: string;
      }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Create Cashfree order for subscription payment
    createCashfreeOrder: (payload: { subscriptionId: string; subscriptionType: 'buyer' | 'provider' }) =>
      apiRequest<{
        orderId: string;
        paymentSessionId: string;
        amount: number;
        currency: string;
        paymentId: string;
      }>('/api/payments/cashfree/create-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Verify payment and activate subscription
    verify: (payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      paymentId: string;
    }) =>
      apiRequest<{
        payment: {
          id: string;
          status: string;
          amount: number;
          paidAt: Date;
        };
        subscription: {
          id: string;
          name: string;
          type: string;
          startDate: Date;
          endDate: Date;
        };
        invoice?: {
          id: string;
          invoiceNumber: string;
          downloadUrl: string;
        } | null;
      }>('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Verify Cashfree payment and activate subscription
    verifyCashfree: (payload: {
      orderId: string;
      paymentId: string;
    }) =>
      apiRequest<{
        payment: {
          id: string;
          status: string;
          amount: number;
          paidAt: Date;
        };
        subscription: {
          id: string;
          name: string;
          type: string;
          startDate: Date;
          endDate: Date;
        };
        invoice?: {
          id: string;
          invoiceNumber: string;
          downloadUrl: string;
        } | null;
      }>('/api/payments/cashfree/verify', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Get payment history
    getHistory: () =>
      apiRequest<{
        payments: Array<{
          _id: string;
          amount: number;
          currency: string;
          status: string;
          subscriptionId?: {
            _id: string;
            name: string;
            type: string;
            price: number;
            billingCycle: string;
          };
          bookingId?: string;
          createdAt: string;
          paidAt?: string;
        }>;
      }>('/api/payments/history'),

    getBookingHistory: (bookingId: string) =>
      apiRequest<{
        payments: Array<{
          id: string;
          status: string;
          bookingPaymentStage: "initial" | "balance";
          amount: number;
          currency: string;
          paymentMethod: string;
          razorpayOrderId?: string;
          razorpayPaymentId?: string;
          paidAt?: string;
          createdAt: string;
        }>;
      }>(`/api/payments/booking/${bookingId}/history`),

    // Create order for booking payment (supports Razorpay & Cashfree via payload.gateway)
    createBookingOrder: (payload: {
      bookingId?: string;
      cartId?: string;
      couponUsageId?: string;
      date?: string;
      time?: string;
      location?: any;
      requirementNote?: string;
      notes?: string;
      gateway?: 'razorpay' | 'cashfree';
    }) =>
      apiRequest<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        key: string;
      }>('/api/payments/create-booking-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    createBookingBalanceOrder: (payload: { bookingId: string; gateway?: 'razorpay' | 'cashfree' }) =>
      apiRequest<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        key: string;
      }>('/api/payments/create-booking-balance-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    // Verify booking payment (Razorpay)
    verifyBooking: (payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      paymentId: string;
    }) =>
      apiRequest<{
        payment: {
          id: string;
          status: string;
          amount: number;
          paidAt: Date;
        };
        booking: {
          id: string;
          status: string;
          paymentStatus: string;
        };
      }>('/api/payments/verify-booking', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    // Verify booking payment (Cashfree)
    verifyCashfreeBooking: (payload: {
      orderId: string;
      paymentId: string;
    }) =>
      apiRequest<{
        payment: {
          id: string;
          status: string;
          amount: number;
          paidAt: Date;
        };
        booking: {
          id: string;
          status: string;
          paymentStatus: string;
        };
      }>('/api/payments/cashfree/verify-booking', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    createRequirementOrder: (payload: { requirementId: string; gateway?: 'razorpay' | 'cashfree' }) =>
      apiRequest<{
        orderId: string;
        amount: number;
        currency: string;
        paymentId: string;
        key?: string;
        paymentSessionId?: string;
      }>('/api/payments/create-requirement-order', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    verifyRequirement: (payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      paymentId: string;
    }) =>
      apiRequest<{
        payment: { id: string; status: string; amount: number; paidAt: Date };
        requirement: { id: string; paid: boolean; paymentStatus: string };
      }>('/api/payments/verify-requirement', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    verifyCashfreeRequirement: (payload: { orderId: string; paymentId: string }) =>
      apiRequest<{
        payment: { id: string; status: string; amount: number; paidAt: Date };
        requirement: { id: string; paid: boolean; paymentStatus: string };
      }>('/api/payments/cashfree/verify-requirement', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Chat (block / report)
  chat: {
    blockUser: (userId: string) =>
      apiRequest<{ success: boolean; data?: { blocked: boolean; blockedUsers: string[] } }>('/api/chat/block', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    unblockUser: (userId: string) =>
      apiRequest<{ success: boolean; data?: { blocked: boolean; blockedUsers: string[] } }>('/api/chat/unblock', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
    getBlockedUsers: () => apiRequest<{ success: boolean; data?: { blockedUsers: string[] } }>('/api/chat/blocked'),
    reportUser: (payload: {
      reportedUserId: string;
      conversationId?: string;
      messageId?: string;
      reason: string;
      description?: string;
    }) =>
      apiRequest('/api/chat/report', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Support tickets (buyer-initiated, /api/tickets)
  tickets: {
    create: (payload: {
      orderId?: string;
      category: string;
      subject: string;
      description: string;
      priority?: string;
      attachments?: string[];
    }) =>
      apiRequest('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMy: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const s = q.toString();
      return apiRequest(`/api/tickets${s ? `?${s}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/api/tickets/${id}`),
    addReply: (id: string, message: string) =>
      apiRequest(`/api/tickets/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    admin: {
      getAll: (params?: { page?: number; limit?: number; status?: string; priority?: string; category?: string }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        if (params?.status) q.set('status', params.status);
        if (params?.priority) q.set('priority', params.priority);
        if (params?.category) q.set('category', params.category);
        const s = q.toString();
        return apiRequest(`/api/tickets/admin/all${s ? `?${s}` : ''}`);
      },
      updateStatus: (id: string, status: string) =>
        apiRequest(`/api/tickets/admin/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      assign: (id: string, assignedTo: string | null) =>
        apiRequest(`/api/tickets/admin/${id}/assign`, {
          method: 'PATCH',
          body: JSON.stringify({ assignedTo }),
        }),
      addReply: (id: string, message: string, isInternal?: boolean) =>
        apiRequest(`/api/tickets/admin/${id}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message, isInternal }),
        }),
      escalate: (id: string) =>
        apiRequest(`/api/tickets/admin/${id}/escalate`, {
          method: 'POST',
        }),
      initiateRefund: (id: string) =>
        apiRequest(`/api/tickets/admin/${id}/initiate-refund`, {
          method: 'POST',
        }),
    },
    provider: {
      getRelated: (params?: { page?: number; limit?: number }) => {
        const q = new URLSearchParams();
        if (params?.page) q.set('page', String(params.page));
        if (params?.limit) q.set('limit', String(params.limit));
        const s = q.toString();
        return apiRequest(`/api/tickets/provider/related${s ? `?${s}` : ''}`);
      },
      addReply: (id: string, message: string) =>
        apiRequest(`/api/tickets/provider/${id}/reply`, {
          method: 'POST',
          body: JSON.stringify({ message }),
        }),
    },
  },

  // Support (provider-initiated, /api/support - legacy)
  support: {
    getTickets: () => apiRequest('/api/support'),
    getTicketById: (id: string) => apiRequest(`/api/support/${id}`),
    createTicket: (payload: { subject: string; category: string; priority: string; description: string }) =>
      apiRequest('/api/support', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    addReply: (id: string, message: string) =>
      apiRequest(`/api/support/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    updateStatus: (id: string, status: string) =>
      apiRequest(`/api/support/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    admin: {
      getAll: () => apiRequest('/api/support/admin/all'),
      updateStatus: (id: string, status: string) =>
        apiRequest(`/api/support/admin/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
    },
  },

  // Notifications
  notifications: {
    getMy: (params?: { read?: boolean; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/notifications/my${queryString ? `?${queryString}` : ''}`);
    },
    getById: (id: string) => apiRequest(`/api/notifications/${id}`),
    markAsRead: (id: string) =>
      apiRequest(`/api/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllAsRead: () =>
      apiRequest('/api/notifications/read-all', {
        method: 'PUT',
      }),
  },

  // KYC
  kyc: {
    getMy: () => apiRequest('/api/kyc'),
    uploadDocument: (file: File, documentType: 'idProof' | 'selfie' | 'workPhoto') => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);

      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };

      return fetch(`${API_BASE_URL}/api/kyc/upload`, {
        method: 'POST',
        headers,
        credentials: "include",
        body: formData,
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error?.message || data.message || 'Upload failed');
          }
          return data;
        })
        .catch((error) => ({
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Network error',
          },
        }));
    },
    submit: () =>
      apiRequest('/api/kyc/submit', {
        method: 'POST',
      }),
    admin: {
      getAll: (params?: { status?: string; page?: number; limit?: number }) => {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value));
            }
          });
        }
        const queryString = queryParams.toString();
        return apiRequest(`/api/kyc/admin/all${queryString ? `?${queryString}` : ''}`);
      },
      updateStatus: (id: string, status: 'KYC_APPROVED' | 'KYC_REJECTED', adminComment?: string) =>
        apiRequest(`/api/kyc/admin/${id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status, adminComment }),
        }),
    },
  },
  earnings: {
    getSummary: () => apiRequest<{
      totalEarnings: number;
      withdrawableBalance: number;
      totalCommission: number;
      thisMonthEarnings: number;
      lastMonthEarnings: number;
      premiumRevenue: number;
      pendingPayouts: number;
    }>('/api/earnings/summary'),

    getTransactions: (period?: string, page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const query = params.toString();
      return apiRequest<Array<{
        id: string;
        date: string;
        type: 'earning' | 'commission' | 'payout' | 'refund';
        description: string;
        amount: number;
        bookingId?: string;
        invoiceId?: string;
      }>>(`/api/earnings/transactions${query ? `?${query}` : ''}`);
    },

    getPayouts: () => apiRequest<Array<{
      id: string;
      date: string;
      amount: number;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      method: string;
      transactionId?: string;
      description: string;
    }>>('/api/earnings/payouts'),

    getInvoices: () => apiRequest<Array<{
      id: string;
      date: string;
      amount: number;
      status: 'paid' | 'pending' | 'overdue';
      bookingId: string;
      downloadUrl?: string;
    }>>('/api/earnings/invoices'),

    requestWithdrawal: (amount: number, method?: string) => 
      apiRequest<{
        amount: number;
        method: string;
        status: string;
        bankAccount?: {
          id: string;
          accountNumber: string;
          bankName: string;
        };
      }>('/api/earnings/withdraw', {
        method: 'POST',
        body: JSON.stringify({ amount, method }),
      }),
  },
  bankAccounts: {
    getAll: () => apiRequest<Array<{
      _id: string;
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName?: string;
      accountType: 'savings' | 'current';
      isDefault: boolean;
      isVerified: boolean;
      createdAt: string;
      updatedAt: string;
    }>>('/api/bank-accounts'),

    add: (data: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName?: string;
      accountType?: 'savings' | 'current';
      isDefault?: boolean;
    }) => apiRequest<{
      _id: string;
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName?: string;
      accountType: 'savings' | 'current';
      isDefault: boolean;
      isVerified: boolean;
    }>('/api/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    update: (id: string, data: {
      accountHolderName?: string;
      accountNumber?: string;
      ifscCode?: string;
      bankName?: string;
      branchName?: string;
      accountType?: 'savings' | 'current';
      isDefault?: boolean;
    }) => apiRequest<{
      _id: string;
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branchName?: string;
      accountType: 'savings' | 'current';
      isDefault: boolean;
      isVerified: boolean;
    }>(`/api/bank-accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

    delete: (id: string) => apiRequest(`/api/bank-accounts/${id}`, {
      method: 'DELETE',
    }),
  },
  leads: {
    getAll: (params?: { type?: string; status?: string; search?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest<Array<{
        id: string;
        type: 'direct' | 'platform';
        title: string;
        description: string;
        budget?: number;
        location: string;
        status: string;
        date: string;
        buyerName: string;
        buyerEmail: string;
        buyerPhone: string;
        buyerAvatar?: string;
        serviceTitle: string;
        priority: 'low' | 'medium' | 'high';
      }>>(`/api/leads${queryString ? `?${queryString}` : ''}`);
    },

    getById: (id: string) => apiRequest<{
      id: string;
      type: 'direct' | 'platform';
      title: string;
      description: string;
      budget?: number;
      location: any;
      status: string;
      date: string;
      buyerName: string;
      buyerEmail: string;
      buyerPhone: string;
      buyerAvatar?: string;
      serviceTitle: string;
      priority: 'low' | 'medium' | 'high';
      service?: any;
    }>(`/api/leads/${id}`),

    updateStatus: (id: string, status: string) => apiRequest<{
      id: string;
      status: string;
    }>(`/api/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  },

  /** Bulk labour crew requests (contractors invite multiple workers). */
  manpowerCrew: {
    create: (data: {
      title: string;
      description: string;
      headcount: number;
      location?: { address?: string; city?: string; state?: string; zipCode?: string };
      startDate?: string;
      endDate?: string;
      skillTags?: string[];
      rateNote?: string;
    }) =>
      apiRequest<{ success: boolean; data: { crewRequest: Record<string, unknown> } }>('/api/manpower-crew', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listMine: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return apiRequest<{
        success: boolean;
        data: { crewRequests: Record<string, unknown>[] };
        pagination?: { page: number; limit: number; total: number; pages: number };
      }>(`/api/manpower-crew${qs ? `?${qs}` : ''}`);
    },
    listWorkerInvites: (params?: { page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      const qs = q.toString();
      return apiRequest<{
        success: boolean;
        data: { invites: Record<string, unknown>[] };
        pagination?: { page: number; limit: number; total: number; pages: number };
      }>(`/api/manpower-crew/worker/invites${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) =>
      apiRequest<{
        success: boolean;
        data: { crewRequest: Record<string, unknown>; myInvite: Record<string, unknown> | null };
      }>(`/api/manpower-crew/${encodeURIComponent(id)}`),
    listInvites: (id: string) =>
      apiRequest<{
        success: boolean;
        data: { invites: Record<string, unknown>[] };
      }>(`/api/manpower-crew/${encodeURIComponent(id)}/invites`),
    inviteBatch: (id: string, workerUserIds: string[]) =>
      apiRequest<{
        success: boolean;
        data: { invitesCreated: number; skipped: string[] };
      }>(`/api/manpower-crew/${encodeURIComponent(id)}/invites`, {
        method: 'POST',
        body: JSON.stringify({ workerUserIds }),
      }),
    respondInvite: (inviteId: string, action: 'accept' | 'decline') =>
      apiRequest<{ success: boolean; data: Record<string, unknown> }>(
        `/api/manpower-crew/invites/${encodeURIComponent(inviteId)}/respond`,
        {
          method: 'POST',
          body: JSON.stringify({ action }),
        }
      ),
    cancel: (id: string) =>
      apiRequest<{ success: boolean; data: { crewRequest: Record<string, unknown> } }>(
        `/api/manpower-crew/${encodeURIComponent(id)}/cancel`,
        { method: 'PATCH' }
      ),

    browseLabour: (params?: {
      categorySlug?: string;
      q?: string;
      page?: number;
      limit?: number;
      sort?: string;
      addressQ?: string;
      city?: string;
      state?: string;
      startDate?: string;
      endDate?: string;
      minRating?: number;
      minExperience?: number;
      maxPrice?: number;
      subManpower?: string;
      subTechnical?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.categorySlug) q.set('categorySlug', params.categorySlug);
      if (params?.q) q.set('q', params.q);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.sort) q.set('sort', params.sort);
      if (params?.addressQ) q.set('addressQ', params.addressQ);
      if (params?.city) q.set('city', params.city);
      if (params?.state) q.set('state', params.state);
      if (params?.startDate) q.set('startDate', params.startDate);
      if (params?.endDate) q.set('endDate', params.endDate);
      if (params?.minRating != null && Number.isFinite(params.minRating)) {
        q.set('minRating', String(params.minRating));
      }
      if (params?.minExperience != null && Number.isFinite(params.minExperience)) {
        q.set('minExperience', String(params.minExperience));
      }
      if (params?.maxPrice != null && Number.isFinite(params.maxPrice)) {
        q.set('maxPrice', String(params.maxPrice));
      }
      if (params?.subManpower) q.set('subManpower', params.subManpower);
      if (params?.subTechnical) q.set('subTechnical', params.subTechnical);
      const qs = q.toString();
      return apiRequest<{
        success: boolean;
        data: {
          workers: Array<{
            userId: string;
            displayName: string;
            avatar?: string;
            city?: string;
            categoryLabel?: string;
            address?: string;
            experienceYears?: number | null;
            rating?: number;
            reviewCount?: number;
            price?: number | null;
            priceType?: string | null;
            state?: string;
          }>;
          category?: { name?: string; slug?: string } | null;
        };
        pagination?: { page: number; limit: number; total: number; pages: number };
      }>(`/api/manpower-crew/browse-labour${qs ? `?${qs}` : ''}`);
    },
  },

  // User requirements (submit → admin quotes → approve)
  requirements: {
    create: (data: {
      title: string;
      description: string;
      category?: string;
      location?: string | { address?: string; city?: string; state?: string; zipCode?: string };
      contactPhone?: string;
      budgetMin?: number;
      budgetMax?: number;
      expectedBudget?: number;
      preferredTimeline?: string;
      attachments?: Array<{ url: string; name?: string }>;
    }) =>
      apiRequest<{ data: any }>('/api/requirements', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getAll: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'all') q.append('status', params.status);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      const query = q.toString();
      return apiRequest<{ data: any[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
        `/api/requirements${query ? `?${query}` : ''}`
      );
    },
    getById: (id: string) =>
      apiRequest<{ data: { requirement: any; quote: any } }>(`/api/requirements/${id}`),
    approveQuote: (id: string) =>
      apiRequest<{ data: { requirement: any; quote: any } }>(`/api/requirements/${id}/quote/approve`, {
        method: 'POST',
      }),
    rejectQuote: (id: string, reason?: string) =>
      apiRequest<{ data: { requirement: any; quote: any } }>(`/api/requirements/${id}/quote/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || '' }),
      }),
    uploadDocument: (file: File): Promise<ApiResponse<{ url: string; name?: string }>> => {
      const formData = new FormData();
      formData.append('document', file);
      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      return fetch(`${API_BASE_URL}/api/requirements/upload-document`, {
        method: 'POST',
        headers,
        credentials: "include",
        body: formData,
        signal: controller.signal,
      })
        .then(async (res) => {
          let data: any;
          try {
            data = await res.json();
          } catch {
            throw new Error('Document upload failed. Please try again.');
          }
          if (!res.ok) {
            throw new Error(data?.error?.message || data?.message || 'Upload failed');
          }
          return data;
        })
        .catch((err) => ({
          success: false,
          error: {
            message:
              err?.name === 'AbortError'
                ? 'Document upload timed out. Please try again.'
                : err instanceof Error
                  ? err.message
                  : 'Upload failed',
          },
        }))
        .finally(() => clearTimeout(timeoutId));
    },
  },

  // Admin requirements
  adminRequirements: {
    getAll: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'all') q.append('status', params.status);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      const query = q.toString();
      return apiRequest<{ data: any[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
        `/api/admin/requirements${query ? `?${query}` : ''}`
      );
    },
    getById: (id: string) =>
      apiRequest<{ data: { requirement: any; quote: any } }>(`/api/admin/requirements/${id}`),
    createOrUpdateQuote: (id: string, data: { totalAmount: number; breakdown?: Record<string, number>; notes?: string; validTill?: string }) =>
      apiRequest<{ data: { requirement: any; quote: any } }>(`/api/admin/requirements/${id}/quote`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      apiRequest<{ data: any }>(`/api/admin/requirements/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // Newsletter
  newsletter: {
    subscribe: (email: string) => apiRequest<{
      email: string;
      subscribed: boolean;
    }>('/api/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

    unsubscribe: (email: string) => apiRequest<{
      email: string;
      subscribed: boolean;
    }>('/api/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  },

  // Favorites
  favorites: {
    getAll: () => apiRequest('/api/favorites'),
    toggle: (serviceId: string) => apiRequest(`/api/favorites/${serviceId}/toggle`, {
      method: 'POST',
    }),
    add: (serviceId: string) => apiRequest(`/api/favorites/${serviceId}`, {
      method: 'POST',
    }),
    remove: (serviceId: string) => apiRequest(`/api/favorites/${serviceId}`, {
      method: 'DELETE',
    }),
    check: (serviceId: string) => apiRequest(`/api/favorites/${serviceId}/check`),
  },

  // Invoices
  invoices: {
    getAll: (params?: { bookingId?: string; invoiceType?: string; status?: string; page?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params?.bookingId) queryParams.append('bookingId', params.bookingId);
      if (params?.invoiceType) queryParams.append('invoiceType', params.invoiceType);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      const query = queryParams.toString();
      return apiRequest<any>(`/api/invoices/admin/all${query ? `?${query}` : ''}`);
    },
    getBuyerInvoices: (page?: number, limit?: number, options?: { timeoutMs?: number }) => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const query = params.toString();
      return apiRequest<{
        data: Array<{
          _id: string;
          invoiceNumber: string;
          bookingId: string;
          paymentId: string;
          buyerId: string;
          buyerName: string;
          buyerEmail: string;
          providerId: string;
          providerName: string;
          serviceId: string;
          serviceTitle: string;
          serviceAmount: number;
          platformFee: number;
          gst: number;
          totalAmount: number;
          paymentMethod: string;
          razorpayOrderId?: string;
          razorpayPaymentId?: string;
          paidAt: string;
          status: 'paid' | 'refunded' | 'cancelled';
          invoiceDate: string;
          createdAt: string;
          invoiceType?: string;
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/api/invoices/buyer${query ? `?${query}` : ''}`, options);
    },
    getProviderInvoices: (page?: number, limit?: number) => {
      const params = new URLSearchParams();
      if (page) params.append('page', page.toString());
      if (limit) params.append('limit', limit.toString());
      const query = params.toString();
      return apiRequest<{
        data: Array<{
          _id: string;
          invoiceNumber: string;
          bookingId: string;
          paymentId: string;
          buyerId: string;
          buyerName: string;
          providerId: string;
          providerName: string;
          serviceId: string;
          serviceTitle: string;
          serviceAmount: number;
          platformFee: number;
          gst: number;
          totalAmount: number;
          status: 'paid' | 'refunded' | 'cancelled';
          invoiceDate: string;
          createdAt: string;
        }>;
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/api/invoices/provider${query ? `?${query}` : ''}`);
    },
    getById: (invoiceId: string) => apiRequest<{
      data: {
        invoice: {
          _id: string;
          invoiceNumber: string;
          bookingId: any;
          paymentId: any;
          buyerId: any;
          buyerName: string;
          buyerEmail: string;
          buyerPhone?: string;
          providerId: any;
          providerName: string;
          providerEmail?: string;
          serviceId: any;
          serviceTitle: string;
          serviceDescription?: string;
          serviceAmount: number;
          platformFee: number;
          gst: number;
          discount?: number;
          totalAmount: number;
          paymentMethod: string;
          razorpayOrderId?: string;
          razorpayPaymentId?: string;
          paidAt: string;
          status: 'paid' | 'refunded' | 'cancelled';
          invoiceDate: string;
          createdAt: string;
        };
      };
    }>(`/api/invoices/${invoiceId}`),
    getByBookingId: (bookingId: string) => apiRequest<{
      data: {
        invoice: {
          _id: string;
          invoiceNumber: string;
          bookingId: any;
          paymentId: any;
          buyerId: any;
          buyerName: string;
          buyerEmail: string;
          buyerPhone?: string;
          providerId: any;
          providerName: string;
          providerEmail?: string;
          serviceId: any;
          serviceTitle: string;
          serviceDescription?: string;
          serviceAmount: number;
          platformFee: number;
          gst: number;
          discount?: number;
          totalAmount: number;
          paymentMethod: string;
          razorpayOrderId?: string;
          razorpayPaymentId?: string;
          paidAt: string;
          status: 'paid' | 'refunded' | 'cancelled';
          invoiceDate: string;
          createdAt: string;
          gstDetails?: {
            buyerGST?: string;
            providerGST?: string;
          };
          platformCompanyName?: string;
          platformCompanyGST?: string;
          platformCompanyPAN?: string;
          platformCompanyCIN?: string;
          platformCompanyAddress?: {
            street?: string;
            city?: string;
            state?: string;
            zipCode?: string;
            country?: string;
          };
        };
      };
    }>(`/api/invoices/booking/${bookingId}`),
    download: (invoiceId: string) => apiRequest<{
      data: {
        invoice: any;
      };
      message: string;
    }>(`/api/invoices/${invoiceId}/download`),
    /** Download invoice as PDF from backend. Triggers browser download. */
    downloadPdf: async (invoiceId: string, filename?: string): Promise<void> => {
      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoiceId}/download`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) {
        const text = await response.text();
        let message = `Download failed (${response.status})`;
        try {
          const json = JSON.parse(text);
          message = json?.error?.message || json?.message || message;
        } catch {
          if (text) message = text;
        }
        throw new Error(message);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const name =
        filename ||
        (disposition && /filename="?([^";]+)"?/.exec(disposition)?.[1]) ||
        `invoice-${invoiceId}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    },
    /** Open invoice PDF in new tab for viewing. Uses pdfUrl if available (S3 or backend static), else fetches from API. */
    viewPdf: async (invoice: { _id: string; pdfUrl?: string }): Promise<void> => {
      const raw = invoice.pdfUrl?.trim();
      if (raw) {
        const url = /^https?:\/\//i.test(raw)
          ? raw
          : raw.startsWith('/')
            ? `${API_BASE_URL.replace(/\/$/, '')}${raw}`
            : null;
        if (url) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
      }
      const token = getAuthToken();
      const headers: HeadersInit = { ...bearerAuthHeaders(token) };
      const response = await fetch(`${API_BASE_URL}/api/invoices/${invoice._id}/download`, {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error('Failed to load invoice');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        URL.revokeObjectURL(url);
        throw new Error('Please allow popups to view the invoice');
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    },
  },

  settings: {
    getNeftBankDetails: () =>
      apiRequest<{ accountName: string; accountNo: string; ifsc: string; upi: string }>('/api/settings/neft-bank-details'),
    getSbiCollectDetails: () =>
      apiRequest<{ paymentLink?: string; instructions?: string }>('/api/settings/sbicollect-details'),
  },

  // Cart (longer timeout: pricing + populate can be slow)
  cart: {
    add: (serviceId: string, quantity = 1) =>
      apiRequest('/api/cart/add?minimal=1', {
        method: 'POST',
        body: JSON.stringify({ serviceId, quantity }),
        timeoutMs: 20000,
      }),
    get: () =>
      apiRequest('/api/cart', { timeoutMs: 20000 }),
    remove: (serviceId: string) =>
      apiRequest(`/api/cart/remove/${serviceId}`, {
        method: 'DELETE',
        timeoutMs: 20000,
      }),
    clear: () =>
      apiRequest('/api/cart/clear', {
        method: 'DELETE',
      }),
    updateQuantity: (serviceId: string, quantity: number) =>
      apiRequest(`/api/cart/update-quantity/${serviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
        timeoutMs: 20000,
      }),
  },

  // CMS (banners, etc. – public read)
  cms: {
    getBanners: (placement?: string) => {
      const q = placement ? `?placement=${encodeURIComponent(placement)}` : '';
      return apiRequest(`/api/cms/banners${q}`);
    },
  },

  // Careers / Jobs (public)
  careers: {
    getJobs: (params?: {
      department?: string;
      location?: string;
      employmentType?: string;
      experienceLevel?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const queryString = queryParams.toString();
      return apiRequest(`/api/jobs${queryString ? `?${queryString}` : ''}`);
    },

    getJob: (idOrSlug: string) =>
      apiRequest(`/api/jobs/${encodeURIComponent(idOrSlug)}`),

    apply: (
      idOrSlug: string,
      data: {
        name: string;
        email: string;
        phone?: string;
        currentLocation?: string;
        experienceYears?: number;
        currentCompany?: string;
        linkedInUrl?: string;
        portfolioUrl?: string;
        coverLetter?: string;
        resumeUrl?: string;
        source?: string;
      }
    ) =>
      apiRequest(`/api/jobs/${encodeURIComponent(idOrSlug)}/apply`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    uploadResume: (file: File): Promise<ApiResponse<{ url: string }>> => {
      const formData = new FormData();
      formData.append('resume', file);
      const token = getAuthToken();

      return fetch(`${API_BASE_URL}/api/jobs/upload-resume`, {
        method: 'POST',
        headers: bearerAuthHeaders(token),
        credentials: 'include',
        body: formData,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(
              data?.error?.message ||
                data?.message ||
                'Resume upload failed'
            );
          }
          return data;
        })
        .catch((err) => ({
          success: false as const,
          error: {
            message:
              err instanceof Error
                ? err.message
                : 'Resume upload failed',
          },
        }));
    },
  },

  // User job posts (buyers post work; providers browse & apply)
  userJobs: {
    getRecentPublic: () => apiRequest('/api/user-jobs/public/recent'),

    create: (data: {
      title: string;
      description: string;
      category?: string;
      location?: {
        city?: string;
        state?: string;
        address?: string;
        coordinates?: { lat: number; lng: number };
      };
      budgetMin?: number;
      budgetMax?: number;
      durationText?: string;
    }) =>
      apiRequest('/api/user-jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getMy: (params?: { status?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'all') q.append('status', params.status);
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      const s = q.toString();
      return apiRequest(`/api/user-jobs/my${s ? `?${s}` : ''}`);
    },

    getAll: (params?: {
      category?: string;
      city?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            q.append(key, String(value));
          }
        });
      }
      const s = q.toString();
      return apiRequest(`/api/user-jobs${s ? `?${s}` : ''}`);
    },

    getById: (id: string, scope: 'provider' | 'buyer' = 'provider') => {
      if (scope === 'buyer') {
        return apiRequest(`/api/user-jobs/my/${encodeURIComponent(id)}`);
      }
      return apiRequest(`/api/user-jobs/${encodeURIComponent(id)}`);
    },

    updateStatus: (
      id: string,
      status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'expired'
    ) =>
      apiRequest(`/api/user-jobs/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    apply: (
      id: string,
      payload: { message: string; proposedBudget?: number; proposedDuration?: string }
    ) =>
      apiRequest(`/api/user-jobs/${encodeURIComponent(id)}/apply`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    contactBuyer: (id: string) =>
      apiRequest(`/api/user-jobs/${encodeURIComponent(id)}/contact`, {
        method: 'POST',
      }),
  },
};

export const apiClient = api;
export default api;













