"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import api, { getAuthToken } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

type CartItem = {
  service: any;
  quantity: number;
  price: number;
  priceType?: string;
};

type CartData = {
  _id: string;
  buyer: string;
  provider: any;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
};

type CartTotals = {
  subtotal: number;
  total: number;
  platformFee?: number;
  gst?: number;
  tax?: number;
  discount?: number;
};

type CartContextState = {
  cart: CartData | null;
  totals: CartTotals;
  loading: boolean;
  isRefreshing: boolean;
  addToCart: (serviceId: string, quantity?: number, options?: { silent?: boolean }) => Promise<void>;
  removeFromCart: (serviceId: string) => Promise<void>;
  updateQuantity: (serviceId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: (silent?: boolean) => Promise<void>;
  cartCount: number;
};

const CartContext = createContext<CartContextState | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartData | null>(null);
  const [totals, setTotals] = useState<CartTotals>({ subtotal: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const updateRequestIdRef = useRef(0);
  const { toast } = useToast();

  const refreshCart = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const token = getAuthToken();
      if (!token) {
        setCart(null);
        setTotals({ subtotal: 0, total: 0 });
        return;
      }
      const res = await api.cart.get();
      if (res.success && res.data) {
        setCart((res.data as any).cart || null);
        setTotals((res.data as any).totals || { subtotal: 0, total: 0 });
      }
    } catch (error: any) {
      if (!silent) console.error("Failed to load cart", error);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onAuthChanged = () => {
      if (!getAuthToken()) {
        setCart(null);
        setTotals({ subtotal: 0, total: 0 });
        setIsRefreshing(false);
      } else {
        void refreshCart();
      }
    };
    window.addEventListener("auth-token-changed", onAuthChanged);
    return () => window.removeEventListener("auth-token-changed", onAuthChanged);
  }, [refreshCart]);

  const addToCart = useCallback(
    async (serviceId: string, quantity = 1, options?: { silent?: boolean }) => {
      setLoading(true);
      try {
        const res = await api.cart.add(serviceId, quantity);
        if (res.success && res.data) {
          const totalsData = (res.data as any).totals || { subtotal: 0, total: 0 };
          setTotals(totalsData);
          setLoading(false);
          if (!options?.silent) toast({ title: "Added to cart" });
          refreshCart(true);
        } else if (res.error) {
          throw new Error(res.error.message);
        }
      } catch (error: any) {
        toast({
          title: "Cannot add to cart",
          description: error.message || "Your cart contains another provider. Clear it first.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast, refreshCart]
  );

  const removeFromCart = useCallback(
    async (serviceId: string) => {
      setLoading(true);
      try {
        const res = await api.cart.remove(serviceId);
        if (res.success && res.data) {
          setCart((res.data as any).cart || null);
          setTotals((res.data as any).totals || { subtotal: 0, total: 0 });
          toast({ title: "Removed from cart" });
        }
      } catch (error: any) {
        toast({
          title: "Cannot remove item",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const updateQuantity = useCallback(
    async (serviceId: string, quantity: number) => {
      const requestId = ++updateRequestIdRef.current;
      const prevCart = cart;
      const prevTotals = totals;
      if (prevCart) {
        const nextItems = prevCart.items.map((it) =>
          String(it.service?._id ?? it.service) === String(serviceId)
            ? { ...it, quantity }
            : it
        );
        const subtotal = nextItems.reduce((s, it) => s + (it.price || 0) * it.quantity, 0);
        setCart({ ...prevCart, items: nextItems });
        setTotals({ ...totals, subtotal });
      }
      setLoading(true);
      try {
        const res = await api.cart.updateQuantity(serviceId, quantity);
        if (res.success && res.data) {
          if (requestId !== updateRequestIdRef.current) return;
          setCart((res.data as any).cart || null);
          setTotals((res.data as any).totals || { subtotal: 0, total: 0 });
        } else {
          throw new Error((res as any).error?.message || "Update failed");
        }
      } catch (error: any) {
        if (requestId !== updateRequestIdRef.current) return;
        setCart(prevCart);
        setTotals(prevTotals);
        toast({
          title: "Cannot update quantity",
          description: (error as Error)?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        if (requestId === updateRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [toast, cart, totals]
  );

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.cart.clear();
      if (res.success) {
        setCart(null);
        setTotals({ subtotal: 0, total: 0 });
        toast({ title: "Cart cleared" });
      }
    } catch (error: any) {
      toast({
        title: "Cannot clear cart",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const cartCount = cart?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        totals,
        loading,
        isRefreshing,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
};
