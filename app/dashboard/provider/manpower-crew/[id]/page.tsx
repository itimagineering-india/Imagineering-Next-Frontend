import type { Metadata } from "next";
import ManpowerCrewDetail from "./ManpowerCrewDetail";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Crew requirement | Imagineering India",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/manpower-crew` },
};

export default function Page() {
  return <ManpowerCrewDetail />;
}
