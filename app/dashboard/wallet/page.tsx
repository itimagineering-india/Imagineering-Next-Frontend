import { redirect } from "next/navigation";

/** Legacy URL — wallet lives under profile for all users */
export default function LegacyWalletRedirect() {
  redirect("/profile/wallet");
}
