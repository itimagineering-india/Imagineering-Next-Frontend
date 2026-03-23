"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import api from "@/lib/api-client";

interface UseFavoritesOptions {
  serviceIds: string[];
  enabled?: boolean; // Only fetch if enabled (lazy loading)
}

interface UseFavoritesReturn {
  favorites: Set<string>;
  isLoading: boolean;
  isFavorite: (serviceId: string) => boolean;
  toggleFavorite: (serviceId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

// Cache for favorite statuses
const favoritesCache = new Map<string, { isFavorite: boolean; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Batch favorite checks - fetch multiple at once
const batchCheckFavorites = async (serviceIds: string[]): Promise<Set<string>> => {
  const favoritesSet = new Set<string>();
  
  // Check cache first
  const uncachedIds: string[] = [];
  serviceIds.forEach((id) => {
    const cached = favoritesCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      if (cached.isFavorite) {
        favoritesSet.add(id);
      }
    } else {
      uncachedIds.push(id);
    }
  });

  // If all are cached, return early
  if (uncachedIds.length === 0) {
    return favoritesSet;
  }

  // Batch check uncached favorites
  // Note: If backend doesn't support batch check, we'll check individually but in parallel
  try {
    const checkPromises = uncachedIds.map(async (id) => {
      try {
        const response = await api.favorites.check(id);
        if (response.success && response.data) {
          const data = response.data as { isFavorite: boolean };
          const isFavorite = data.isFavorite;
          
          // Update cache
          favoritesCache.set(id, {
            isFavorite,
            timestamp: Date.now(),
          });
          
          if (isFavorite) {
            favoritesSet.add(id);
          }
        }
      } catch (error) {
        // Silently fail for individual checks - user might not be logged in
        console.log(`Could not check favorite status for ${id}:`, error);
      }
    });

    await Promise.all(checkPromises);
  } catch (error) {
    console.error('Error batch checking favorites:', error);
  }

  return favoritesSet;
};

export function useFavorites(
  options: UseFavoritesOptions = { serviceIds: [], enabled: true }
): UseFavoritesReturn {
  const { serviceIds, enabled = true } = options;
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const serviceIdsRef = useRef<string[]>([]);

  // Update ref when serviceIds change
  useEffect(() => {
    serviceIdsRef.current = serviceIds;
  }, [serviceIds]);

  const refreshFavorites = useCallback(async () => {
    if (!enabled || serviceIds.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const favoritesSet = await batchCheckFavorites(serviceIds);
      setFavorites(favoritesSet);
    } catch (error) {
      console.error('Error refreshing favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [serviceIds, enabled]);

  // Fetch favorites on mount if enabled
  useEffect(() => {
    if (enabled && serviceIds.length > 0) {
      refreshFavorites();
    }
  }, [enabled]); // Only run when enabled changes, not on every serviceIds change

  const isFavorite = useCallback(
    (serviceId: string): boolean => {
      return favorites.has(serviceId);
    },
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (serviceId: string): Promise<void> => {
      try {
        const response = await api.favorites.toggle(serviceId);
        if (response.success && response.data) {
          const data = response.data as { isFavorite: boolean };
          const newIsFavorite = data.isFavorite;

          // Update cache
          favoritesCache.set(serviceId, {
            isFavorite: newIsFavorite,
            timestamp: Date.now(),
          });

          // Optimistically update state
          setFavorites((prev) => {
            const next = new Set(prev);
            if (newIsFavorite) {
              next.add(serviceId);
            } else {
              next.delete(serviceId);
            }
            return next;
          });
        }
      } catch (error) {
        console.error('Failed to toggle favorite:', error);
        // Refresh to get correct state
        await refreshFavorites();
        throw error;
      }
    },
    [refreshFavorites]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    refreshFavorites,
  };
}

// Helper to clear favorites cache
export const clearFavoritesCache = () => {
  favoritesCache.clear();
};

// Helper to clear specific favorite from cache
export const clearFavoriteCache = (serviceId: string) => {
  favoritesCache.delete(serviceId);
};
