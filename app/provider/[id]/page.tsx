import type { Metadata } from "next";
import ProviderProfile from "@/pages/ProviderProfile";
import { getProviderPublicMeta } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

type Params = { id: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const p = await getProviderPublicMeta(id);
  const url = `${BASE_URL}/provider/${encodeURIComponent(p?.slug || id)}`;

  if (!p) {
    return {
      title: "Provider | Imagineering India",
      alternates: { canonical: `${BASE_URL}/provider/${encodeURIComponent(id)}` },
      robots: { index: false, follow: true },
    };
  }

  const title = `${p.displayName} | Imagineering India`;
  const description = p.description;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      ...(p.image ? { images: [{ url: p.image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function Page() {
  return <ProviderProfile />;
}
