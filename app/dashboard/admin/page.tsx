import type { Metadata } from "next";
import AdminDashboard from "@/pages/AdminDashboard";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/admin` },
};

export default function Page() {
  return <AdminDashboard />;
}
