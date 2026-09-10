import type { Metadata } from "next";
import { MachineResaleHub } from "@/components/machineResale/MachineResaleHub";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Machine Resale | Imagineering India",
  description:
    "Buy used excavators, JCB, cranes and more from verified sellers. Browse machine resale listings on Imagineering India.",
  alternates: { canonical: `${BASE_URL}/machine-resale` },
  openGraph: {
    title: "Machine Resale | Imagineering India",
    description: "Buy used construction machines from verified sellers near you.",
    url: `${BASE_URL}/machine-resale`,
  },
};

export default function MachineResalePage() {
  return <MachineResaleHub />;
}
