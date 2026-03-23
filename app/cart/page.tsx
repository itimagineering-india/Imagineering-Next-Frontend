import type { Metadata } from "next";
import Cart from "@/pages/Cart";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/cart` },
};

export default function Page() {
  return <Cart />;
}

