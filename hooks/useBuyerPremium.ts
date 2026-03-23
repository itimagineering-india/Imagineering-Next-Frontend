"use client";

import { useEffect, useState } from "react";
import api, { getAuthToken } from "@/lib/api-client";

type BuyerSubscriptionStatus = "active" | "inactive" | "expired" | "cancelled";

interface MyBuyerSubResponse {
  subscription?: {
    _id: string;
    name: string;
    type: "buyer" | "provider";
    price: number;
    billingCycle: "monthly" | "yearly";
  } | null;
  status?: BuyerSubscriptionStatus;
  startDate?: string;
  endDate?: string;
  autoRenew?: boolean;
  isDefault?: boolean;
  isExpired?: boolean;
}

export function useBuyerPremium() {
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [data, setData] = useState<MyBuyerSubResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        if (!isMounted) return;
        setIsPremium(false);
        setData(null);
        setLoading(false);
        return;
      }

      try {
        const res = await api.subscriptions.getMy("buyer");
        if (!isMounted) return;

        if (res.success && res.data) {
          const payload = (res.data as any) as MyBuyerSubResponse;
          setData(payload);

          const status = payload.status;
          const isExpired = payload.isExpired === true;
          const active = status === "active" && !isExpired;
          setIsPremium(!!active);
        } else {
          setData(null);
          setIsPremium(false);
          setError((res as any)?.error?.message || "Failed to load subscription");
        }
      } catch (e: any) {
        if (!isMounted) return;
        setData(null);
        setIsPremium(false);
        setError(e?.message || "Failed to load subscription");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, []);

  return { loading, isPremium, data, error };
}

