/**
 * API helper utilities for better error handling and retry logic
 */

type ApiResponse<T> = { success: boolean; data?: T; error?: { message: string } };

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export const retryRequest = async <T>(
  requestFn: () => Promise<ApiResponse<T>>,
  config: RetryConfig = {}
): Promise<ApiResponse<T>> => {
  const { maxRetries, retryDelay } = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();
      if (response.success) return response;
      lastError = new Error(response.error?.message || "Request failed");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");
    }
    if (attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, retryDelay * Math.pow(2, attempt)));
    }
  }
  return {
    success: false,
    error: { message: lastError?.message || "Request failed after retries" },
  };
};

export const handleApiError = (error: unknown, defaultMessage = "An error occurred"): string => {
  const e = error as { response?: { data?: { error?: { message?: string } } }; error?: { message?: string }; message?: string };
  if (e?.response?.data?.error?.message) return e.response.data.error.message;
  if (e?.error?.message) return e.error.message;
  if (e?.message) return e.message;
  return defaultMessage;
};

export const formatErrorMessage = (error: unknown): string => {
  const msg = (error as Error)?.message || "";
  if (msg.includes("Network") || msg.includes("Failed to fetch") || msg.includes("network")) {
    return "Network error. Please check your internet connection and try again.";
  }
  if (msg.includes("is not valid JSON") || msg.includes("Unexpected token")) {
    return "Server error. Please try again in a moment.";
  }
  return handleApiError(error, "Something went wrong. Please try again.");
};
