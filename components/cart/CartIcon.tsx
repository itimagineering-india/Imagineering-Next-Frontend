"use client";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export const CartIcon = () => {
  const { cartCount } = useCart();

  return (
    <Link 
      href="/cart" 
      className="relative inline-flex items-center"
      aria-label={`Shopping cart with ${cartCount} item${cartCount !== 1 ? 's' : ''}`}
      title={`View cart (${cartCount} item${cartCount !== 1 ? 's' : ''})`}
    >
      <ShoppingCart className="h-5 w-5" />
      {cartCount > 0 && (
        <span 
          className="absolute -top-2 -right-2 rounded-full bg-primary text-white text-[10px] px-1.5 py-0.5 min-w-[18px] text-center"
          aria-hidden="true"
        >
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </Link>
  );
};
