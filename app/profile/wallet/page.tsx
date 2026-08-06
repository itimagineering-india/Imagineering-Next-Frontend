import type { Metadata } from "next";
import WalletPage from "@/pages/Wallet";
import { BASE_URL } from "@/lib/constants";
import { IMAGINEERING_WALLET } from "@/lib/imagineering-product-labels";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${IMAGINEERING_WALLET.name} | Imagineering India`,
  alternates: { canonical: `${BASE_URL}/profile/wallet` },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <WalletPage />;
}
