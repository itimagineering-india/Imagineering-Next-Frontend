"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from "@/lib/api-client";

interface ServicesQueryParams {
  category?: string;
  subcategory?: string;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
}

// Allow null to indicate "waiting for dependencies"
type ServicesQueryParamsOrNull = ServicesQueryParams | null;

interface UseServicesOptions {
  debounceMs?: number; // For map-triggered fetches
  immediate?: boolean; // Fetch immediately on mount
  cacheKey?: string; // Custom cache key
}

interface ServicesData {
  services: any[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface UseServicesReturn {
  services: any[];
  total: number;
  isLoading: boolean;
  error: string | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => Promise<void>;
}

// In-memory cache
const servicesCache = new Map<string, { data: ServicesData; timestamp: number }>();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes cache

function preserveServicesOnFetchError(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err ?? '');
  const name = String((err as any)?.name ?? '');
  return (
    name === 'TypeError' ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('Load failed') ||
    msg.includes('Network request failed')
  );
}

// Clean query params - remove undefined values
const cleanParams = (params: ServicesQueryParamsOrNull): Record<string, string | number> => {
  if (params === null) return {};
  const cleaned: Record<string, string | number> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// Fast hash function for cache keys (faster than JSON.stringify)
const hashParams = (params: Record<string, string | number>): string => {
  const keys = Object.keys(params).sort();
  return keys.map(key => `${key}:${params[key]}`).join('|');
};

// Generate cache key from params
const getCacheKey = (params: ServicesQueryParamsOrNull): string => {
  const cleaned = cleanParams(params);
  return `services_${hashParams(cleaned)}`;
};

// Deep equality check for params
const areParamsEqual = (a: ServicesQueryParamsOrNull, b: ServicesQueryParamsOrNull): boolean => {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  const aCleaned = cleanParams(a);
  const bCleaned = cleanParams(b);
  
  const aKeys = Object.keys(aCleaned).sort();
  const bKeys = Object.keys(bCleaned).sort();
  
  if (aKeys.length !== bKeys.length) return false;
  
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (aCleaned[key] !== bCleaned[key]) {
      return false;
    }
  }
  
  return true;
};

export function useServices(
  params: ServicesQueryParamsOrNull = {},
  options: UseServicesOptions = {}
): UseServicesReturn {
  const { debounceMs = 0, immediate = true, cacheKey } = options;
  
  const [services, setServices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(immediate && params !== null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | undefined>(undefined);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const paramsRef = useRef<ServicesQueryParamsOrNull>(params || {});
  const prevParamsRef = useRef<ServicesQueryParamsOrNull>(params || {});
  const servicesSetInCurrentFetchRef = useRef<boolean>(false);

  // Memoize params to create stable reference
  const stableParams = useMemo(() => {
    // Handle null params (waiting for dependencies)
    if (params === null) {
      return null;
    }
    // Only create new object if params actually changed
    if (prevParamsRef.current === null || !areParamsEqual(prevParamsRef.current, params)) {
      prevParamsRef.current = params;
    }
    return prevParamsRef.current;
  }, [params]);

  // Update params ref when params change
  useEffect(() => {
    paramsRef.current = stableParams;
  }, [stableParams]);

  const fetchServices = useCallback(async (isRetry = false): Promise<void> => {
    console.log('[useServices] fetchServices called', { 
      params: paramsRef.current, 
      isRetry 
    });
    
    // Skip if params are null
    if (paramsRef.current === null) {
      console.log('[useServices] Skipping fetch - params are null');
      return;
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check cache first (unless retry)
    const key = cacheKey || getCacheKey(paramsRef.current);
    if (!isRetry) {
      const cached = servicesCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setServices(cached.data.services);
        setTotal(cached.data.total);
        setPagination(cached.data.pagination);
        setIsLoading(false);
        setError(null);
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    servicesSetInCurrentFetchRef.current = false;

    // Track if we successfully processed the response
    let responseProcessed = false;
    
    // Create timeout (8 seconds) - declare outside try for catch access
    let timeoutId: NodeJS.Timeout | undefined;
    
    try {
      // Clean params - remove undefined values
      const cleanedParams = cleanParams(paramsRef.current);
      
      // Set timeout to abort the request if it takes too long
      timeoutId = setTimeout(() => {
        if (!responseProcessed) {
          controller.abort();
        }
      }, 190000);

      // Create API request promise
      console.log('[useServices] Making API call with params:', cleanedParams);
      const response = await api.services.getAll(cleanedParams as any) as any;
      console.log('[useServices] API call completed, response type:', typeof response, 'response:', response);
      
      // Clear timeout if request completed
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      // Check if request was aborted (params changed)
      if (controller.signal.aborted) {
        console.log('[useServices] Request was aborted');
        return;
      }

      // Log full response for debugging
      console.log('[useServices] API response received', {
        success: response?.success,
        hasData: !!response?.data,
        servicesCount: response?.data?.services?.length || 0,
        pagination: response?.pagination,
        error: response?.error,
        responseKeys: response ? Object.keys(response) : [],
        fullResponse: response
      });

      if (response.success && response.data) {
        const servicesData = (response.data as any).services || [];
        const totalCount = response.pagination?.total || servicesData.length;
        
        console.log('[useServices] Services fetched successfully', { 
          count: servicesData.length, 
          total: totalCount 
        });
        
        const data: ServicesData = {
          services: servicesData,
          total: totalCount,
          pagination: response.pagination,
        };

        // Update state
        setServices(data.services);
        setTotal(data.total);
        setPagination(data.pagination);
        setError(null);
        
        // Mark response as processed and services as set
        responseProcessed = true;
        servicesSetInCurrentFetchRef.current = true;

        // Update cache
        servicesCache.set(key, { data, timestamp: Date.now() });
      } else {
        console.error('[useServices] API response not successful', response);
        throw new Error(response.error?.message || 'Failed to fetch services');
      }
    } catch (err: any) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.error('[useServices] Error in fetchServices:', {
        error: err,
        errorMessage: err?.message,
        errorName: err?.name,
        isAborted: controller.signal.aborted,
        params: paramsRef.current,
      });
      
      // Don't set error if request was aborted - but preserve services if they were already set
      if (controller.signal.aborted || err.name === 'AbortError') {
        console.log('[useServices] Request was aborted, skipping error handling');
        // If we already set services in this fetch call, don't clear them
        // This handles the case where a new request aborts an old one that already succeeded
        if (servicesSetInCurrentFetchRef.current || responseProcessed) {
          console.log('[useServices] Request aborted but services already set, preserving them');
          setIsLoading(false);
          return;
        }
        return;
      }
      
      // Check for timeout or abort
      const isTimeout = err.message?.includes('timeout') || 
                        err.message?.includes('30 seconds') || 
                        err.message?.includes('60 seconds') || 
                        err.message?.includes('180 seconds') ||
                        err.message?.includes('8 seconds') ||
                        err.name === 'AbortError' ||
                        controller.signal.aborted;
      
      if (isTimeout) {
        // If response was already processed, don't clear services
        if (responseProcessed) {
          console.log('[useServices] Timeout/Abort occurred but response was already processed, keeping services');
          setIsLoading(false);
          return;
        }
        
        if (!isRetry && !controller.signal.aborted) {
          // Retry once on timeout with longer delay for large datasets
          console.log('[useServices] Timeout occurred, retrying with longer delay...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchServices(true);
        }
        // Only set error and clear services if we haven't processed the response
        if (!responseProcessed) {
          setError('Request timed out while loading services. Try again, or narrow filters if the list is very large.');
          setServices((prev) =>
            preserveServicesOnFetchError(err) && prev.length > 0 ? prev : []
          );
          setTotal((prev) =>
            preserveServicesOnFetchError(err) && prev > 0 ? prev : 0
          );
        }
        return;
      }

      // Retry once on network errors (not on 4xx errors)
      const isNetworkError = 
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('timeout') ||
        err.message?.includes('NetworkError');

      if (isNetworkError && !isRetry) {
        // Wait 500ms before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        return fetchServices(true);
      }

      // Only clear services if response wasn't processed
      if (!responseProcessed) {
        setError(err.message || 'Failed to fetch services');
        setServices((prev) =>
          preserveServicesOnFetchError(err) && prev.length > 0 ? prev : []
        );
        setTotal((prev) =>
          preserveServicesOnFetchError(err) && prev > 0 ? prev : 0
        );
      } else {
        console.log('[useServices] Error occurred but response was already processed, keeping services');
        setIsLoading(false);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [cacheKey]);

  // Debounced fetch for map movements
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchServices();
    }, debounceMs);
  }, [fetchServices, debounceMs]);

  // Fetch when params change (with debounce if specified)
  useEffect(() => {
    console.log('[useServices] useEffect triggered', {
      immediate,
      debounceMs,
      params: paramsRef.current,
    });
    
    // Skip if params are null (waiting for dependencies like categories to load)
    if (paramsRef.current === null) {
      console.log('[useServices] Skipping fetch - params are null (waiting for dependencies)');
      return;
    }
    
    // Skip if not immediate and this is the first render
    if (!immediate) {
      console.log('[useServices] Skipping fetch - immediate is false');
      return;
    }

    console.log('[useServices] Calling fetch', { debounceMs });
    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        console.log('[useServices] Debounced fetch executing');
        fetchServices();
      }, debounceMs);
    } else {
      console.log('[useServices] Immediate fetch executing');
      fetchServices();
    }

    // Cleanup: abort request and clear timer
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [stableParams, debounceMs, immediate, fetchServices]);

  const refetch = useCallback(async () => {
    // Clear cache for this key
    const key = cacheKey || getCacheKey(paramsRef.current);
    servicesCache.delete(key);
    await fetchServices();
  }, [fetchServices, cacheKey]);

  return {
    services,
    total,
    isLoading,
    error,
    pagination,
    refetch,
  };
}

// Helper to clear all cache
export const clearServicesCache = () => {
  servicesCache.clear();
};

// Helper to clear specific cache entry
export const clearServicesCacheEntry = (params: ServicesQueryParamsOrNull) => {
  const key = getCacheKey(params);
  servicesCache.delete(key);
};

