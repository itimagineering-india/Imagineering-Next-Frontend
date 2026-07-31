import type { Metadata } from "next";
import { ManpowerDispatchWaitingClient } from "@/components/manpower/ManpowerDispatchWaitingClient";
import { BASE_URL } from "@/lib/constants";

type Props = { params: Promise<{ bookingId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookingId } = await params;
  return {
    title: "Finding worker | Imagineering India",
    alternates: { canonical: `${BASE_URL}/manpower/dispatch/${bookingId}` },
  };
}

export default async function ManpowerDispatchPage({ params }: Props) {
  const { bookingId } = await params;
  return <ManpowerDispatchWaitingClient bookingId={bookingId} />;
}
