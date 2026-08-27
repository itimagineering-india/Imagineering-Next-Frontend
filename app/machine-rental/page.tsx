import type { Metadata } from "next";
import { MachineRentalHub } from "@/components/machineRental/MachineRentalHub";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Rent Machines | Imagineering India",
  description:
    "Rent excavators, JCB, cranes, dumpers and more from verified providers. Book construction machines on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/machine-rental` },
  openGraph: {
    title: "Rent Machines | Imagineering India",
    description: "Rent construction machines from verified providers near you.",
    url: `${BASE_URL}/machine-rental`,
  },
};

export default function MachineRentalPage() {
  return <MachineRentalHub />;
}
