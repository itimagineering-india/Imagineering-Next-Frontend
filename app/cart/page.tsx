import type { Metadata } from "next";
import Cart from "@/pages/Cart";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your cart",
  description:
    "Review services, apply coupons, and checkout securely on Imagineering India. Platform fee and GST are shown before you pay.",
  alternates: { canonical: `${BASE_URL}/cart` },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Your cart | Imagineering India",
    description: "Review your cart and proceed to secure checkout.",
    url: `${BASE_URL}/cart`,
  },
};

export default function Page() {
  return <Cart />;
}
