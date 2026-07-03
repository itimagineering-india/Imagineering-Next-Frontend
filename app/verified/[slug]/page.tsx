import type { Metadata } from "next";
import ProviderProfile from "@/pages/ProviderProfile";
import { getProviderPublicMeta } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";

type Params = { slug: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProviderPublicMeta(slug);
  const url = `${BASE_URL}/verified/${encodeURIComponent(p?.slug || slug)}`;

  if (!p) {
    return {
      title: "Imagineering Verified | Imagineering India",
      alternates: { canonical: url },
      robots: { index: false, follow: true },
    };
  }

  const title = `${p.displayName} | Imagineering Verified Network`;
  const description =
    p.description || "Imagineering Verified supplier profile on Imagineering India.";

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
