import type { Metadata } from "next";
import MyRequirements from "@/pages/MyRequirements";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${BASE_URL}/dashboard/buyer/requirements` },
};

export default function Page() {
  return <MyRequirements />;
}
