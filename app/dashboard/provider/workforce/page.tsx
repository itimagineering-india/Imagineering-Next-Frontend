import type { Metadata } from "next";
import WorkforceManagement from "@/components/provider/WorkforceManagement";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workforce Management",
  description:
    "Manage workers, site assignments, attendance, and wages in your Imagineering India provider dashboard.",
  alternates: { canonical: `${BASE_URL}/dashboard/provider/workforce` },
};

export default function Page() {
  return <WorkforceManagement />;
}
