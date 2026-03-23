import type { Metadata } from "next";
import { getServiceById } from "@/lib/api";
import { BASE_URL } from "@/lib/constants";
import { getServiceDescription, getServiceTitle } from "@/lib/seo";

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Rich metadata for public service detail URLs (`/service/...`). */
export async function buildServiceDetailMetadata(serviceParam: string): Promise<Metadata> {
  let service: Awaited<ReturnType<typeof getServiceById>> = null;
  try {
    service = await getServiceById(serviceParam);
  } catch {
    service = null;
  }

  if (!service) {
    return {
      title: "Service | Imagineering India",
      robots: { index: false, follow: true },
    };
  }

  const city = service.location?.city;
  const catName = service.category?.name;
  const title = getServiceTitle(service.title, catName, city);
  const raw = service.shortDescription || service.description || "";
  const description =
    stripHtml(raw).slice(0, 160) ||
    getServiceDescription(catName, city || undefined);

  const pathSegment = encodeURIComponent(service.slug || service.id);
  const url = `${BASE_URL}/service/${pathSegment}`;

  const ogImage = service.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
