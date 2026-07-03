import type { Metadata } from "next";
import WalletPage from "@/pages/Wallet";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rewards & Credits | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/wallet` },
};

export default function Page() {
  return <WalletPage />;
}
