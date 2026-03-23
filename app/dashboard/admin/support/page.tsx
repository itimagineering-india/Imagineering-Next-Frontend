import type { Metadata } from "next";
import AdminSupport from "@/pages/AdminSupport";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/admin/support` },
};

export default function Page() {
  return <AdminSupport />;
}
