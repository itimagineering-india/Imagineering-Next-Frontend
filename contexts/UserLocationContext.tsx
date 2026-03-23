"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "userLocation_v1";
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_RADIUS_KM = 50;

export interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
  address?: string;
  timestamp: number;
}

type UserLocationContextValue = {
  userLocation: UserLocation | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => void;
  setUserLocation: (loc: UserLocation | null) => void;
  radiusKm: number;
};

const UserLocationContext = createContext<UserLocationContextValue | undefined>(undefined);

function loadFromStorage(): UserLocation | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const ts = Number(parsed?.timestamp);
    if (!Number.isFinite(ts) || Date.now() - ts > STORAGE_TTL_MS) return null;
    const lat = Number(parsed?.lat);
    const lng = Number(parsed?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      city: parsed?.city,
      address: parsed?.address,
      timestamp: ts,
    };
  } catch {
    return null;
  }
}

function saveToStorage(loc: UserLocation | null) {
  try {
    if (typeof window === "undefined") return;
    if (loc) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(() =>
    typeof window !== "undefined" ? loadFromStorage() : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUserLocation = useCallback((loc: UserLocation | null) => {
    setUserLocationState(loc);
    saveToStorage(loc);
    setError(null);
  }, []);

  const fetchLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator?.geolocation) {
      setError("Geolocation not supported");
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const loc: UserLocation = {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        };
        setUserLocationState(loc);
        saveToStorage(loc);
        setError(null);
        setIsLoading(false);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "ServiceSphere/1.0" } }
          );
          const data = await res.json();
          const addr = data?.address;
          if (addr) {
            const city = addr.city || addr.town || addr.village || addr.county || addr.state;
            const address = data?.display_name;
            const fullLoc: UserLocation = { ...loc, city, address };
            setUserLocationState(fullLoc);
            saveToStorage(fullLoc);
          }
        } catch {
          // ignore
        }
      },
      (err) => {
        setIsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location permission denied");
        } else {
          setError("Could not get location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  const refreshLocation = useCallback(() => {
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = loadFromStorage();
    if (cached) {
      setUserLocationState(cached);
      fetchLocation();
      return;
    }
    fetchLocation();
  }, [fetchLocation]);

  const value = useMemo(
    () => ({
      userLocation,
      isLoading,
      error,
      refreshLocation,
      setUserLocation,
      radiusKm: DEFAULT_RADIUS_KM,
    }),
    [userLocation, isLoading, error, refreshLocation, setUserLocation]
  );

  return (
    <UserLocationContext.Provider value={value}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const ctx = useContext(UserLocationContext);
  if (!ctx) throw new Error("useUserLocation must be used within UserLocationProvider");
  return ctx;
}
