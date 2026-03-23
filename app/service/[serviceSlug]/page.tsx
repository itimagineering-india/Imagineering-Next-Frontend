import type { Metadata } from "next";
import ServiceDetails from "@/pages/ServiceDetails";
import { buildServiceDetailMetadata } from "@/lib/service-metadata";

type Params = { serviceSlug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { serviceSlug } = await params;
  return buildServiceDetailMetadata(serviceSlug);
}

export default function Page() {
  return <ServiceDetails />;
}
