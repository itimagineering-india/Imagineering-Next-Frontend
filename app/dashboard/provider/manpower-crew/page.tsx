import type { Metadata } from "next";
import ManpowerCrewHub from "@/components/provider/ManpowerCrewHub";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hire labour | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/manpower-crew` },
};

export default function Page() {
  return <ManpowerCrewHub />;
}
