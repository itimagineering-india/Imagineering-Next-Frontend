import type { Metadata } from "next";
import { ManpowerTradeTasksClient } from "@/components/manpower/ManpowerTradeTasksClient";
import { BASE_URL } from "@/lib/constants";

type Props = { params: Promise<{ tradeKey: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tradeKey } = await params;
  const label = decodeURIComponent(tradeKey).replace(/-/g, " ");
  return {
    title: `${label} | Manpower | Imagineering India`,
    alternates: { canonical: `${BASE_URL}/manpower/${encodeURIComponent(tradeKey)}` },
  };
}

export default async function ManpowerTradePage({ params }: Props) {
  const { tradeKey } = await params;
  return <ManpowerTradeTasksClient tradeKey={decodeURIComponent(tradeKey)} />;
}
